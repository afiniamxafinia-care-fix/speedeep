begin;
-- Presentation numbers are independent of the internal lesson codes.
create or replace view public.curriculum_route_catalog with (security_invoker=true) as
 select code as lesson_code,block_number,position,
  case when block_number<=4 then '1.'||block_number::text else '2.'||(block_number-4)::text end as route_level,
  (case when block_number<=4 then '1.'||block_number::text else '2.'||(block_number-4)::text end) || '.' || (case when position=5 then 'C' else position::text end) as display_code,
  title,mission,skill_code,content_version,is_published
 from public.curriculum_lessons;
grant select on public.curriculum_route_catalog to authenticated;
-- v1 attempts and their responses remain unchanged; new attempts use the v2 bank.
do $seed$
declare c public.curriculum_cases%rowtype; k private.curriculum_answer_keys%rowtype;
 r private.curriculum_case_rubrics%rowtype; new_id uuid; target_index integer; old_index integer;
 targets jsonb := $patterns${"1.1|A":[2,1,0,0,2,1],"1.1|B":[0,1,2,1,0,2],"1.1|C":[1,1,2,0,0,2],"1.2|A":[1,0,2,2,1,0],"1.2|B":[2,1,1,2,0,0],"1.2|C":[0,2,1,1,0,2],"1.3|A":[0,1,1,0,2,2],"1.3|B":[2,0,1,1,2,0],"1.3|C":[2,1,0,2,1,0],"1.4|A":[1,0,2,2,0,1],"1.4|B":[2,2,0,0,1,1],"1.4|C":[2,2,0,1,0,1],"1.C|A":[1,2,0,0,2,1],"1.C|B":[2,1,1,0,0,2],"1.C|C":[1,0,0,2,2,1],"2.1|A":[1,2,0,1,0,2],"2.1|B":[2,0,2,1,0,1],"2.1|C":[1,1,2,2,0,0],"2.2|A":[2,1,1,0,2,0],"2.2|B":[1,2,1,0,0,2],"2.2|C":[1,1,0,2,0,2],"2.3|A":[2,0,0,1,2,1],"2.3|B":[0,2,1,2,1,0],"2.3|C":[1,1,0,2,2,0],"2.4|A":[2,0,1,2,0,1],"2.4|B":[2,0,2,1,1,0],"2.4|C":[0,0,1,2,2,1],"2.C|A":[1,0,1,2,0,2],"2.C|B":[0,2,1,2,0,1],"2.C|C":[0,1,2,0,2,1]}$patterns$::jsonb;
 new_options jsonb; new_feedback jsonb; new_errors jsonb;
begin
 for c in select * from public.curriculum_cases where lesson_code in ('1.1','1.2','1.3','1.4','1.C','2.1','2.2','2.3','2.4','2.C') and content_version=1 order by lesson_code,variant,step loop
   select * into k from private.curriculum_answer_keys where case_id=c.id;
   select * into r from private.curriculum_case_rubrics where case_id=c.id;
   if k.case_id is null or r.case_id is null then raise exception 'Incomplete v1 case: %',c.id; end if;
   target_index := (targets->(c.lesson_code||'|'||c.variant)->>(c.step-1))::integer;
   select jsonb_agg(c.options->((i-target_index+k.correct_index+3)%3) order by i),
          jsonb_agg(k.feedback->((i-target_index+k.correct_index+3)%3) order by i),
          jsonb_agg(r.error_codes->((i-target_index+k.correct_index+3)%3) order by i)
     into new_options,new_feedback,new_errors from generate_series(0,2) as i;
   insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
     values(c.lesson_code,2,c.variant,c.step,c.role,c.sentence,c.question,new_options) returning id into new_id;
   insert into private.curriculum_answer_keys(case_id,correct_index,feedback) values(new_id,target_index,new_feedback);
   insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code) values(new_id,new_errors,r.skill_code);
 end loop;
end $seed$;
-- Clarify one grouping prompt and three referent passages without moving their keys.
update public.curriculum_cases set question='¿Qué palabras niegan la aprobación?'
 where lesson_code='1.2' and content_version=2 and variant='A' and step=4;
update public.curriculum_cases set sentence=case variant
 when 'A' then 'Marta entregó el plan a Lucía. Mientras Marta reunía las facturas, Lucía lo revisó. Luego ella solicitó una corrección en el presupuesto.'
 when 'B' then 'Diego dejó el mapa con Raúl. Mientras Diego hablaba con los conductores, Raúl marcó la nueva ruta. Después él pidió imprimir copias.'
 else 'Julia envió la propuesta a Nora. Mientras Julia preparaba la presentación, Nora comparó la propuesta con el presupuesto. Después ella solicitó una versión más breve.' end
 where lesson_code='2.C' and content_version=2 and step=3;
