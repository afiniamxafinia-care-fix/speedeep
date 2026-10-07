begin;

-- Initial placement uses new passages; laboratory attempts and lesson 1.1
-- never count as diagnostic evidence.
create table public.diagnostic_items (
  id smallint primary key check (id between 1 and 10),
  passage_number smallint not null check (passage_number in (1, 2)),
  genre text not null,
  title text not null,
  passage text not null,
  skill text not null check (skill in ('explicit', 'sentence', 'main_idea', 'cause', 'inference')),
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 3)
);
alter table public.diagnostic_items enable row level security;
revoke all on public.diagnostic_items from public, anon, authenticated;

create table private.diagnostic_keys (
  item_id smallint primary key references public.diagnostic_items(id),
  correct_index smallint not null check (correct_index between 0 and 2)
);
alter table private.diagnostic_keys enable row level security;
revoke all on private.diagnostic_keys from public, anon, authenticated;

create table public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  next_item smallint not null default 1 check (next_item between 1 and 11),
  started_at timestamptz not null default now(),
  second_passage_at timestamptz,
  finished_at timestamptz,
  first_read_seconds integer check (first_read_seconds between 0 and 3600),
  second_read_seconds integer check (second_read_seconds between 0 and 3600),
  check ((next_item = 11) = (finished_at is not null))
);
create unique index diagnostic_one_active_idx on public.diagnostic_attempts(user_id) where finished_at is null;
create index diagnostic_user_history_idx on public.diagnostic_attempts(user_id, started_at desc);
alter table public.diagnostic_attempts enable row level security;
revoke all on public.diagnostic_attempts from public, anon, authenticated;
grant select on public.diagnostic_attempts to authenticated;
create policy "Readers see their diagnostic attempts" on public.diagnostic_attempts
  for select to authenticated using ((select auth.uid()) = user_id);

create table public.diagnostic_answers (
  attempt_id uuid not null references public.diagnostic_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id smallint not null references public.diagnostic_items(id),
  selected_index smallint not null check (selected_index between 0 and 2),
  correct boolean not null,
  confidence text not null check (confidence in ('sure', 'unsure')),
  looked_back boolean not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, item_id)
);
create index diagnostic_answers_user_idx on public.diagnostic_answers(user_id, answered_at desc);
alter table public.diagnostic_answers enable row level security;
revoke all on public.diagnostic_answers from public, anon, authenticated;
grant select on public.diagnostic_answers to authenticated;
create policy "Readers see their diagnostic answers" on public.diagnostic_answers
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.diagnostic_items(id, passage_number, genre, title, passage, skill, prompt, options) values
(1,1,'aviso','Cambio en el centro de salud',
 'El centro de salud del barrio abrirá los sábados a partir del próximo mes. La nueva atención será de ocho de la mañana a una de la tarde. Durante ese horario funcionarán las consultas generales, pero el laboratorio seguirá cerrado. Quienes ya tienen una cita entre semana conservarán la fecha asignada. La dirección anunció el cambio después de recibir solicitudes de personas que trabajan de lunes a viernes.',
 'explicit','¿Hasta qué hora habrá consultas los sábados?', '["Hasta la una de la tarde","Hasta las ocho de la mañana","Hasta las cinco de la tarde"]'),
(2,1,'aviso','Cambio en el centro de salud',
 'El centro de salud del barrio abrirá los sábados a partir del próximo mes. La nueva atención será de ocho de la mañana a una de la tarde. Durante ese horario funcionarán las consultas generales, pero el laboratorio seguirá cerrado. Quienes ya tienen una cita entre semana conservarán la fecha asignada. La dirección anunció el cambio después de recibir solicitudes de personas que trabajan de lunes a viernes.',
 'sentence','¿Qué seguirá cerrado los sábados?', '["El centro completo","El laboratorio","Las consultas generales"]'),
(3,1,'aviso','Cambio en el centro de salud',
 'El centro de salud del barrio abrirá los sábados a partir del próximo mes. La nueva atención será de ocho de la mañana a una de la tarde. Durante ese horario funcionarán las consultas generales, pero el laboratorio seguirá cerrado. Quienes ya tienen una cita entre semana conservarán la fecha asignada. La dirección anunció el cambio después de recibir solicitudes de personas que trabajan de lunes a viernes.',
 'main_idea','¿Qué comunica principalmente el aviso?', '["Cambiarán todas las citas existentes","El laboratorio tendrá horario nuevo","Habrá consultas generales los sábados"]'),
(4,1,'aviso','Cambio en el centro de salud',
 'El centro de salud del barrio abrirá los sábados a partir del próximo mes. La nueva atención será de ocho de la mañana a una de la tarde. Durante ese horario funcionarán las consultas generales, pero el laboratorio seguirá cerrado. Quienes ya tienen una cita entre semana conservarán la fecha asignada. La dirección anunció el cambio después de recibir solicitudes de personas que trabajan de lunes a viernes.',
 'cause','¿Por qué anunció la dirección la atención sabatina?', '["Porque cerrará entre semana","Por solicitudes de quienes trabajan entre semana","Porque abrirá el laboratorio"]'),
