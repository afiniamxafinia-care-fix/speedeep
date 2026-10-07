begin;

create table public.flash_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  numbers_rank smallint not null default 0 check (numbers_rank between 0 and 17),
  high_streak smallint not null default 0 check (high_streak between 0 and 1),
  low_streak smallint not null default 0 check (low_streak between 0 and 1),
  rounds_completed integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.flash_profiles enable row level security;
revoke all on public.flash_profiles from public, anon, authenticated;
grant select on public.flash_profiles to authenticated;
create policy "Readers see own flash level" on public.flash_profiles
  for select to authenticated using ((select auth.uid())=user_id);

create table public.flash_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin text not null check (origin in ('route','lab')),
  kind text not null default 'numbers' check (kind='numbers'),
  rank smallint not null check (rank between 0 and 17),
  length smallint not null check (length between 3 and 8),
  exposure_ms integer not null check (exposure_ms between 250 and 2000),
  next_item smallint not null default 1 check (next_item between 1 and 9),
  correct_count smallint not null default 0 check (correct_count between 0 and 8),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((next_item=9)=(completed_at is not null))
);
create unique index flash_one_active_numbers_idx on public.flash_rounds(user_id,kind) where completed_at is null;
create index flash_rounds_user_idx on public.flash_rounds(user_id,completed_at desc);
alter table public.flash_rounds enable row level security;
revoke all on public.flash_rounds from public, anon, authenticated;
grant select on public.flash_rounds to authenticated;
create policy "Readers see own flash rounds" on public.flash_rounds
  for select to authenticated using ((select auth.uid())=user_id);

create table private.flash_items (
  round_id uuid not null references public.flash_rounds(id) on delete cascade,
  position smallint not null check (position between 1 and 8),
  target text not null,
  options jsonb not null check (jsonb_typeof(options)='array' and jsonb_array_length(options)=4),
  correct_index smallint not null check (correct_index between 0 and 3),
  selected_index smallint check (selected_index between 0 and 3),
  observed_ms integer check (observed_ms between 1 and 10000),
  answered_at timestamptz,
  primary key (round_id,position)
);
alter table private.flash_items enable row level security;
revoke all on private.flash_items from public, anon, authenticated;

create function private.flash_state(p_round_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.flash_rounds%rowtype; item private.flash_items%rowtype; p public.flash_profiles%rowtype;
begin
  select * into r from public.flash_rounds where id=p_round_id and user_id=auth.uid();
  if not found then raise exception 'Ronda no disponible.' using errcode='22023'; end if;
  select * into p from public.flash_profiles where user_id=r.user_id;
  if r.completed_at is not null then
    return jsonb_build_object('status','completed','roundId',r.id,'origin',r.origin,'correct',r.correct_count,
      'level',jsonb_build_object('rank',p.numbers_rank,'digits',3+p.numbers_rank/3,'step',mod(p.numbers_rank,3),
        'roundsCompleted',p.rounds_completed),'played',jsonb_build_object('digits',r.length,'exposureMs',r.exposure_ms));
  end if;
  select * into item from private.flash_items where round_id=r.id and position=r.next_item;
  if not found then raise exception 'Falta un destello.' using errcode='22023'; end if;
  return jsonb_build_object('status','active','roundId',r.id,'origin',r.origin,'position',r.next_item,
    'digits',r.length,'exposureMs',r.exposure_ms,'target',item.target,'options',item.options);
end $$;

create function private.begin_flash_numbers(p_origin text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.flash_profiles%rowtype; r public.flash_rounds%rowtype;
  n integer; j integer; duration integer; pos integer; k integer; target text; swapped text;
  changed text; rotated text; options text[]; correct_idx integer; tries integer;
begin
  if u is null then raise exception 'Inicia sesión para entrenar.' using errcode='28000'; end if;
  if p_origin not in ('route','lab') or p_origin is null then raise exception 'Origen inválido.' using errcode='22023'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':flash_numbers',0));
  insert into public.flash_profiles(user_id) values(u) on conflict (user_id) do nothing;
  select * into r from public.flash_rounds where user_id=u and kind='numbers' and completed_at is null for update;
  if found then return private.flash_state(r.id); end if;
  select * into p from public.flash_profiles where user_id=u for update;
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

create function private.submit_flash_numbers(p_round_id uuid,p_index integer,p_observed_ms integer)
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
    if total<=3 or low>=2 then new_rank:=greatest(0,p.numbers_rank-1);
    elsif high>=2 then new_rank:=least(17,p.numbers_rank+1); end if;
    if new_rank<>p.numbers_rank then high:=0; low:=0; end if;
    update public.flash_profiles set numbers_rank=new_rank,high_streak=high,low_streak=low,
      rounds_completed=rounds_completed+1,updated_at=clock_timestamp() where user_id=u;
  end if;
  return private.flash_state(r.id);
end $$;

revoke all on function private.flash_state(uuid),private.begin_flash_numbers(text),private.submit_flash_numbers(uuid,integer,integer) from public,anon,authenticated;
grant execute on function private.flash_state(uuid),private.begin_flash_numbers(text),private.submit_flash_numbers(uuid,integer,integer) to authenticated;
create function public.begin_flash_numbers(p_origin text) returns jsonb language sql security invoker set search_path='' as $$
  select private.begin_flash_numbers(p_origin);
$$;
create function public.submit_flash_numbers(p_round_id uuid,p_index integer,p_observed_ms integer)
returns jsonb language sql security invoker set search_path='' as $$
  select private.submit_flash_numbers(p_round_id,p_index,p_observed_ms);
$$;
revoke all on function public.begin_flash_numbers(text),public.submit_flash_numbers(uuid,integer,integer) from public,anon;
grant execute on function public.begin_flash_numbers(text),public.submit_flash_numbers(uuid,integer,integer) to authenticated;
commit;
