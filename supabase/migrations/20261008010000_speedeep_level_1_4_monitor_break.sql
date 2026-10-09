begin;
insert into public.curriculum_lessons(code,block_number,position,title,mission,skill_code,is_published)
 values('4.1',4,1,'Detecta cuándo se pierde el sentido','Distingue una ruptura real de una diferencia que sí tiene explicación.','monitor_break',true);
do $seed$
declare item jsonb; cid uuid;
begin
 for item in select value from jsonb_array_elements($cases$[{"v":"A","s":1,"r":"probe","p":"El taller abre a las nueve. La primera clase comienza a las diez. Quienes llegan antes pueden esperar en la sala.","q":"¿Hay un dato que impida entender los horarios?","o":["Sí, la clase empieza antes de abrir","No; abrir y comenzar la clase son momentos distintos","Sí, nadie puede esperar"],"k":1,"skill":"monitor_break"},{"v":"A","s":2,"r":"probe","p":"El aviso dice que la visita será el jueves. Más adelante indica: «Ese mismo día, viernes, se entregarán las entradas».","q":"¿Qué requiere comprobarse?","o":["El día de la visita, porque aparecen jueves y viernes","La cantidad de entradas","El lugar de espera"],"k":0,"skill":"monitor_break"},{"v":"A","s":3,"r":"guided","p":"La biblioteca cerrará el lunes por limpieza. El martes abrirá normalmente. Por eso, quienes planeaban ir el lunes deberán cambiar su visita.","q":"¿Qué parte conserva el sentido?","o":["El martes también está cerrado","La visita del lunes debe cambiarse","No se sabe cuándo abrirá"],"k":1,"skill":"monitor_break"},{"v":"A","s":4,"r":"guided","p":"Una nota dice que hay veinte lugares para el curso. Otra línea dice que quedan ocho lugares disponibles.","q":"¿Hay una contradicción real?","o":["Sí: veinte y ocho siempre son incompatibles","Sí: no se puede saber cuántos quedan","No; puede haber veinte en total y ocho libres"],"k":2,"skill":"monitor_break"},{"v":"A","s":5,"r":"transfer","p":"El informe señala que el puente permanece cerrado. Después recomienda usarlo para llegar al mercado sin mencionar una reapertura.","q":"¿Qué ruptura conviene detectar?","o":["Recomienda usar un puente que sigue cerrado","El mercado está lejos","No aparece el nombre del puente"],"k":0,"skill":"monitor_break"},{"v":"A","s":6,"r":"transfer","p":"La reunión inicia a las seis y el registro abre a las cinco y media. Se pide llegar con tiempo.","q":"¿Necesitas detenerte por una contradicción?","o":["Sí, el registro empieza después de la reunión","No; el registro empieza antes","Sí, la reunión no tiene hora"],"k":1,"skill":"monitor_break"},{"v":"B","s":1,"r":"probe","p":"El museo permite entrar a las diez. La visita guiada empieza a las once. Es posible recorrer la sala principal antes de la guía.","q":"¿Se pierde el sentido por las horas?","o":["Sí, la guía empieza antes de abrir","No; la entrada antecede a la guía","Sí, el museo permanece cerrado"],"k":1,"skill":"monitor_break"},{"v":"B","s":2,"r":"probe","p":"El cartel dice que el torneo será el sábado. Al final pide llegar «el domingo del torneo» a las ocho.","q":"¿Qué dato requiere aclaración?","o":["El día del torneo, porque se indican dos días","La hora del partido","El lugar del cartel"],"k":0,"skill":"monitor_break"},{"v":"B","s":3,"r":"guided","p":"La ruta habitual está en obras. Una ruta alterna llega a la misma parada, aunque tarda diez minutos más.","q":"¿Qué interpretación conserva el sentido?","o":["No existe otra ruta","Hay una alternativa más lenta","La parada desapareció"],"k":1,"skill":"monitor_break"},{"v":"B","s":4,"r":"guided","p":"El centro tiene treinta mesas. Quince están ocupadas esta tarde.","q":"¿Hay contradicción entre las cifras?","o":["Sí, quince es menor que treinta","Sí, treinta mesas no pueden ocuparse","No; quince pueden estar ocupadas de un total de treinta"],"k":2,"skill":"monitor_break"},{"v":"B","s":5,"r":"transfer","p":"La convocatoria afirma que el registro terminó ayer. Más abajo invita a inscribirse hoy sin mencionar una extensión.","q":"¿Qué ruptura conviene detectar?","o":["El plazo cerrado y la invitación actual chocan","El registro ocurrió ayer","La convocatoria tiene varias líneas"],"k":0,"skill":"monitor_break"},{"v":"B","s":6,"r":"transfer","p":"El pedido se prepara el martes y se recoge el miércoles. La nota pide esperar un día.","q":"¿Conviene señalar una contradicción?","o":["Sí, preparar y recoger deben ocurrir a la vez","No; son días consecutivos","Sí, no hay fecha de recogida"],"k":1,"skill":"monitor_break"},{"v":"C","s":1,"r":"probe","p":"La escuela abre a las siete. La actividad comienza a las ocho. El salón estará disponible desde que abra el edificio.","q":"¿Los horarios crean un problema de sentido?","o":["Sí, la actividad comienza antes de abrir","No; hay una hora entre apertura y actividad","Sí, el salón estará cerrado"],"k":1,"skill":"monitor_break"},{"v":"C","s":2,"r":"probe","p":"La nota anuncia entrega de uniformes el martes. Al pie dice «presentarse el miércoles para recibirlos».","q":"¿Qué se debe comprobar?","o":["El día de la entrega, porque los días no coinciden","La talla de todos los uniformes","Quién redactó la nota"],"k":0,"skill":"monitor_break"},{"v":"C","s":3,"r":"guided","p":"El parque cerró por lluvia durante la mañana. A las tres volvió a abrir; desde entonces se permite la entrada.","q":"¿Qué lectura tiene sentido?","o":["Sigue cerrado todo el día","Reabrió por la tarde","Nunca cerró"],"k":1,"skill":"monitor_break"},{"v":"C","s":4,"r":"guided","p":"El comedor tiene cuarenta lugares. En este momento veinte están libres.","q":"¿Hay una ruptura real?","o":["Sí, veinte y cuarenta no pueden aparecer juntos","Sí, todos los lugares están ocupados","No; veinte libres caben dentro de cuarenta en total"],"k":2,"skill":"monitor_break"},{"v":"C","s":5,"r":"transfer","p":"La instrucción dice que el formulario solo se entrega en persona. La línea siguiente exige enviarlo exclusivamente por correo sin explicar el cambio.","q":"¿Qué ruptura requiere aclaración?","o":["Las dos formas exclusivas de entrega se contradicen","Falta imprimir el formulario","La instrucción menciona correo"],"k":0,"skill":"monitor_break"},{"v":"C","s":6,"r":"transfer","p":"Las solicitudes se revisan el viernes y las respuestas se envían el lunes siguiente.","q":"¿Hay que detenerse por una contradicción?","o":["Sí, se responde antes de revisar","No; la respuesta sigue a la revisión","Sí, no se habla de solicitudes"],"k":1,"skill":"monitor_break"}]$cases$::jsonb) loop
  insert into public.curriculum_cases(lesson_code,content_version,variant,step,role,sentence,question,options)
    values('4.1',1,item->>'v',(item->>'s')::smallint,item->>'r',item->>'p',item->>'q',item->'o') returning id into cid;
  insert into private.curriculum_answer_keys(case_id,correct_index,feedback)
    select cid,(item->>'k')::smallint,(select jsonb_agg(case when i=(item->>'k')::integer then 'Correcto. Diferencias compatibles no exigen detenerse; contradicciones sí.' else 'Revisa si ambos datos pueden ser ciertos a la vez antes de decidir.' end order by i) from generate_series(0,2) i);
  insert into private.curriculum_case_rubrics(case_id,error_codes,skill_code)
    select cid,(select jsonb_agg(case when i=(item->>'k')::integer then null else 'monitor_break_missed' end order by i) from generate_series(0,2) i),item->>'skill';
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
