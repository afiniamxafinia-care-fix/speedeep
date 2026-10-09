begin;

insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
values('2.3',2,3,'Conectar oraciones','Sigue a quién o a qué se refiere cada frase para conservar el hilo.','paragraph_reference',true);

do $seed$
declare item jsonb; cid uuid;
begin
  for item in select value from jsonb_array_elements($cases$[
{"v":"A","s":1,"r":"probe","p":"La biblioteca amplió su horario. Esto permitió que más personas llegaran después del trabajo.","q":"¿Qué permitió las visitas después del trabajo?","o":["La ampliación del horario","La biblioteca cerró temprano","El trabajo de los visitantes"],"k":0},
{"v":"A","s":2,"r":"probe","p":"Sofía dejó la carpeta con Elena. Ella la guardó en el archivero mientras Sofía salía a la reunión.","q":"¿Quién guardó la carpeta?","o":["Sofía","Elena","La persona de la reunión"],"k":1},
{"v":"A","s":3,"r":"guided","p":"Primero cerraron la calle por obras. Después abrieron un desvío para llegar al mercado. Esta ruta temporal estará señalada toda la semana.","q":"¿A qué se refiere «esta ruta temporal»?","o":["A la calle cerrada","Al mercado","Al desvío recién abierto"],"k":2},
{"v":"A","s":4,"r":"guided","p":"El museo prestó sus salas a la escuela. Dicha decisión permitió mostrar los trabajos de los alumnos al público.","q":"¿Cuál fue la decisión mencionada?","o":["Prestar las salas a la escuela","Cerrar el museo","Calificar los trabajos"],"k":0},
{"v":"A","s":5,"r":"transfer","p":"El comité revisó la propuesta de Marta. Luego la envió al director para su aprobación. Él pidió aclarar el presupuesto antes de decidir.","q":"¿Quién pidió aclarar el presupuesto?","o":["Marta","El director","El comité"],"k":1},
{"v":"A","s":6,"r":"transfer","p":"La tienda dejó de imprimir recibos por defecto y empezó a enviarlos por correo. Ese cambio redujo el uso de papel, aunque algunos clientes aún piden la versión impresa.","q":"¿Qué redujo el uso de papel?","o":["Los clientes que piden recibos impresos","La apertura de la tienda","Enviar recibos por correo en vez de imprimirlos"],"k":2},
{"v":"B","s":1,"r":"probe","p":"El centro instaló rampas en la entrada. Gracias a ello, más visitantes pudieron acceder sin ayuda.","q":"¿Qué facilitó la entrada?","o":["La instalación de rampas","El centro cerró la entrada","La ayuda de otros visitantes"],"k":0},
{"v":"B","s":2,"r":"probe","p":"Luis entregó las llaves a Diego. Él abrió la sala mientras Luis atendía a los invitados en la puerta.","q":"¿Quién abrió la sala?","o":["Luis","Diego","Un invitado"],"k":1},
{"v":"B","s":3,"r":"guided","p":"El primer autobús se averió. La empresa envió otro para cubrir el trayecto. Este vehículo llegó veinte minutos después.","q":"¿Qué vehículo llegó después?","o":["El primero, averiado","Un automóvil particular","El autobús de reemplazo"],"k":2},
{"v":"B","s":4,"r":"guided","p":"La escuela permitió entregar tareas por internet. Esta medida ayudó a quienes viven lejos a evitar un viaje adicional.","q":"¿Cuál fue la medida?","o":["Aceptar tareas por internet","Acortar las tareas","Cambiar la dirección de la escuela"],"k":0},
{"v":"B","s":5,"r":"transfer","p":"Nora presentó el diseño a la coordinadora. Ella pidió cambiar el tamaño de la letra antes de publicarlo. Nora hizo la corrección esa tarde.","q":"¿Quién pidió cambiar la letra?","o":["Nora","La coordinadora","El público"],"k":1},
{"v":"B","s":6,"r":"transfer","p":"El vecindario reparó el camino y añadió señales en los cruces. Esas mejoras hicieron más sencillo llegar al parque durante la lluvia.","q":"¿A qué se refieren «esas mejoras»?","o":["A la lluvia","Al parque","A la reparación del camino y las señales"],"k":2},
{"v":"C","s":1,"r":"probe","p":"La clínica organizó las citas por horario. Con ello disminuyó la fila que antes se formaba al abrir.","q":"¿Qué redujo la fila?","o":["Organizar las citas por horario","Abrir la clínica más tarde","Suspender las citas"],"k":0},
{"v":"C","s":2,"r":"probe","p":"Clara pasó el mapa a Julia. Ella lo colocó junto a la puerta mientras Clara buscaba los marcadores.","q":"¿Quién colocó el mapa?","o":["Clara","Julia","La persona de la puerta"],"k":1},
{"v":"C","s":3,"r":"guided","p":"La primera fecha quedó ocupada. El equipo reservó el viernes siguiente. Ese día el salón sí estará disponible.","q":"¿Qué día estará disponible el salón?","o":["La primera fecha","Cualquier viernes","El viernes siguiente"],"k":2},
{"v":"C","s":4,"r":"guided","p":"El mercado colocó etiquetas grandes en cada puesto. Esta decisión permitió comparar precios sin preguntar uno por uno.","q":"¿Qué decisión facilitó comparar precios?","o":["Colocar etiquetas grandes","Quitar las etiquetas","Cambiar el horario"],"k":0},
{"v":"C","s":5,"r":"transfer","p":"Elena envió el informe al supervisor. Él lo revisó y solicitó una cifra actualizada. Elena volvió a calcularla antes de responder.","q":"¿Quién solicitó la cifra actualizada?","o":["Elena","El supervisor","La persona que recibió la respuesta"],"k":1},
{"v":"C","s":6,"r":"transfer","p":"El parque instaló bancas y plantó árboles junto al sendero. Estas acciones hicieron más cómoda la espera del autobús cercano.","q":"¿Qué acciones hicieron más cómoda la espera?","o":["El autobús cercano","El sendero anterior","Instalar bancas y plantar árboles"],"k":2}
  ]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values('2.3',1,item->>'v',(item->>'s')::smallint,item->>'r',item->>'p',item->>'q',item->'o') returning id into cid;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    select cid,(item->>'k')::smallint,(select jsonb_agg(case when i=(item->>'k')::integer then 'Sí. Seguiste el referente entre las oraciones.'
      else 'Vuelve a la frase anterior y busca quién o qué encaja con esa referencia.' end order by i) from generate_series(0,2) i);
    insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
    select cid,(select jsonb_agg(case when i=(item->>'k')::integer then null else 'reference_misattributed' end order by i) from generate_series(0,2) i),
      case when (item->>'s')::integer=1 then 'paragraph_support' else 'paragraph_reference' end;
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
  if p_lesson_code in ('2.2','2.3') and not exists
    (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '2.2' then '2.1' else '2.2' end and status='completed') then
    raise exception 'Completa la lección anterior del nivel 1.2.' using errcode='22023';
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
