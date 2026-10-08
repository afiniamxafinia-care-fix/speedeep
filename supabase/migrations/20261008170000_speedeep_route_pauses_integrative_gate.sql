begin;
-- One completed round per route pause; laboratory rounds remain repeatable.
create or replace function private.begin_training(p_exercise_id uuid,p_origin text,p_route_level text,p_route_after smallint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); e public.training_exercises%rowtype; a public.training_attempts%rowtype;
begin
 if u is null then raise exception 'Inicia sesión para practicar.' using errcode='28000'; end if;
 if not private.can_practice() then raise exception 'Tu acceso de práctica no está activo.' using errcode='42501'; end if;
 if p_origin is null or not coalesce(((p_origin='route' and p_route_level in ('1.1','1.2','1.3','1.4') and p_route_after in (1,3))
   or (p_origin='lab' and p_route_level is null and p_route_after is null)),false) then
   raise exception 'El origen de práctica no es válido.' using errcode='22023'; end if;
 select * into e from public.training_exercises where id=p_exercise_id and is_published;
 if not found or not exists(select 1 from private.training_answer_keys where exercise_id=p_exercise_id) then
   raise exception 'El ejercicio no está disponible.' using errcode='22023'; end if;
 if p_origin='route' then
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':route:'||p_route_level||':'||p_route_after,0));
   if exists (select 1 from public.training_attempts where user_id=u and origin='route'
      and route_level=p_route_level and route_after=p_route_after and completed_at is not null) then
      raise exception 'Ya completaste esta pausa curiosa. Explora más retos en Prácticas.' using errcode='22023';
   end if;
   select * into a from public.training_attempts where user_id=u and origin='route'
      and route_level=p_route_level and route_after=p_route_after and completed_at is null
      and expires_at>clock_timestamp() order by started_at desc limit 1 for update;
   if found then
      select * into e from public.training_exercises where id=a.exercise_id;
      return jsonb_build_object('attemptId',a.id,'exercise',jsonb_build_object(
        'id',e.id,'kind',e.kind,'title',e.title,'instructions',e.instructions,
        'context',e.context,'items',e.items,'skillCode',e.skill_code));
   end if;
 end if;
 insert into public.training_attempts(user_id,exercise_id,content_version,origin,route_level,route_after)
   values(u,e.id,e.content_version,p_origin,p_route_level,p_route_after) returning * into a;
 return jsonb_build_object('attemptId',a.id,'exercise',jsonb_build_object(
   'id',e.id,'kind',e.kind,'title',e.title,'instructions',e.instructions,
   'context',e.context,'items',e.items,'skillCode',e.skill_code));
end $$;

