"""Rekey the already authored autocontrol bank; preserve v1 attempts."""
import json
from itertools import permutations
from pathlib import Path
patterns={
 '4.1':{'A':[2,0,1,1,2,0],'B':[1,2,0,2,0,1],'C':[0,1,2,0,1,2]},
 '4.2':{'A':[1,2,0,0,2,1],'B':[2,0,1,1,0,2],'C':[0,2,1,2,1,0]},
 '4.3':{'A':[2,1,0,1,0,2],'B':[0,1,2,2,0,1],'C':[1,0,2,0,2,1]},
 '4.4':{'A':[0,2,1,1,2,0],'B':[1,0,2,2,1,0],'C':[2,1,0,0,1,2]},
 '4.C':{'A':[1,0,2,0,2,1],'B':[2,1,0,1,0,2],'C':[0,2,1,2,1,0]}}
used=set()
spares=[p for p in sorted(set(permutations([0,0,1,1,2,2]))) if p!=(0,1,2,0,1,2)]
for code,variants in patterns.items():
 for v,positions in variants.items():
  if tuple(positions) in used:
   positions=list(next(p for p in spares if p not in used))
   variants[v]=positions
  used.add(tuple(positions))
assert len(used)==15
assert all(sorted(v)==[0,0,1,1,2,2] for values in patterns.values() for v in values.values())
source=Path('supabase/migrations/20261008070000_speedeep_level_1_3_v2.sql').read_text()
start=source.index('create or replace function private.begin_curriculum_lesson(p_lesson_code text)')
end=source.index('end $$;',start)+len('end $$;')
function=source[start:end]
old="end and status='completed') then\n   raise exception 'Completa la lección anterior del nivel 1.4.'"
new="end and status='completed' and transfer_correct>=1) then\n   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.4.'"
assert old in function
function=function.replace(old,new)
seed='''begin;
-- Carry the already written 1.4 cases into v2 with balanced, non-repeating answer positions.
-- Every v1 attempt continues to point at its original immutable cases.
do $seed$
declare c public.curriculum_cases%rowtype; k private.curriculum_answer_keys%rowtype;
 r private.curriculum_case_rubrics%rowtype; new_id uuid; target_index integer;
 targets jsonb := $patterns$'''+json.dumps({code+'|'+v:positions for code,variants in patterns.items() for v,positions in variants.items()},separators=(',',':'))+'''$patterns$::jsonb;
 new_options jsonb; new_feedback jsonb; new_errors jsonb;
begin
 for c in select * from public.curriculum_cases where lesson_code in ('4.1','4.2','4.3','4.4','4.C') and content_version=1 order by lesson_code,variant,step loop
  select * into k from private.curriculum_answer_keys where case_id=c.id;
  select * into r from private.curriculum_case_rubrics where case_id=c.id;
  if k.case_id is null or r.case_id is null then raise exception 'Incomplete v1 case: %',c.id; end if;
  target_index := (targets->(c.lesson_code||'|'||c.variant)->>(c.step-1))::integer;
  select jsonb_agg(c.options->((i-target_index+k.correct_index+3)%3) order by i),
         jsonb_agg(k.feedback->((i-target_index+k.correct_index+3)%3) order by i),
         jsonb_agg(r.error_codes->((i-target_index+k.correct_index+3)%3) order by i)
   into new_options,new_feedback,new_errors from generate_series(0,2) as i;
  insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
   values(c.lesson_code,2,c.variant,c.step,c.role,c.sentence,c.question,new_options) returning id into new_id;
  insert into private.curriculum_answer_keys(case_id,correct_index,feedback) values(new_id,target_index,new_feedback);
  insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code) values(new_id,new_errors,r.skill_code);
 end loop;
end $seed$;
update public.curriculum_lessons set content_version=2 where code in ('4.1','4.2','4.3','4.4','4.C');
'''
Path('supabase/migrations/20261008080000_speedeep_level_1_4_v2_progression.sql').write_text(seed+function+'\ncommit;\n')
print('cases expected',15*6,'migration bytes',len((seed+function).encode()))
