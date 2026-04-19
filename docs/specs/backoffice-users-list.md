# Spec: Listagem de usuários no Backoffice

**Tipo:** feature  
**Abordagem:** spec driven development (SDD)  
**Rota alvo:** `/backoffice/users`  
**Stack de referência:** Next.js (App Router), Better Auth, Drizzle, Neon Postgres, clean architecture  
**Status:** implementado no MVP — listagem, busca e paginação entregues; fluxos que **gravam** banimento seguem fora desta spec (ver §3.2).

---

## 1. Objetivo

Permitir que a equipe interna da plataforma **pesquise e visualize usuários** cadastrados (tabela `user` do Better Auth), com filtros por identificação e uma tabela legível com dados operacionais (cadastro, último acesso, **se o usuário está banido do sistema ou não**).

O estado **banido** é o mesmo conceito usado no produto quando:

1. **Exclusão solicitada pelo usuário** — após o fluxo de pedido de exclusão (e regras de carência/confirmação, se houver), a conta deixa de poder usar o sistema (tratada como banida / impedida de login conforme política de dados).
2. **Bloqueio pelo staff/backoffice** — a equipe precisa impedir o uso da plataforma por motivo operacional, segurança ou política.

A listagem **reflete** esse estado; os fluxos que **gravam** banimento (self-service de exclusão, tela/ação de banir no backoffice, jobs) serão entregues em features adjacentes, compartilhando o mesmo modelo de dados descrito em §4.2.

---

## 2. Persona e permissões

| Ator | Acesso |
|------|--------|
| Equipe do backoffice (área `/backoffice` no mesmo domínio da aplicação) | Pode acessar `/backoffice/users`, pesquisar e listar usuários |

**Requisito de segurança (implementado):**

- A rota `/backoffice/*` exige autenticação **e** autorização explícita de staff. Usuário não logado é redirecionado para `/auth/login`; usuário logado fora da allowlist é redirecionado para `/`.
- A API `/api/backoffice/users` responde **401** sem sessão e **403** para sessão autenticada fora da allowlist — nunca vaza dados de usuários em endpoint público.
- **Quem é staff (decisão fechada):** allowlist **hardcoded** em código via `BackofficeAccessService` (`src/infrastructure/services/backoffice-access.service.ts`). Emails atuais:
  - `hrd.ramalho@gmail.com`
  - `adrianadossantosnayara@gmail.com`
  - Comparação case-insensitive. Mudanças na lista requerem deploy. Quando a lista crescer, trocar a implementação do service (env var ou tabela `staff_users`) sem alterar os consumidores.

---

## 3. Escopo funcional

### 3.1 Entregue (MVP)

1. **Página** em `/backoffice/users` (`src/app/backoffice/users/page.tsx`) com:
   - **Formulário de pesquisa** com campos opcionais (combináveis):
     - **ID** — UUID **exato** (validado por regex antes de ir ao banco).
     - **Email** — match parcial `ILIKE '%termo%'`, case-insensitive, trim e limite de 255 chars.
     - **Nome** — match parcial `ILIKE '%termo%'`, case-insensitive, mesmo limite.
     - **Status** — `Todos` / `Ativos` / `Banidos` (filtra coluna `banned`).
   - **Tabela** com colunas:
     | Coluna | Fonte |
     |--------|-------|
     | ID | `user.id` (exibido truncado com tooltip do UUID completo) |
     | Nome | `user.name` |
     | Email | `user.email` (+ badge “verificado” quando `email_verified = true`) |
     | Status | Ativo / Banido / Exclusão solicitada / Bloqueado (ver §4.2) |
     | Cadastro | `user.created_at` formatado `dd/MM/yyyy HH:mm` |
     | Último acesso | ver §4.1 (ou `—` quando `null`) |
   - **Paginação** offset/limit com botões Anterior/Próxima; default `pageSize = 20`, máximo `100`.
   - **Estado vazio:** “Nenhum usuário encontrado.”
   - **Loading:** linha “Carregando...” no corpo da tabela; **erro:** banner vermelho com mensagem do servidor.

