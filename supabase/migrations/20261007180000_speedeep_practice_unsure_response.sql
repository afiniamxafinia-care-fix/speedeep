-- Selected index -1 records an explicit unknown answer. It is scored as incorrect,
-- remains visible in the response payload, and cannot accidentally match a valid key.
create or replace function private.submit_practice(
  p_article_id uuid,
  p_ticket_id uuid,
  p_active_reading_seconds integer,
  p_responses jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_duration_seconds integer;
  v_active_reading_seconds integer;
  v_article public.reading_articles%rowtype;
  v_ticket private.practice_start_tickets%rowtype;
  v_question public.article_questions%rowtype;
  v_item jsonb;
  v_key jsonb;
  v_selected integer;
  v_correct boolean;
  v_correct_count integer := 0;
  v_question_count integer := 0;
  v_speed_question_count integer := 0;
  v_points numeric := 0;
  v_max_points numeric := 0;
  v_score smallint;
  v_session_id uuid := gen_random_uuid();
  v_first_reading boolean;
  v_speed_eligible boolean;
begin
  if v_user_id is null then
    raise exception 'Inicia sesión para guardar tu práctica.' using errcode = '28000';
  end if;
  if not private.can_practice() then
    raise exception 'Tu acceso de práctica no está activo.' using errcode = '42501';
  end if;
  if p_responses is null or jsonb_typeof(p_responses) <> 'array' then
    raise exception 'Las respuestas no tienen un formato válido.' using errcode = '22023';
  end if;
  if p_active_reading_seconds is null or p_active_reading_seconds < 10 then
    raise exception 'La lectura debe durar al menos 10 segundos.' using errcode = '22023';
  end if;
  select * into v_ticket
  from private.practice_start_tickets t
  where t.ticket_id = p_ticket_id and t.user_id = v_user_id and t.article_id = p_article_id
    and t.consumed_at is null and t.expires_at > v_now
  for update;
  if not found then
    raise exception 'La práctica venció o ya fue enviada. Inicia una lectura nueva.' using errcode = '22023';
  end if;
  v_duration_seconds := floor(extract(epoch from (v_now - v_ticket.started_at)))::integer;
  if v_duration_seconds < 10 then
    raise exception 'La lectura debe durar al menos 10 segundos.' using errcode = '22023';
  end if;
  v_active_reading_seconds := least(p_active_reading_seconds, v_duration_seconds);

  select * into v_article
  from public.reading_articles a
  where a.id = p_article_id and a.is_published;
  if not found then
    raise exception 'La lectura no está disponible.' using errcode = '22023';
  end if;

  select count(*) into v_question_count
  from public.article_questions q
  where q.article_id = p_article_id and q.is_active and q.assessment_stage = 'immediate';
  if v_question_count = 0 or jsonb_array_length(p_responses) <> v_question_count then
    raise exception 'Responde todas las preguntas de esta práctica.' using errcode = '22023';
  end if;
  v_speed_question_count := v_question_count;

  for v_question in
    select q.* from public.article_questions q
    where q.article_id = p_article_id and q.is_active and q.assessment_stage = 'immediate'
    order by q.sort_order, q.id
  loop
    select item into v_item
    from jsonb_array_elements(p_responses) as responses(item)
    where item ->> 'questionId' = v_question.id::text;
    if v_item is null or jsonb_typeof(v_question.options) is distinct from 'array' then
      raise exception 'Una pregunta no tiene respuesta válida.' using errcode = '22023';
    end if;
    begin
      v_selected := (v_item ->> 'selectedIndex')::integer;
    exception when others then
      raise exception 'Una respuesta seleccionada no es válida.' using errcode = '22023';
    end;
    if v_selected is null or v_selected < -1 or v_selected >= jsonb_array_length(v_question.options) then
      raise exception 'Una respuesta seleccionada no pertenece a las opciones.' using errcode = '22023';
    end if;
    select k.answer_key into v_key
    from private.article_answer_keys k
    where k.question_id = v_question.id;
    if v_key is null then
      raise exception 'Falta la clave de una pregunta; no se guardó la práctica.' using errcode = '22023';
    end if;
    v_correct := v_selected = coalesce(v_key ->> 'correctIndex', v_key #>> '{}')::integer;
    if v_correct then
      v_correct_count := v_correct_count + 1;
      v_points := v_points + v_question.max_points;
    end if;
    v_max_points := v_max_points + v_question.max_points;
  end loop;

  v_score := round(100.0 * v_points / nullif(v_max_points, 0))::smallint;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  v_first_reading := not exists (
    select 1 from public.practice_sessions where user_id=v_user_id and article_id=v_article.id
      and article_content_version=v_article.content_version and validity_status='valid');
  v_speed_eligible := v_first_reading and v_article.assessment_use='evaluation'
    and v_article.word_count>=300 and v_score>=70 and v_speed_question_count>=3;

  insert into public.practice_sessions (
    id, user_id, article_id, started_at, completed_at, duration_seconds,
    words_read, comprehension_score, active_reading_seconds,
    article_content_version, difficulty_level_snapshot, difficulty_multiplier,
    purpose_code, validity_status, validity_reason, speed_eligible, measurement_formula_version
  ) values (
    v_session_id, v_user_id, v_article.id, v_ticket.started_at, v_now, v_duration_seconds,
    v_article.word_count, v_score, v_active_reading_seconds,
    v_article.content_version, v_article.difficulty_level, null,
    v_article.purpose_codes[1], 'valid',
    case when not v_first_reading then 'repeat_for_training_only'
         when v_article.assessment_use<>'evaluation' or v_article.word_count<300 then 'short_practice_for_training_only'
         when v_score < 70 then 'comprehension_below_speed_eligibility_gate'
         when v_speed_question_count < 3 then 'insufficient_question_evidence_for_speed'
         else null end,
    v_speed_eligible, 'v1'
  );

  for v_question in
    select q.* from public.article_questions q
    where q.article_id = p_article_id and q.is_active and q.assessment_stage = 'immediate'
    order by q.sort_order, q.id
  loop
    select item into v_item
    from jsonb_array_elements(p_responses) as responses(item)
    where item ->> 'questionId' = v_question.id::text;
    select k.answer_key into v_key from private.article_answer_keys k where k.question_id = v_question.id;
    v_selected := (v_item ->> 'selectedIndex')::integer;
    v_correct := v_selected = coalesce(v_key ->> 'correctIndex', v_key #>> '{}')::integer;
    insert into public.practice_responses (
      user_id, session_id, source_session_id, question_id, assessment_stage,
      response_payload, score_points, max_points, is_correct
    ) values (
      v_user_id, v_session_id, v_session_id, v_question.id, 'immediate',
      jsonb_build_object('selectedIndex', v_selected),
      case when v_correct then v_question.max_points else 0 end,
      v_question.max_points, v_correct
    );
  end loop;

  update private.practice_start_tickets set consumed_at = v_now where ticket_id = v_ticket.ticket_id;

  return jsonb_build_object(
    'sessionId', v_session_id,
    'wordsRead', v_article.word_count,
    'activeReadingSeconds', v_active_reading_seconds,
    'rawActivePpm', round(v_article.word_count * 60.0 / v_active_reading_seconds, 2),
    'comprehensionScore', v_score,
    'correctAnswers', v_correct_count,
    'totalQuestions', v_question_count,
    'speedEligible', v_speed_eligible
  );
end;
$$;

