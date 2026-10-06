-- Live cards expose only the brief progress a learner has opted to share.
create table public.live_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_ppm integer not null default 0 check (current_ppm >= 0),
  best_ppm integer not null default 0 check (best_ppm >= 0),
  weekly_streak integer not null default 0 check (weekly_streak >= 0),
  last_active_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.live_progress enable row level security;
create policy "Live progress visible to owner or opted-in members"
  on public.live_progress for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = user_id and p.show_in_live
  ));

-- Cover the parent-side foreign key lookups identified in the initial lint.
create index practice_sessions_article_idx on public.practice_sessions (article_id);
create index user_milestones_code_idx on public.user_milestones (milestone_code);
create index support_hearts_sender_idx on public.support_hearts (sender_id);
create index referral_attributions_code_idx on public.referral_attributions (referral_code_id);
create index commission_ledger_referred_idx on public.commission_ledger (referred_user_id);

-- Only trusted server handlers can read comprehension answer keys.
create policy "Trusted server can access quiz keys"
  on private.article_quizzes for all to service_role
  using (true) with check (true);
