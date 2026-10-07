-- Follow-up indexes for measurement-schema foreign keys.
-- Already applied to the production project. Remote migration version: 20261006071121.

create index assessment_cycle_skill_targets_cycle_user_idx
  on public.assessment_cycle_skill_targets (cycle_id, user_id);

create index practice_responses_question_idx
  on public.practice_responses (question_id);
create index practice_responses_session_user_idx
  on public.practice_responses (session_id, user_id);
create index practice_responses_source_session_user_idx
  on public.practice_responses (source_session_id, user_id);

create index practice_segments_session_user_idx
  on public.practice_segments (session_id, user_id);

create index skill_score_snapshots_cycle_user_idx
  on public.skill_score_snapshots (cycle_id, user_id);

create index user_speed_milestones_cycle_user_idx
  on public.user_speed_milestones (cycle_id, user_id);
create index user_speed_milestones_snapshot_user_idx
  on public.user_speed_milestones (snapshot_id, user_id);

commit;
