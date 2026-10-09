begin;
insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published) values('3.C',3,5,'Cierre: comprender textos','Aplica estructura, conexión, argumento y síntesis en textos nuevos.','text_integration',true);
do $seed$
declare item jsonb; cid uuid;
begin
 for item in select value from jsonb_array_elements($cases$[{"v":"A","s":1,"p":"La asociación abrió un banco de herramientas para reparaciones ocasionales. Antes cada familia compraba instrumentos que usaba una sola vez.\n\nAhora se reservan por semana y se devuelven al terminar. En una prueba de dos meses participaron cuarenta hogares; el equipo todavía debe revisar cómo cubrir el mantenimiento.","q":"¿Qué problema presenta el primer párrafo?","o":["Las compras de herramientas para un solo uso","La falta de talleres nocturnos","Las devoluciones tardías"],"k":0,"skill":"text_structure"},{"v":"A","s":2,"p":"La asociación abrió un banco de herramientas para reparaciones ocasionales. Antes cada familia compraba instrumentos que usaba una sola vez.\n\nAhora se reservan por semana y se devuelven al terminar. En una prueba de dos meses participaron cuarenta hogares; el equipo todavía debe revisar cómo cubrir el mantenimiento.","q":"¿A qué se refiere «ahora» en el segundo párrafo?","o":["A la compra individual","Al sistema de reservas del banco","Al mantenimiento futuro"],"k":1,"skill":"text_connection"},{"v":"A","s":3,"p":"La asociación abrió un banco de herramientas para reparaciones ocasionales. Antes cada familia compraba instrumentos que usaba una sola vez.\n\nAhora se reservan por semana y se devuelven al terminar. En una prueba de dos meses participaron cuarenta hogares; el equipo todavía debe revisar cómo cubrir el mantenimiento.","q":"¿Qué dato apoya el uso de la nueva medida?","o":["La duración de una reparación","El número de herramientas","La participación de cuarenta hogares"],"k":2,"skill":"text_argument"},{"v":"A","s":4,"p":"La asociación abrió un banco de herramientas para reparaciones ocasionales. Antes cada familia compraba instrumentos que usaba una sola vez.\n\nAhora se reservan por semana y se devuelven al terminar. En una prueba de dos meses participaron cuarenta hogares; el equipo todavía debe revisar cómo cubrir el mantenimiento.","q":"¿Cuál resume el texto del banco de herramientas?","o":["El préstamo evitó compras individuales y se evalúa su mantenimiento","Todas las herramientas son gratuitas para siempre","Nadie compró nada durante dos meses"],"k":0,"skill":"text_synthesis"},{"v":"A","s":5,"p":"El centro cultural creó talleres nocturnos. Muchas personas trabajan de día y no podían asistir.\n\nLa primera ronda llenó sus cupos y permitió abrir otra. Sin embargo, el centro necesita calcular el costo de mantener abierto el edificio.","q":"¿Cómo se relacionan los párrafos del centro cultural?","o":["Dos edificios distintos","Necesidad de acceso y prueba de un nuevo horario","Una lista de cursos"],"k":1,"skill":"text_connection"},{"v":"A","s":6,"p":"El centro cultural creó talleres nocturnos. Muchas personas trabajan de día y no podían asistir.\n\nLa primera ronda llenó sus cupos y permitió abrir otra. Sin embargo, el centro necesita calcular el costo de mantener abierto el edificio.","q":"¿Qué falta comprobar antes de mantener los talleres nocturnos?","o":["La cantidad de hogares","Los tipos de herramientas","El costo de abrir el edificio más tiempo"],"k":2,"skill":"text_argument"},{"v":"B","s":1,"p":"Una escuela comenzó a prestar bicicletas para llegar a clases. Varias familias vivían lejos de la parada de autobús.\n\nOrganizó reservas por día y enseñó reglas de circulación. En el primer mes hubo menos llegadas tarde; aún necesita medir el gasto de reparación de las bicicletas.","q":"¿Qué dificultad introduce el primer párrafo?","o":["La distancia a la parada de autobús","La falta de bicicletas de carrera","El precio del uniforme"],"k":0,"skill":"text_structure"},{"v":"B","s":2,"p":"Una escuela comenzó a prestar bicicletas para llegar a clases. Varias familias vivían lejos de la parada de autobús.\n\nOrganizó reservas por día y enseñó reglas de circulación. En el primer mes hubo menos llegadas tarde; aún necesita medir el gasto de reparación de las bicicletas.","q":"¿Para qué se organizaron reservas?","o":["Para cambiar la ruta de autobús","Para usar las bicicletas de forma compartida","Para cerrar la escuela"],"k":1,"skill":"text_connection"},{"v":"B","s":3,"p":"Una escuela comenzó a prestar bicicletas para llegar a clases. Varias familias vivían lejos de la parada de autobús.\n\nOrganizó reservas por día y enseñó reglas de circulación. En el primer mes hubo menos llegadas tarde; aún necesita medir el gasto de reparación de las bicicletas.","q":"¿Qué dato apoya el efecto de la medida?","o":["El color de las bicicletas","Los turnos por día","La reducción de llegadas tarde"],"k":2,"skill":"text_argument"},{"v":"B","s":4,"p":"Una escuela comenzó a prestar bicicletas para llegar a clases. Varias familias vivían lejos de la parada de autobús.\n\nOrganizó reservas por día y enseñó reglas de circulación. En el primer mes hubo menos llegadas tarde; aún necesita medir el gasto de reparación de las bicicletas.","q":"¿Cuál es la síntesis fiel?","o":["El préstamo compartido ayudó a llegar a tiempo, con mantenimiento por evaluar","Todos llegan en bicicleta todos los días","La escuela eliminó el autobús"],"k":0,"skill":"text_synthesis"},{"v":"B","s":5,"p":"El mercado instaló señalización de precios por unidad. Antes costaba comparar envases de tamaños diferentes.\n\nLos clientes tardaron menos en elegir durante la prueba. La administración revisará si las etiquetas resisten el uso diario.","q":"¿Qué cambio aborda el problema del mercado?","o":["Cambiar los envases","Mostrar precios por unidad","Cerrar los puestos"],"k":1,"skill":"text_connection"},{"v":"B","s":6,"p":"El mercado instaló señalización de precios por unidad. Antes costaba comparar envases de tamaños diferentes.\n\nLos clientes tardaron menos en elegir durante la prueba. La administración revisará si las etiquetas resisten el uso diario.","q":"¿Qué límite debe comprobar el mercado?","o":["La hora de apertura","El precio de las bicicletas","La resistencia de las etiquetas"],"k":2,"skill":"text_argument"},{"v":"C","s":1,"p":"La biblioteca habilitó salas para estudiar en grupo. Antes los equipos hablaban en la zona de lectura silenciosa y molestaban a otros visitantes.\n\nInstaló mesas separadas y una reserva de horarios. Disminuyeron las quejas durante el primer mes, pero falta saber si habrá suficiente espacio en épocas de exámenes.","q":"¿Qué situación explica el primer párrafo?","o":["El ruido de los grupos en una zona silenciosa","La falta de exámenes","El costo de los envases"],"k":0,"skill":"text_structure"},{"v":"C","s":2,"p":"La biblioteca habilitó salas para estudiar en grupo. Antes los equipos hablaban en la zona de lectura silenciosa y molestaban a otros visitantes.\n\nInstaló mesas separadas y una reserva de horarios. Disminuyeron las quejas durante el primer mes, pero falta saber si habrá suficiente espacio en épocas de exámenes.","q":"¿Qué permitió usar las salas separadas?","o":["La compra de libros","Las mesas y reservas para grupos","El cierre de la biblioteca"],"k":1,"skill":"text_connection"},{"v":"C","s":3,"p":"La biblioteca habilitó salas para estudiar en grupo. Antes los equipos hablaban en la zona de lectura silenciosa y molestaban a otros visitantes.\n\nInstaló mesas separadas y una reserva de horarios. Disminuyeron las quejas durante el primer mes, pero falta saber si habrá suficiente espacio en épocas de exámenes.","q":"¿Cuál es la evidencia de un primer resultado?","o":["Las épocas de exámenes","Las salas nuevas","La disminución de quejas"],"k":2,"skill":"text_argument"},{"v":"C","s":4,"p":"La biblioteca habilitó salas para estudiar en grupo. Antes los equipos hablaban en la zona de lectura silenciosa y molestaban a otros visitantes.\n\nInstaló mesas separadas y una reserva de horarios. Disminuyeron las quejas durante el primer mes, pero falta saber si habrá suficiente espacio en épocas de exámenes.","q":"¿Qué síntesis conserva el texto?","o":["Las salas organizadas redujeron molestias, pero su capacidad requiere seguimiento","Se terminaron todos los exámenes","La biblioteca prohibió estudiar en grupo"],"k":0,"skill":"text_synthesis"},{"v":"C","s":5,"p":"Una cooperativa propuso recoger envases usados. Sus clientes querían evitar tirarlos después de cada compra.\n\nUna prueba recuperó cien envases en cuatro semanas. Antes de ampliarla, la cooperativa necesita calcular el costo de limpiarlos.","q":"¿Qué respalda la propuesta de la cooperativa?","o":["Las quejas de una biblioteca","La recuperación de cien envases en la prueba","La cantidad de salas"],"k":1,"skill":"text_argument"},{"v":"C","s":6,"p":"Una cooperativa propuso recoger envases usados. Sus clientes querían evitar tirarlos después de cada compra.\n\nUna prueba recuperó cien envases en cuatro semanas. Antes de ampliarla, la cooperativa necesita calcular el costo de limpiarlos.","q":"¿Qué debe averiguar antes de ampliar el proyecto?","o":["El precio de los libros","El horario de exámenes","El costo de limpiar los envases"],"k":2,"skill":"text_argument"}]$cases$::jsonb) loop
  insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values('3.C',1,item->>'v',(item->>'s')::smallint,'transfer',item->>'p',item->>'q',item->'o') returning id into cid;
  insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    select cid,(item->>'k')::smallint,(select jsonb_agg(case when i=(item->>'k')::integer then 'Correcto. Esa conclusión está respaldada por el texto.' else 'Revisa qué afirma el texto y qué queda pendiente.' end order by i) from generate_series(0,2) i);
  insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
    select cid,(select jsonb_agg(case when i=(item->>'k')::integer then null else 'text_relation_missed' end order by i) from generate_series(0,2) i),item->>'skill';
 end loop;
