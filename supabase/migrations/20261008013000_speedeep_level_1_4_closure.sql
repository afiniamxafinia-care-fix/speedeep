begin;
insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
 values('4.C',4,5,'Cierre: recuperar el sentido','Detecta, repara, localiza y retoma en ejemplos nuevos.','monitor_integration',true);
do $seed$
declare item jsonb; cid uuid;
begin
 for item in select value from jsonb_array_elements($cases$[{"v":"A","s":1,"p":"El aviso anuncia apertura el martes. Al final exige presentarse el miércoles de apertura.","q":"¿Qué detalle exige detenerte?","o":["Los dos días distintos para la misma apertura","La palabra apertura","El nombre del lugar"],"k":0,"skill":"monitor_break"},{"v":"A","s":2,"p":"El texto llama «vigente» a un permiso, pero necesitas saber si uno de hace ocho meses es aceptado.","q":"¿Qué acción resuelve la duda?","o":["Releer la palabra vigente muchas veces","Pedir el periodo exacto de vigencia","Suponer que sirve todo el año"],"k":1,"skill":"repair_choice"},{"v":"A","s":3,"p":"La biblioteca abre los sábados de 10 a 14. Los préstamos terminan media hora antes del cierre.","q":"¿Qué dato localizarías para pedir un libro el sábado?","o":["La apertura de lunes","El nombre de los libros","El horario de sábado y el cierre anticipado de préstamos"],"k":2,"skill":"targeted_reread"},{"v":"A","s":4,"p":"La asociación reunió alimentos, los clasificó y ahora prepara la entrega.","q":"Al ocultar el texto, ¿cuál era el último paso completado?","o":["Clasificar los alimentos","Entregar todos los alimentos","Comprar más cajas"],"k":0,"skill":"focus_resume"},{"v":"A","s":5,"p":"Un cartel dice que el autobús termina a las 18. Luego recomienda tomarlo a las 19 sin indicar extensión.","q":"¿Qué harías antes de planear ese viaje?","o":["Ignorar el horario","Confirmar si se extendió el servicio","Asumir que la ruta opera hasta las 19"],"k":1,"skill":"repair_choice"},{"v":"A","s":6,"p":"La clínica confirmó las citas del viernes. Ahora espera saber cuántos pacientes necesitarán intérprete.","q":"¿Qué dato quedó pendiente al retomar?","o":["La fecha del viernes","El nombre de la clínica","Cuántos necesitarán intérprete"],"k":2,"skill":"focus_resume"},{"v":"B","s":1,"p":"La invitación fija la reunión el lunes y después habla del martes de esa misma reunión.","q":"¿Qué ruptura hay?","o":["La fecha de una misma reunión no coincide","La reunión tiene invitados","Se menciona un lugar"],"k":0,"skill":"monitor_break"},{"v":"B","s":2,"p":"La nota ofrece una «prórroga» sin decir la nueva fecha. Debes entregar mañana.","q":"¿Qué reparación sirve?","o":["Adivinar una semana adicional","Consultar la nueva fecha límite","Esperar sin entregar"],"k":1,"skill":"repair_choice"},{"v":"B","s":3,"p":"Los pedidos de zona norte se entregan en puerta B. Los demás se recogen en recepción. Se solicita un folio.","q":"¿Qué fragmento relees si eres de zona norte?","o":["La recepción para los demás","El requisito de folio solamente","La asignación de puerta B a zona norte"],"k":2,"skill":"targeted_reread"},{"v":"B","s":4,"p":"El equipo comparó dos rutas: una era más corta pero tenía escaleras; la otra era accesible. Todavía no eligió.","q":"Al ocultar el texto, ¿qué decisión seguía pendiente?","o":["Elegir una ruta","Abrir otra calle","Cambiar el autobús"],"k":0,"skill":"focus_resume"},{"v":"B","s":5,"p":"Una guía señala que el parque sigue cerrado y luego pide entrar para una actividad sin indicar reapertura.","q":"¿Qué acción repara el problema?","o":["Entrar de todos modos","Confirmar si existe una excepción o reapertura","Ignorar el cierre"],"k":1,"skill":"repair_choice"},{"v":"B","s":6,"p":"La escuela recogió uniformes y los ordenó por talla. Falta comunicar el horario de entrega a las familias.","q":"¿Qué quedaba por hacer?","o":["Volver a recoger todos los uniformes","Comprarlos nuevos","Comunicar el horario de entrega"],"k":2,"skill":"focus_resume"},{"v":"C","s":1,"p":"El documento dice que el registro cerró ayer. La última línea invita a registrarse hoy sin explicar una excepción.","q":"¿Qué debe alertarte?","o":["El plazo cerrado frente a la invitación actual","El nombre del registro","La existencia de dos líneas"],"k":0,"skill":"monitor_break"},{"v":"C","s":2,"p":"El anuncio permite descuento bajo condiciones que no enumera. Necesitas pagar hoy.","q":"¿Cómo reparas el dato faltante?","o":["Suponer que todos califican","Consultar las condiciones antes de pagar","Releer el precio sin objetivo"],"k":1,"skill":"repair_choice"},{"v":"C","s":3,"p":"La ruta A termina a las 18 y la B a las 20. Ambas paran frente al museo.","q":"Llegas a las 19. ¿Qué fragmento necesitas?","o":["El nombre del museo","La primera ruta solamente","Los horarios finales de ambas rutas"],"k":2,"skill":"targeted_reread"},{"v":"C","s":4,"p":"El taller prestó herramientas, aumentaron las reservas y ahora debe calcular el costo de repararlas.","q":"Al ocultar el texto, ¿qué cuestión seguía abierta?","o":["El costo de reparar herramientas","Cuántas personas viven cerca","Dónde se compraron las herramientas"],"k":0,"skill":"focus_resume"},{"v":"C","s":5,"p":"La instrucción exige entrega solo presencial y luego pide enviarla únicamente por correo, sin más contexto.","q":"¿Qué harías para resolverlo?","o":["Escoger por intuición","Pedir confirmación del método válido","Mandarla por dos vías sin preguntar"],"k":1,"skill":"repair_choice"},{"v":"C","s":6,"p":"El mercado probó etiquetas por unidad. Los clientes compararon más rápido; falta revisar si resisten el uso diario.","q":"¿Qué dato pendiente necesitas recordar?","o":["El nombre del mercado","El tamaño de los envases","Si las etiquetas siguen legibles"],"k":2,"skill":"focus_resume"}]$cases$::jsonb) loop
  insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
   values('4.C',1,item->>'v',(item->>'s')::smallint,'transfer',item->>'p',item->>'q',item->'o') returning id into cid;
  insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
   select cid,(item->>'k')::smallint,(select jsonb_agg(case when i=(item->>'k')::integer then 'Correcto. La elección responde a la duda con evidencia.' else 'Busca el dato que falta o la última idea antes de decidir.' end order by i) from generate_series(0,2) i);
  insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
   select cid,(select jsonb_agg(case when i=(item->>'k')::integer then null else 'monitor_strategy_missed' end order by i) from generate_series(0,2) i),item->>'skill';
 end loop;