create or replace function private.begin_flash_numbers(p_origin text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.flash_profiles%rowtype; r public.flash_rounds%rowtype;
  n integer; j integer; duration integer; pos integer; k integer; target text; swapped text;
  changed text; rotated text; options text[]; correct_idx integer; tries integer;
begin
  if u is null then raise exception 'Inicia sesión para entrenar.' using errcode='28000'; end if;
  if p_origin not in ('route','lab','diagnostic') or p_origin is null then raise exception 'Origen inválido.' using errcode='22023'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  if p_origin='diagnostic' and not exists (select 1 from public.diagnostic_attempts
      where user_id=u and finished_at is not null) then
    raise exception 'Completa primero las dos lecturas.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':flash_numbers',0));
  insert into public.flash_profiles(user_id) values(u) on conflict (user_id) do nothing;
  select * into r from public.flash_rounds where user_id=u and kind='numbers' and completed_at is null for update;
  if found then
    if p_origin='diagnostic' and r.origin<>'diagnostic' then
      raise exception 'Termina la ronda anterior antes de calibrar.' using errcode='22023';
    end if;
    return private.flash_state(r.id);
  end if;
  if p_origin='route' and exists(select 1 from public.flash_rounds where user_id=u and origin='route' and completed_at is not null) then
    raise exception 'Ya completaste esta pausa curiosa. Puedes seguir jugando en Prácticas.' using errcode='22023';
  end if;
  select * into p from public.flash_profiles where user_id=u for update;
  if p_origin='diagnostic' and p.rounds_completed>0 then
    raise exception 'Tu rango de cifras ya está en ajuste con tus rondas.' using errcode='22023';
  end if;
  n:=3+p.numbers_rank/3; j:=mod(p.numbers_rank,3);
  duration:=greatest(250,round((800+120*(n-3))*power(0.85,j))::integer);
  insert into public.flash_rounds(user_id,origin,rank,length,exposure_ms)
    values(u,p_origin,p.numbers_rank,n,duration) returning * into r;
  for pos in 1..8 loop
    tries:=0;
    loop
      tries:=tries+1;
      target:='';
      for k in 1..n loop
        target:=target||floor(random()*10)::integer::text;
      end loop;
      swapped:=substr(target,2,1)||substr(target,1,1)||substr(target,3);
      changed:=substr(target,1,2)||((substr(target,3,1)::integer+1)%10)::text||substr(target,4);
      rotated:=substr(target,n,1)||substr(target,1,n-1);
      exit when target<>swapped and target<>changed and target<>rotated
        and swapped<>changed and swapped<>rotated and changed<>rotated;
      if tries>100 then raise exception 'No se pudo generar el reto.'; end if;
    end loop;
    correct_idx:=floor(random()*4)::integer;
    options:=array[swapped,changed,rotated,target];
    options[4]:=options[correct_idx+1];
    options[correct_idx+1]:=target;
    insert into private.flash_items(round_id,position,target,options,correct_index)
      values(r.id,pos,target,to_jsonb(options),correct_idx);
  end loop;
  return private.flash_state(r.id);
end $$;
-- The next sublevel requires a valid integrated reading; historical access is preserved.
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
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '1.2' then '1.1' when '1.3' then '1.2' when '1.4' then '1.3' else '1.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior primero.' using errcode='22023'; end if;
 if p_lesson_code='2.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='1.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=5) then
   raise exception 'Primero comprueba las habilidades del nivel 1.1.' using errcode='22023'; end if;
 if p_lesson_code in ('2.2','2.3','2.4','2.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '2.2' then '2.1' when '2.3' then '2.2' when '2.4' then '2.3' else '2.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.2.' using errcode='22023'; end if;
 if p_lesson_code='3.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='2.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=4) then
   raise exception 'Primero comprueba las habilidades del nivel 1.2.' using errcode='22023'; end if;
 if p_lesson_code='4.1' and not exists
   (select 1 from public.curriculum_attempts a0 where a0.user_id=u and a0.lesson_code='3.C' and a0.status='completed' and a0.transfer_correct>=5
    and (select count(distinct r.skill_code) from public.curriculum_responses r where r.attempt_id=a0.id and r.first_correct)=4) then
   raise exception 'Primero comprueba las habilidades del nivel 1.3.' using errcode='22023'; end if;
 if p_lesson_code in ('3.2','3.3','3.4','3.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '3.2' then '3.1' when '3.3' then '3.2' when '3.4' then '3.3' else '3.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.3.' using errcode='22023'; end if;
 if p_lesson_code in ('4.2','4.3','4.4','4.C') and not exists
   (select 1 from public.curriculum_attempts where user_id=u and lesson_code=case p_lesson_code when '4.2' then '4.1' when '4.3' then '4.2' when '4.4' then '4.3' else '4.4' end and status='completed' and transfer_correct>=1) then
   raise exception 'Resuelve al menos un caso nuevo de la lección anterior del nivel 1.4.' using errcode='22023'; end if;
 -- Existing learners who entered the next sublevel retain their access.
 if p_lesson_code in ('2.1','3.1','4.1') and not exists
   (select 1 from public.curriculum_attempts prior where prior.user_id=u and prior.lesson_code=p_lesson_code)
   and not exists (
     select 1 from public.practice_sessions s
     join public.reading_articles ra on ra.id=s.article_id
     where s.user_id=u and s.validity_status='valid' and s.completed_at is not null
       and ra.slug=case p_lesson_code
         when '2.1' then 'integracion-1-1-la-nota-del-mercado'
         when '3.1' then 'integracion-1-2-el-aviso-de-la-biblioteca'
         else 'integracion-1-3-la-ruta-de-las-cajas' end
   ) then
   raise exception 'Completa una lectura integradora válida antes de abrir el siguiente subnivel.' using errcode='22023';
 end if;
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

create or replace function private.curriculum_passage_group(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.curriculum_attempts%rowtype; current_passage text;
begin
 if u is null then raise exception 'Inicia sesión para continuar.' using errcode='28000'; end if;
 if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
 select * into a from public.curriculum_attempts where id=p_attempt_id and user_id=u and status='active';
 if not found then raise exception 'La misión no está disponible.' using errcode='22023'; end if;
 select sentence into current_passage from public.curriculum_cases where lesson_code=a.lesson_code
  and content_version=a.content_version and variant=a.variant and step=a.current_step;
 return coalesce((select jsonb_agg(jsonb_build_object('step',c.step,'role',c.role,
    'sentence',c.sentence,'question',c.question,'options',c.options) order by c.step)
    from public.curriculum_cases c where c.lesson_code=a.lesson_code and c.content_version=a.content_version
      and c.variant=a.variant and c.sentence=current_passage), '[]'::jsonb);
end $$;
revoke all on function private.curriculum_passage_group(uuid) from public,anon;
grant execute on function private.curriculum_passage_group(uuid) to authenticated;
create or replace function public.curriculum_passage_group(p_attempt_id uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select private.curriculum_passage_group(p_attempt_id);
$$;
revoke all on function public.curriculum_passage_group(uuid) from public,anon;
grant execute on function public.curriculum_passage_group(uuid) to authenticated;

do $seed$
declare e jsonb; exercise_id uuid;
begin
 for e in select value from jsonb_array_elements($training$[{"slug":"idea-turno-medico","kind":"main_idea","title":"Turnos que sí alcanzan","instructions":"Elige la idea que reúne el problema y la solución, no un dato suelto.","context":"En la clínica, varias personas llegaban antes de abrir y formaban una fila larga. La coordinación revisó los registros y descubrió que casi todas acudían a preguntar por el mismo trámite. Publicó los requisitos y permitió reservar un turno por teléfono. La fila disminuyó, aunque la atención siguió teniendo el mismo horario.","items":["La clínica amplió su horario de atención.","Informar y organizar los turnos redujo una fila innecesaria.","Todas las personas prefieren llamar por teléfono."],"answer":[1],"explanation":"El horario no cambió. La solución combinó requisitos claros y reserva anticipada.","skill_code":"idea_identification"},{"slug":"idea-prestamo-herramientas","kind":"main_idea","title":"Una caja compartida","instructions":"Selecciona la idea central que explica para qué sirvió el cambio.","context":"En el taller, cada equipo compraba una cinta de medir y luego la dejaba guardada. Marina organizó una caja común con etiquetas y un registro de préstamos. Después de un mes, los equipos encontraban las herramientas con más facilidad y dejaron de comprar piezas duplicadas. El registro también ayudó a saber cuáles necesitaban reparación.","items":["Compartir herramientas con un registro facilitó su uso y cuidado.","Marina reparó todas las cintas de medir.","Las etiquetas eran de color amarillo."],"answer":[0],"explanation":"La caja y el registro resolvieron la duplicación y ayudaron al mantenimiento; los otros enunciados no resumen el texto.","skill_code":"idea_identification"},{"slug":"idea-avisos-accesibles","kind":"main_idea","title":"Un aviso para todos","instructions":"Busca la conclusión que engloba lo ocurrido.","context":"El centro comunitario anunciaba sus actividades en un cartel junto a la entrada. Quienes no pasaban por ahí se enteraban tarde. El equipo empezó a colocar el mismo aviso en la biblioteca y a enviarlo por mensaje a las personas inscritas. Más vecinos pudieron planear su visita; las actividades y sus costos no cambiaron.","items":["La biblioteca comenzó a cobrar las actividades.","Cambiar los canales de aviso permitió llegar a más vecinos.","El centro añadió nuevas actividades cada semana."],"answer":[1],"explanation":"La mejora fue de comunicación, no de precio ni de oferta.","skill_code":"idea_identification"},{"slug":"secuencia-bicicleta","kind":"sequence","title":"Antes de salir en bici","instructions":"Toca los pasos en el orden indicado por el texto.","context":"Antes de salir, Ana revisó la presión de las llantas. Al encontrar una baja, la infló. Luego comprobó los frenos y, cuando ambos respondieron bien, se colocó el casco y salió.","items":["Comprobar los frenos.","Inflar la llanta baja.","Revisar la presión.","Ponerse el casco y salir."],"answer":[2,1,0,3],"explanation":"Primero detectó el problema de presión, después lo resolvió y revisó los frenos antes de salir.","skill_code":"comprehension"},{"slug":"secuencia-archivo","kind":"sequence","title":"Recupera el documento","instructions":"Ordena la recuperación según las dependencias descritas.","context":"Para recuperar el documento, busca primero su número en el índice. Con ese número localiza la carpeta. Comprueba la fecha de la portada y, si coincide con la solicitud, registra el préstamo antes de entregarlo.","items":["Registrar el préstamo y entregar.","Comprobar la fecha.","Buscar el número en el índice.","Localizar la carpeta."],"answer":[2,3,1,0],"explanation":"El índice conduce a la carpeta; la fecha debe comprobarse antes de registrar la entrega.","skill_code":"comprehension"},{"slug":"secuencia-semillas","kind":"sequence","title":"Del sobre al brote","instructions":"Reconstruye el procedimiento, no el orden de las tarjetas.","context":"Primero humedece la tierra. Coloca después las semillas a poca profundidad. Cubre con una capa delgada de tierra y, por último, escribe la fecha en la etiqueta para observar cuándo brotan.","items":["Escribir la fecha en la etiqueta.","Colocar las semillas.","Humedecer la tierra.","Cubrir las semillas."],"answer":[2,1,3,0],"explanation":"La fecha se registra al final, después de preparar, sembrar y cubrir.","skill_code":"comprehension"},{"slug":"dato-cupo-charla","kind":"find_data","title":"Encuentra el cupo real","instructions":"Localiza el dato pedido sin confundir lugares con horarios.","context":"CHARLA DE ASTRONOMÍA — EJEMPLO\nViernes 19:00 · Sala norte.\nCupo de la sala: 42 personas.\nLugares disponibles al publicar: 18.\nInscripción hasta el jueves a las 16:00.\nObjetivo: ¿cuántos lugares quedaban al publicar el aviso?","items":["42 lugares.","18 lugares.","16 lugares."],"answer":[1],"explanation":"Cupo total y lugares disponibles no son lo mismo: quedaban 18.","skill_code":"adaptation_to_purpose"},{"slug":"dato-devolucion","kind":"find_data","title":"Revisa el plazo de entrega","instructions":"Encuentra la fecha límite aplicable al préstamo.","context":"PRÉSTAMO DE MATERIAL — CASO FICTICIO\nEntrega: lunes 8 de junio.\nDevolución ordinaria: viernes 12 de junio antes de las 17:00.\nSolicitud de renovación: hasta el miércoles 10 de junio.\nObjetivo: sin renovación, ¿cuándo debe devolverse?","items":["Miércoles 10 de junio.","Lunes 8 de junio.","Viernes 12 de junio antes de las 17:00."],"answer":[2],"explanation":"El miércoles es el límite para solicitar renovación; la devolución ordinaria vence el viernes.","skill_code":"adaptation_to_purpose"},{"slug":"dato-cambio-entrada","kind":"find_data","title":"No confundas las puertas","instructions":"Busca la entrada vigente para el evento.","context":"AVISO DE ACCESO — EJEMPLO\nEl plano original señalaba la puerta oeste.\nPor mantenimiento, durante la función del sábado se utilizará la puerta sur.\nLas salidas de emergencia no cambian.\nObjetivo: ¿por dónde se entra el sábado?","items":["Por la puerta oeste.","Por la puerta sur.","Por cualquier salida de emergencia."],"answer":[1],"explanation":"La nota actualiza la entrada del sábado; el plano original ya no es el dato vigente.","skill_code":"adaptation_to_purpose"},{"slug":"relevancia-envio","kind":"relevance","title":"Prepara un envío","instructions":"Marca los datos necesarios para cumplir el objetivo; evita los accesorios.","context":"Objetivo: enviar un paquete a la dirección correcta antes del cierre de recepción.","items":["Dirección completa del destinatario.","Color favorito del remitente.","Horario límite de recepción.","Nombre de la canción que sonaba al empacar."],"answer":[0,2],"explanation":"La dirección y la hora límite son decisivas para este envío.","skill_code":"adaptation_to_purpose"},{"slug":"relevancia-comparar-talleres","kind":"relevance","title":"Compara dos talleres","instructions":"Selecciona solo los datos útiles para decidir según el propósito.","context":"Objetivo: elegir un taller al que pueda asistir una persona que sale del trabajo a las 17:00 y tiene un presupuesto máximo de 300 pesos.","items":["Hora de inicio de cada taller.","Precio total de inscripción.","Color del logotipo del taller.","Año en que se pintó el edificio."],"answer":[0,1],"explanation":"Horario y costo permiten contrastar ambas restricciones; los datos decorativos no.","skill_code":"adaptation_to_purpose"},{"slug":"relevancia-explicar-cambio","kind":"relevance","title":"Explica un cambio de ruta","instructions":"Elige todos los datos que ayudan a explicar el cambio solicitado.","context":"Objetivo: avisar al grupo por qué el transporte llegará 20 minutos más tarde y dónde lo abordará.","items":["La avenida habitual está cerrada por obras.","El conductor usa una libreta azul.","La nueva parada estará frente a la biblioteca.","El vehículo se lavó ayer."],"answer":[0,2],"explanation":"El cierre explica la demora y la parada nueva indica dónde abordar.","skill_code":"idea_identification"}]$training$::jsonb) loop
   insert into public.training_exercises(slug,kind,title,instructions,context,items,skill_code,is_published)
    values(e->>'slug',e->>'kind',e->>'title',e->>'instructions',e->>'context',e->'items',e->>'skill_code',true)
    on conflict (slug) do nothing returning id into exercise_id;
   if exercise_id is not null then
      insert into private.training_answer_keys(exercise_id,expected_indices,explanation)
       values(exercise_id,e->'answer',e->>'explanation');
   end if;
 end loop;
end $seed$;
commit;
