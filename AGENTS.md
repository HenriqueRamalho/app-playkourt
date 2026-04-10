<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Contexto do projeto 
MicroSaaS para locação de quadras esportivas. Proprietários cadastram venues e quadras, configuram disponibilidade e preços. Clientes pesquisam por espaço, reservam horários e efetuam pagamento — com suporte a cobranças avulsas por hora ou recorrentes via mensalidade.

Esse projeto é um microsaas usando nextjs e supabase.
O projeto usa supabase mas é desajado evitar um acoplamento forte, por isso não são utilizadas as policies do banco do supabase.
Usamos clean architecture. 


## URLs de acesso

### domain.com
Onde será feito o marketing do aplicativo

### admin.domain.com
Onde o dono da quadra acessa para administrar o negócio dele

### go.domain.com
Onde o cliente final interessado em reservar uma quadra acessa para gerenciar suas reservas (criando, pagando, editando etc).

### backoffice.domain.com
Onde eu e meu time acessamos para administrar o nosso app. É o nosso backoffice onde podemos fazer login na conta dos usuários, ver os últimos usuário cadastros, pesquisar por um usuário etc.


## entidades do sistema

### venue
Representa o local onde as quadras estão localizadas (courts), ou seja, é aquela unidade que agrupa várias quadras e as oferece para locação. Um venue é criado por um dono de quadra.

  - id uuid
  - owner_id uuid 
  - name text not null,
  - cnpj text,
  - phone text,
  - street text,
  - number text,
  - complement text,
  - neighborhood text,
  - city text not null,
  - state char(2) not null,
  - zip_code text,
  - latitude numeric(9,6),
  - longitude numeric(9,6),
  - is_active boolean default true,
  - created_at timestamptz default now()

 ### venue_members

  - id uuid
  - venue_id uuid references venues(id) on delete cascade,
  - user_id uuid 
  - role text (vou guardar isso em um enum no meu código)
  - created_at timestamptz default now(),
  - unique(venue_id, user_id)  -- evita duplicata

  ## court

 - id uuid 
 - venue_id 
 - name text not null,
 - sport_type text not null (esse aqui será um enum no meu código)
 - description text,
 - price_per_hour numeric(10,2) not null,
 - is_active boolean default true
 - created_at timestamptz default now()


<!-- END:nextjs-agent-rules -->
