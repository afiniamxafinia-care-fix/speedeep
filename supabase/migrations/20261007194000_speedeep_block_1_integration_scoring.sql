begin;
alter table public.curriculum_attempts drop constraint curriculum_attempts_transfer_correct_check;
alter table public.curriculum_attempts add constraint curriculum_attempts_transfer_correct_check
  check ((lesson_code='1.C' and transfer_correct between 0 and 6)
      or (lesson_code<>'1.C' and transfer_correct between 0 and 2));
create or replace function private.submit_curriculum_answer(p_attempt_id uuid, p_index integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid(); a public.curriculum_attempts%rowtype;
  c public.curriculum_cases%rowtype; k private.curriculum_answer_keys%rowtype;
  r public.curriculum_responses%rowtype; is_correct boolean;
  retry_needed boolean := false; total integer; passed boolean; message text;
begin
  if u is null then raise exception 'Inicia sesión para continuar.' using errcode='28000'; end if;
  if not private.can_practice() then raise exception 'Tu acceso al programa no está activo.' using errcode='42501'; end if;
  select * into a from public.curriculum_attempts
    where id=p_attempt_id and user_id=u and status='active' for update;
  if not found then raise exception 'La misión no está activa.' using errcode='22023'; end if;
  select * into c from public.curriculum_cases
    where lesson_code=a.lesson_code and content_version=a.content_version
      and variant=a.variant and step=a.current_step;
  select * into k from private.curriculum_answer_keys where case_id=c.id;
  if c.id is null or k.case_id is null then raise exception 'Falta configurar este caso.' using errcode='22023'; end if;
  if p_index is null or p_index<0 or p_index>=jsonb_array_length(c.options) then
    raise exception 'Selecciona una respuesta válida.' using errcode='22023';
  end if;
  is_correct := p_index=k.correct_index;
  message := k.feedback->>p_index;
  select * into r from public.curriculum_responses where attempt_id=a.id and step=a.current_step for update;
  if not found then
    insert into public.curriculum_responses(attempt_id,user_id,case_id,step,first_index,first_correct)
      values(a.id,u,c.id,c.step,p_index,is_correct);
    retry_needed := not is_correct and c.role <> 'transfer';
  elsif r.retry_index is null and not r.first_correct and c.role <> 'transfer' then
    update public.curriculum_responses set retry_index=p_index
      where attempt_id=a.id and step=c.step;
  else
    raise exception 'Esta respuesta ya fue registrada.' using errcode='22023';
  end if;
  if not retry_needed then
    update public.curriculum_attempts set current_step=current_step+1 where id=a.id;
    if a.current_step=6 then
      select count(*) into total from public.curriculum_responses
        where attempt_id=a.id and (a.lesson_code='1.C' or step in (5,6)) and first_correct;
      if a.lesson_code='1.C' then
        select total >= 5 and count(distinct skill_code)=5 into passed
          from public.curriculum_responses
          where attempt_id=a.id and first_correct;
      end if;
      update public.curriculum_attempts set status='completed',completed_at=clock_timestamp(),transfer_correct=total
        where id=a.id;
    end if;
  end if;
  return jsonb_build_object('feedback',message,'correct',is_correct,'retryNeeded',retry_needed,
    'completed',a.current_step=6 and not retry_needed,
    'transferCorrect',case when a.current_step=6 and not retry_needed then total else null end,
    'integrationPassed',case when a.lesson_code='1.C' and a.current_step=6 and not retry_needed then passed else null end);
end $$;
commit;
