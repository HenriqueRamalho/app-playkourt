<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Contexto do projeto 
MicroSaaS para locação de quadras esportivas. Proprietários cadastram venues e quadras, configuram disponibilidade e preços. Clientes pesquisam por espaço, reservam horários e efetuam pagamento — com suporte a cobranças avulsas por hora ou recorrentes via mensalidade.

Stack: Next.js + Neon (Postgres serverless) + Drizzle ORM + Better Auth.
Usamos clean architecture, por isso a regra de negócio nunca depende do banco (sem RLS policies, sem ENUMs no banco — enums ficam no código).

## Banco / ORM
- Postgres gerenciado pelo Neon, acessado via `postgres.js` + Drizzle.
- Migrations SQL vivem em `drizzle/migrations/` e são aplicadas via `npm run db:migrate`.
- Sem RLS. Autorização fica no código (ver `src/infrastructure/middlewares/auth.middleware.ts` e `VenueAccessService`).

## Autenticação
- Better Auth com adapter Drizzle. Config em `src/infrastructure/auth/better-auth.server.ts`.
- Handler catch-all em `src/app/api/auth/[...all]/route.ts`.
- Cliente em `src/infrastructure/auth/better-auth.client.ts` (`authClient.signIn/signUp/useSession/...`).
- Opcional: `AUTH_COOKIE_DOMAIN` (ex.: `.playkourt.com`) para **sessão compartilhada entre subdomínios** — útil se no futuro o deploy separar `admin.` / `go.` / `backoffice.` no mesmo site; com **um único host** e rotas `/admin`, `/go`, `/backoffice`, o cookie de sessão já cobre todo o domínio sem isso.
- APIs internas leem sessão por cookie via `AuthService.getUserFromRequest(req)` — não use Bearer tokens.

## URLs de acesso

O produto é servido em **um mesmo domínio** com **prefixos de rota** (não usamos subdomínios `admin.` / `go.` / `backoffice.` no Next.js — isso complicava deploy e roteamento).

| Caminho | Uso |
|---------|-----|
| `/` | Marketing / landing |
| `/admin` | Dono da quadra — venues, quadras, disponibilidade, preços |
| `/go` | Cliente final — buscar quadras, reservar, pagar, gerenciar reservas |
| `/backoffice` | Equipe interna — operação do app (ex.: listagem de usuários) |

Login e sessão usam as rotas `/auth/*` no mesmo host. Se no futuro houver subdomínios, `AUTH_COOKIE_DOMAIN` permite manter uma sessão compartilhada entre eles (ver seção Autenticação).


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
