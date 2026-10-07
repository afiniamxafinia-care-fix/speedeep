"""Validate original content and build an atomic, reviewable Supabase content migration."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
pack = json.loads((root / 'content/practice-pack-v2.json').read_text())
for article in pack['articles']:
    assert len(article['body'].split()) >= 300, article['slug']
    assert len(article['questions']) >= 5
    for prompt, options, correct, kind, skill in article['questions']:
        assert len(options) == len(set(options)) and 0 <= correct < len(options)
for exercise in pack['exercises']:
    assert len(set(exercise['answer'])) == len(exercise['answer'])
    assert all(0 <= i < len(exercise['items']) for i in exercise['answer'])
    if exercise['kind'] == 'sequence':
        assert sorted(exercise['answer']) == list(range(len(exercise['items'])))
    elif exercise['kind'] != 'relevance':
        assert len(exercise['answer']) == 1

payload = json.dumps(pack, ensure_ascii=False)
assert '$content$' not in payload
seed = """
do $seed$
declare pack jsonb := $content$PAYLOAD$content$::jsonb;
  a jsonb; q jsonb; e jsonb; article_id uuid; question_id uuid; exercise_id uuid; position integer;
begin
  for a in select value from jsonb_array_elements(pack->'articles') loop
    insert into public.reading_articles(slug,title,category,estimated_minutes,body,word_count,
      is_published,difficulty_level,text_type,purpose_codes,assessment_use)
    values(a->>'slug',a->>'title',a->>'category',5,a->>'body',
      cardinality(regexp_split_to_array(btrim(regexp_replace(a->>'body','\\s+',' ','g')),' ')),
      true,a->>'difficulty_level',a->>'text_type',
      array(select jsonb_array_elements_text(a->'purpose_codes')),'evaluation')
    returning id into article_id;
    position:=0;
    for q in select value from jsonb_array_elements(a->'questions') loop
      position:=position+1;
      insert into public.article_questions(article_id,legacy_question_key,prompt,options,question_type,
        skill_code,assessment_stage,max_points,sort_order)
      values(article_id,'content-v2:'||position,q->>0,q->1,q->>3,q->>4,'immediate',1,position)
      returning id into question_id;
      insert into private.article_answer_keys(question_id,answer_key) values(question_id,q->2);
    end loop;
  end loop;
  for e in select value from jsonb_array_elements(pack->'exercises') loop
    insert into public.training_exercises(slug,kind,title,instructions,context,items,skill_code,is_published)
    values(e->>'slug',e->>'kind',e->>'title',e->>'instructions',e->>'context',e->'items',e->>'skill_code',true)
    returning id into exercise_id;
    insert into private.training_answer_keys(exercise_id,expected_indices,explanation)
    values(exercise_id,e->'answer',e->>'explanation');
  end loop;
end $seed$;
""".replace('PAYLOAD', payload)

# Preserve QSD evidence rules: warmups and repeats still save results but cannot
# establish a speed trend. The authoritative gate is calculated by the database.
existing = (root / 'supabase/migrations/20261006081024_speedeep_submit_practice_v1.sql').read_text()
function = existing[existing.index('create or replace function private.submit_practice('):]
function = function.replace('v_session_id uuid := gen_random_uuid();', 'v_session_id uuid := gen_random_uuid();\n  v_first_reading boolean;\n  v_speed_eligible boolean;')
needle = 'v_score := round(100.0 * v_points / nullif(v_max_points, 0))::smallint;'
function = function.replace(needle, needle + """
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  v_first_reading := not exists (
    select 1 from public.practice_sessions where user_id=v_user_id and article_id=v_article.id
      and article_content_version=v_article.content_version and validity_status='valid');
  v_speed_eligible := v_first_reading and v_article.assessment_use='evaluation'
    and v_article.word_count>=300 and v_score>=70 and v_speed_question_count>=3;
""")
function = function.replace("case when v_score < 70 then", "case when not v_first_reading then 'repeat_for_training_only'\n         when v_article.assessment_use<>'evaluation' or v_article.word_count<300 then 'short_practice_for_training_only'\n         when v_score < 70 then")
function = function.replace('v_score >= 70 and v_speed_question_count >= 3', 'v_speed_eligible')
output = 'begin;\n' + (root / 'docs/training-exercises-v2.sql').read_text() + '\n' + seed + '\n' + function + '\ncommit;\n'
(root / 'docs/practice-content-v2-migration.sql').write_text(output)
print(f"Validated {len(pack['articles'])} readings, {sum(len(a['questions']) for a in pack['articles'])} questions, {len(pack['exercises'])} training exercises.")
