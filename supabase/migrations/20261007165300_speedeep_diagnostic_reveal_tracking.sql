begin;
-- Record the action for the specific active question. The UI cannot
-- self-report a lookback on submission; existing diagnostic answers remain.
create table private.diagnostic_passage_reveals (
  attempt_id uuid not null references public.diagnostic_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id smallint not null references public.diagnostic_items(id),
  revealed_at timestamptz not null default clock_timestamp(),
  primary key(attempt_id,item_id)
);
revoke all on private.diagnostic_passage_reveals from public, anon, authenticated;
alter table private.diagnostic_passage_reveals enable row level security;

create function private.reveal_diagnostic_passage(p_attempt_id uuid,p_item_id smallint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.diagnostic_attempts%rowtype; item public.diagnostic_items%rowtype;
begin
  if auth.uid() is null then raise exception 'Inicia sesión.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into a from public.diagnostic_attempts
    where id=p_attempt_id and user_id=auth.uid() and finished_at is null for update;
  if not found or a.next_item<>p_item_id then
    raise exception 'Esta pregunta ya no está activa.' using errcode='22023';
  end if;
  select * into item from public.diagnostic_items where id=p_item_id;
  if not found then raise exception 'Falta la lectura.' using errcode='22023'; end if;
  insert into private.diagnostic_passage_reveals(attempt_id,user_id,item_id)
    values(a.id,auth.uid(),item.id) on conflict (attempt_id,item_id) do nothing;
  return jsonb_build_object('item',item.id,'passage',item.passage);
end $$;
revoke all on function private.reveal_diagnostic_passage(uuid,smallint) from public, anon;
grant execute on function private.reveal_diagnostic_passage(uuid,smallint) to authenticated;
create function public.reveal_diagnostic_passage(p_attempt_id uuid,p_item_id smallint)
returns jsonb language sql security invoker set search_path='' as $$
  select private.reveal_diagnostic_passage(p_attempt_id,p_item_id);
$$;
revoke all on function public.reveal_diagnostic_passage(uuid,smallint) from public, anon;
grant execute on function public.reveal_diagnostic_passage(uuid,smallint) to authenticated;

create or replace function private.submit_diagnostic_answer(p_attempt_id uuid,p_index integer,p_confidence text,p_looked_back boolean)
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
    values(a.id,auth.uid(),item.id,p_index,p_index=answer.correct_index,p_confidence,
      exists(select 1 from private.diagnostic_passage_reveals
        where attempt_id=a.id and item_id=item.id and user_id=auth.uid()));
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


-- The four-parameter RPC remains compatible with existing clients, but its
-- boolean is ignored; only the persisted reveal event sets looked_back.
commit;
