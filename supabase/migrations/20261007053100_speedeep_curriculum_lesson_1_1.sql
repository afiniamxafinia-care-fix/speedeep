begin;

create table public.curriculum_lessons (
  code text primary key,
  block_number smallint not null check (block_number between 1 and 8),
  position smallint not null check (position between 1 and 4),
  title text not null,
  mission text not null,
  skill_code text not null,
  content_version integer not null default 1 check (content_version > 0),
  is_published boolean not null default false,
  unique (block_number, position)
);
alter table public.curriculum_lessons enable row level security;
revoke all on public.curriculum_lessons from anon, authenticated;
grant select on public.curriculum_lessons to authenticated;
create policy "Readers see published lessons" on public.curriculum_lessons
  for select to authenticated using (is_published);

create table public.curriculum_cases (
  id uuid primary key default gen_random_uuid(),
  lesson_code text not null references public.curriculum_lessons(code),
  content_version integer not null,
  variant text not null check (variant in ('A', 'B')),
  step smallint not null check (step between 1 and 6),
  role text not null check (role in ('probe', 'guided', 'transfer')),
  sentence text not null,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 3),
  unique (lesson_code, content_version, variant, step),
  unique (id, lesson_code, content_version, variant, step)
);
alter table public.curriculum_cases enable row level security;
revoke all on public.curriculum_cases from public, anon, authenticated;

create table private.curriculum_answer_keys (
  case_id uuid primary key references public.curriculum_cases(id) on delete cascade,
  correct_index smallint not null check (correct_index between 0 and 2),
  feedback jsonb not null check (jsonb_typeof(feedback) = 'array' and jsonb_array_length(feedback) = 3)
);
revoke all on private.curriculum_answer_keys from public, anon, authenticated;

