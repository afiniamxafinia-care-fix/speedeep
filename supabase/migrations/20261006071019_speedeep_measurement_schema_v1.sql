-- Speedeep measurement schema v1. Already applied to the production project.
-- Remote migration version: 20261006071019.
begin;

-- ---------------------------------------------------------------------------
-- Content metadata and assessment taxonomy
-- ---------------------------------------------------------------------------

alter table public.reading_articles
  add column difficulty_level text not null default 'unrated'
    check (difficulty_level in ('unrated', 'beginner', 'intermediate', 'advanced')),
  add column text_type text not null default 'general',
  add column purpose_codes text[] not null default '{}',
  add column content_version integer not null default 1 check (content_version > 0),
  add column assessment_use text not null default 'short_practice'
    check (assessment_use in ('short_practice', 'guided_practice', 'evaluation'));

create table public.article_questions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.reading_articles(id) on delete cascade,
  legacy_question_key text,
  prompt text not null,
  options jsonb,
  question_type text not null check (question_type in (
    'literal', 'inferential', 'main_idea', 'supporting_detail', 'relevance',
    'purpose_task', 'recall', 'attention_checkpoint', 'other'
  )),
  skill_code text not null check (skill_code in (
    'comprehension', 'idea_identification', 'attention_sustained',
    'retention', 'adaptation_to_purpose'
  )),
  assessment_stage text not null check (assessment_stage in ('immediate', 'delayed', 'checkpoint')),
  max_points numeric(6,2) not null default 1 check (max_points > 0),
  rubric jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (article_id, legacy_question_key)
);

create index article_questions_article_active_idx
  on public.article_questions (article_id, is_active, sort_order);

alter table public.article_questions enable row level security;
grant select on public.article_questions to authenticated;
grant all on public.article_questions to service_role;

create policy "Eligible readers can view active question prompts"
  on public.article_questions for select to authenticated
  using (
    is_active
    and exists (
      select 1 from public.reading_articles a
      where a.id = article_id
        and a.is_published
        and (select private.can_practice())
    )
  );

-- Correct answers remain in the non-exposed private schema.
create table private.article_answer_keys (
  question_id uuid primary key references public.article_questions(id) on delete cascade,
  answer_key jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table private.article_answer_keys enable row level security;
grant usage on schema private to service_role;
grant all on private.article_answer_keys to service_role;
create policy "Trusted server can manage answer keys"
  on private.article_answer_keys for all to service_role
  using (true) with check (true);

-- Preserve current JSON-based quiz prompts and keys during transition.
-- Only prompts/options are copied to the exposed table; correctIndex is excluded.
insert into public.article_questions (
  article_id, legacy_question_key, prompt, options, question_type, skill_code,
  assessment_stage, max_points, sort_order
)
select
  qz.article_id,
  'legacy:' || q.ordinality::text,
  coalesce(q.question ->> 'prompt', 'Pregunta ' || q.ordinality::text),
  q.question -> 'options',
  case
    when lower(coalesce(q.question ->> 'prompt', '')) like '%idea principal%' then 'main_idea'
    when lower(coalesce(q.question ->> 'prompt', '')) like '%propósito%' then 'purpose_task'
    else 'other'
  end,
  case
    when lower(coalesce(q.question ->> 'prompt', '')) like '%idea principal%' then 'idea_identification'
    when lower(coalesce(q.question ->> 'prompt', '')) like '%propósito%' then 'adaptation_to_purpose'
    else 'comprehension'
  end,
  'immediate',
  1,
  q.ordinality::integer
from private.article_quizzes qz
cross join lateral jsonb_array_elements(qz.questions) with ordinality as q(question, ordinality)
on conflict (article_id, legacy_question_key) do nothing;

insert into private.article_answer_keys (question_id, answer_key)
select
  aq.id,
  coalesce(
    nullif(q.question -> 'correctIndex', 'null'::jsonb),
    nullif(qz.answer_key -> (q.ordinality - 1)::integer, 'null'::jsonb)
  )
from private.article_quizzes qz
cross join lateral jsonb_array_elements(qz.questions) with ordinality as q(question, ordinality)
join public.article_questions aq
  on aq.article_id = qz.article_id
 and aq.legacy_question_key = 'legacy:' || q.ordinality::text
where coalesce(
  nullif(q.question -> 'correctIndex', 'null'::jsonb),
  nullif(qz.answer_key -> (q.ordinality - 1)::integer, 'null'::jsonb)
) is not null
on conflict (question_id) do nothing;

-- ---------------------------------------------------------------------------
-- Session evidence
-- ---------------------------------------------------------------------------

alter table public.practice_sessions
  add column active_reading_seconds integer check (active_reading_seconds > 0),
  add column article_content_version integer check (article_content_version > 0),
  add column difficulty_level_snapshot text,
  add column difficulty_multiplier numeric(8,4) check (difficulty_multiplier > 0),
  add column purpose_code text,
  add column validity_status text not null default 'legacy_unreviewed'
    check (validity_status in ('legacy_unreviewed', 'valid', 'invalid')),
  add column validity_reason text,
  add column speed_eligible boolean not null default false,
  add column measurement_formula_version text not null default 'v1';

alter table public.practice_sessions
  add column raw_active_ppm numeric(10,2)
    generated always as (
      case when active_reading_seconds is not null
        then (words_read * 60.0 / active_reading_seconds)::numeric(10,2)
        else null
      end
    ) stored,
  add column adjusted_ppm numeric(10,2)
    generated always as (
      case when active_reading_seconds is not null and difficulty_multiplier is not null
        then (words_read * 60.0 / active_reading_seconds * difficulty_multiplier)::numeric(10,2)
        else null
      end
    ) stored;

-- Existing `words_per_minute` is retained for backward compatibility. It uses
-- total session duration; new speed scores use `raw_active_ppm`, which excludes
-- pauses and post-reading activities. Legacy sessions remain unreviewed.
create unique index practice_sessions_id_user_unique
  on public.practice_sessions (id, user_id);
create index practice_sessions_scored_window_idx
  on public.practice_sessions (user_id, completed_at desc)
  where validity_status = 'valid';

create table public.practice_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references s auth.users(id) on delete cascade,
  session_id uuid not null,
  source_session_id uuid not null,
  question_id uuid not null references public.article_questions(id),
  assessment_stage text not null check (assessment_stage in ('immediate', 'delayed', 'checkpoint')),
  response_payload jsonb not null,
  score_points numeric(6,2) check (score_points >= 0),
  max_points numeric(6,2) check (max_points > 0),
  is_correct boolean,
  response_time_ms integer check (response_time_ms >= 0),
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id)
    references public.practice_sessions(id, user_id) on delete cascade,
  foreign key (source_session_id, user_id)
    references public.practice_sessions(id, user_id) on delete cascade,
  unique (session_id, question_id, assessment_stage),
  check (
    (assessment_stage = 'delayed' and source_session_id <> session_id)
    or (assessment_stage <> 'delayed' and source_session_id = session_id)
  )
);

