begin;

-- A small diagnostic cannot certify QSD. It gives provisional academic and
-- practice recommendations; visual exposure is calibrated separately.
alter table public.flash_profiles
  add column calibration_done_at timestamptz;

alter table public.flash_rounds drop constraint flash_rounds_origin_check;
alter table public.flash_rounds add constraint flash_rounds_origin_check
  check (origin in ('route','lab','diagnostic'));

create or replace function private.diagnostic_result(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare counts jsonb; a public.diagnostic_attempts%rowtype;
  correct_total integer; weak text; band text; practice_kind text;
  rationale text; first_step text;
begin
  select * into a from public.diagnostic_attempts
    where id=p_attempt_id and user_id=auth.uid() and finished_at is not null;
  if not found then raise exception 'Aún no hay resultado.' using errcode='22023'; end if;
  select jsonb_object_agg(skill,jsonb_build_object('correct',correct,'total',total))
    into counts from (
      select i.skill,count(*) filter (where r.correct) as correct,count(*) as total
      from public.diagnostic_answers r join public.diagnostic_items i on i.id=r.item_id
      where r.attempt_id=a.id group by i.skill
    ) s;
  select count(*) filter (where correct) into correct_total
    from public.diagnostic_answers where attempt_id=a.id;
  if (counts->'sentence'->>'correct')::integer < 2 then
    weak:='sentence'; practice_kind:='reading'; first_step:='sentido de la oración';
  elsif (counts->'main_idea'->>'correct')::integer < 2 then
    weak:='main_idea'; practice_kind:='main_idea'; first_step:='idea central';
  elsif (counts->'explicit'->>'correct')::integer < 2 then
    weak:='explicit'; practice_kind:='find_data'; first_step:='localizar datos';
  elsif (counts->'cause'->>'correct')::integer < 2 then
    weak:='cause'; practice_kind:='reading'; first_step:='causas y efectos';
  elsif (counts->'inference'->>'correct')::integer < 2 then
    weak:='inference'; practice_kind:='reading'; first_step:='inferir con evidencia';
  else
    weak:='none'; practice_kind:='reading'; first_step:='comprensión integrada';
  end if;
  band:=case when correct_total>=8
      and (counts->'sentence'->>'correct')::integer>=1
      and (counts->'main_idea'->>'correct')::integer>=1
    then 'intermediate' else 'beginner' end;
  rationale:=case when weak='none'
    then 'Buen punto de partida. Prueba lecturas nuevas para confirmar tu rango.'
    else 'Conviene empezar con '||first_step||' y verificarla en material nuevo.' end;
  return jsonb_build_object(
    'skills',counts,'recommendation',
      'Empieza en 1.1. Este diagnóstico orienta tus primeras prácticas, pero aún no acredita dominio ni QSD.',
    'nextLesson','1.1','firstReadSeconds',a.first_read_seconds,
    'secondReadSeconds',a.second_read_seconds,
    'confidenceState','provisional',
    'practicePlacement',jsonb_build_object('readingRange',band,
      'recommendedKind',practice_kind,'focusSkill',weak,'reason',rationale),
    'calibrationPending',not exists (
      select 1 from public.flash_profiles p where p.user_id=a.user_id and p.rounds_completed>0
    )
  );
end $$;

create function public.get_my_diagnostic_placement()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare a uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión.' using errcode='28000'; end if;
  select id into a from public.diagnostic_attempts
    where user_id=auth.uid() and finished_at is not null
    order by finished_at desc limit 1;
  if a is null then return null; end if;
  return private.diagnostic_result(a.id);
end $$;
revoke all on function public.get_my_diagnostic_placement() from public, anon;
grant execute on function public.get_my_diagnostic_placement() to authenticated;

-- The rest of this migration replaces the two existing flash RPCs. A first
-- diagnostic round is one ordinary eight-item practice round, with a safe
-- initial rank. It counts in the lab and never in QSD.
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


create or replace function private.submit_flash_numbers(p_round_id uuid,p_index integer,p_observed_ms integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.flash_rounds%rowtype; item private.flash_items%rowtype;
  p public.flash_profiles%rowtype; total integer; new_rank integer; high smallint; low smallint;
begin
  if u is null then raise exception 'Inicia sesión para entrenar.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into r from public.flash_rounds where id=p_round_id and user_id=u and completed_at is null for update;
  if not found then raise exception 'La ronda no está activa.' using errcode='22023'; end if;
  if p_index not between 0 and 3 or p_observed_ms not between 1 and 10000 then
    raise exception 'Respuesta inválida.' using errcode='22023'; end if;
  select * into item from private.flash_items where round_id=r.id and position=r.next_item for update;
  if item.answered_at is not null then raise exception 'Este destello ya fue respondido.' using errcode='22023'; end if;
  update private.flash_items set selected_index=p_index,observed_ms=p_observed_ms,answered_at=clock_timestamp()
    where round_id=r.id and position=r.next_item;
  total:=r.correct_count+(p_index=item.correct_index)::integer;
  update public.flash_rounds set next_item=r.next_item+1,correct_count=total,
    completed_at=case when r.next_item=8 then clock_timestamp() else null end where id=r.id;
  if r.next_item=8 then
    select * into p from public.flash_profiles where user_id=u for update;
    new_rank:=p.numbers_rank;
    high:=case when total>=7 then least(2,p.high_streak+1) else 0 end;
    low:=case when total<=5 then least(2,p.low_streak+1) else 0 end;
    if r.origin='diagnostic' and p.rounds_completed=0 then
      new_rank:=case when total>=7 then 1 else 0 end;
      high:=0; low:=0;
    elsif total<=3 or low>=2 then new_rank:=greatest(0,p.numbers_rank-1);
    elsif high>=2 then new_rank:=least(17,p.numbers_rank+1); end if;
    if new_rank<>p.numbers_rank then high:=0; low:=0; end if;
    update public.flash_profiles set numbers_rank=new_rank,high_streak=high,low_streak=low,
      rounds_completed=rounds_completed+1,
      calibration_done_at=case when r.origin='diagnostic' and p.rounds_completed=0
        then clock_timestamp() else calibration_done_at end,
      updated_at=clock_timestamp() where user_id=u;
  end if;
  return private.flash_state(r.id);
end $$;


commit;
