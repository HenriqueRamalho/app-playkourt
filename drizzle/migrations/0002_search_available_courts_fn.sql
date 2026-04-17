-- Resolve herança venue→court, bloqueios pontuais, recorrentes e conflitos
-- de reserva em uma única query parametrizada.
create or replace function search_available_courts(
  p_city_id     int,
  p_sport_type  text,
  p_date        date,
  p_day_of_week int,
  p_start_time  time,
  p_end_time    time
)
returns table (
  court_id       uuid,
  court_name     text,
  sport_type     text,
  price_per_hour numeric,
  description    text,
  venue_id       uuid,
  venue_name     text,
  neighborhood   text,
  city_name      text
)
language sql stable as
$$
  select
    c.id              as court_id,
    c.name            as court_name,
    c.sport_type,
    c.price_per_hour,
    c.description,
    v.id              as venue_id,
    v.name            as venue_name,
    v.neighborhood,
    ci.name           as city_name
  from courts c
  join venues v  on v.id = c.venue_id
  join cities ci on ci.id = v.city_id

  -- Horário efetivo: usa court_business_hours se existir, senão venue_business_hours
  join lateral (
    select
      coalesce(cbh.open_time,  vbh.open_time)  as open_time,
      coalesce(cbh.close_time, vbh.close_time) as close_time,
      coalesce(cbh.is_closed,  vbh.is_closed)  as is_closed
    from venue_business_hours vbh
    left join court_business_hours cbh
      on cbh.court_id    = c.id
      and cbh.day_of_week = p_day_of_week
    where vbh.venue_id    = v.id
      and vbh.day_of_week = p_day_of_week
  ) eff on true

  where ci.id          = p_city_id
    and c.sport_type   = p_sport_type
    and c.is_active    = true
    and v.is_active    = true

    and eff.is_closed  = false
    and eff.open_time  <= p_start_time
    and eff.close_time >= p_end_time

    and not exists (
      select 1 from court_date_exceptions e
      where e.court_id    = c.id
        and e.date        = p_date
        and e.is_full_day = true
    )

    and not exists (
      select 1 from court_date_exceptions e
      where e.court_id    = c.id
        and e.date        = p_date
        and e.is_full_day = false
        and e.start_time  < p_end_time
        and e.end_time    > p_start_time
    )

    and not exists (
      select 1 from court_recurring_blocks rb
      where rb.court_id    = c.id
        and rb.day_of_week = p_day_of_week
        and rb.start_time  < p_end_time
        and rb.end_time    > p_start_time
    )

    and not exists (
      select 1 from bookings b
      where b.court_id = c.id
        and b.date     = p_date
        and b.status   in ('pending', 'confirmed')
        and b.start_time < p_end_time
        and booking_end_ts(b.date, b.start_time, b.duration_hours)::time > p_start_time
    )

  order by c.price_per_hour asc;
$$;
