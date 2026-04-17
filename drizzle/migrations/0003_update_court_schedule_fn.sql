-- Atualiza atomicamente as tabelas de horário/bloqueios de uma court:
-- deleta tudo e reinsere a partir dos arrays JSONB. Chamado por
-- CourtRepository.updateSchedule.
create or replace function update_court_schedule(
  p_court_id         uuid,
  p_business_hours   jsonb,
  p_date_exceptions  jsonb,
  p_recurring_blocks jsonb
)
returns void
language plpgsql as
$$
begin
  delete from court_business_hours   where court_id = p_court_id;
  delete from court_date_exceptions  where court_id = p_court_id;
  delete from court_recurring_blocks where court_id = p_court_id;

  if jsonb_array_length(p_business_hours) > 0 then
    insert into court_business_hours (court_id, day_of_week, open_time, close_time, is_closed)
    select
      p_court_id,
      (h->>'dayOfWeek')::smallint,
      (h->>'openTime')::time,
      (h->>'closeTime')::time,
      (h->>'isClosed')::boolean
    from jsonb_array_elements(p_business_hours) as h;
  end if;

  if jsonb_array_length(p_date_exceptions) > 0 then
    insert into court_date_exceptions (court_id, date, is_full_day, start_time, end_time, reason)
    select
      p_court_id,
      (e->>'date')::date,
      (e->>'isFullDayBlock')::boolean,
      nullif(e->>'startTime', '')::time,
      nullif(e->>'endTime',   '')::time,
      nullif(e->>'reason',    '')
    from jsonb_array_elements(p_date_exceptions) as e;
  end if;

  if jsonb_array_length(p_recurring_blocks) > 0 then
    insert into court_recurring_blocks (court_id, day_of_week, start_time, end_time, reason)
    select
      p_court_id,
      (b->>'dayOfWeek')::smallint,
      (b->>'startTime')::time,
      (b->>'endTime')::time,
      nullif(b->>'reason', '')
    from jsonb_array_elements(p_recurring_blocks) as b;
  end if;
end;
$$;
