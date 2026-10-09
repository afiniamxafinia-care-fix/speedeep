begin;

insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
values('2.1',2,1,'Decir de qué trata','Distingue la idea completa de un párrafo de su tema y de un detalle.','paragraph_main_idea',true);

do $seed$
declare item jsonb; new_case_id uuid;
begin
  for item in select value from jsonb_array_elements($cases$[
{"v":"A","s":1,"r":"probe","p":"Marta abrió la biblioteca temprano. Aunque llovía, varias personas llegaron a devolver libros y a buscar nuevos títulos. Al cerrar, casi todos los préstamos del día se habían hecho antes del mediodía.","q":"¿Qué ocurrió en la biblioteca?","o":["Marta abrió temprano y hubo préstamos pese a la lluvia","La lluvia impidió que abriera","Todos llegaron por la tarde"],"k":0},
{"v":"A","s":2,"r":"probe","p":"En el barrio instalaron tres bebederos públicos. Antes, quienes caminaban debían comprar agua o llevar una botella desde casa. Ahora pueden rellenarla gratis en distintos puntos del recorrido.","q":"¿Cuál es la idea completa?","o":["Las botellas de agua","Instalaron bebederos que facilitan rellenar agua durante el recorrido","Hay tres puntos en el recorrido"],"k":1},
{"v":"A","s":3,"r":"guided","p":"El mercado cambió su horario los sábados. Abre una hora antes para atender a quienes salen temprano y conserva la misma hora de cierre. Los vendedores dicen que las primeras ventas aumentaron.","q":"¿Qué resume mejor el párrafo?","o":["El mercado y sus vendedores","Las primeras ventas aumentaron","Adelantar la apertura del sábado facilitó compras tempranas y elevó las primeras ventas"],"k":2},
{"v":"A","s":4,"r":"guided","p":"Una escuela reunió cuadernos usados al final del ciclo. Separó las hojas limpias y las encuadernó de nuevo. Con ellas preparó libretas para el siguiente grupo sin comprar tanto papel.","q":"¿Qué opción conserva la idea principal?","o":["La escuela reutilizó hojas para hacer libretas y reducir compras de papel","Los cuadernos usados","La escuela encuadernó hojas limpias"],"k":0},
{"v":"A","s":5,"r":"transfer","p":"El centro de salud empezó a confirmar las citas por mensaje. Cuando alguien no puede asistir, avisa con anticipación y el espacio se ofrece a otra persona. En un mes disminuyeron las horas sin paciente.","q":"¿De qué trata el párrafo en conjunto?","o":["Los mensajes del centro de salud","Confirmar y liberar citas por mensaje redujo los espacios sin paciente","Las citas se confirman por mensaje"],"k":1},
{"v":"A","s":6,"r":"transfer","p":"El vecindario plantó árboles junto a la parada de autobús. Durante el verano, las personas esperaron bajo su sombra y el pavimento recibió menos sol directo. Por eso solicitaron repetir la iniciativa en otra calle.","q":"¿Cuál es la idea principal?","o":["Una parada de autobús","El pavimento recibe menos sol","Los árboles mejoraron la espera y motivaron extender la iniciativa"],"k":2},
{"v":"B","s":1,"r":"probe","p":"La encargada revisó los paquetes antes de abrir la tienda. Encontró dos cajas dañadas y pidió reemplazarlas. El resto salió a la venta según lo previsto.","q":"¿Qué ocurrió en la tienda?","o":["La revisión detectó dos cajas dañadas y permitió vender el resto","Todas las cajas fueron devueltas","La tienda no abrió"],"k":0},
{"v":"B","s":2,"r":"probe","p":"Una asociación prestó bicicletas para trayectos cortos. Quienes antes usaban automóvil para ir al parque empezaron a pedalear. También se instalaron soportes para dejarlas al llegar.","q":"¿Cuál es la idea completa?","o":["Los soportes para bicicletas","El préstamo de bicicletas facilitó reemplazar viajes cortos en automóvil","Las bicicletas del parque"],"k":1},
{"v":"B","s":3,"r":"guided","p":"El museo extendió su horario los jueves. Quienes terminan de trabajar tarde ahora alcanzan a visitar las salas. En las primeras semanas aumentó la asistencia después de las seis.","q":"¿Qué resume mejor el párrafo?","o":["El museo y sus salas","La asistencia después de las seis aumentó","El horario extendido permitió más visitas por la tarde"],"k":2},
{"v":"B","s":4,"r":"guided","p":"Los vecinos juntaron restos de comida para producir composta. Un mes después la usaron en el jardín común. Así redujeron residuos y mejoraron la tierra sin comprar fertilizante.","q":"¿Qué opción conserva la idea principal?","o":["Convertir restos de comida en composta redujo residuos y ayudó al jardín","Los restos de comida","La composta se usó un mes después"],"k":0},
{"v":"B","s":5,"r":"transfer","p":"Una clínica reorganizó las consultas breves en una franja matutina. Las personas con dudas simples recibieron respuesta antes y las citas largas dejaron de acumular retrasos. El cambio hizo más predecible la jornada.","q":"¿De qué trata el párrafo en conjunto?","o":["Las consultas de la clínica","Separar consultas breves mejoró los tiempos de atención","Hay consultas breves por la mañana"],"k":1},
{"v":"B","s":6,"r":"transfer","p":"En la plaza colocaron bancas bajo los árboles. Más personas comenzaron a detenerse allí durante el calor y varios comercios cercanos notaron mayor movimiento. El municipio planea repetir el diseño.","q":"¿Cuál es la idea principal?","o":["Las bancas de la plaza","Los comercios cercanos tienen más movimiento","Las bancas con sombra hicieron más útil la plaza e impulsaron repetir el diseño"],"k":2},
{"v":"C","s":1,"r":"probe","p":"Luis preparó el salón antes de la reunión. Una proyección falló, pero usó las copias impresas y explicó el plan completo. El grupo pudo decidir ese mismo día.","q":"¿Qué ocurrió en la reunión?","o":["Luis resolvió una falla y el grupo tomó su decisión","La reunión fue cancelada","No se presentó ningún plan"],"k":0},
{"v":"C","s":2,"r":"probe","p":"La colonia abrió un pequeño huerto comunitario. Las familias se turnan para regarlo y comparten lo que cosechan. El espacio también reúne a personas que antes apenas se conocían.","q":"¿Cuál es la idea completa?","o":["Las verduras del huerto","El huerto permite compartir cosechas y acerca a los vecinos","Las familias riegan por turnos"],"k":1},
{"v":"C","s":3,"r":"guided","p":"La ruta de autobús añadió una parada cerca del hospital. Antes, varios pacientes caminaban quince minutos desde la estación anterior. Ahora llegan más cerca y pueden hacer el trayecto con menos esfuerzo.","q":"¿Qué resume mejor el párrafo?","o":["Los autobuses de la ciudad","Los pacientes caminaban quince minutos","La nueva parada facilitó llegar al hospital"],"k":2},
{"v":"C","s":4,"r":"guided","p":"Una panadería anotó cuántos panes sobraban cada tarde. Ajustó la producción según esos datos y donó los pocos que quedaron. Así desperdició menos alimento sin dejar de atender a sus clientes.","q":"¿Qué opción conserva la idea principal?","o":["Medir sobrantes ayudó a reducir el desperdicio de pan","Los panes de la tarde","La panadería donó algunos panes"],"k":0},
{"v":"C","s":5,"r":"transfer","p":"Un centro cultural publicó su programa en letra grande y audio. Personas que antes necesitaban ayuda para revisarlo pudieron elegir actividades por sí mismas. La asistencia a los talleres también creció.","q":"¿De qué trata el párrafo en conjunto?","o":["El programa del centro cultural","Formatos accesibles facilitaron elegir talleres y ampliaron la participación","El programa tiene una versión en audio"],"k":1},
{"v":"C","s":6,"r":"transfer","p":"La comunidad restauró un sendero que se inundaba cada temporada. Abrió canales de drenaje y colocó señales para rodear las zonas húmedas. Desde entonces más personas lo usan aun después de la lluvia.","q":"¿Cuál es la idea principal?","o":["Las señales del sendero","Los canales de drenaje","La restauración permitió usar el sendero con más seguridad tras la lluvia"],"k":2}
  ]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values('2.1',1,item->>'v',(item->>'s')::smallint,item->>'r',item->>'p',item->>'q',item->'o') returning id into new_case_id;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    select new_case_id,(item->>'k')::smallint,
      (select jsonb_agg(case when i=(item->>'k')::integer then 'Sí. Esta opción conserva lo esencial del párrafo.'
         when (item->>'s')::integer=1 then 'Revisa qué ocurrió al final, pese al detalle.'
         when i=0 then 'Esto nombra el tema, pero no cuenta qué dice el párrafo.'
         else 'Es un detalle; busca la idea que reúna todo el párrafo.' end order by i)
       from generate_series(0,2) i);
    insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
    select new_case_id,(select jsonb_agg(case when i=(item->>'k')::integer then null when (item->>'s')::integer=1 then 'action_missed' when i=0 then 'topic_only' else 'detail_as_idea' end order by i) from generate_series(0,2) i),
      case when (item->>'s')::integer=1 then 'sentence_action' else 'paragraph_main_idea' end;
  end loop;
end $seed$;

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
    raise exception 'Completa la lección anterior primero.' using errcode='22023';
  end if;
  if p_lesson_code='2.1' and not exists
    (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='1.C' and a0.status='completed'
      and a0.transfer_correct>=5
      and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=5) then
    raise exception 'Primero comprueba las habilidades del nivel 1.1.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_lesson_code, 0));
  select * into a from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='active' for update;
  if not found then
    select count(*) into completed_count from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='completed';
    chosen_variant := case when completed_count % 3 = 0 then 'A' when completed_count % 3 = 1 then 'B' else 'C' end;
    if (select count(*) from public.curriculum_cases where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then
      raise exception 'Faltan casos para esta misión.' using errcode='22023';
    end if;
    insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant)
      values(u,l.code,l.content_version,chosen_variant) returning * into a;
  end if;
  return private.curriculum_lesson_state(a.id);
end $$;

commit;