2. **API interna** `GET /api/backoffice/users`:
   - Valida query params (UUID, limites de string, tipos numéricos, boolean).
   - Aplica filtros via Drizzle, sem carregar a tabela inteira.
   - Protegida por `withBackofficeAccess` (autenticação + allowlist).
   - Retorna DTO estável documentado em §6.

### 3.2 Fora do escopo (MVP)

- Edição de perfil, **ações** de banir/desbanir/processar exclusão nesta tela, reset de senha pelo staff (a coluna **mostra** o estado; fluxos que alteram `banned` são features separadas).
- Implementação dos fluxos de **pedido de exclusão pelo usuário** e de **banimento operacional pelo staff** — esta spec define a **semântica** do campo e a exibição na listagem; telas/APIs que gravam esses estados devem alinhar ao modelo de §4.2.
- **Hook de login** bloqueando usuários banidos — as colunas estão no schema mas o Better Auth ainda não valida `banned` no `signIn`. Entra junto com a feature que grava o estado.
- “Logar como usuário” (impersonation).
- Exportação CSV/Excel.
- Auditoria persistida (log em tabela) de quem consultou quem — desejável em fase 2.
- Rate limiting por staff/IP — fase 2.

---

## 4. Modelo de dados e colunas “Status” e “Último acesso”

### 4.1 Último acesso (regra escolhida)

**Definição implementada:** `lastSeenAt = MAX(session.updated_at)` por `user_id`, calculada via subquery agregada no repositório Drizzle (`drizzle-backoffice-user.repository.ts`).

- Se o usuário **nunca logou** ou não há sessões retidas, `lastSeenAt` é `null` e a UI exibe `—`.
- O driver `postgres.js` devolve `MAX(...)` de um subquery aliasado como **string**; o repositório converte para `Date` antes de retornar (método `toDate`). O DTO final expõe `lastSeenAt` como ISO-8601.

### 4.2 Banimento (coluna “Status” na UI)

**Significado:** a coluna representa se o usuário está **banido do sistema** — ou seja, **não pode autenticar nem usar a aplicação** até existir desbanimento explícito. A listagem **reflete** o flag; quem o escreve é outra feature.

**Origens de negócio (mesmo estado “não pode usar o sistema”):**

| Origem | Descrição |
|--------|-----------|
| **Pedido de exclusão** | O usuário solicita sair da plataforma; após o processamento previsto, a conta fica **impedida de uso**, modelada como banimento. |
| **Bloqueio pelo staff** | Alguém autorizado no backoffice aplica bloqueio (fraude, termos de uso, suporte). Mesmo conceito de banimento no armazenamento. |

**Abordagem escolhida para persistência (decisão fechada):** **colunas próprias no schema Drizzle**, sem depender do plugin do Better Auth nesta entrega. Migração `0007_user_ban_fields.sql` adiciona em `user`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `banned` | `boolean NOT NULL DEFAULT false` | Flag de banimento. |
| `ban_reason` | `text NULL` | Motivo livre (auditoria/suporte). |
| `ban_source` | `text NULL` | Enum no código: `user_requested_deletion` \| `staff` \| `other`. |
| `banned_at` | `timestamptz NULL` | Quando o banimento entrou em vigor. |

O enum vive em **código** (`src/domain/user/entity/ban-source.ts`), não no banco, alinhado à regra do projeto (sem ENUMs no Postgres). O repositório normaliza valores desconhecidos para `BanSource.OTHER` ao ler.

**Por que não o plugin do Better Auth agora:**
- Minimiza acoplamento com a versão do BA usada hoje.
- O hook de login que bloqueia `banned` ainda não é necessário porque **nada grava `true` nessa coluna no MVP**.
- Quando o fluxo de ban/self-delete for implementado, a decisão do plugin pode ser reavaliada — o schema atual cobre os campos que o plugin do BA usa por convenção (`banned`, `ban_reason`), facilitando migração.

**Regra explícita:** **não** derivar status “apenas de sessão” (ex.: sem sessão ativa = inativo) — isso confunde “sumiu” com “bloqueado”.

**Labels na UI:**

