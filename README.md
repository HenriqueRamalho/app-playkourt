# Playkourt

Plataforma de gestão para locação de quadras esportivas, construída com Next.js, TypeScript e Tailwind CSS.

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

## Configuração

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configure o banco de dados

Execute as migrations disponíveis em `supabase/migrations/` no seu projeto Supabase:

```bash
supabase db push
```

### 5. Ative o Data API no Supabase ⚠️

Este projeto utiliza o cliente JavaScript do Supabase (`@supabase/supabase-js`) para consultar o banco de dados. Esse cliente depende do **Data API (PostgREST)**, que precisa estar habilitado no projeto.

Sem essa configuração, todas as queries retornarão erro silenciosamente ou falharão sem mensagem clara.

**Como ativar:**

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione o seu projeto
3. Vá em **Settings → API**
4. Na seção **Data API**, certifique-se de que a opção está **habilitada**
5. Em **Exposed schemas**, confirme que o schema `public` está listado

### 6. Inicie o servidor de desenvolvimento

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

## Estrutura do projeto

```
src/
├── app/                  # Rotas e páginas (Next.js App Router)
│   ├── api/              # API Routes
│   ├── auth/             # Login, registro e callback OAuth
│   └── venue/            # Gestão de venues e quadras
├── application/          # Casos de uso
├── domain/               # Entidades e interfaces de repositório
├── infrastructure/       # Repositórios, controllers, serviços e middlewares
└── components/           # Componentes compartilhados
```

## Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