(5,1,'aviso','Cambio en el centro de salud',
 'El centro de salud del barrio abrirá los sábados a partir del próximo mes. La nueva atención será de ocho de la mañana a una de la tarde. Durante ese horario funcionarán las consultas generales, pero el laboratorio seguirá cerrado. Quienes ya tienen una cita entre semana conservarán la fecha asignada. La dirección anunció el cambio después de recibir solicitudes de personas que trabajan de lunes a viernes.',
 'inference','Una persona que necesita un análisis de laboratorio el sábado, ¿qué puede concluir?', '["Podrá hacerlo en la nueva jornada","Deberá buscar otro horario para el laboratorio","Su cita entre semana se cancelará"]'),
(6,2,'nota','Huerto compartido',
 'En una colonia, varias familias transformaron un terreno vacío en un huerto comunitario. Al principio llevaron tierra y repararon la cerca. Luego acordaron turnos de riego para que las plantas no dependieran de una sola persona. En el primer verano algunas hortalizas se secaron porque los turnos no cubrían los domingos. El grupo cambió el calendario y, en la siguiente cosecha, pudo repartir verduras entre más vecinos. Ahora registra lo que funciona para ajustar el cultivo cada temporada.',
 'explicit','¿Qué repararon al comienzo?', '["El calendario","La cerca","Un sistema de riego"]'),
(7,2,'nota','Huerto compartido',
 'En una colonia, varias familias transformaron un terreno vacío en un huerto comunitario. Al principio llevaron tierra y repararon la cerca. Luego acordaron turnos de riego para que las plantas no dependieran de una sola persona. En el primer verano algunas hortalizas se secaron porque los turnos no cubrían los domingos. El grupo cambió el calendario y, en la siguiente cosecha, pudo repartir verduras entre más vecinos. Ahora registra lo que funciona para ajustar el cultivo cada temporada.',
 'sentence','¿Qué hizo el grupo después de perder algunas hortalizas?', '["Abandonó el huerto","Dejó de regar los domingos","Cambió el calendario de riego"]'),
(8,2,'nota','Huerto compartido',
 'En una colonia, varias familias transformaron un terreno vacío en un huerto comunitario. Al principio llevaron tierra y repararon la cerca. Luego acordaron turnos de riego para que las plantas no dependieran de una sola persona. En el primer verano algunas hortalizas se secaron porque los turnos no cubrían los domingos. El grupo cambió el calendario y, en la siguiente cosecha, pudo repartir verduras entre más vecinos. Ahora registra lo que funciona para ajustar el cultivo cada temporada.',
 'main_idea','¿Qué idea reúne mejor toda la nota?', '["El huerto mejoró cuando el grupo ajustó su organización","Toda la cosecha se perdió en el primer verano","La cerca es lo más importante de un huerto"]'),
(9,2,'nota','Huerto compartido',
 'En una colonia, varias familias transformaron un terreno vacío en un huerto comunitario. Al principio llevaron tierra y repararon la cerca. Luego acordaron turnos de riego para que las plantas no dependieran de una sola persona. En el primer verano algunas hortalizas se secaron porque los turnos no cubrían los domingos. El grupo cambió el calendario y, en la siguiente cosecha, pudo repartir verduras entre más vecinos. Ahora registra lo que funciona para ajustar el cultivo cada temporada.',
 'cause','¿Por qué se secaron algunas hortalizas?', '["Porque nadie reparó la cerca","Porque los turnos no cubrían los domingos","Porque faltaba tierra"]'),
(10,2,'nota','Huerto compartido',
 'En una colonia, varias familias transformaron un terreno vacío en un huerto comunitario. Al principio llevaron tierra y repararon la cerca. Luego acordaron turnos de riego para que las plantas no dependieran de una sola persona. En el primer verano algunas hortalizas se secaron porque los turnos no cubrían los domingos. El grupo cambió el calendario y, en la siguiente cosecha, pudo repartir verduras entre más vecinos. Ahora registra lo que funciona para ajustar el cultivo cada temporada.',
 'inference','¿Para qué sirve registrar lo que funciona cada temporada?', '["Para evitar que otros vecinos participen","Para dejar los turnos sin cambios","Para decidir ajustes futuros con lo aprendido"]');
insert into private.diagnostic_keys(item_id,correct_index) values
 (1,0),(2,1),(3,2),(4,1),(5,1),(6,1),(7,2),(8,0),(9,1),(10,2);

