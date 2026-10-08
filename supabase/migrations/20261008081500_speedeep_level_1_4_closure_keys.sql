begin;
-- No 1.4 attempts existed when this was applied. Correct the three closure key sequences
-- before readers encounter v2; permute options, feedback and error tags together.
do $fix$
declare c public.curriculum_cases%rowtype; k private.curriculum_answer_keys%rowtype;
 r private.curriculum_case_rubrics%rowtype; target_index integer;
 targets jsonb := '{"A":[1,2,0,0,1,2],"B":[2,0,1,2,1,0],"C":[0,1,2,1,2,0]}'::jsonb;
 new_options jsonb; new_feedback jsonb; new_errors jsonb;
begin
 if exists(select 1 from public.curriculum_attempts where lesson_code='4.C' and content_version=2) then
   raise exception 'Cannot rekey used content version 2';
 end if;
 for c in select * from public.curriculum_cases where lesson_code='4.C' and content_version=2 order by variant,step loop
   select * into k from private.curriculum_answer_keys where case_id=c.id;
   select * into r from private.curriculum_case_rubrics where case_id=c.id;
   target_index := (targets->c.variant->>(c.step-1))::integer;
   select jsonb_agg(c.options->((i-target_index+k.correct_index+3)%3) order by i),
          jsonb_agg(k.feedback->((i-target_index+k.correct_index+3)%3) order by i),
          jsonb_agg(r.error_codes->((i-target_index+k.correct_index+3)%3) order by i)
     into new_options,new_feedback,new_errors from generate_series(0,2) as i;
   update public.curriculum_cases set options=new_options where id=c.id;
   update private.curriculum_answer_keys set correct_index=target_index,feedback=new_feedback where case_id=c.id;
   update private.curriculum_case_rubrics set error_codes=new_errors where case_id=c.id;
 end loop;
end $fix$;
commit;
