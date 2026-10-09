begin;
create or replace function public.get_my_diagnostic_placement()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare attempt_id uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión.' using errcode='28000'; end if;
  select id into attempt_id from public.diagnostic_attempts
    where user_id=auth.uid() and finished_at is not null
    order by finished_at desc limit 1;
  if attempt_id is null then return null; end if;
  return private.diagnostic_result(attempt_id);
end $$;
commit;
