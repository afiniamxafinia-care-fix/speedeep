begin;

insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
values('2.C',2,5,'Cierre: comprender párrafos','Aplica idea principal, apoyo, referentes y resumen en párrafos nuevos.','paragraph_integration',true);

do $seed$
declare item jsonb; cid uuid;
begin
  for item in select value from jsonb_array_elements($cases$[
{"v":"A","s":1,"p":"El centro cultural abrió talleres los domingos. Las familias que trabajan entre semana empezaron a asistir y la matrícula del mes aumentó.","q":"¿Cuál es la idea principal?","o":["Los talleres son los domingos","El nuevo horario permitió participar a más familias","Todas las familias trabajan entre semana"],"k":1},
{"v":"A","s":2,"p":"La biblioteca redujo el tiempo de espera para pedir libros. Antes se formaban filas de veinte personas; ahora rara vez hay más de cinco gracias al préstamo digital.","q":"¿Qué dato apoya la reducción de la espera?","o":["Las filas bajaron de veinte personas a menos de cinco","Los libros son digitales","Hay veinte libros nuevos"],"k":0},
{"v":"A","s":3,"p":"Marta entregó el plan a Lucía. Ella lo revisó mientras Marta reunía las facturas. Luego solicitó una corrección en el presupuesto.","q":"¿Quién solicitó la corrección?","o":["Marta","La persona de las facturas","Lucía"],"k":2},
{"v":"A","s":4,"p":"El barrio instaló bebederos en el sendero. Los corredores pueden rellenar sus botellas sin comprar agua y varias personas dejaron de usar envases desechables.","q":"Elige un resumen fiel.","o":["Los bebederos facilitaron beber agua y redujeron envases desechables","Los corredores compran agua","Todos los envases desaparecieron"],"k":0},
{"v":"A","s":5,"p":"La escuela abrió su patio después de clases. Los vecinos pudieron hacer ejercicio allí y los alumnos organizaron partidos. El espacio antes permanecía cerrado por las tardes.","q":"¿Qué ocurrió al abrir el patio?","o":["Se cerró antes de clases","El patio empezó a servir para ejercicio y juegos comunitarios","Se cancelaron los partidos"],"k":1},
{"v":"A","s":6,"p":"El museo sustituyó los folletos impresos por guías digitales. Los visitantes las consultan en sus teléfonos y pueden ampliar las imágenes. El gasto en papel disminuyó.","q":"¿Qué síntesis conserva lo esencial?","o":["Los teléfonos tienen imágenes","Los folletos impresos aumentaron","Las guías digitales mejoraron la consulta y redujeron el gasto en papel"],"k":2},
{"v":"B","s":1,"p":"Una clínica organizó las consultas por horario. Los pacientes dejaron de llegar todos a la misma hora y el tiempo de espera se redujo durante la mañana.","q":"¿Cuál es la idea principal?","o":["Los pacientes llegan temprano","Organizar las citas disminuyó la espera matutina","La clínica abre en la mañana"],"k":1},
{"v":"B","s":2,"p":"El mercado gastó menos energía tras cambiar sus lámparas. El medidor registró una reducción de 18% durante los siguientes dos meses.","q":"¿Qué dato sustenta el ahorro?","o":["El medidor registró 18% menos consumo","El mercado tiene lámparas","Pasaron dos meses"],"k":0},
{"v":"B","s":3,"p":"Diego dejó el mapa con Raúl. Él marcó la nueva ruta mientras Diego hablaba con los conductores. Después pidió imprimir copias.","q":"¿Quién pidió imprimir copias?","o":["Diego","Los conductores","Raúl"],"k":2},
{"v":"B","s":4,"p":"La plaza añadió árboles y bancas. Más personas descansan allí durante el calor y varios comercios cercanos reciben nuevas visitas.","q":"Elige un resumen fiel.","o":["La sombra hizo más útil la plaza y atrajo visitantes al área","Los comercios cerraron","Todos los visitantes compran algo"],"k":0},
{"v":"B","s":5,"p":"Una asociación reunió uniformes en buen estado. Los clasificó por talla y los entregó a familias antes del comienzo de clases. Así prolongó su uso y ayudó a reducir gastos.","q":"¿Qué resultado logró la asociación?","o":["Vendió uniformes nuevos","Reutilizó uniformes y alivió gastos familiares","Cambió el inicio de clases"],"k":1},
{"v":"B","s":6,"p":"La ruta de autobús agregó una parada cerca del hospital. Los pacientes caminan menos desde el transporte y los trabajadores también la utilizan. La empresa estudia otra parada similar.","q":"¿Qué síntesis conserva lo esencial?","o":["Todos los pacientes usan autobús","La empresa quitó una parada","La nueva parada facilitó llegar al hospital y motivó estudiar otra"],"k":2},
{"v":"C","s":1,"p":"El centro abrió una sala de lectura nocturna. Personas que estudian después de trabajar encontraron un lugar tranquilo y la asistencia subió en ese horario.","q":"¿Cuál es la idea principal?","o":["La sala tiene libros","El horario nocturno amplió el acceso a un espacio de estudio","Todas las personas trabajan de noche"],"k":1},
{"v":"C","s":2,"p":"El taller redujo el desperdicio de madera. Antes tiraba doce tablas por semana; ahora aprovecha los recortes y desecha solo tres.","q":"¿Qué dato apoya la reducción?","o":["Los desechos bajaron de doce tablas a tres","El taller usa madera","Los recortes son pequeños"],"k":0},
{"v":"C","s":3,"p":"Julia envió la propuesta a Nora. Ella la comparó con el presupuesto mientras Julia preparaba la presentación. Después solicitó una versión más breve.","q":"¿Quién pidió una versión más breve?","o":["Julia","La persona de la presentación","Nora"],"k":2},
{"v":"C","s":4,"p":"Los vecinos repararon el sendero que se inundaba. Abrieron canales para evacuar agua y colocaron señales en las zonas húmedas. Ahora más personas lo usan después de llover.","q":"Elige un resumen fiel.","o":["Las reparaciones permitieron usar el sendero después de la lluvia","Ya nunca llueve allí","Todas las señales se retiraron"],"k":0},
{"v":"C","s":5,"p":"La panadería anotó cuánto pan sobraba cada día y ajustó la producción. Lo que aún quedó se donó. Con ello redujo desperdicios sin dejar de atender a sus clientes.","q":"¿Qué consiguió al ajustar la producción?","o":["Cerrar temprano","Reducir desperdicio y aprovechar los sobrantes","Dejar de vender pan"],"k":1},
{"v":"C","s":6,"p":"La cooperativa agrupó entregas en un solo viaje semanal. Gastó menos combustible y mantuvo los precios para sus clientes. Los pedidos siguieron llegando cada viernes.","q":"¿Qué síntesis conserva lo esencial?","o":["La cooperativa dejó de entregar pedidos","Los viernes son días caros","Agrupar entregas redujo costos y ayudó a mantener precios"],"k":2}
  ]$cases$::jsonb) loop
    insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values('2.C',1,item->>'v',(item->>'s')::smallint,'transfer',item->>'p',item->>'q',item->'o') returning id into cid;
    insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    select cid,(item->>'k')::smallint,(select jsonb_agg(case when i=(item->>'k')::integer then 'Correcto. Esta respuesta sigue lo que dice el párrafo.'
      else 'Revisa la idea completa y descarta detalles o afirmaciones no respaldadas.' end order by i) from generate_series(0,2) i);
    insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
    select cid,(select jsonb_agg(case when i=(item->>'k')::integer then null else case (item->>'s')::integer when 2 then 'support_missed' when 3 then 'reference_misattributed' when 4 then 'summary_distorted' when 6 then 'summary_distorted' else 'idea_missed' end end order by i) from generate_series(0,2) i),
      case (item->>'s')::integer when 1 then 'paragraph_main_idea' when 2 then 'paragraph_support' when 3 then 'paragraph_reference' when 4 then 'paragraph_summary' when 5 then 'paragraph_main_idea' else 'paragraph_summary' end;
  end loop;
