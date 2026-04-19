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

### 3. Aplique as migrations

```bash
npm run db:migrate
```

Para gerar novas migrations após alterar o schema Drizzle:

```bash
npm run db:generate
```

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [https://localplaykourt.com:3000](https://localplaykourt.com:3000).

> Para HTTPS local com domínio customizado, o projeto usa `mkcert`. Veja a seção **Local HTTPS** abaixo.

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
│   └── database/drizzle/ # Schema e client do Drizzle ORM
└── components/           # Componentes compartilhados
```

## Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de dados**: Postgres (Neon) + Drizzle ORM
- **Autenticação**: Better Auth