create table public.curriculum_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_code text not null references public.curriculum_lessons(code),
  content_version integer not null,
  variant text not null check (variant in ('A', 'B')),
  current_step smallint not null default 1 check (current_step between 1 and 7),
  status text not null default 'active' check (status in ('active', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  transfer_correct smallint check (transfer_correct between 0 and 2),
  unique (id, user_id),
  check ((status = 'active' and completed_at is null and transfer_correct is null)
    or (status = 'completed' and completed_at is not null and transfer_correct is not null and current_step = 7))
);
create unique index curriculum_one_active_lesson_idx on public.curriculum_attempts(user_id, lesson_code) where status = 'active';
create index curriculum_attempts_user_history_idx on public.curriculum_attempts(user_id, lesson_code, completed_at desc);
alter table public.curriculum_attempts enable row level security;
revoke all on public.curriculum_attempts from anon, authenticated;
grant select on public.curriculum_attempts to authenticated;
create policy "Readers see own lesson attempts" on public.curriculum_attempts
  for select to authenticated using ((select auth.uid()) = user_id);

create table public.curriculum_responses (
  attempt_id uuid not null,
  user_id uuid not null,
  case_id uuid not null references public.curriculum_cases(id),
  step smallint not null check (step between 1 and 6),
  first_index smallint not null check (first_index between 0 and 2),
  first_correct boolean not null,
  retry_index smallint check (retry_index between 0 and 2),
  answered_at timestamptz not null default now(),
  primary key (attempt_id, step),
  foreign key (attempt_id, user_id) references public.curriculum_attempts(id, user_id) on delete cascade
);
create index curriculum_responses_user_idx on public.curriculum_responses(user_id, answered_at desc);
alter table public.curriculum_responses enable row level security;
revoke all on public.curriculum_responses from anon, authenticated;
grant select on public.curriculum_responses to authenticated;
create policy "Readers see own lesson responses" on public.curriculum_responses
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.curriculum_lessons(code, block_number, position, title, mission, skill_code, is_published)
values ('1.1', 1, 1, 'Conservar la acción central',
  'Descubre qué ocurrió, incluso cuando una oración incluye detalles en medio.',
  'sentence_action', true);

-- Cases are seeded below. Keys stay in the private schema; RPCs never send
-- the entire key or feedback array to the browser.
do $seed$
declare item jsonb; case_id uuid;
begin
  for item in select value from jsonb_array_elements($cases$[{"variant": "A", "step": 1, "role": "probe", "sentence": "Lucía, después de revisar tres propuestas, eligió la opción más sencilla.", "question": "¿Qué hizo Lucía al final?", "options": ["Revisó tres propuestas", "Eligió la opción más sencilla", "Presentó tres propuestas"], "correct_index": 1, "feedback": ["Revisar ocurrió antes; la acción central es que eligió una opción.", "Exacto. El detalle intercalado explica qué hizo antes.", "La oración no dice que Lucía presentara propuestas."]}, {"variant": "A", "step": 2, "role": "probe", "sentence": "El tren, pese a la lluvia intensa, salió a tiempo de la estación.", "question": "¿Qué ocurrió?", "options": ["La lluvia detuvo al tren", "El tren llegó tarde", "El tren salió a tiempo"], "correct_index": 2, "feedback": ["La lluvia es una dificultad, pero no impidió la salida.", "La oración habla de la salida, no de la llegada.", "Sí. Conservaste la acción central a pesar del detalle."]}, {"variant": "A", "step": 3, "role": "guided", "sentence": "Después de recibir la alerta, el equipo de guardia cerró la entrada norte.", "question": "¿Qué hizo el equipo?", "options": ["Recibió la alerta y abrió la entrada", "Cerró la entrada norte", "Cerró todas las entradas"], "correct_index": 1, "feedback": ["La alerta ocurrió primero; la entrada fue cerrada.", "Correcto. El detalle inicial indica cuándo actuó el equipo.", "El texto solo menciona la entrada norte."]}, {"variant": "A", "step": 4, "role": "guided", "sentence": "Marta no entregó el informe que había corregido durante la mañana.", "question": "¿Qué NO hizo Marta?", "options": ["Corregir un informe", "Entregar el informe", "Trabajar durante la mañana"], "correct_index": 1, "feedback": ["Corregir aparece como realizado; observa «no» junto a «entregó».", "Bien. La negación cambia la acción principal.", "La negación afecta a la entrega del informe."]}, {"variant": "A", "step": 5, "role": "transfer", "sentence": "Aunque el precio subió el lunes, la tienda mantuvo el descuento anunciado.", "question": "¿Qué hizo la tienda?", "options": ["Retiró el descuento", "Mantuvo el descuento", "Bajó el precio el lunes"], "correct_index": 1, "feedback": ["«Aunque» presenta un contraste: el descuento se mantuvo.", "Sí. Separaste el cambio de precio de la decisión de la tienda.", "El precio subió; la tienda mantuvo el descuento."]}, {"variant": "A", "step": 6, "role": "transfer", "sentence": "La coordinadora, tras escuchar a los vecinos, aplazó la reunión del viernes.", "question": "¿Qué sucedió con la reunión?", "options": ["Se adelantó", "Se celebró el viernes", "Se aplazó"], "correct_index": 2, "feedback": ["Aplazar significa pasarla a otro momento.", "La oración dice que se aplazó, así que no se celebró como estaba previsto.", "Correcto. Reconociste la acción central en una oración nueva."]}, {"variant": "B", "step": 1, "role": "probe", "sentence": "El comité, después de escuchar a las familias, cambió la fecha del encuentro.", "question": "¿Qué decidió el comité?", "options": ["Escuchar a las familias", "Cambiar la fecha del encuentro", "Cancelar todos los encuentros"], "correct_index": 1, "feedback": ["Escuchar fue el paso anterior; busca la decisión que siguió.", "Correcto. El detalle explica qué pasó antes de la decisión.", "La oración habla de cambiar una fecha, no de cancelar todos los encuentros."]}, {"variant": "B", "step": 2, "role": "probe", "sentence": "A pesar del cierre de la calle, el repartidor llegó a la biblioteca a tiempo.", "question": "¿Qué ocurrió?", "options": ["El repartidor llegó a tiempo", "La biblioteca cerró", "El repartidor no pudo llegar"], "correct_index": 0, "feedback": ["Bien. El cierre fue una dificultad que no cambió el resultado.", "No se afirma que la biblioteca haya cerrado.", "«A pesar de» indica un obstáculo; el repartidor sí llegó."]}, {"variant": "B", "step": 3, "role": "guided", "sentence": "Al terminar la revisión, Sara guardó los documentos en una carpeta azul.", "question": "¿Qué hizo Sara?", "options": ["Empezó la revisión", "Guardó los documentos", "Compró una carpeta"], "correct_index": 1, "feedback": ["La revisión ya había terminado; después ocurrió la acción central.", "Exacto. La frase inicial sitúa la acción en el tiempo.", "El texto describe una carpeta, pero no dice que la comprara."]}, {"variant": "B", "step": 4, "role": "guided", "sentence": "Los técnicos no apagaron el equipo que habían instalado por la mañana.", "question": "¿Qué NO hicieron los técnicos?", "options": ["Instalar el equipo", "Trabajar por la mañana", "Apagar el equipo"], "correct_index": 2, "feedback": ["«Habían instalado» indica una acción previa; busca el verbo que lleva «no».", "La oración no niega que trabajaran por la mañana.", "Sí. La negación afecta a apagar, no a instalar."]}, {"variant": "B", "step": 5, "role": "transfer", "sentence": "El encargado, aunque recibió varias llamadas, abrió la sala a la hora prevista.", "question": "¿Qué hizo el encargado?", "options": ["Abrió la sala a tiempo", "Aplazó la apertura", "Canceló las llamadas"], "correct_index": 0, "feedback": ["Bien. Conservaste el hecho principal a pesar del detalle intercalado.", "Las llamadas no hicieron que cambiara la hora de apertura.", "La oración no afirma que cancelara las llamadas."]}, {"variant": "B", "step": 6, "role": "transfer", "sentence": "Tras comparar los resultados, Inés descartó la propuesta que había defendido ayer.", "question": "¿Qué hizo Inés con la propuesta?", "options": ["La mantuvo", "La descartó", "La presentó por primera vez"], "correct_index": 1, "feedback": ["Defenderla ocurrió ayer; el verbo principal dice qué hizo ahora.", "Exacto. La acción actual es descartarla.", "La propuesta ya existía; Inés la descartó después de comparar."]}]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values ('1.1',1,item->>'variant',(item->>'step')::smallint,item->>'role',item->>'sentence',item->>'question',item->'options')
    returning id into case_id;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    values(case_id,(item->>'correct_index')::smallint,item->'feedback');
  end loop;
end $seed$;

alter table private.curriculum_answer_keys enable row level security;

create function private.curriculum_lesson_state(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid(); a public.curriculum_attempts%rowtype;
  c public.curriculum_cases%rowtype; r public.curriculum_responses%rowtype;
  k private.curriculum_answer_keys%rowtype;
begin
  if u is null then raise exception 'Inicia sesión para continuar.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into a from public.curriculum_attempts where id=p_attempt_id and user_id=u;
  if not found then raise exception 'La misión no está disponible.' using errcode='22023'; end if;
  if a.status='completed' then
    return jsonb_build_object('attemptId',a.id,'status','completed','transferCorrect',a.transfer_correct,
      'completedAt',a.completed_at,'variant',a.variant);
  end if;
  select * into c from public.curriculum_cases
    where lesson_code=a.lesson_code and content_version=a.content_version
      and variant=a.variant and step=a.current_step;
  if not found then raise exception 'Falta un caso de esta misión.' using errcode='22023'; end if;
  select * into r from public.curriculum_responses
    where attempt_id=a.id and step=a.current_step;
  if found then
    select * into k from private.curriculum_answer_keys where case_id=c.id;
  end if;
  return jsonb_build_object('attemptId',a.id,'status','active','variant',a.variant,
    'case',jsonb_build_object('step',c.step,'role',c.role,'sentence',c.sentence,
      'question',c.question,'options',c.options),
    'retryPending',r.attempt_id is not null and r.retry_index is null and not r.first_correct,
    'priorFeedback',case when r.attempt_id is not null then k.feedback->>r.first_index else null end);
end $$;
revoke all on function private.curriculum_lesson_state(uuid) from public, anon;
grant execute on function private.curriculum_lesson_state(uuid) to authenticated;

create function private.begin_curriculum_lesson(p_lesson_code text)
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
    chosen_variant := case when completed_count % 2 = 0 then 'A' else 'B' end;
    if (select count(*) from public.curriculum_cases
      where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then
      raise exception 'Faltan casos para esta misión.' using errcode='22023';
    end if;
    insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant)
      values(u,l.code,l.content_version,chosen_variant) returning * into a;
  end if;
  return private.curriculum_lesson_state(a.id);
end $$;
revoke all on function private.begin_curriculum_lesson(text) from public, anon;
grant execute on function private.begin_curriculum_lesson(text) to authenticated;
create function public.begin_curriculum_lesson(p_lesson_code text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.begin_curriculum_lesson(p_lesson_code);
$$;
revoke all on function public.begin_curriculum_lesson(text) from public, anon;
grant execute on function public.begin_curriculum_lesson(text) to authenticated;

create function private.submit_curriculum_answer(p_attempt_id uuid, p_index integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid(); a public.curriculum_attempts%rowtype;
  c public.curriculum_cases%rowtype; k private.curriculum_answer_keys%rowtype;
  r public.curriculum_responses%rowtype; is_correct boolean;
  retry_needed boolean := false; total integer; message text;
begin
  if u is null then raise exception 'Inicia sesión para continuar.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into a from public.curriculum_attempts
    where id=p_attempt_id and user_id=u and status='active' for update;
  if not found then raise exception 'La misión no está activa.' using errcode='22023'; end if;
  select * into c from public.curriculum_cases
    where lesson_code=a.lesson_code and content_version=a.content_version
      and variant=a.variant and step=a.current_step;
  select * into k from private.curriculum_answer_keys where case_id=c.id;
  if c.id is null or k.case_id is null then raise exception 'Falta configurar este caso.' using errcode='22023'; end if;
  if p_index is null or p_index<0 or p_index>=jsonb_array_length(c.options) then
    raise exception 'Selecciona una respuesta válida.' using errcode='22023';
  end if;
  is_correct := p_index=k.correct_index;
  message := k.feedback->>p_index;
  select * into r from public.curriculum_responses where attempt_id=a.id and step=a.current_step for update;
  if not found then
    insert into public.curriculum_responses(attempt_id,user_id,case_id,step,first_index,first_correct)
      values(a.id,u,c.id,c.step,p_index,is_correct);
    retry_needed := not is_correct and c.role <> 'transfer';
  elsif r.retry_index is null and not r.first_correct and c.role <> 'transfer' then
    update public.curriculum_responses set retry_index=p_index
      where attempt_id=a.id and step=c.step;
  else
    raise exception 'Esta respuesta ya fue registrada.' using errcode='22023';
  end if;
  if not retry_needed then
    update public.curriculum_attempts set current_step=current_step+1 where id=a.id;
    if a.current_step=6 then
      select count(*) into total from public.curriculum_responses
        where attempt_id=a.id and step in (5,6) and first_correct;
      update public.curriculum_attempts set status='completed',completed_at=clock_timestamp(),transfer_correct=total
        where id=a.id;
    end if;
  end if;
  return jsonb_build_object('feedback',message,'correct',is_correct,'retryNeeded',retry_needed,
    'completed',a.current_step=6 and not retry_needed,
    'transferCorrect',case when a.current_step=6 and not retry_needed then total else null end);
end $$;
revoke all on function private.submit_curriculum_answer(uuid,integer) from public, anon;
grant execute on function private.submit_curriculum_answer(uuid,integer) to authenticated;
create function public.submit_curriculum_answer(p_attempt_id uuid,p_index integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.submit_curriculum_answer(p_attempt_id,p_index);
$$;
revoke all on function public.submit_curriculum_answer(uuid,integer) from public, anon;
grant execute on function public.submit_curriculum_answer(uuid,integer) to authenticated;

commit;
