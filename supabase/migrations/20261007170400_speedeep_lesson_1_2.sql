begin;
insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
values ('1.2',1,2,'Unir palabras que van juntas',
  'Agrupa palabras que forman una idea para conservar el sentido de la oración.',
  'sentence_chunk',true);

do $seed$
declare item jsonb; new_case_id uuid;
begin
  for item in select value from jsonb_array_elements($cases$[{"variant": "A", "step": 1, "role": "probe", "sentence": "Aunque perdió el autobús, Clara llegó a tiempo a la reunión.", "question": "¿Qué hizo Clara?", "options": ["Perdió la reunión", "Llegó a tiempo", "Cambió el autobús"], "correct_index": 1, "feedback": ["Perder el autobús fue la dificultad; observa qué ocurrió después.", "Sí. Conservaste la acción principal.", "La oración no habla de cambiar el autobús."]}, {"variant": "A", "step": 2, "role": "probe", "sentence": "La médica revisó los resultados del laboratorio antes de llamar.", "question": "¿Qué palabras dicen qué revisó?", "options": ["La médica revisó", "los resultados del laboratorio", "antes de llamar"], "correct_index": 1, "feedback": ["Esa parte dice quién actuó; busca el objeto de la revisión.", "Correcto. Esas palabras nombran juntas lo revisado.", "Esa parte dice cuándo ocurrió la llamada."]}, {"variant": "A", "step": 3, "role": "guided", "sentence": "El aviso para los vecinos llegó esta mañana.", "question": "¿Qué palabras identifican cuál aviso llegó?", "options": ["El aviso para los vecinos", "llegó esta mañana", "para los vecinos llegó"], "correct_index": 0, "feedback": ["Sí. «Para los vecinos» precisa de qué aviso hablamos.", "Eso dice qué pasó y cuándo, no identifica el aviso.", "Separa el aviso de la acción «llegó»."]}, {"variant": "A", "step": 4, "role": "guided", "sentence": "La coordinadora no aprobó el cambio de horario.", "question": "¿Qué palabras deben ir juntas para entender la decisión?", "options": ["aprobó el cambio", "no aprobó", "el cambio de horario"], "correct_index": 1, "feedback": ["Falta «no»: cambia por completo la decisión.", "Bien. La negación pertenece a la acción.", "Eso nombra qué cambio se discutía, pero no la decisión."]}, {"variant": "A", "step": 5, "role": "transfer", "sentence": "La tienda del barrio abrió una sala de lectura para niños.", "question": "¿Qué parte nombra lo que abrió la tienda?", "options": ["La tienda del barrio", "una sala de lectura para niños", "abrió una sala"], "correct_index": 1, "feedback": ["Es quien abrió la sala, no lo que abrió.", "Correcto. Conservaste completa la unidad que describe la sala.", "La expresión está incompleta; falta qué tipo de sala era."]}, {"variant": "A", "step": 6, "role": "transfer", "sentence": "Después de la reunión, el grupo entregó las llaves del salón a Ana.", "question": "¿Qué entregó el grupo?", "options": ["las llaves del salón", "el salón a Ana", "la reunión"], "correct_index": 0, "feedback": ["Sí. «Del salón» precisa cuáles llaves entregó.", "El grupo entregó llaves, no el salón.", "La reunión ocurrió antes de la entrega."]}, {"variant": "B", "step": 1, "role": "probe", "sentence": "Pese al corte de luz, el equipo terminó el informe.", "question": "¿Qué hizo el equipo?", "options": ["Cortó la luz", "Terminó el informe", "Suspendió la reunión"], "correct_index": 1, "feedback": ["El corte de luz fue un obstáculo, no su acción.", "Exacto. Identificaste el resultado principal.", "No se menciona ninguna reunión."]}, {"variant": "B", "step": 2, "role": "probe", "sentence": "El guardia revisó las entradas del edificio principal al amanecer.", "question": "¿Qué palabras dicen qué revisó?", "options": ["El guardia revisó", "las entradas del edificio principal", "al amanecer"], "correct_index": 1, "feedback": ["Eso dice quién hizo la revisión.", "Sí. El conjunto precisa cuáles entradas revisó.", "Eso indica cuándo ocurrió."]}, {"variant": "B", "step": 3, "role": "guided", "sentence": "La carta de la directora llegó el martes.", "question": "¿Qué palabras identifican cuál carta llegó?", "options": ["llegó el martes", "La carta de la directora", "de la directora llegó"], "correct_index": 1, "feedback": ["Eso dice cuándo llegó; busca cuál carta era.", "Correcto. «De la directora» modifica a «carta».", "Mantén juntas las palabras que nombran la carta."]}, {"variant": "B", "step": 4, "role": "guided", "sentence": "Los vecinos nunca aceptaron la propuesta inicial.", "question": "¿Qué palabras deben ir juntas para entender la decisión?", "options": ["aceptaron la propuesta", "la propuesta inicial", "nunca aceptaron"], "correct_index": 2, "feedback": ["Sin «nunca» cambia el sentido de la oración.", "Eso nombra la propuesta, no indica si la aceptaron.", "Bien. La negación modifica la acción."]}, {"variant": "B", "step": 5, "role": "transfer", "sentence": "El centro cultural prestó una colección de mapas antiguos a la escuela.", "question": "¿Qué parte nombra lo prestado?", "options": ["El centro cultural", "una colección de mapas antiguos", "a la escuela"], "correct_index": 1, "feedback": ["Ese es quien prestó, no lo prestado.", "Correcto. La unidad completa describe lo prestado.", "Eso indica a quién se prestó."]}, {"variant": "B", "step": 6, "role": "transfer", "sentence": "Antes de salir, Inés guardó las copias del contrato en una carpeta.", "question": "¿Qué guardó Inés?", "options": ["una carpeta", "las copias del contrato", "Antes de salir"], "correct_index": 1, "feedback": ["La carpeta fue el lugar donde las guardó.", "Sí. «Del contrato» precisa qué copias eran.", "Esa frase indica cuándo ocurrió."]}, {"variant": "C", "step": 1, "role": "probe", "sentence": "Aunque llovía, el grupo abrió el mercado a la hora prevista.", "question": "¿Qué hizo el grupo?", "options": ["Cerró el mercado", "Abrió el mercado a tiempo", "Esperó a que cesara la lluvia"], "correct_index": 1, "feedback": ["La lluvia fue una dificultad; observa el resultado.", "Correcto. Conservaste la acción central.", "La oración no dice que esperaran."]}, {"variant": "C", "step": 2, "role": "probe", "sentence": "El técnico cambió la batería del equipo de sonido durante la pausa.", "question": "¿Qué palabras dicen qué cambió?", "options": ["El técnico cambió", "durante la pausa", "la batería del equipo de sonido"], "correct_index": 2, "feedback": ["Eso dice quién actuó; busca la pieza cambiada.", "Eso indica cuándo ocurrió.", "Sí. La unidad completa identifica qué batería era."]}, {"variant": "C", "step": 3, "role": "guided", "sentence": "La nota sobre el nuevo horario apareció en la puerta.", "question": "¿Qué palabras identifican cuál nota apareció?", "options": ["La nota sobre el nuevo horario", "apareció en la puerta", "sobre el nuevo horario apareció"], "correct_index": 0, "feedback": ["Bien. Esa unidad identifica la nota.", "Eso explica dónde apareció.", "Mantén el tema de la nota junto con «La nota»."]}, {"variant": "C", "step": 4, "role": "guided", "sentence": "La oficina todavía no confirmó la reserva del salón.", "question": "¿Qué palabras deben ir juntas para entender el estado de la reserva?", "options": ["confirmó la reserva", "todavía no confirmó", "la reserva del salón"], "correct_index": 1, "feedback": ["Sin «no» parece que la reserva ya está confirmada.", "Correcto. La acción aún no sucedió.", "Eso nombra la reserva, no su estado."]}, {"variant": "C", "step": 5, "role": "transfer", "sentence": "La escuela recibió un paquete de cuadernos reciclados para el taller.", "question": "¿Qué parte nombra lo recibido?", "options": ["La escuela", "un paquete de cuadernos reciclados", "para el taller"], "correct_index": 1, "feedback": ["La escuela lo recibió, pero no es el objeto recibido.", "Sí. Las palabras juntas describen el paquete.", "Eso indica para qué se utilizará."]}, {"variant": "C", "step": 6, "role": "transfer", "sentence": "Al final de la visita, Luis devolvió las llaves de la oficina a recepción.", "question": "¿Qué devolvió Luis?", "options": ["a recepción", "las llaves de la oficina", "la visita"], "correct_index": 1, "feedback": ["Eso indica dónde las devolvió.", "Correcto. «De la oficina» identifica las llaves.", "La visita terminó antes de la devolución."]}]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values ('1.2',1,item->>'variant',(item->>'step')::smallint,item->>'role',item->>'sentence',item->>'question',item->'options') returning id into new_case_id;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    values (new_case_id,(item->>'correct_index')::smallint,item->'feedback');
  end loop;
end $seed$;

alter table private.curriculum_case_rubrics add column skill_code text not null default 'sentence_action';
insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
select c.id,(select jsonb_agg(case when n.i=k.correct_index then null
    when n.i=0 then 'incomplete_group' else 'wrong_group' end order by n.i)
    from generate_series(0,2) n(i)),
    case when c.step=1 then 'sentence_action' else 'sentence_chunk' end
from public.curriculum_cases c join private.curriculum_answer_keys k on k.case_id=c.id
where c.lesson_code='1.2';

create or replace function private.record_curriculum_evidence()
returns trigger language plpgsql security definer set search_path='' as $$
declare c public.curriculum_cases%rowtype; rubric private.curriculum_case_rubrics%rowtype;
begin
  select * into c from public.curriculum_cases where id=new.case_id;
  select * into rubric from private.curriculum_case_rubrics where case_id=new.case_id;
  new.skill_code := rubric.skill_code;
  new.attempt_role := c.role;
  new.first_unassisted_score := case when new.first_correct then 1 else 0 end;
  new.error_code := case when new.first_correct then null else rubric.error_codes->>new.first_index end;
  new.help_used := new.retry_index is not null;
  return new;
end $$;

create or replace function private.begin_curriculum_lesson(p_lesson_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid(); l public.curriculum_lessons%rowtype;
  a public.curriculum_attempts%rowtype; completed_count integer; chosen_variant text;
begin
  if u is null then raise exception 'Inicia sesión para aprender.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into l from public.curriculum_lessons where code=p_lesson_code and is_published;
  if not found then raise exception 'La misión no está disponible.' using errcode='22023'; end if;
  if p_lesson_code='1.2' and not exists (select 1 from public.curriculum_attempts where user_id=u and lesson_code='1.1' and status='completed') then
    raise exception 'Completa primero la lección 1.1.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_lesson_code, 0));
  select * into a from public.curriculum_attempts
    where user_id=u and lesson_code=l.code and status='active' for update;
  if not found then
    select count(*) into completed_count from public.curriculum_attempts
      where user_id=u and lesson_code=l.code and status='completed';
    chosen_variant := case when completed_count % 3 = 0 then 'A' when completed_count % 3 = 1 then 'B' else 'C' end;
    if (select count(*) from public.curriculum_cases
      where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then
      raise exception 'Faltan casos para esta misión.' using errcode='22023';
    end if;
    insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant)
      values(u,l.code,l.content_version,chosen_variant) returning * into a;
  end if;
  return private.curriculum_lesson_state(a.id);
end $$;

commit;