create index practice_responses_user_answered_idx
  on public.practice_responses (user_id, answered_at desc);
create index practice_responses_source_session_idx
  on public.practice_responses (source_session_id, assessment_stage);

alter table public.practice_responses enable row level security;
grant select on public.practice_responses to authenticated;
grant all on public.practice_responses to service_role;
create policy "Users can view their own practice responses"
  on public.practice_responses for select to authenticated
  using ((select auth.uid()) = user_id);

create table public.practice_segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  segment_number smallint not null check (segment_number > 0),
  started_at timestamptz,
  completed_at timestamptz,
  active_seconds integer check (active_seconds > 0),
  checkpoint_passed boolean,
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id)
    references public.practice_sessions(id, user_id) on delete cascade,
  unique (session_id, segment_number),
  check (completed_at is null or started_at is not null),
  check (completed_at is null or completed_at >= started_at)
);

create index practice_segments_user_session_idx
  on public.practice_segments (user_id, session_id);
alter table public.practice_segments enable row level security;
grant select on public.practice_segments to authenticated;
grant all on public.practice_segments to service_role;
create policy "Users can view their own practice segments"
  on public.practice_segments for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Per-user measurement cycles and score history
-- ---------------------------------------------------------------------------

create table public.assessment_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_number integer not null check (cycle_number > 0),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  formula_version text not null default 'v1',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, cycle_number),
  unique (id, user_id),
  check (ended_at is null or ended_at >= started_at),
  check ((status = 'active' and ended_at is null) or status <> 'active')
);

create unique index assessment_cycles_one_active_per_user_idx
  on public.assessment_cycles (user_id) where status = 'active';
alter table public.assessment_cycles enable row level security;
grant select on public.assessment_cycles to authenticated;
grant all on public.assessment_cycles to service_role;
create policy "Users can view their own assessment cycles"
  on public.assessment_cycles for select to authenticated
  using ((select auth.uid()) = user_id);

