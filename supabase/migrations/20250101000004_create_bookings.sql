create table bookings (
  id             uuid primary key default gen_random_uuid(),
  court_id       uuid not null references courts(id) on delete cascade,
  user_id        uuid not null,
  date           date not null,
  start_time     time not null,
  duration_hours numeric(3,1) not null check (duration_hours between 0.5 and 4),
  status         text not null default 'pending',
  created_at     timestamptz not null default now()
);

create index bookings_court_id_date_idx on bookings (court_id, date);
create index bookings_user_id_idx on bookings (user_id);
