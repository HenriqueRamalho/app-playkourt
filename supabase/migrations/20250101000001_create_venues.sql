create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  cnpj text,
  phone text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text not null,
  state char(2) not null,
  zip_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists venue_members (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  created_at timestamptz default now(),
  unique(venue_id, user_id)
);

alter table venues disable row level security;
alter table venue_members disable row level security;
