begin;
-- Historical rows retain their original timer protocol, even when otherwise eligible.
alter table private.practice_start_tickets add column timing_protocol_version text not null default 'prestart_v1'
 check (timing_protocol_version in ('prestart_v1','on_demand_v2'));
alter table public.practice_sessions add column timing_protocol_version text not null default 'prestart_v1'
 check (timing_protocol_version in ('prestart_v1','on_demand_v2'));
create or replace function private.begin_practice_v2(p_article_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 result := private.begin_practice(p_article_id);
 update private.practice_start_tickets set timing_protocol_version='on_demand_v2'
 where ticket_id=(result->>'ticketId')::uuid and user_id=auth.uid();
 return result;
end $$;
revoke all on function private.begin_practice_v2(uuid) from public,anon;
grant execute on function private.begin_practice_v2(uuid) to authenticated;
create or replace function public.begin_practice_v2(p_article_id uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select private.begin_practice_v2(p_article_id); $$;
revoke all on function public.begin_practice_v2(uuid) from public,anon;
grant execute on function public.begin_practice_v2(uuid) to authenticated;
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
  v_speed_eligible := v_ticket.timing_protocol_version='on_demand_v2' and v_first_reading and v_article.assessment_use='evaluation'
    and v_article.word_count>=300 and v_score>=70 and v_speed_question_count>=3;

  insert into public.practice_sessions (
    id, user_id, article_id, started_at, completed_at, duration_seconds,
    words_read, comprehension_score, active_reading_seconds,
    article_content_version, difficulty_level_snapshot, difficulty_multiplier,
    purpose_code, validity_status, validity_reason, speed_eligible, measurement_formula_version, timing_protocol_version
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
    v_speed_eligible, 'v1', v_ticket.timing_protocol_version
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


do $seed$
declare a jsonb; q jsonb; article_id uuid; question_id uuid; position integer;
begin
 for a in select value from jsonb_array_elements($readings$[{"slug": "calibracion-el-turno-del-taller", "title": "El turno del taller", "category": "Vida cotidiana", "difficulty_level": "beginner", "text_type": "narrative", "purpose_codes": ["comprender", "inferir"], "body": "El taller comunitario abría los sábados para reparar objetos pequeños. Una mañana, Julia llevó una lámpara que había dejado de encender. En la puerta encontró a tres personas esperando, aunque el salón parecía vacío. Un cartel decía que cada visitante debía anotar su nombre en una hoja y esperar a que le llamaran. Julia se apuntó y preguntó cuánto faltaba. Nadie sabía responderle.\n\nA los pocos minutos salió Mateo, encargado del taller. Explicó que dentro había dos mesas de trabajo, pero una estaba ocupada con herramientas que no se habían guardado el día anterior. Había comenzado a atender por orden de llegada. Sin embargo, una reparación complicada podía ocupar toda la mañana y dejar a los demás sin turno. Julia propuso anotar también el tipo de objeto y el problema descrito, sin prometer que todas las reparaciones fueran rápidas.\n\nMateo revisó la lista. La primera persona necesitaba cambiar una pieza de una radio; la segunda quería saber si podía reparar el asa de una bolsa; Julia llevaba la lámpara; la última persona pedía orientación sobre una bicicleta. Mateo podía revisar la bolsa y la lámpara en pocos minutos. La radio requería una pieza que no estaba disponible, mientras que la bicicleta necesitaba una herramienta especial. Informó a cada persona antes de empezar, para que decidiera si prefería esperar o volver otro día.\n\nJulia eligió quedarse. Mateo comprobó primero el enchufe y después abrió la base de la lámpara. Encontró un cable suelto y lo ajustó. Al probarla, la luz encendió. La dueña de la bolsa recibió una recomendación para reforzar el asa. Las otras dos personas anotaron qué piezas o herramientas debían traer la semana siguiente. Nadie obtuvo una solución idéntica, pero todos salieron con un paso claro.\n\nAl cerrar, Mateo limpió la segunda mesa y dejó los materiales en cajas marcadas. También cambió el cartel de la entrada. Ahora explicaba cómo describir el problema y avisaba que algunas revisiones solo permitirían planear la reparación. Julia vio el nuevo cartel la semana siguiente. La fila no había desaparecido, pero las personas comprendían mejor qué esperar y podían usar su tiempo con más tranquilidad.", "questions": [["¿Cuál fue el cambio principal en la organización del taller?", ["Cerró los sábados para evitar filas.", "Registró el problema de cada objeto e informó qué podía hacer.", "Prometió reparar todos los objetos en el mismo día."], 1, "main_idea", "idea_identification"], ["¿Por qué la radio no se reparó esa mañana?", ["Faltaba una pieza.", "La persona llegó después de Julia.", "Mateo no atendía radios."], 0, "literal", "comprehension"], ["¿Qué hizo Julia cuando supo que podían revisar su lámpara?", ["Se llevó la lámpara sin esperar.", "Buscó una herramienta especial.", "Eligió quedarse."], 2, "supporting_detail", "comprehension"], ["¿Qué tenían en común las cuatro personas al salir?", ["Todas recibieron una lámpara nueva.", "Cada una sabía cuál era el siguiente paso.", "Todas habían terminado su reparación."], 1, "inferential", "comprehension"], ["¿Para qué cambió Mateo el cartel?", ["Para explicar expectativas y pedir una descripción del problema.", "Para anunciar que el taller ya no recibiría visitas.", "Para sustituir la lista de turnos por una fila sin orden."], 0, "purpose_task", "adaptation_to_purpose"]], "word_count": 353}, {"slug": "calibracion-el-mapa-del-huerto", "title": "El mapa del huerto", "category": "Vida cotidiana", "difficulty_level": "beginner", "text_type": "narrative", "purpose_codes": ["comprender", "inferir"], "body": "En el huerto de la colonia, las familias se turnaban para regar las plantas. Un lunes, Nora encontró varias macetas secas junto a otras con la tierra muy húmeda. Pensó que alguien había olvidado su turno. Antes de enviar un mensaje al grupo, revisó la hoja donde anotaban las visitas. Dos familias habían ido el domingo y ambas habían regado la misma fila, porque las marcas de las macetas ya casi no se veían.\n\nNora habló con Andrés, quien coordinaba el huerto. Él propuso escribir nombres nuevos en todas las macetas. Ella señaló que algunas se movían cada vez que limpiaban el patio. Además, había plantas grandes que ocupaban más de una maceta. Decidieron dibujar un mapa sencillo de las cuatro filas y numerar los espacios en el suelo. El mapa mostraría qué fila correspondía a cada turno y qué plantas necesitaban menos agua.\n\nEl sábado siguiente reunieron a las familias. Una niña preguntó qué pasaría si alguien no podía acudir el día asignado. Andrés respondió que bastaba con avisar al grupo antes del turno para que otra persona lo tomara. Nora añadió un espacio en la hoja para registrar el cambio. No quería que una ausencia se confundiera con una tarea realizada. También acordaron anotar la fecha de riego, en lugar de marcar únicamente una palomita sin contexto.\n\nDurante la primera semana, el mapa ayudó a distribuir el trabajo, pero apareció un problema nuevo. La llave de agua quedó cerrada una tarde y quien tenía el turno no pudo llenar la regadera. Esa persona anotó lo ocurrido y avisó en el grupo. Al día siguiente, otra familia completó el riego de esa fila. El registro permitió entender el retraso sin culpar a quien había intentado cumplir.\n\nDespués de un mes, Nora volvió a recorrer el patio. Las macetas no estaban siempre igual de húmedas; el calor cambiaba de un día a otro. Sin embargo, ya no había filas olvidadas ni dos familias regando por error el mismo espacio. El mapa no cuidaba las plantas por sí solo. Servía para que las personas compartieran una idea clara del trabajo, detectaran problemas y pudieran corregirlos a tiempo.", "questions": [["¿Por qué se regó dos veces la misma fila?", ["Las familias no conocían los turnos.", "Las marcas de las macetas eran difíciles de ver.", "El mapa decía que todas las filas debían regarse dos veces."], 1, "literal", "comprehension"], ["¿Qué identificaba el mapa?", ["Los espacios de las filas y las necesidades de riego.", "El precio de las macetas nuevas.", "Los nombres de todos los visitantes del patio."], 0, "supporting_detail", "comprehension"], ["¿Para qué registraban un cambio de turno?", ["Para castigar a quien faltara.", "Para cerrar el huerto al día siguiente.", "Para distinguir una ausencia de una tarea ya realizada."], 2, "inferential", "comprehension"], ["¿Qué hizo la familia del día siguiente tras el problema con la llave?", ["Movió todas las macetas.", "Regó la fila que había quedado pendiente.", "Borró el registro del turno anterior."], 1, "literal", "comprehension"], ["¿Cuál es la idea central?", ["Un mapa compartido ayuda a coordinar y corregir el cuidado del huerto.", "Las plantas necesitan siempre la misma cantidad de agua.", "El mejor método es que cada familia riegue cualquier fila."], 0, "main_idea", "idea_identification"]], "word_count": 356}, {"slug": "calibracion-la-caja-de-los-libros", "title": "La caja de los libros", "category": "Vida cotidiana", "difficulty_level": "beginner", "text_type": "narrative", "purpose_codes": ["comprender", "inferir"], "body": "La escuela organizó un intercambio de libros entre familias. Cada persona podía llevar un libro en buen estado y elegir otro de una mesa común. El primer día llegaron más cajas de las previstas. Elena, voluntaria de la entrada, intentó colocarlas por tamaño, pero algunos libros para niñas y niños pequeños quedaron mezclados con manuales de cocina y novelas. Varias personas tardaban mucho en encontrar algo que quisieran leer.\n\nTomás, otro voluntario, sugirió hacer una lista de títulos. Elena pensó que una lista sería útil al final, pero primero necesitaban que las mesas fueran fáciles de recorrer. Pidió a dos familias que ayudaran a separar los libros por tipo de lectura. Usaron tres carteles: historias, información y libros para primeros lectores. Dentro de cada grupo dejaron los ejemplares visibles, sin ordenarlos por precio ni por color de la portada.\n\nA media mañana, una madre avisó que había llevado dos libros, aunque la regla hablaba de uno. Quería saber si podía llevarse dos a cambio. Los voluntarios revisaron el aviso original: cada familia podía elegir un libro por visita, pero el cartel no decía que estuviera prohibido donar más. Le agradecieron los dos ejemplares y explicaron la regla con calma. Después añadieron la frase «Puedes donar varios; elige uno por visita» al cartel de entrada.\n\nMás tarde encontraron una caja sin nombre junto a la puerta. Contenía libros con hojas sueltas y páginas manchadas. Como no sabían quién la había dejado, apartaron esos ejemplares para revisarlos. No los pusieron en la mesa común solo para llenar espacios. Los libros que podían repararse fueron destinados al taller escolar; los demás se separaron para reciclaje. La decisión evitó que otra familia eligiera un ejemplar incompleto sin darse cuenta.\n\nAl terminar la jornada, Elena contó cuántos libros quedaban en cada mesa. Había menos historias que libros informativos. Con esa información preparó un mensaje para el siguiente intercambio: pedía más cuentos, explicaba la regla de selección y recordaba revisar el estado del libro antes de llevarlo. Tomás hizo entonces la lista de títulos para quienes quisieran consultar el catálogo con anticipación. Ordenar las mesas había resuelto la búsqueda del día; registrar lo ocurrido ayudó a preparar la siguiente jornada.", "questions": [["¿Cómo organizaron las mesas después de ver la dificultad?", ["Por tamaño de las cajas.", "Por tipo de lectura.", "Por color de portada."], 1, "literal", "comprehension"], ["¿Qué aclararon a la madre que donó dos libros?", ["Podía donar varios, pero elegir uno por visita.", "Tenía que retirar uno de sus libros.", "Podía llevarse tantos como hubiera donado."], 0, "supporting_detail", "comprehension"], ["¿Por qué apartaron la caja sin nombre?", ["Porque todas las cajas sin nombre estaban reservadas.", "Porque Tomás no había terminado la lista.", "Porque sus libros necesitaban revisión antes de ofrecerlos."], 2, "inferential", "comprehension"], ["¿Para qué contó Elena los libros que quedaban?", ["Para decidir a quién cobrar por los libros.", "Para saber qué pedir y explicar en el próximo intercambio.", "Para cerrar el taller escolar."], 1, "purpose_task", "adaptation_to_purpose"], ["¿Qué resume mejor la historia?", ["Organizar, aclarar reglas y registrar lo ocurrido mejoró el intercambio.", "La escuela decidió vender todos sus libros.", "La lista de títulos reemplazó la revisión de los ejemplares."], 0, "main_idea", "idea_identification"]], "word_count": 364}]$readings$::jsonb) loop
   insert into public.reading_articles(slug,title,category,estimated_minutes,body,word_count,is_published,difficulty_level,text_type,purpose_codes,assessment_use)
   values (a->>'slug',a->>'title',a->>'category',5,a->>'body',
     cardinality(regexp_split_to_array(btrim(regexp_replace(a->>'body','\s+',' ','g')),' ')),
     true,'beginner','narrative',array(select jsonb_array_elements_text(a->'purpose_codes')),'evaluation')
   returning id into article_id;
   position:=0;
   for q in select value from jsonb_array_elements(a->'questions') loop
     position:=position+1;
     insert into public.article_questions(article_id,legacy_question_key,prompt,options,question_type,skill_code,assessment_stage,max_points,sort_order)
     values(article_id,'calibration-v2:'||position,q->>0,q->1,q->>3,q->>4,'immediate',1,position)
     returning id into question_id;
     insert into private.article_answer_keys(question_id,answer_key) values(question_id,q->2);
   end loop;
 end loop;
end $seed$;
commit;
