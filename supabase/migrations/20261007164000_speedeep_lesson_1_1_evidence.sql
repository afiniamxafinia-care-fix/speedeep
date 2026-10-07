begin;
-- Version 1.1: preserve existing attempts and introduce a third independent bank.
alter table public.curriculum_cases drop constraint curriculum_cases_variant_check;
alter table public.curriculum_cases add constraint curriculum_cases_variant_check check (variant in ('A','B','C'));
alter table public.curriculum_attempts drop constraint curriculum_attempts_variant_check;
alter table public.curriculum_attempts add constraint curriculum_attempts_variant_check check (variant in ('A','B','C'));

do $seed$
declare item jsonb; new_case_id uuid;
begin
  for item in select value from jsonb_array_elements($cases$[{"variant": "C", "step": 1, "role": "probe", "sentence": "El bibliotecario, luego de ordenar los libros nuevos, cerró la sala infantil.", "question": "¿Qué hizo el bibliotecario?", "options": ["Ordenó los libros nuevos", "Cerró la sala infantil", "Abrió otra sala"], "correct_index": 1, "feedback": ["Ordenar fue una acción previa; busca qué ocurrió después.", "Sí. El cierre es la acción central.", "No se menciona que abriera otra sala."]}, {"variant": "C", "step": 2, "role": "probe", "sentence": "Aunque la máquina falló al principio, el equipo terminó el pedido antes del mediodía.", "question": "¿Qué ocurrió con el pedido?", "options": ["Se terminó antes del mediodía", "Se canceló por la falla", "Se entregó al día siguiente"], "correct_index": 0, "feedback": ["Correcto. La falla no impidió que terminaran el pedido.", "La falla fue un obstáculo; el pedido sí se terminó.", "No se menciona una entrega al día siguiente."]}, {"variant": "C", "step": 3, "role": "guided", "sentence": "Después de consultar el horario, Julia reservó una cita para el jueves.", "question": "¿Qué hizo Julia?", "options": ["Consultó el horario", "Reservó una cita", "Canceló la cita"], "correct_index": 1, "feedback": ["Consultar fue el paso previo; busca la acción siguiente.", "Exacto. Julia reservó una cita.", "El texto no menciona una cancelación."]}, {"variant": "C", "step": 4, "role": "guided", "sentence": "El mensajero no retiró el sobre que habían dejado en recepción.", "question": "¿Qué NO hizo el mensajero?", "options": ["Dejar el sobre", "Retirar el sobre", "Llegar a recepción"], "correct_index": 1, "feedback": ["Otra persona había dejado el sobre; busca el verbo con «no».", "Bien. No retiró el sobre.", "La oración no niega su llegada."]}, {"variant": "C", "step": 5, "role": "transfer", "sentence": "Aunque recibió una oferta más barata, Nora renovó el contrato con su proveedor habitual.", "question": "¿Qué hizo Nora?", "options": ["Cambió de proveedor", "Renovó el contrato", "Rechazó todas las ofertas"], "correct_index": 1, "feedback": ["La oferta fue distinta de la decisión final.", "Sí. Conservaste la decisión principal.", "Solo se menciona una oferta alternativa."]}, {"variant": "C", "step": 6, "role": "transfer", "sentence": "La directora, tras revisar el informe, no autorizó la compra del equipo.", "question": "¿Qué decidió la directora?", "options": ["Autorizó la compra", "Pidió otro informe", "No autorizó la compra"], "correct_index": 2, "feedback": ["La negación modifica la autorización.", "No se menciona que pidiera otro informe.", "Correcto. La compra no fue autorizada."]}]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values ('1.1',1,item->>'variant',(item->>'step')::smallint,item->>'role',item->>'sentence',item->>'question',item->'options') returning id into new_case_id;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    values (new_case_id,(item->>'correct_index')::smallint,item->'feedback');
  end loop;
end $seed$;

alter table public.curriculum_responses
  add column skill_code text,
  add column attempt_role text,
  add column error_code text,
  add column first_unassisted_score smallint check (first_unassisted_score in (0,1)),
  add column help_used boolean not null default false;

create table private.curriculum_case_rubrics (
  case_id uuid primary key references public.curriculum_cases(id) on delete cascade,
  error_codes jsonb not null check (jsonb_typeof(error_codes)='array' and jsonb_array_length(error_codes)=3)
);
revoke all on private.curriculum_case_rubrics from public, anon, authenticated;
alter table private.curriculum_case_rubrics enable row level security;

-- Each distractor identifies a concrete mistake; null is the correct answer.
insert into private.curriculum_case_rubrics(case_id,error_codes)
select c.id, case
  when c.step=4 then case c.variant
    when 'A' then '["prior_action_as_negated",null,"detail_as_negated"]'::jsonb
    when 'B' then '["prior_action_as_negated","detail_as_negated",null]'::jsonb
    else '["prior_action_as_negated",null,"detail_as_negated"]'::jsonb end
  when c.step=6 and c.variant='C' then '["negation_missed","unsupported_inference",null]'::jsonb
  else (select jsonb_agg(case when n.i=k.correct_index then null
    when n.i=0 then 'detail_as_action' else 'unsupported_inference' end order by n.i)
    from generate_series(0,2) n(i)) end
from public.curriculum_cases c
join private.curriculum_answer_keys k on k.case_id=c.id
where c.lesson_code='1.1';

create function private.record_curriculum_evidence()
returns trigger language plpgsql security definer set search_path='' as $$
declare c public.curriculum_cases%rowtype; rubric private.curriculum_case_rubrics%rowtype;
begin
  select * into c from public.curriculum_cases where id=new.case_id;
  select * into rubric from private.curriculum_case_rubrics where case_id=new.case_id;
  new.skill_code := 'sentence_action';
  new.attempt_role := c.role;
  new.first_unassisted_score := case when new.first_correct then 1 else 0 end;
  new.error_code := case when new.first_correct then null else rubric.error_codes->>new.first_index end;
  new.help_used := new.retry_index is not null;
  return new;
end $$;
revoke all on function private.record_curriculum_evidence() from public, anon, authenticated;
create trigger curriculum_evidence_before_write before insert or update on public.curriculum_responses
for each row execute function private.record_curriculum_evidence();

update public.curriculum_responses set help_used=retry_index is not null;
create or replace function private.begin_curriculum_lesson(p_lesson_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid(); l public.curriculum_lessons%rowtype;
  a public.curriculum_attempts%rowtype; completed_count integer; chosen_variant text;
begin
  if u is null then raise exception 'Inicia sesión para aprender.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into l from public.curriculum_lessons where code=p_lesson_code and is_published;
  if not found then raise exception 'La misión no está disponible.' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_lesson_code, 0));
  select * into a from public.curriculum_attempts
    where user_id=u and lesson_code=l.code and status='active' for update;
  if not found then
    select count(*) into completed_count from public.curriculum_attempts
      where user_id=u and lesson_code=l.code and status='completed';
    chosen_variant := case when completed_count % 3 = 0 then 'A' when completed_count % 3 = 1 then 'B' else 'C' end;
    if (select count(*) from public.curriculum_cases
      where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then
      raise exception 'Faltan casos para esta misión.' using errcode='22023';
    end if;
    insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant)
      values(u,l.code,l.content_version,chosen_variant) returning * into a;
  end if;
  return private.curriculum_lesson_state(a.id);
end $$;

-- The lesson remains completed after one run; mastery is checked separately
-- using successful first attempts in distinct banks and a delayed C session.
commit;
