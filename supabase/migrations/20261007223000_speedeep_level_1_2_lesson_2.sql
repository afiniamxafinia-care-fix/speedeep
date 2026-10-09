begin;

insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
values('2.2',2,2,'Separar idea y apoyo','Identifica la idea de un párrafo y el detalle que la sustenta.','paragraph_support',true);

do $seed$
declare item jsonb; cid uuid;
begin
  for item in select value from jsonb_array_elements($cases$[
{"v":"A","s":1,"r":"probe","p":"La biblioteca abrió los domingos. Así, quienes trabajan entre semana pueden pedir libros sin faltar a su empleo.","q":"¿Cuál es la idea del párrafo?","o":["Los domingos","Abrir los domingos facilita el acceso a quienes trabajan","Los libros se prestan entre semana"],"k":1},
{"v":"A","s":2,"r":"probe","p":"La nueva rampa facilitó la entrada al centro cultural. Antes, algunas personas necesitaban ayuda para subir los escalones; ahora pueden llegar por sí mismas.","q":"¿Qué detalle apoya que la entrada mejoró?","o":["Pueden entrar sin ayuda","El centro cultural tiene actividades","La rampa es nueva"],"k":0},
{"v":"A","s":3,"r":"guided","p":"El huerto redujo la compra de verduras. Durante la cosecha, las familias llevaron a casa tomates y lechugas cultivados allí. También pintaron una cerca verde.","q":"¿Qué dato sostiene la reducción de compras?","o":["Pintaron la cerca","El huerto tiene una cerca","Las familias cosecharon verduras para llevar a casa"],"k":2},
{"v":"A","s":4,"r":"guided","p":"El nuevo horario hizo más fácil usar el autobús. Por ejemplo, Ana pudo llegar a su trabajo de madrugada. El vehículo ahora es azul.","q":"¿Cuál es un ejemplo que apoya la idea?","o":["Ana pudo llegar temprano al trabajo","El vehículo es azul","El autobús tiene un nuevo horario"],"k":0},
{"v":"A","s":5,"r":"transfer","p":"La escuela redujo el desperdicio de papel. Los alumnos imprimieron por ambos lados y reutilizaron hojas limpias para hacer borradores. La puerta principal recibió pintura nueva.","q":"¿Qué detalle sustenta la idea principal?","o":["Pintaron la puerta","Reutilizaron hojas e imprimieron por ambos lados","La escuela tiene alumnos"],"k":1},
{"v":"A","s":6,"r":"transfer","p":"El parque atrajo más visitantes tras instalar sombra. En la primera semana, el registro de entradas subió de 80 a 130 personas por día. Una de las bancas quedó junto a la fuente.","q":"¿Qué dato apoya que llegaron más visitantes?","o":["Hay una banca junto a la fuente","Instalaron sombra","El registro subió de 80 a 130 por día"],"k":2},
{"v":"B","s":1,"r":"probe","p":"El museo abrió una sala con entrada gratuita. Desde entonces, más vecinos pudieron conocer la colección sin pagar boleto.","q":"¿Cuál es la idea del párrafo?","o":["Los boletos del museo","La sala gratuita amplió el acceso a la colección","El museo tiene una colección"],"k":1},
{"v":"B","s":2,"r":"probe","p":"El sistema de turnos acortó la espera en la clínica. Antes se formaba una fila larga al abrir; ahora cada persona llega a una hora asignada.","q":"¿Qué detalle apoya que la espera disminuyó?","o":["Cada persona tiene una hora asignada","La clínica abre temprano","Hay una fila al abrir"],"k":0},
{"v":"B","s":3,"r":"guided","p":"La cooperativa gastó menos en transporte. Juntó varios pedidos en un solo viaje cada semana. Además, cambió el color de sus cajas.","q":"¿Qué acción sustenta el ahorro?","o":["Cambió el color de las cajas","La cooperativa recibe pedidos","Agrupó los pedidos en un viaje"],"k":2},
{"v":"B","s":4,"r":"guided","p":"La señalización ayudó a encontrar las salas. Por ejemplo, Luis llegó al taller sin pedir indicaciones. En la entrada había una planta nueva.","q":"¿Qué ejemplo apoya la idea?","o":["Luis encontró el taller solo","Había una planta nueva","El edificio tiene salas"],"k":0},
{"v":"B","s":5,"r":"transfer","p":"El barrio ahorró agua al reparar las fugas. Después del arreglo, el medidor registró un consumo menor durante dos meses. La fachada de la oficina se pintó de blanco.","q":"¿Qué dato apoya el ahorro de agua?","o":["Pintaron la fachada","El medidor registró menos consumo","El barrio tiene una oficina"],"k":1},
{"v":"B","s":6,"r":"transfer","p":"La biblioteca aumentó el uso de su catálogo digital. Las búsquedas pasaron de 200 a 340 por semana tras simplificar la pantalla. El mostrador se movió de sitio.","q":"¿Qué dato sustenta el aumento?","o":["Movieron el mostrador","Simplificaron la pantalla","Las búsquedas subieron de 200 a 340"],"k":2},
{"v":"C","s":1,"r":"probe","p":"La plaza instaló luces nuevas. Ahora los vecinos pueden atravesarla con mayor facilidad al anochecer.","q":"¿Cuál es la idea del párrafo?","o":["Las luces de la plaza","La iluminación facilitó el paso al anochecer","Los vecinos viven cerca"],"k":1},
{"v":"C","s":2,"r":"probe","p":"El taller amplió sus cupos. Antes varias personas quedaban en lista de espera; ahora todas las inscritas del mes obtuvieron lugar.","q":"¿Qué detalle apoya que hay más cupos?","o":["Todas las personas inscritas obtuvieron lugar","El taller dura un mes","Había una lista de espera"],"k":0},
{"v":"C","s":3,"r":"guided","p":"La tienda disminuyó sus empaques desechables. Ofreció recipientes retornables y muchos clientes comenzaron a usarlos. También cambió la música del local.","q":"¿Qué hecho apoya la reducción de desechables?","o":["Cambió la música","La tienda tiene clientes","Los clientes usan recipientes retornables"],"k":2},
{"v":"C","s":4,"r":"guided","p":"Las instrucciones claras evitaron errores al armar las mesas. Por ejemplo, Julia terminó la primera sin tener que deshacer ninguna pieza. La caja era amarilla.","q":"¿Qué ejemplo apoya la idea?","o":["Julia armó la mesa sin corregir piezas","La caja era amarilla","Las mesas tienen piezas"],"k":0},
{"v":"C","s":5,"r":"transfer","p":"El sendero reparado se usó más después de la lluvia. Los guardias contaron el doble de caminantes que el mes anterior en días húmedos. La entrada tiene un letrero de madera.","q":"¿Qué dato sostiene la idea principal?","o":["Hay un letrero de madera","Se contó el doble de caminantes en días húmedos","Los guardias vigilan la entrada"],"k":1},
{"v":"C","s":6,"r":"transfer","p":"El curso en audio permitió estudiar durante los traslados. Seis participantes dijeron que terminaron una unidad mientras viajaban en autobús. La portada del curso es morada.","q":"¿Qué detalle apoya esa utilidad?","o":["La portada es morada","El curso tiene unidades","Seis participantes terminaron una unidad durante el viaje"],"k":2}
  ]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values('2.2',1,item->>'v',(item->>'s')::smallint,item->>'r',item->>'p',item->>'q',item->'o') returning id into cid;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    select cid,(item->>'k')::smallint,(select jsonb_agg(case when i=(item->>'k')::integer then 'Sí. Esta respuesta conserva la relación entre idea y apoyo.'
      when (item->>'s')::integer=1 then 'Busca lo que dice el párrafo completo.'
      else 'Ese dato no demuestra la idea principal; busca la prueba concreta.' end order by i) from generate_series(0,2) i);
    insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
    select cid,(select jsonb_agg(case when i=(item->>'k')::integer then null when (item->>'s')::integer=1 then 'topic_or_detail_as_idea' else 'irrelevant_or_general_detail' end order by i) from generate_series(0,2) i),
      case when (item->>'s')::integer=1 then 'paragraph_main_idea' else 'paragraph_support' end;
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
  if p_lesson_code='2.2' and not exists
    (select 1 from public.curriculum_attempts where user_id=u and lesson_code='2.1' and status='completed') then
    raise exception 'Completa la primera lección del nivel 1.2.' using errcode='22023';
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
