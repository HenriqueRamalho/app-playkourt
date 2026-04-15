-- States
create table if not exists states (
  id        int          primary key,
  uf        varchar(2)   not null,
  name      varchar(100) not null,
  latitude  float        not null,
  longitude float        not null,
  region    varchar(12)  not null
);

-- Cities
create table if not exists cities (
  id           int          primary key,
  name         varchar(100) not null,
  latitude     float        not null,
  longitude    float        not null,
  capital      boolean      not null,
  state_id     int          not null references states (id),
  siafi_id     varchar(4)   not null unique,
  ddd          int          not null,
  timezone     varchar(32)  not null
);

-- Venues
create table if not exists venues (
  id           uuid         primary key default gen_random_uuid(),
  owner_id     uuid         not null,
  name         text         not null,
  cnpj         text,
  phone        text,
  street       text,
  number       text,
  complement   text,
  neighborhood text,
  city_id      int          not null references cities (id),
  state_id     int          not null references states (id),
  zip_code     text,
  latitude     numeric(9,6),
  longitude    numeric(9,6),
  is_active    boolean      default true,
  created_at   timestamptz  default now(),
  business_hours jsonb not null default '[]'
);

-- Venue members
create table if not exists venue_members (
  id         uuid        primary key default gen_random_uuid(),
  venue_id   uuid        not null references venues(id) on delete cascade,
  user_id    uuid        not null,
  role       text        not null,
  created_at timestamptz default now(),
  unique(venue_id, user_id)
);

-- Courts
create table if not exists courts (
  id             uuid          primary key default gen_random_uuid(),
  venue_id       uuid          not null references venues(id) on delete cascade,
  name           text          not null,
  sport_type     text          not null,
  description    text,
  price_per_hour numeric(10,2) not null,
  is_active      boolean       default true,
  created_at     timestamptz   default now()
);

alter table states        disable row level security;
alter table cities        disable row level security;
alter table venues        disable row level security;
alter table venue_members disable row level security;
alter table courts        disable row level security;
