-- Speedeep's isolated product schema. Personal records are owner-scoped;
-- payment and progress writes are reserved for trusted server-side handlers.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Lector',
  avatar_url text,
  show_in_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'trialing' check (status in ('trialing','active','past_due','canceled','incomplete','unpaid','paused')),
  price_cents integer not null default 99000 check (price_cents > 0),
  currency text not null default 'MXN' check (currency = 'MXN'),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.reading_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'Lectura breve',
  estimated_minutes smallint not null default 5 check (estimated_minutes between 1 and 30),
  body text not null,
  word_count integer not null check (word_count > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.reading_articles(id),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds > 0),
  words_read integer not null check (words_read > 0),
  comprehension_score smallint not null check (comprehension_score between 0 and 100),
  words_per_minute integer generated always as ((words_read * 60) / duration_seconds) stored,
  created_at timestamptz not null default now(),
  check (completed_at >= started_at)
);
create index practice_sessions_user_created_idx on public.practice_sessions (user_id, created_at desc);
create table public.milestones (
  code text primary key,
  title text not null,
  threshold_ppm integer not null unique check (threshold_ppm > 0),
  description text not null
);
create table public.user_milestones (
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_code text not null references public.milestones(code),
  achieved_at timestamptz not null default now(),
  primary key (user_id, milestone_code)
);
create table public.support_hearts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index support_hearts_recipient_created_idx on public.support_hearts (recipient_id, created_at desc);
create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  code varchar(8) not null unique check (code ~ '^[A-Z0-9]{8}$'),
  created_at timestamptz not null default now()
);
create table public.referral_attributions (
  referred_user_id uuid primary key references auth.users(id) on delete cascade,
  referral_code_id uuid not null references public.referral_codes(id),
  attributed_at timestamptz not null default now()
);
create table public.commission_ledger (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('new_subscription','renewal','reversal')),
  rate_percent numeric(5,2) not null check (rate_percent between 0 and 100),
  amount_cents integer not null check (amount_cents <> 0),
  stripe_invoice_id text not null unique,
  created_at timestamptz not null default now()
);
create index commission_ledger_referrer_created_idx on public.commission_ledger (referrer_id, created_at desc);
create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 100000),
  status text not null default 'requested' check (status in ('requested','processing','paid','rejected')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);
create index payout_requests_user_requested_idx on public.payout_requests (user_id, requested_at desc);

-- Answer keys stay outside the exposed public schema.
create table private.article_quizzes (
  article_id uuid primary key references public.reading_articles(id) on delete cascade,
  questions jsonb not null,
  answer_key jsonb not null,
  updated_at timestamptz not null default now()
);
alter table private.article_quizzes enable row level security;

create or replace function private.can_practice()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = (select auth.uid())
      and ((s.trial_ends_at > now() and s.status = 'trialing')
        or (s.status = 'active' and coalesce(s.current_period_ends_at, now() + interval '1 second') > now()))
  );
$$;
revoke all on function private.can_practice() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.can_practice() to authenticated;

create or replace function private.create_speedeep_account()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Lector'))
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, status, trial_started_at, trial_ends_at)
  values (new.id, 'trialing', now(), now() + interval '7 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_speedeep_account() from public, anon, authenticated;
create trigger on_auth_user_created_speedeep after insert on auth.users
for each row execute function private.create_speedeep_account();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reading_articles enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.milestones enable row level security;
alter table public.user_milestones enable row level security;
alter table public.support_hearts enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_attributions enable row level security;
alter table public.commission_ledger enable row level security;
alter table public.payout_requests enable row level security;

create policy "Profiles are visible to their owner or opted-in Live members"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or show_in_live);
create policy "Users create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Users view their own subscription"
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Active trial or subscription required for reading content"
  on public.reading_articles for select to authenticated
  using (is_published and (select private.can_practice()));
create policy "Users view their own practice sessions"
  on public.practice_sessions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Milestone catalog is readable by signed-in users"
  on public.milestones for select to authenticated using (true);
create policy "Users view their own earned milestones"
  on public.user_milestones for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users view hearts they sent or received"
  on public.support_hearts for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy "Users view their own referral code"
  on public.referral_codes for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "Referrers view their own attributions"
  on public.referral_attributions for select to authenticated
  using (exists (select 1 from public.referral_codes c where c.id = referral_code_id and c.owner_id = (select auth.uid())));
create policy "Referrers view their own commissions"
  on public.commission_ledger for select to authenticated
  using (referrer_id = (select auth.uid()));
create policy "Users view their own payout requests"
  on public.payout_requests for select to authenticated
  using (user_id = (select auth.uid()));

-- No direct client write policies for sessions, payments, commissions,
-- referral attribution, milestones, hearts, or withdrawals.
insert into public.milestones (code, title, threshold_ppm, description) values
  ('club_300', 'Club de los 300', 300, 'Alcanza 300 palabras por minuto y conserva tu comprensión.'),
  ('club_500', 'Lectura fluida', 500, 'Construye una lectura más ágil y consistente.'),
  ('club_750', 'Lector avanzado', 750, 'Lee con estrategia a un ritmo avanzado.'),
  ('club_1000', 'Maestría Speedeep', 1000, 'Celebra un ritmo de lectura extraordinario.')
on conflict (code) do nothing;
insert into public.reading_articles (slug, title, category, estimated_minutes, body, word_count, is_published)
values ('leer-con-intencion', 'Leer con intención', 'Hábitos y aprendizaje', 5,
  'La lectura rápida no consiste en correr sobre las palabras. Consiste en entrenar la atención, reconocer ideas con intención y comprobar que lo leído permanece contigo. Con práctica breve y constante, tu cerebro aprende a encontrar patrones, conectar conceptos y dedicar menos tiempo a releer. La meta no es terminar primero: es avanzar más, comprendiendo mejor.',
  52, true)
on conflict (slug) do nothing;
insert into private.article_quizzes (article_id, questions, answer_key)
select id,
  '[{"prompt":"¿Cuál es la idea principal del texto?","options":["La lectura rápida busca terminar antes que los demás.","Leer con intención mejora el ritmo y ayuda a retener lo leído.","Releer varias veces es la mejor forma de aumentar velocidad."],"correctIndex":1}]'::jsonb,
  '[1]'::jsonb
from public.reading_articles where slug = 'leer-con-intencion'
on conflict (article_id) do nothing;
