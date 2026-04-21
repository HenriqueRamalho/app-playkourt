# Playkourt

Plataforma de gestão para locação de quadras esportivas, construída com Next.js, TypeScript e Tailwind CSS.

## Pré-requisitos

- Node.js 18+
- Banco Postgres (recomendado [Neon](https://neon.com) em produção; qualquer Postgres 14+ local funciona)

## Configuração

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

BETTER_AUTH_SECRET=<gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
BETTER_AUTH_URL=https://localplaykourt.com:3000
NEXT_PUBLIC_BETTER_AUTH_URL=https://localplaykourt.com:3000

# Opcional — se no futuro você servir o app em subdomínios (admin./go./backoffice.),
# use para compartilhar o cookie de sessão entre eles. Com um único host e rotas
# /admin, /go, /backoffice, em geral não é necessário.
# AUTH_COOKIE_DOMAIN=.playkourt.com

# Opcional — habilita login com Google
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

### 3. Primeira carga do banco (aplicar migrations existentes)

O projeto usa **Drizzle ORM** com migrations versionadas em `drizzle/migrations/`. O script `db:migrate` roda `scripts/migrate.ts`, que aplica **apenas** o que ainda não consta em `drizzle.__drizzle_migrations` no Postgres apontado por `DATABASE_URL`.

```bash
npm run db:migrate
```

Para apontar para outro banco (ex.: Neon de staging) sem alterar o `.env.local`:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate
```

### 4. Fluxo para **atualizar** o banco (schema → migration → banco)

Alterações de schema devem nascer do **TypeScript** em `src/infrastructure/database/drizzle/schema/`, e o Drizzle gera o SQL e mantém o histórico em `drizzle/migrations/meta/` (`_journal.json` + `*_snapshot.json`). **Não** crie só um arquivo `.sql` manual na pasta de migrations sem esse meta — o `generate` e o `migrate` ficam inconsistentes.

1. **Edite** as tabelas/colunas/índices no schema Drizzle (`src/infrastructure/database/drizzle/schema/`).
2. **Gere** a migration a partir do diff entre o schema atual e o último snapshot:

   ```bash
   npm run db:generate
   ```

   (equivale a `drizzle-kit generate` usando `drizzle.config.ts`, que lê `.env.local` para credenciais quando necessário.)

3. **Revise** o arquivo novo em `drizzle/migrations/` (nome tipo `0009_nome_descritivo.sql`) e confira se o SQL reflete o que você quer (especialmente drops e dados sensíveis).
4. **Aplique** no banco:

   ```bash
   npm run db:migrate
   ```

Se o `generate` responder que não há mudanças, o schema TypeScript já está alinhado com o último snapshot em `drizzle/migrations/meta/`.

**Arquivos importantes**

| Caminho | Função |
|---------|--------|
| `drizzle.config.ts` | Onde o Drizzle encontra o schema (`schema`) e onde grava migrations (`out`) |
| `drizzle/migrations/*.sql` | SQL executado na ordem do journal |
| `drizzle/migrations/meta/_journal.json` | Lista ordenada das migrations conhecidas pelo kit |
| `drizzle/migrations/meta/*_snapshot.json` | Estado do schema após cada migration — base do próximo `generate` |
| `scripts/migrate.ts` | Aplica migrations na pasta `drizzle/migrations` via `DATABASE_URL` |

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [https://localplaykourt.com:3000](https://localplaykourt.com:3000).

> Para HTTPS local com domínio customizado, o projeto usa `mkcert`. Veja a seção **Local HTTPS** abaixo.

## Emails (React Email)

Templates transacionais em **React** são gerados com [`@react-email/render`](https://react.email/docs/utilities/render) e componentes de [`@react-email/components`](https://react.email/docs/components/html).

- **Templates**: `src/infrastructure/services/email/react-email/templates/` (cada arquivo exporta um componente; use `export default` para o preview).
- **Layout compartilhado**: `src/infrastructure/services/email/react-email/email-layout.tsx`
- **Render para o caso de uso**: `src/infrastructure/services/email/react-email/render-booking-emails.tsx` (chama `render()` e devolve `html` + `text` em plain text).

Para abrir o **preview** local (porta **3001**, para não conflitar com o Next em 3000). O pacote `react-email` expõe o CLI como o comando **`email`** (não `react-email`):

```bash
npm run email:dev
```

Para configurar as variáveis de ambiente para envio de email verifique o arquivo `docs/specs/backoffice-processed-emails.md`. A ideia inicial é usar resend e posteriormente migrar para SES da Aws.

## Local HTTPS (mkcert)

1. Instale o mkcert:
   ```bash
   brew install mkcert
   mkcert -install
   ```

2. Gere os certificados na raiz do projeto:
   ```bash
   mkdir -p certificates
   mkcert -key-file certificates/local-key.pem -cert-file certificates/local-cert.pem \
     localplaykourt.com "*.localplaykourt.com"
   ```

3. Adicione ao `/etc/hosts`:
   ```
   127.0.0.1   localplaykourt.com
   ```

4. Rode o servidor:
   ```bash
   npm run dev
   ```

5. Acesse [https://localplaykourt.com:3000](https://localplaykourt.com:3000).

## Rotas da aplicação

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/auth/login` | Login |
| `/auth/register` | Cadastro |
| `/go` | Área do jogador — explorar quadras |
| `/go/reservations` | Minhas reservas |
| `/go/profile` | Perfil do jogador |
| `/admin` | Área do gestor de venues |
| `/admin/venues` | Gerenciar venues |
| `/accounts/profile` | Dados pessoais da conta |
| `/backoffice` | Painel administrativo da plataforma |

## Estrutura do projeto

```
src/
├── app/                  # Rotas e páginas (Next.js App Router)
│   ├── (main)/           # Rotas públicas com Navbar
│   ├── api/              # API Routes
│   │   └── auth/[...all] # Catch-all do Better Auth
│   ├── auth/             # Login e registro
│   ├── go/               # Área do jogador
│   ├── admin/            # Área do gestor de venues
│   ├── accounts/         # Gestão de dados pessoais
│   └── backoffice/       # Painel administrativo
├── application/          # Casos de uso
├── domain/               # Entidades e interfaces de repositório
├── infrastructure/       # Repositórios, controllers, serviços e middlewares
│   ├── auth/             # Config do Better Auth (server + client)
│   ├── database/drizzle/ # Schema e client do Drizzle ORM
│   └── services/email/   # Envio de email + templates React Email (`react-email/`)
└── components/           # Componentes compartilhados
```

## Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de dados**: Postgres (Neon) + Drizzle ORM
- **Autenticação**: Better Auth
- **Emails transacionais**: React Email (`@react-email/components` + `@react-email/render`)