| Estado | Label exibido |
|--------|---------------|
| `banned = false` | **Ativo** (badge verde) |
| `banned = true` + `ban_source = user_requested_deletion` | **Exclusão solicitada** (badge vermelho) |
| `banned = true` + `ban_source = staff` | **Bloqueado** (badge vermelho) |
| `banned = true` + `ban_source` `null` ou `other` | **Banido** (badge vermelho) |

---

## 5. Sugestões úteis no contexto Playkourt (pós-MVP)

Estas colunas ou filtros costumam ajudar suporte e operações; podem entrar como **fase 2** se couber:

| Ideia | Por quê |
|-------|---------|
| **Motivo / data do banimento visíveis na tabela** | Já temos `ban_reason`, `banned_at`, `ban_source` no backend; expor na UI (coluna extra ou detalhe) depende do fluxo de escrita estar rodando. |
| **Provedores de login** | Agregar a partir de `account.provider_id` (ex.: `credential` vs `google`) — útil para debug de OAuth. |
| **Papel no produto** | Contagens ou badges: *dono de venue* (`venues.owner_id`), *membro de venue* (`venue_members`) — ajuda a priorizar suporte sem abrir outras telas. |
| **Data de última atualização de perfil** | `user.updated_at` — distingue “último login” de “última mudança de nome/email”. |
| **Ordenação configurável** | MVP ordena fixo por `created_at DESC, id ASC`; adicionar `sort=lastSeen_desc` etc. quando necessário. |
| **Rate limiting** | Na API de busca, limitar requisições por IP/usuário staff — evita abuso e scan de base. |
| **Busca por domínio de email** | Já suportado pelo `ILIKE`, mas poderia ganhar filtro dedicado (ex.: `emailDomain=empresa.com`). |
| **Staff via env/tabela** | Substituir allowlist hardcoded por env var ou tabela `staff_users` quando o time crescer. |
| **Hook de login** | Quando o fluxo de ban for gravar `true`, adicionar validação no `signIn` (plugin do BA ou callback próprio) para derrubar sessões e bloquear novos logins. |

---

## 6. Contrato da API (implementado)

### 6.1 Request

`GET /api/backoffice/users`

Headers: cookie de sessão do Better Auth (não aceita Bearer).

Query params (todos opcionais):

| Param | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `id` | string | UUID v4 exato (regex) | Igualdade. Valor inválido → `400`. |
| `email` | string | trim, ≤ 255 chars | Substring `ILIKE '%termo%'`, case-insensitive. |
| `name` | string | trim, ≤ 255 chars | Substring `ILIKE '%termo%'`, case-insensitive. |
| `banned` | `"true"` \| `"false"` | — | Filtra só banidos ou só não banidos. Outro valor → `400`. |
| `page` | number | inteiro ≥ 1, default `1` | Valor inválido não numérico → `400`. |
| `pageSize` | number | inteiro ≥ 1, default `20`, máx `100` | Acima de `100` é **clampado** para `100`. |

Ordenação é fixa no MVP: `created_at DESC, id ASC`.

### 6.2 Response

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "banned": false,
      "banReason": "string | null",
      "banSource": "user_requested_deletion | staff | other | null",
      "bannedAt": "ISO-8601 | null",
      "emailVerified": true,
      "createdAt": "ISO-8601",
      "lastSeenAt": "ISO-8601 | null"
    }
  ],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

- `total` é contagem **exata** (`count(*)::int`) com os mesmos filtros. Em bases muito grandes, considerar aproximação em fase 2.
- Status HTTP: `200` OK, `400` param inválido, `401` sem sessão, `403` sessão fora da allowlist, `500` erro inesperado.

---

## 7. Camada de código (clean architecture)

