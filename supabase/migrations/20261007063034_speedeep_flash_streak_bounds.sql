begin;
-- A learner at the minimum or maximum rank can meet a change threshold
-- without changing rank. Preserve the saturated streak safely at the edge.
alter table public.flash_profiles drop constraint flash_profiles_high_streak_check;
alter table public.flash_profiles drop constraint flash_profiles_low_streak_check;
alter table public.flash_profiles add constraint flash_profiles_high_streak_check check (high_streak between 0 and 2);
alter table public.flash_profiles add constraint flash_profiles_low_streak_check check (low_streak between 0 and 2);
commit;
