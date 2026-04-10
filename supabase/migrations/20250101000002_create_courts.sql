create table if not exists courts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  sport_type text not null,
  description text,
  price_per_hour numeric(10,2) not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table courts disable row level security;