end $seed$;
alter table public.curriculum_attempts drop constraint curriculum_attempts_transfer_correct_check;
alter table public.curriculum_attempts add constraint curriculum_attempts_transfer_correct_check
 check ((lesson_code in ('1.C','2.C','3.C','4.C') and transfer_correct between 0 and 6) or (lesson_code not in ('1.C','2.C','3.C','4.C') and transfer_correct between 0 and 2));
create or replace function private.submit_curriculum_answer(p_attempt_id uuid, p_index integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); a public.curriculum_attempts%rowtype;
  c public.curriculum_cases%rowtype; k private.curriculum_answer_keys%rowtype;
  r public.curriculum_responses%rowtype; is_correct boolean;
  retry_needed boolean := false; total integer; passed boolean; message text;
begin
  if u is null then raise exception 'Inicia sesión para continuar.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into a from public.curriculum_attempts where id=p_attempt_id and user_id=u and status='active' for update;
  if not found then raise exception 'La misión no está activa.' using errcode='22023'; end if;
  select * into c from public.curriculum_cases where lesson_code=a.lesson_code and content_version=a.content_version and variant=a.variant and step=a.current_step;
  select * into k from private.curriculum_answer_keys where case_id=c.id;
  if c.id is null or k.case_id is null then raise exception 'Falta configurar este caso.' using errcode='22023'; end if;
  if p_index is null or p_index<0 or p_index>=jsonb_array_length(c.options) then raise exception 'Selecciona una respuesta válida.' using errcode='22023'; end if;
  is_correct := p_index=k.correct_index; message := k.feedback->>p_index;
  select * into r from public.curriculum_responses where attempt_id=a.id and step=a.current_step for update;
  if not found then
    insert into public.curriculum_responses(attempt_id,user_id,case_id,step,first_index,first_correct)
      values(a.id,u,c.id,c.step,p_index,is_correct);
    retry_needed := not is_correct and c.role <> 'transfer';
  elsif r.retry_index is null and not r.first_correct and c.role <> 'transfer' then
    update public.curriculum_responses set retry_index=p_index where attempt_id=a.id and step=c.step;
  else raise exception 'Esta respuesta ya fue registrada.' using errcode='22023'; end if;
  if not retry_needed then
    update public.curriculum_attempts set current_step=current_step+1 where id=a.id;
    if a.current_step=6 then
      select count(*) into total from public.curriculum_responses
        where attempt_id=a.id and (a.lesson_code in ('1.C','2.C','3.C','4.C') or step in (5,6)) and first_correct;
      if a.lesson_code in ('1.C','2.C','3.C','4.C') then
        select total >= 5 and count(distinct skill_code)=case when a.lesson_code='1.C' then 5 else 4 end into passed
          from public.curriculum_responses where attempt_id=a.id and first_correct;
      end if;
      update public.curriculum_attempts set status='completed',completed_at=clock_timestamp(),transfer_correct=total where id=a.id;
    end if;
  end if;
  return jsonb_build_object('feedback',message,'correct',is_correct,'retryNeeded',retry_needed,
    'completed',a.current_step=6 and not retry_needed,
    'transferCorrect',case when a.current_step=6 and not retry_needed then total else null end,
    'integrationPassed',case when a.lesson_code in ('1.C','2.C','3.C','4.C') and a.current_step=6 and not retry_needed then passed else null end);
