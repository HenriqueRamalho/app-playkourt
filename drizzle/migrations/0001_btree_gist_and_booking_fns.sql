-- Extensão necessária para o exclusion constraint GiST com tsrange.
create extension if not exists btree_gist;
--> statement-breakpoint

-- Funções IMMUTABLE usadas em expressões de índice e constraint.
-- Combinam date + time em timestamp sem depender do timezone da sessão.
create or replace function booking_start_ts(d date, t time)
  returns timestamp language sql immutable strict as
$$
  select (d + t)::timestamp;
$$;
--> statement-breakpoint

create or replace function booking_end_ts(d date, t time, duration_hours numeric)
  returns timestamp language sql immutable strict as
$$
  select (d + t)::timestamp + make_interval(mins => (duration_hours * 60)::int);
$$;
--> statement-breakpoint

-- Previne race condition de reservas sobrepostas na mesma quadra/dia.
-- O operador && em tsrange é exclusivo nas bordas, então reservas
-- adjacentes (19h-20h e 20h-22h) permanecem válidas.
alter table bookings add constraint no_overlapping_bookings
  exclude using gist (
    court_id with =,
    date     with =,
    tsrange(
      booking_start_ts(date, start_time),
      booking_end_ts(date, start_time, duration_hours)
    ) with &&
  )
  where (status in ('pending', 'confirmed'));