update public.curriculum_lessons set content_version=2 where code in ('1.1','1.2','1.3','1.4','1.C','2.1','2.2','2.3','2.4','2.C');
-- A library exercise can now be attributed to the route pause that opened it.
alter table public.training_attempts add column origin text not null default 'legacy' check (origin in ('legacy','route','lab'));
alter table public.training_attempts add column route_level text;
alter table public.training_attempts add column route_after smallint;
alter table public.training_attempts add constraint training_route_origin_check check
 ((origin='route' and route_level is not null and route_after is not null and route_level in ('1.1','1.2','1.3','1.4') and route_after in (1,3))
 or (origin<>'route' and route_level is null and route_after is null));
create or replace function private.begin_training(p_exercise_id uuid,p_origin text,p_route_level text,p_route_after smallint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); e public.training_exercises%rowtype; a public.training_attempts%rowtype;
begin
 if u is null then raise exception 'Inicia sesión para practicar.' using errcode='28000'; end if;
 if not private.can_practice() then raise exception 'Tu acceso de práctica no está activo.' using errcode='42501'; end if;
 if p_origin is null or not coalesce(((p_origin='route' and p_route_level in ('1.1','1.2','1.3','1.4') and p_route_after in (1,3))
   or (p_origin='lab' and p_route_level is null and p_route_after is null)),false) then
   raise exception 'El origen de práctica no es válido.' using errcode='22023'; end if;
 select * into e from public.training_exercises where id=p_exercise_id and is_published;
 if not found or not exists(select 1 from private.training_answer_keys where exercise_id=p_exercise_id) then
   raise exception 'El ejercicio no está disponible.' using errcode='22023'; end if;
 insert into public.training_attempts(user_id,exercise_id,content_version,origin,route_level,route_after)
   values(u,e.id,e.content_version,p_origin,p_route_level,p_route_after) returning * into a;
 return jsonb_build_object('attemptId',a.id,'exercise',jsonb_build_object(
   'id',e.id,'kind',e.kind,'title',e.title,'instructions',e.instructions,
   'context',e.context,'items',e.items,'skillCode',e.skill_code));
end $$;
revoke all on function private.begin_training(uuid,text,text,smallint) from public,anon;
grant execute on function private.begin_training(uuid,text,text,smallint) to authenticated;
create or replace function public.begin_training(p_exercise_id uuid,p_origin text,p_route_level text,p_route_after smallint)
returns jsonb language sql security invoker set search_path='' as $$
 select private.begin_training(p_exercise_id,p_origin,p_route_level,p_route_after);
$$;
revoke all on function public.begin_training(uuid,text,text,smallint) from public,anon;
grant execute on function public.begin_training(uuid,text,text,smallint) to authenticated;
-- A completed lesson with zero correct transfer cases needs a new variant before progression.
create or replace function private.begin_curriculum_lesson(p_lesson_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); l public.curriculum_lessons%rowtype;
 a public.curriculum_attempts%rowtype; completed_count integer; chosen_variant text;
begin
 if u is null then raise exception 'Inicia sesión para aprender.' using errcode='28000'; end if;
 if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
 select * into l from public.curriculum_lessons where code=p_lesson_code and is_published;
 if not found then raise exception 'La misión no está disponible.' using errcode='22023'; end if;
 if p_lesson_code in ('1.2','1.3','1.4','1.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '1.2' then '1.1' when '1.3' then '1.2' when '1.4' then '1.3' else '1.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior primero.' using errcode='22023'; end if;
 if p_lesson_code='2.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='1.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=5) then
   raise exception 'Primero comprueba las habilidades del nivel 1.1.' using errcode='22023'; end if;
 if p_lesson_code in ('2.2','2.3','2.4','2.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '2.2' then '2.1' when '2.3' then '2.2' when '2.4' then '2.3' else '2.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.2.' using errcode='22023'; end if;
 if p_lesson_code='3.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='2.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=4) then
   raise exception 'Primero comprueba las habilidades del nivel 1.2.' using errcode='22023'; end if;
 if p_lesson_code='4.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='3.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=4) then
   raise exception 'Primero comprueba las habilidades del nivel 1.3.' using errcode='22023'; end if;
 if p_lesson_code in ('3.2','3.3','3.4','3.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '3.2' then '3.1' when '3.3' then '3.2' when '3.4' then '3.3' else '3.4' end and status='completed') then
   raise exception 'Completa la lección anterior del nivel 1.3.' using errcode='22023'; end if;
 if p_lesson_code in ('4.2','4.3','4.4','4.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '4.2' then '4.1' when '4.3' then '4.2' when '4.4' then '4.3' else '4.4' end and status='completed') then
   raise exception 'Completa la lección anterior del nivel 1.4.' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_lesson_code, 0));
 select * into a from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='active' for update;
 if not found then
   select count(*) into completed_count from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='completed';
   chosen_variant := case when completed_count % 3 = 0 then 'A' when completed_count % 3 = 1 then 'B' else 'C' end;
   if (select count(*) from public.curriculum_cases where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then raise exception 'Faltan casos para esta misión.' using errcode='22023'; end if;
   insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant) values(u,l.code,l.content_version,chosen_variant) returning * into a;
 end if;
 return private.curriculum_lesson_state(a.id);
end $$;
commit;