end $$;

create or replace function private.begin_curriculum_lesson(p_lesson_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); l public.curriculum_lessons%rowtype;
 a public.curriculum_attempts%rowtype; completed_count integer; chosen_variant text;
begin
 if u is null then raise exception 'Inicia sesión para aprender.' using errcode='28000'; end if;
 if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
 select * into l from public.curriculum_lessons where code=p_lesson_code and is_published;
 if not found then raise exception 'La misión no está disponible.' using errcode='22023'; end if;
 if p_lesson_code in ('1.2','1.3','1.4','1.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '1.2' then '1.1' when '1.3' then '1.2' when '1.4' then '1.3' else '1.4' end and status='completed') then
   raise exception 'Completa la lección anterior primero.' using errcode='22023'; end if;
 if p_lesson_code='2.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='1.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=5) then
   raise exception 'Primero comprueba las habilidades del nivel 1.1.' using errcode='22023'; end if;
 if p_lesson_code in ('2.2','2.3','2.4','2.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '2.2' then '2.1' when '2.3' then '2.2' when '2.4' then '2.3' else '2.4' end and status='completed') then
   raise exception 'Completa la lección anterior del nivel 1.2.' using errcode='22023'; end if;
 if p_lesson_code='3.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='2.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=4) then
   raise exception 'Primero comprueba las habilidades del nivel 1.2.' using errcode='22023'; end if;
 if p_lesson_code='4.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='3.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=4) then
   raise exception 'Primero comprueba las habilidades del nivel 1.3.' using errcode='22023'; end if;
 if p_lesson_code in ('3.2','3.3','3.4','3.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '3.2' then '3.1' when '3.3' then '3.2' when '3.4' then '3.3' else '3.4' end and status='completed') then
   raise exception 'Completa la lección anterior del nivel 1.3.' using errcode='22023'; end if;
 if p_lesson_code in ('4.2','4.3','4.4','4.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '4.2' then '4.1' when '4.3' then '4.2' when '4.4' then '4.3' else '4.4' end and status='completed') then
   raise exception 'Completa la lección anterior del nivel 1.4.' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_lesson_code, 0));
 select * into a from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='active' for update;
 if not found then
   select count(*) into completed_count from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='completed';
   chosen_variant := case when completed_count % 3 = 0 then 'A' when completed_count % 3 = 1 then 'B' else 'C' end;
   if (select count(*) from public.curriculum_cases where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then raise exception 'Faltan casos para esta misión.' using errcode='22023'; end if;
   insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant) values(u,l.code,l.content_version,chosen_variant) returning * into a;
 end if;
 return private.curriculum_lesson_state(a.id);
end $$;
commit;