end $seed$;
alter table public.curriculum_attempts drop constraint curriculum_attempts_transfer_correct_check;
alter table public.curriculum_attempts add constraint curriculum_attempts_transfer_correct_check
 check ((lesson_code in ('1.C','2.C','3.C') and transfer_correct between 0 and 6) or (lesson_code not in ('1.C','2.C','3.C') and transfer_correct between 0 and 2));
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
        where attempt_id=a.id and (a.lesson_code in ('1.C','2.C','3.C') or step in (5,6)) and first_correct;
      if a.lesson_code in ('1.C','2.C','3.C') then
        select total >= 5 and count(distinct skill_code)=case when a.lesson_code='1.C' then 5 else 4 end into passed
          from public.curriculum_responses where attempt_id=a.id and first_correct;
      end if;
      update public.curriculum_attempts set status='completed',completed_at=clock_timestamp(),transfer_correct=total where id=a.id;
    end if;
  end if;
  return jsonb_build_object('feedback',message,'correct',is_correct,'retryNeeded',retry_needed,
    'completed',a.current_step=6 and not retry_needed,
    'transferCorrect',case when a.current_step=6 and not retry_needed then total else null end,
    'integrationPassed',case when a.lesson_code in ('1.C','2.C','3.C') and a.current_step=6 and not retry_needed then passed else null end);
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
 if p_lesson_code in ('3.2','3.3','3.4','3.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '3.2' then '3.1' when '3.3' then '3.2' when '3.4' then '3.3' else '3.4' end and status='completed') then
   raise exception 'Completa la lección anterior del nivel 1.3.' using errcode='22023'; end if;
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