create function private.diagnostic_state(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.diagnostic_attempts%rowtype; item public.diagnostic_items%rowtype;
begin
  select * into a from public.diagnostic_attempts where id=p_attempt_id and user_id=auth.uid();
  if not found then raise exception 'Diagnóstico no disponible.' using errcode='22023'; end if;
  if a.finished_at is not null then
    return jsonb_build_object('attemptId',a.id,'status','completed','result',private.diagnostic_result(a.id));
  end if;
  select * into item from public.diagnostic_items where id=a.next_item;
  return jsonb_build_object('attemptId',a.id,'status','active','item',a.next_item,
    'passage',jsonb_build_object('number',item.passage_number,'genre',item.genre,'title',item.title,'body',item.passage),
    'question',jsonb_build_object('prompt',item.prompt,'options',item.options),
    'readStartedAt',case when a.next_item <= 5 then a.started_at else a.second_passage_at end);
end $$;

create function private.diagnostic_result(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare counts jsonb; needs_sentence boolean; a public.diagnostic_attempts%rowtype;
begin
  select * into a from public.diagnostic_attempts where id=p_attempt_id and user_id=auth.uid() and finished_at is not null;
  if not found then raise exception 'Aún no hay resultado.' using errcode='22023'; end if;
  select jsonb_object_agg(skill,jsonb_build_object('correct',correct,'total',total)) into counts
    from (select i.skill, count(*) filter (where r.correct) as correct, count(*) as total
      from public.diagnostic_answers r join public.diagnostic_items i on i.id=r.item_id
      where r.attempt_id=a.id group by i.skill) s;
  needs_sentence := (counts->'sentence'->>'correct')::int < 2;
  return jsonb_build_object('skills',counts,'recommendation',
    case when needs_sentence then 'Empieza en 1.1 para practicar la acción central en oraciones nuevas.'
      else 'Empieza en el Bloque 1. Tus aciertos iniciales orientan la enseñanza; todavía no acreditan dominio ni permiten saltar lecciones.' end,
    'nextLesson','1.1','firstReadSeconds',a.first_read_seconds,'secondReadSeconds',a.second_read_seconds);
end $$;

create function private.begin_diagnostic()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.diagnostic_attempts%rowtype; u uuid := auth.uid();
begin
  if u is null then raise exception 'Inicia sesión para continuar.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text || ':diagnostic',0));
  select * into a from public.diagnostic_attempts where user_id=u and finished_at is null for update;
  if not found then
    select * into a from public.diagnostic_attempts where user_id=u and finished_at is not null order by finished_at desc limit 1;
    if not found then insert into public.diagnostic_attempts(user_id) values(u) returning * into a; end if;
  end if;
  return private.diagnostic_state(a.id);
end $$;

create function private.submit_diagnostic_answer(p_attempt_id uuid,p_index integer,p_confidence text,p_looked_back boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.diagnostic_attempts%rowtype; item public.diagnostic_items%rowtype;
  answer private.diagnostic_keys%rowtype; elapsed integer;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para continuar.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into a from public.diagnostic_attempts where id=p_attempt_id and user_id=auth.uid() and finished_at is null for update;
  if not found then raise exception 'El diagnóstico no está activo.' using errcode='22023'; end if;
  if p_index not between 0 and 2 or p_confidence not in ('sure','unsure') or p_looked_back is null then
    raise exception 'Completa tu respuesta.' using errcode='22023'; end if;
  select * into item from public.diagnostic_items where id=a.next_item;
  select * into answer from private.diagnostic_keys where item_id=item.id;
  if item.id is null or answer.item_id is null then raise exception 'Falta configurar una pregunta.' using errcode='22023'; end if;
  insert into public.diagnostic_answers(attempt_id,user_id,item_id,selected_index,correct,confidence,looked_back)
    values(a.id,auth.uid(),item.id,p_index,p_index=answer.correct_index,p_confidence,p_looked_back);
  if a.next_item in (5,10) then
    elapsed := least(3600,greatest(0,extract(epoch from clock_timestamp() -
      case when a.next_item=5 then a.started_at else a.second_passage_at end)::integer));
  end if;
  update public.diagnostic_attempts set next_item=a.next_item+1,
    second_passage_at=case when a.next_item=5 then clock_timestamp() else second_passage_at end,
    first_read_seconds=case when a.next_item=5 then elapsed else first_read_seconds end,
    second_read_seconds=case when a.next_item=10 then elapsed else second_read_seconds end,
    finished_at=case when a.next_item=10 then clock_timestamp() else null end
    where id=a.id;
  return private.diagnostic_state(a.id);
end $$;

revoke all on function private.diagnostic_result(uuid),private.diagnostic_state(uuid),private.begin_diagnostic(),private.submit_diagnostic_answer(uuid,integer,text,boolean) from public, anon, authenticated;
grant execute on function private.diagnostic_result(uuid),private.diagnostic_state(uuid),private.begin_diagnostic(),private.submit_diagnostic_answer(uuid,integer,text,boolean) to authenticated;
create function public.begin_diagnostic() returns jsonb language sql security invoker set search_path = '' as $$ select private.begin_diagnostic(); $$;
create function public.submit_diagnostic_answer(p_attempt_id uuid,p_index integer,p_confidence text,p_looked_back boolean)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.submit_diagnostic_answer(p_attempt_id,p_index,p_confidence,p_looked_back);
$$;
revoke all on function public.begin_diagnostic(),public.submit_diagnostic_answer(uuid,integer,text,boolean) from public, anon;
grant execute on function public.begin_diagnostic(),public.submit_diagnostic_answer(uuid,integer,text,boolean) to authenticated;
commit;
