begin;
-- Carry the already written 1.4 cases into v2 with balanced, non-repeating answer positions.
-- Every v1 attempt continues to point at its original immutable cases.
do $seed$
declare c public.curriculum_cases%rowtype; k private.curriculum_answer_keys%rowtype;
 r private.curriculum_case_rubrics%rowtype; new_id uuid; target_index integer;
 targets jsonb := $patterns${"4.1|A":[2,0,1,1,2,0],"4.1|B":[1,2,0,2,0,1],"4.1|C":[0,1,2,0,1,2],"4.2|A":[1,2,0,0,2,1],"4.2|B":[2,0,1,1,0,2],"4.2|C":[0,2,1,2,1,0],"4.3|A":[2,1,0,1,0,2],"4.3|B":[0,1,2,2,0,1],"4.3|C":[1,0,2,0,2,1],"4.4|A":[0,2,1,1,2,0],"4.4|B":[1,0,2,2,1,0],"4.4|C":[2,1,0,0,1,2],"4.C|A":[0,0,1,1,2,2],"4.C|B":[0,0,1,2,1,2],"4.C|C":[0,0,1,2,2,1]}$patterns$::jsonb;
 new_options jsonb; new_feedback jsonb; new_errors jsonb;
begin
 for c in select * from public.curriculum_cases where lesson_code in ('4.1','4.2','4.3','4.4','4.C') and content_version=1 order by lesson_code,variant,step loop
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
update public.curriculum_lessons set content_version=2 where code in ('4.1','4.2','4.3','4.4','4.C');
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
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '3.2' then '3.1' when '3.3' then '3.2' when '3.4' then '3.3' else '3.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.3.' using errcode='22023'; end if;
 if p_lesson_code in ('4.2','4.3','4.4','4.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '4.2' then '4.1' when '4.3' then '4.2' when '4.4' then '4.3' else '4.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.4.' using errcode='22023'; end if;
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