create table public.assessment_cycle_skill_targets (
  cycle_id uuid not null,
  user_id uuid not null,
  skill_code text not null check (skill_code in (
    'reading_speed', 'comprehension', 'idea_identification',
    'attention_sustained', 'retention', 'adaptation_to_purpose'
  )),
  measurement_unit text not null check (measurement_unit in ('ppm', 'score_0_100')),
  baseline_value numeric(10,2) not null check (baseline_value >= 0),
  target_value numeric(10,2) not null check (target_value >= baseline_value),
  baseline_recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (cycle_id, skill_code),
  foreign key (cycle_id, user_id)
    references public.assessment_cycles(id, user_id) on delete cascade,
  check (
    (skill_code = 'reading_speed' and measurement_unit = 'ppm')
    or (skill_code <> 'reading_speed' and measurement_unit = 'score_0_100')
  )
);

alter table public.assessment_cycle_skill_targets enable row level security;
grant select on public.assessment_cycle_skill_targets to authenticated;
grant all on public.assessment_cycle_skill_targets to service_role;
create policy "Users can view their own cycle targets"
  on public.assessment_cycle_skill_targets for select to authenticated
  using ((select auth.uid()) = user_id);

create table public.skill_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null,
  user_id uuid not null,
  computed_at timestamptz not null default now(),
  formula_version text not null,
  reading_speed_score numeric(5,2) check (reading_speed_score between 0 and 100),
  comprehension_score numeric(5,2) check (comprehension_score between 0 and 100),
  idea_identification_score numeric(5,2) check (idea_identification_score between 0 and 100),
  attention_sustained_score numeric(5,2) check (attention_sustained_score between 0 and 100),
  retention_score numeric(5,2) check (retention_score between 0 and 100),
  adaptation_to_purpose_score numeric(5,2) check (adaptation_to_purpose_score between 0 and 100),
  quality_score numeric(5,2) check (quality_score between 0 and 100),
  speed_score numeric(5,2) check (speed_score between 0 and 100),
  depth_score numeric(5,2) check (depth_score between 0 and 100),
  qsd_score numeric(5,2) check (qsd_score between 0 and 100),
  confidence_state text not null check (confidence_state in ('insufficient', 'provisional', 'stable')),
  valid_practice_count smallint not null default 0 check (valid_practice_count >= 0),
  distinct_article_count smallint not null default 0 check (distinct_article_count >= 0),
  distinct_purpose_count smallint not null default 0 check (distinct_purpose_count >= 0),
  window_started_at timestamptz,
  window_ended_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (cycle_id, user_id)
    references public.assessment_cycles(id, user_id) on delete cascade,
  unique (id, user_id),
  check (window_ended_at is null or window_started_at is null or window_ended_at >= window_started_at),
  check (
    qsd_score is null or (
      reading_speed_score is not null
      and comprehension_score is not null
      and idea_identification_score is not null
      and attention_sustained_score is not null
      and retention_score is not null
      and adaptation_to_purpose_score is not null
    )
  ),
  check (qsd_score is null or confidence_state <> 'insufficient')
);

create index skill_score_snapshots_user_cycle_idx
  on public.skill_score_snapshots (user_id, cycle_id, computed_at desc);
alter table public.skill_score_snapshots enable row level security;
grant select on public.skill_score_snapshots to authenticated;
grant all on public.skill_score_snapshots to service_role;
create policy "Users can view their own score history"
  on public.skill_score_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

-- Dynamic 300, 400, 500... ladder. Server-side scoring decides when an
-- eligible multi-practice window satisfies the comprehension quality gate.
create table public.user_speed_milestones (
  user_id uuid not null references auth.users(id) on delete cascade,
  threshold_ppm integer not null check (threshold_ppm >= 300 and (threshold_ppm - 300) % 100 = 0),
  cycle_id uuid,
  snapshot_id uuid,
  median_adjusted_ppm numeric(10,2) not null check (median_adjusted_ppm >= threshold_ppm),
  median_comprehension_score numeric(5,2) not null check (median_comprehension_score between 70 and 100),
  confirming_practice_count smallint not null check (confirming_practice_count >= 3),
  achieved_at timestamptz not null default now(),
  primary key (user_id, threshold_ppm),
  foreign key (cycle_id, user_id)
    references public.assessment_cycles(id, user_id) on delete cascade,
  foreign key (snapshot_id, user_id)
    references public.skill_score_snapshots(id, user_id) on delete cascade
);

create index user_speed_milestones_achieved_idx
  on public.user_speed_milestones (user_id, achieved_at desc);
alter table public.user_speed_milestones enable row level security;
grant select on public.user_speed_milestones to authenticated;
grant all on public.user_speed_milestones to service_role;
create policy "Users can view their own speed milestones"
  on public.user_speed_milestones for select to authenticated
  using ((select auth.uid()) = user_id);

commit;
