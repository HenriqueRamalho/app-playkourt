create extension if not exists btree_gist;

create table bookings (
  id             uuid          primary key default gen_random_uuid(),
  court_id       uuid          not null references courts(id) on delete cascade,
  user_id        uuid          not null,
  date           date          not null,
  start_time     time          not null,
  duration_hours numeric(3,1)  not null check (duration_hours between 0.5 and 4),
  status         text          not null default 'pending',
  created_at     timestamptz   not null default now()
);

create index bookings_court_id_date_idx on bookings (court_id, date);
create index bookings_user_id_idx on bookings (user_id);

alter table bookings disable row level security;

-- Previne race condition: o banco garante atomicamente que não existirão
-- duas reservas ativas (pending ou confirmed) com intervalos sobrepostos
-- para a mesma quadra no mesmo dia.
-- O operador && em tsrange é exclusivo nas bordas, portanto reservas
-- adjacentes (ex: 19h-20h e 20h-22h) são permitidas.
alter table bookings add constraint no_overlapping_bookings
  exclude using gist (
    court_id with =,
    date     with =,
    tsrange(
      (date::text || ' ' || start_time::text)::timestamp,
      (date::text || ' ' || start_time::text)::timestamp
        + (duration_hours || ' hours')::interval
    ) with &&
  )
  where (status in ('pending', 'confirmed'));
