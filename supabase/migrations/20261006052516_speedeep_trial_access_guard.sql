create or replace function private.can_practice()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = (select auth.uid())
      and ((s.trial_ends_at > now() and s.status = 'trialing')
        or (s.status = 'active' and s.current_period_ends_at is not null and s.current_period_ends_at > now()))
  );
$$;
update public.reading_articles set word_count = 56 where slug = 'leer-con-intencion';
