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
  created_at   timestamptz  default now()
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
  id               uuid          primary key default gen_random_uuid(),
  venue_id         uuid          not null references venues(id) on delete cascade,
  name             text          not null,
  sport_type       text          not null,
  description      text,
  price_per_hour   numeric(10,2) not null,
  is_active        boolean       default true,
  use_venue_hours  boolean       not null default true,
  created_at       timestamptz   default now()
);

-- Horário de funcionamento do venue (7 linhas por venue, uma por dia da semana)
create table venue_business_hours (
  id          uuid     primary key default gen_random_uuid(),
  venue_id    uuid     not null references venues(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time   time     not null,
  close_time  time     not null,
  is_closed   boolean  not null default false,
  unique(venue_id, day_of_week)
);

-- Horário específico da court (override — só existe se use_venue_hours = false)
create table court_business_hours (
  id          uuid     primary key default gen_random_uuid(),
  court_id    uuid     not null references courts(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time   time     not null,
  close_time  time     not null,
  is_closed   boolean  not null default false,
  unique(court_id, day_of_week)
);

-- Bloqueios pontuais da court (ex: manutenção, feriado)
create table court_date_exceptions (
  id          uuid     primary key default gen_random_uuid(),
  court_id    uuid     not null references courts(id) on delete cascade,
  date        date     not null,
  is_full_day boolean  not null default true,
  start_time  time,
  end_time    time,
  reason      text,
  unique(court_id, date)
);

-- Bloqueios recorrentes da court (ex: contrato com escola)
create table court_recurring_blocks (
  id          uuid     primary key default gen_random_uuid(),
  court_id    uuid     not null references courts(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time     not null,
  end_time    time     not null,
  reason      text
);

-- Índices
create index courts_venue_id_idx                  on courts                (venue_id);
create index venue_business_hours_venue_dow_idx   on venue_business_hours  (venue_id, day_of_week);
create index court_business_hours_court_dow_idx   on court_business_hours  (court_id, day_of_week);
create index court_date_exceptions_court_date_idx on court_date_exceptions  (court_id, date);
create index court_recurring_blocks_court_dow_idx on court_recurring_blocks (court_id, day_of_week);

alter table states                disable row level security;
alter table cities                disable row level security;
alter table venues                disable row level security;
alter table venue_members         disable row level security;
alter table courts                disable row level security;
alter table venue_business_hours  disable row level security;
alter table court_business_hours  disable row level security;
alter table court_date_exceptions disable row level security;
alter table court_recurring_blocks disable row level security;
