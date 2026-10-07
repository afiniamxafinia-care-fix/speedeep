create index curriculum_attempts_lesson_idx on public.curriculum_attempts(lesson_code);
create index curriculum_responses_attempt_user_idx on public.curriculum_responses(attempt_id,user_id);
create index curriculum_responses_case_idx on public.curriculum_responses(case_id);
