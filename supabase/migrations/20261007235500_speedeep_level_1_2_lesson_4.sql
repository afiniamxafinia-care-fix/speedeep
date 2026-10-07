begin;

insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
values('2.4',2,4,'Conservar la esencia','Resume un párrafo sin perder la idea ni cargar detalles secundarios.','paragraph_summary',true);

do $seed$
declare item jsonb; cid uuid;
begin
  for item in select value from jsonb_array_elements($cases$[
{"v":"A","s":1,"r":"probe","p":"El barrio abrió un huerto compartido. Las familias se turnan para cuidarlo y reparten la cosecha entre quienes participan. Con el tiempo, más vecinos se conocieron allí.","q":"¿Cuál es la idea completa?","o":["Un huerto barrial ayuda a compartir alimentos y a reunir vecinos","El barrio tiene un huerto","Las familias se turnan para regar"],"k":0},
{"v":"A","s":2,"r":"probe","p":"La biblioteca amplió su horario por la tarde. Quienes terminan de trabajar a las seis ahora pueden pedir libros y asistir a talleres. Los préstamos en ese horario aumentaron.","q":"¿Qué resumen conserva lo esencial?","o":["Los talleres terminan a las seis","La ampliación de horario facilitó visitas y aumentó préstamos vespertinos","Los préstamos aumentaron el martes"],"k":1},
{"v":"A","s":3,"r":"guided","p":"El centro de salud empezó a recordar las citas por mensaje. Si alguien no puede asistir, avisa a tiempo y el turno se ofrece a otra persona. Así se aprovechan mejor los espacios disponibles.","q":"¿Cuál es el mejor resumen?","o":["Los mensajes son útiles","Una persona puede cancelar una cita","Los recordatorios permiten reasignar citas y aprovechar mejor los turnos"],"k":2},
{"v":"A","s":4,"r":"guided","p":"La escuela instaló contenedores para separar papel, vidrio y restos de comida. Después enseñó a cada grupo a usarlos. En dos meses enviaron menos basura mezclada al camión.","q":"¿Qué frase resume el párrafo sin perder la idea?","o":["La separación de residuos en la escuela redujo la basura mezclada","Había tres tipos de contenedor","El camión llegó dos meses después"],"k":0},
{"v":"A","s":5,"r":"transfer","p":"La plaza incorporó árboles y bancas alrededor del sendero. En los días calurosos, más personas permanecen allí para descansar o conversar. El municipio estudia extender la mejora a otra plaza.","q":"Elige un resumen fiel.","o":["El municipio estudia varias plazas","La sombra y las bancas hicieron más útil la plaza e impulsaron otra mejora","Todas las plazas tendrán árboles este mes"],"k":1},
{"v":"A","s":6,"r":"transfer","p":"Un taller comenzó a prestar herramientas en lugar de venderlas para usos ocasionales. Los vecinos reservan lo que necesitan y lo devuelven después. Muchos pudieron terminar reparaciones sin comprar equipo nuevo.","q":"¿Cuál es la síntesis más fiel?","o":["El taller vende herramientas","Los vecinos hicieron reparaciones","Prestar herramientas ayudó a reparar sin comprar equipo para un uso breve"],"k":2},
{"v":"B","s":1,"r":"probe","p":"El parque abrió una entrada junto al hospital. Las personas que salen de consulta ahora llegan sin rodear varias calles, y algunos pacientes descansan allí antes de volver a casa.","q":"¿Cuál es la idea completa?","o":["La nueva entrada facilitó el acceso al parque desde el hospital","El hospital tiene un parque","Los pacientes salen de consulta"],"k":0},
{"v":"B","s":2,"r":"probe","p":"La cooperativa agrupó sus entregas en un solo viaje semanal. Gastó menos combustible y pudo mantener el precio para sus clientes. Los paquetes llegaron cada viernes.","q":"¿Qué resumen conserva lo esencial?","o":["Los paquetes llegaron el viernes","Agrupar entregas redujo gastos y ayudó a mantener precios","La cooperativa cerró los demás días"],"k":1},
{"v":"B","s":3,"r":"guided","p":"El museo publicó guías de audio para sus exposiciones. Los visitantes pueden escuchar explicaciones a su ritmo y regresar a una sección cuando tienen dudas. Más personas completaron la visita.","q":"¿Cuál es el mejor resumen?","o":["El museo publica audios","Los visitantes tienen dudas","Las guías de audio facilitaron recorrer las exposiciones y aumentaron las visitas completas"],"k":2},
{"v":"B","s":4,"r":"guided","p":"Una asociación reunió uniformes escolares en buen estado. Los revisó, los clasificó por talla y los entregó a otras familias. Así prolongó su uso y redujo gastos al comenzar el ciclo.","q":"¿Qué frase resume el párrafo?","o":["Reutilizar uniformes permitió ayudar a familias y reducir gastos","Los uniformes se clasificaron por talla","Se entregó un uniforme a cada estudiante"],"k":0},
{"v":"B","s":5,"r":"transfer","p":"El mercado colocó etiquetas claras con precios y unidades de medida. Los clientes comparan productos más rápido y los vendedores reciben menos preguntas repetidas. Planea ampliar el sistema a todos los puestos.","q":"Elige un resumen fiel.","o":["Los vendedores respondían preguntas","Las etiquetas facilitaron comparar productos y agilizaron la atención","Todos los puestos ya tienen etiquetas"],"k":1},
{"v":"B","s":6,"r":"transfer","p":"La biblioteca empezó a prestar tabletas dentro del edificio. Las personas sin dispositivo propio pudieron consultar materiales digitales allí. La demanda llevó a ampliar el horario de préstamo.","q":"¿Cuál es la síntesis más fiel?","o":["La biblioteca vende tabletas","Los materiales digitales son gratuitos en casa","El préstamo de tabletas abrió el acceso digital y motivó ampliar su horario"],"k":2},
{"v":"C","s":1,"r":"probe","p":"La clínica instaló un sistema de turnos por hora. Los pacientes esperan menos tiempo en la sala y el personal puede prepararse para cada consulta. La fila de la mañana se acortó.","q":"¿Cuál es la idea completa?","o":["Los turnos por hora mejoraron la espera y la organización de consultas","Hay una sala de espera","La fila de la mañana era larga"],"k":0},
{"v":"C","s":2,"r":"probe","p":"El centro cultural abrió talleres los sábados. Familias que no podían acudir entre semana empezaron a participar. La asistencia total creció durante el primer mes.","q":"¿Qué resumen conserva lo esencial?","o":["El centro abre los sábados","El horario de sábado amplió la participación en talleres","Todos los talleres ocurren el primer mes"],"k":1},
{"v":"C","s":3,"r":"guided","p":"La ruta de autobús incorporó una parada cerca de la escuela. Los estudiantes caminan menos desde el transporte y llegan con mayor puntualidad. La nueva parada también sirve a los vecinos.","q":"¿Cuál es el mejor resumen?","o":["Los autobuses tienen muchas paradas","Los vecinos usan autobuses","La parada cercana facilitó llegar a la escuela y benefició al vecindario"],"k":2},
{"v":"C","s":4,"r":"guided","p":"El barrio reparó las llaves que goteaban en el centro comunitario. Después comparó las lecturas del medidor y encontró un consumo menor. El ahorro ayudó a pagar otra reparación.","q":"¿Qué frase resume el párrafo?","o":["Reparar fugas redujo el consumo y permitió financiar otra mejora","El medidor registró una cifra","Todas las casas del barrio ahorraron agua"],"k":0},
{"v":"C","s":5,"r":"transfer","p":"La escuela transformó un salón vacío en espacio de lectura. Añadió mesas, luz y libros de varios géneros. En pocas semanas más alumnos comenzaron a leer durante el descanso.","q":"Elige un resumen fiel.","o":["La escuela compró mesas y luces","El nuevo espacio impulsó la lectura durante el descanso","Todos los alumnos leen todos los días"],"k":1},
{"v":"C","s":6,"r":"transfer","p":"Un grupo organizó compras conjuntas de productos básicos. Al reunir pedidos grandes obtuvo mejores precios y repartió los artículos entre las familias. Ahora más vecinos quieren participar.","q":"¿Cuál es la síntesis más fiel?","o":["El grupo abrió una tienda","Las familias compraron productos distintos","Comprar en conjunto redujo precios y atrajo a más vecinos"],"k":2}
  ]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values('2.4',1,item->>'v',(item->>'s')::smallint,item->>'r',item->>'p',item->>'q',item->'o') returning id into cid;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    select cid,(item->>'k')::smallint,(select jsonb_agg(case when i=(item->>'k')::integer then 'Sí. Conservaste la idea y el resultado sin sumar información ajena.'
      when i=0 then 'Es demasiado general o solo un detalle. Busca qué cambió y por qué importa.'
      else 'Ese detalle no resume el conjunto, o afirma algo que el texto no dice.' end order by i) from generate_series(0,2) i);
    insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
    select cid,(select jsonb_agg(case when i=(item->>'k')::integer then null when i=0 then 'topic_only' else 'detail_or_unsupported' end order by i) from generate_series(0,2) i),
      case when (item->>'s')::integer=1 then 'paragraph_main_idea' else 'paragraph_summary' end;
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
    raise exception 'Completa la lección anterior primero.' using errcode='22023'; end if;
  if p_lesson_code='2.1' and not exists
    (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='1.C' and a0.status='completed'
      and a0.transfer_correct>=5
      and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=5) then
    raise exception 'Primero comprueba las habilidades del nivel 1.1.' using errcode='22023'; end if;
  if p_lesson_code in ('2.2','2.3','2.4') and not exists
    (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '2.2' then '2.1' when '2.3' then '2.2' else '2.3' end and status='completed') then
    raise exception 'Completa la lección anterior del nivel 1.2.' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_lesson_code, 0));
  select * into a from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='active' for update;
  if not found then
    select count(*) into completed_count from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='completed';
    chosen_variant := case when completed_count % 3 = 0 then 'A' when completed_count % 3 = 1 then 'B' else 'C' end;
    if (select count(*) from public.curriculum_cases where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then
      raise exception 'Faltan casos para esta misión.' using errcode='22023'; end if;
    insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant)
      values(u,l.code,l.content_version,chosen_variant) returning * into a;
  end if;
  return private.curriculum_lesson_state(a.id);
end $$;

commit;