| Camada | Artefato | Caminho |
|--------|----------|---------|
| **Domain** | Enum `BanSource` | `src/domain/user/entity/ban-source.ts` |
| **Domain** | Port `BackofficeUserRepositoryInterface` + DTOs de leitura (`BackofficeUserListItem`, `ListBackofficeUsersCriteria`, `ListBackofficeUsersResult`) | `src/domain/user/repository/backoffice-user-repository.interface.ts` |
| **Application** | Use case `ListUsersForBackofficeUseCase` (valida input, sem HTTP) | `src/application/use-cases/backoffice/ListUsersForBackofficeUseCase.ts` |
| **Infrastructure** | Repositório Drizzle (join agregado em `session` para `lastSeenAt`) | `src/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository.ts` |
| **Infrastructure** | Authorization service (allowlist) | `src/infrastructure/services/backoffice-access.service.ts` |
| **Infrastructure** | Middleware `withBackofficeAccess` | `src/infrastructure/middlewares/auth.middleware.ts` |
| **Interface (HTTP)** | Controller (parse de query params + DTO de saída) | `src/infrastructure/controllers/backoffice.controller.ts` |
| **Interface (HTTP)** | Route handler | `src/app/api/backoffice/users/route.ts` |
| **Interface (UI)** | Layout `/backoffice/*` com guard server-side (redirects) | `src/app/backoffice/layout.tsx` |
| **Interface (UI)** | Página client-side com filtros, tabela e paginação | `src/app/backoffice/users/page.tsx` |

Convenção seguida: read models / filtros ficam no **mesmo arquivo do port do repositório** (padrão de `court-repository.interface.ts`), e não em `entity/`. `entity/` é reservado para vocabulário do domínio (entidades, value objects, enums como `BanSource`).

---

## 8. Critérios de aceite

1. ✅ Com usuários no banco, acessar `/backoffice/users` mostra tabela paginada.
2. ✅ Filtrar por email parcial retorna apenas correspondentes (`ILIKE '%termo%'`, case-insensitive).
3. ✅ Coluna “Último acesso” reflete `MAX(session.updated_at)`; vazio quando `null`.
4. ✅ Coluna de status está alinhada a §4.2: `banned = false` → Ativo; `true` → rótulo conforme `ban_source`.
5. ✅ Usuário **não** autenticado é redirecionado para `/auth/login`; autenticado fora da allowlist é redirecionado para `/`. API devolve `401`/`403` respectivamente.
6. ✅ Nenhuma rota pública expõe a listagem completa (o endpoint está sob `/api/backoffice/*` e protegido pelo middleware).

---

## 9. Decisões fechadas

- [x] **Staff/backoffice:** allowlist de emails hardcoded em `BackofficeAccessService` (§2).
- [x] **Modelo de banimento:** colunas Drizzle próprias (`banned`, `ban_reason`, `ban_source`, `banned_at`); `BanSource` enum em código; plugin do Better Auth adiado até a feature de escrita chegar (§4.2).
- [x] **UUID:** busca **exata** (regex antes do banco).
- [x] **Email:** **contém** (`ILIKE`). Mitigação de scan de base fica para fase 2 (rate limiting).

Itens que permanecem pendentes são feature-adjacentes e estão listados em §3.2 (fluxos de escrita de ban, hook de login etc.) e §5 (melhorias pós-MVP).

---

## 10. Referências no repositório

- **Schema:** `src/infrastructure/database/drizzle/schema/auth.ts`
- **Migração:** `drizzle/migrations/0007_user_ban_fields.sql`
- **Layout do backoffice (guard server-side):** `src/app/backoffice/layout.tsx`
- **Página:** `src/app/backoffice/users/page.tsx`
- **API:** `src/app/api/backoffice/users/route.ts`
- **Middleware:** `src/infrastructure/middlewares/auth.middleware.ts` (`withBackofficeAccess`)
- **Authorization service:** `src/infrastructure/services/backoffice-access.service.ts`
- **Controller:** `src/infrastructure/controllers/backoffice.controller.ts`
- **Use case:** `src/application/use-cases/backoffice/ListUsersForBackofficeUseCase.ts`
- **Repositório:** `src/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository.ts`
- **Port + DTOs:** `src/domain/user/repository/backoffice-user-repository.interface.ts`
- **Enum de domínio:** `src/domain/user/entity/ban-source.ts`

---

*Documento atualizado após a implementação do MVP. Manter esta seção sincronizada quando os fluxos de escrita de banimento forem entregues.*