end $seed$;

alter table public.curriculum_attempts drop constraint curriculum_attempts_transfer_correct_check;
alter table public.curriculum_attempts add constraint curriculum_attempts_transfer_correct_check
  check ((lesson_code in ('1.C','2.C') and transfer_correct between 0 and 6)
      or (lesson_code not in ('1.C','2.C') and transfer_correct between 0 and 2));

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
        where attempt_id=a.id and (a.lesson_code in ('1.C','2.C') or step in (5,6)) and first_correct;
      if a.lesson_code in ('1.C','2.C') then
        select total >= 5 and count(distinct skill_code)=case when a.lesson_code='1.C' then 5 else 4 end into passed
          from public.curriculum_responses where attempt_id=a.id and first_correct;
      end if;
      update public.curriculum_attempts set status='completed',completed_at=clock_timestamp(),transfer_correct=total where id=a.id;
    end if;
  end if;
  return jsonb_build_object('feedback',message,'correct',is_correct,'retryNeeded',retry_needed,
    'completed',a.current_step=6 and not retry_needed,
    'transferCorrect',case when a.current_step=6 and not retry_needed then total else null end,
    'integrationPassed',case when a.lesson_code in ('1.C','2.C') and a.current_step=6 and not retry_needed then passed else null end);
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
    (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='1.C' and a0.status='completed'
      and a0.transfer_correct>=5
      and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=5) then
    raise exception 'Primero comprueba las habilidades del nivel 1.1.' using errcode='22023'; end if;
  if p_lesson_code in ('2.2','2.3','2.4','2.C') and not exists
    (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '2.2' then '2.1' when '2.3' then '2.2' when '2.4' then '2.3' else '2.4' end and status='completed') then
    raise exception 'Completa la lección anterior del nivel 1.2.' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||p_lesson_code, 0));
  select * into a from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='active' for update;
  if not found then
    select count(*) into completed_count from public.curriculum_attempts where user_id=u and lesson_code=l.code and status='completed';
    chosen_variant := case when completed_count % 3 = 0 then 'A' when completed_count % 3 = 1 then 'B' else 'C' end;
    if (select count(*) from public.curriculum_cases where lesson_code=l.code and content_version=l.content_version and variant=chosen_variant) <> 6 then raise exception 'Faltan casos para esta misión.' using errcode='22023'; end if;
    insert into public.curriculum_attempts(user_id,lesson_code,content_version,variant)
      values(u,l.code,l.content_version,chosen_variant) returning * into a;
  end if;
  return private.curriculum_lesson_state(a.id);
end $$;

commit;
