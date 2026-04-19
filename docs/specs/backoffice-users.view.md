# Spec: Visualização de usuário no Backoffice

**Tipo:** feature  
**Abordagem:** spec driven development (SDD)  
**Rota alvo:** `/backoffice/users/:id`  
**Stack de referência:** Next.js (App Router), Better Auth, Drizzle, Neon Postgres, clean architecture  
**Status:** design — não implementado.  
**Spec irmã:** `docs/specs/backoffice-users-list.md` (listagem, já implementada — esta spec é acessada clicando em um usuário daquela tabela).

---

## 1. Objetivo

Permitir que a equipe interna **abra a ficha de um usuário específico** e visualize, em um só lugar, dados operacionais úteis para suporte e auditoria: identidade, estado de banimento, provedores de login, **resumo** de atividade (venues criadas, reservas, pagamentos) e atalhos para ações sensíveis (banir, revogar sessões, logar como).

Esta página é **somente leitura**; os fluxos que **gravam** mudança de estado (banir/desbanir, logar como, revogar sessão) são referenciados mas vivem em specs próprias (ver §3.2). Isso mantém esta entrega focada e evita acoplamento com features sensíveis que merecem design dedicado.

---

## 2. Persona e permissões

| Ator | Acesso |
|------|--------|
| Equipe do backoffice (allowlist em `BackofficeAccessService`) | Pode acessar `/backoffice/users/:id` e todas as APIs `/api/backoffice/users/:id/*` |

Mesma política de autorização da listagem:

- Layout `/backoffice/*` já protege a UI (redireciona para `/auth/login` quando não logado e para `/` quando fora da allowlist).
- Todas as novas rotas da API serão protegidas pelo middleware `withBackofficeAccess` (401 sem sessão, 403 sem allowlist).
- Cobrança extra de auditoria: acessos a ficha de usuário são **candidatos a log** (fase 2, ver §5).

---

## 3. Escopo funcional

### 3.1 Incluído (MVP)

**Página** `src/app/backoffice/users/[id]/page.tsx` organizada em **cabeçalho + abas**. O cabeçalho e uma seção "Visão geral" são carregados já no primeiro render; as demais abas só disparam `fetch` quando abertas (economiza banco e banda).

#### 3.1.1 Cabeçalho (sempre visível, carregado junto com o overview)

| Bloco | Campos |
|-------|--------|
| **Identidade** | ID (UUID completo, com copy), nome, email (+ badge "verificado" se `email_verified`), imagem/avatar |
| **Datas** | Cadastro (`user.created_at`), última atualização de perfil (`user.updated_at`), último acesso (`MAX(session.updated_at)`) |
| **Status de banimento** | Badge igual à listagem (Ativo / Banido / Exclusão solicitada / Bloqueado) + `ban_reason` e `banned_at` quando aplicável |
| **Provedores de login** | Lista distinta de `account.provider_id` (ex.: `credential`, `google`) — útil para debug de OAuth |
| **Papel no produto** | Duas contagens simples: `ownerVenuesCount` (venues onde o usuário é `owner_id`) e `memberVenuesCount` (via `venue_members`). Badges clicáveis que abrem a aba "Venues". |
| **Métricas resumo** | Totais agregados: venues, reservas, pagamentos (quando a feature existir). São `COUNT(*)` baratos e **não** carregam detalhes. |

#### 3.1.2 Barra de ações (somente UI nesta spec)

Botões sempre visíveis no topo da página. Cada um **aciona** um endpoint de feature adjacente (spec separada); esta spec **não implementa** a gravação:

| Botão | Estado de habilitação | Comportamento (nesta spec) |
|-------|----------------------|---------------------------|
| **Banir / Desbanir** | Muda o label conforme `banned` | Abre modal de confirmação → chama API da spec de banimento (fora deste escopo) |
| **Deslogar de todos os dispositivos** | Sempre habilitado | Confirmação → chama API de revogação de sessões (fora deste escopo) |
| **Logar como (impersonate)** | Desabilitado se o alvo é também staff da allowlist | Fluxo de impersonation com auditoria e banner global — spec própria |
| **Reenviar verificação de email** *(sugerido)* | Só se `email_verified = false` | Chama API de reenvio — fora deste escopo |

No MVP desta view os botões são renderizados e **ficam desabilitados** (ou abrem um modal com mensagem "funcionalidade em desenvolvimento") até que as specs adjacentes existam. Isso garante que o design da tela já comporta as ações.

#### 3.1.3 Abas com lazy load

Cada aba só faz `fetch` na primeira vez que é aberta; o resultado é cacheado no estado da página até navegar para fora.

| Aba | O que mostra | Endpoint |
|-----|-------------|----------|
| **Visão geral** | Já vem carregada com o cabeçalho; reforça as métricas resumo e mostra atividade recente (últimas 5 reservas, última sessão ativa) | `GET /api/backoffice/users/:id` |
| **Venues** | Tabela compacta: venues onde o usuário é `owner` ou `member` (com coluna "papel"), nome, cidade/UF, ativo | `GET /api/backoffice/users/:id/venues` |
| **Reservas** | Tabela paginada: data, hora, quadra, venue, status, valor (quando a feature suportar). Filtros opcionais: status, range de data | `GET /api/backoffice/users/:id/bookings` |
| **Pagamentos** | **Placeholder**: aba visível com mensagem "Em breve — aguardando feature de pagamentos". Sem endpoint nesta entrega. | (não aplicável no MVP) |
| **Sessões ativas** | Tabela: IP, user-agent, criada em, expira em. Coluna "ação" com botão "Revogar" por linha (apenas UI; chamada a endpoint de revogação fica em spec adjacente) | `GET /api/backoffice/users/:id/sessions` |

#### 3.1.4 API interna (quatro novos endpoints)

Todos protegidos por `withBackofficeAccess` e retornam `404` quando o usuário `:id` não existir.

1. `GET /api/backoffice/users/:id` — overview (cabeçalho + métricas resumo + últimos itens).
2. `GET /api/backoffice/users/:id/venues` — venues como owner e como member.
3. `GET /api/backoffice/users/:id/bookings` — reservas do usuário, paginadas, com filtros.
4. `GET /api/backoffice/users/:id/sessions` — sessões **ativas** (`expires_at > now()`).

Detalhes de request/response em §6.

### 3.2 Fora do escopo (MVP)

Estes itens **aparecem na UI** (botões, banners) mas a **implementação** vive em specs próprias, a serem criadas:

- **Banir / desbanir usuário** — modelo já existe (`banned`, `ban_reason`, `ban_source`, `banned_at`), falta o endpoint que grava + revogação de sessões + auditoria. Spec futura: `docs/specs/backoffice-user-ban.md`.
- **Deslogar de todos os dispositivos** — endpoint `DELETE /api/backoffice/users/:id/sessions` que apaga todas as sessões ativas do alvo. Spec futura: `docs/specs/backoffice-user-revoke-sessions.md`.
- **Revogar uma sessão específica** — endpoint por `session_id`. Pode sair junto com a spec de revogação acima.
- **Logar como (impersonate)** — requer plugin admin do Better Auth ou equivalente, banner global durante a sessão impersonada, auditoria em tabela dedicada, timeout curto, proibição de impersonar outro staff. Spec futura: `docs/specs/backoffice-user-impersonate.md`.
- **Reenviar verificação de email** — endpoint que dispara o fluxo do Better Auth. Spec menor, pode sair em lote com as outras.
- **Pagamentos** — a feature de pagamentos **não existe** no projeto ainda. Aba aparece como placeholder. Quando existir, adicionar `GET /api/backoffice/users/:id/payments` + aba correspondente (pode ser um update nesta spec).
- **Notas internas do staff** — nova tabela `staff_user_notes` (user_id, author_id, text, created_at) para registrar observações append-only. Fase 2 ou spec própria.
- **Auditoria persistida** de ações do staff (quem baniu quem, quem impersonou quem) — tabela `user_audit_events`. Fase 2.
- **Exportação de dados** do usuário (LGPD) — fora do escopo desta view.

---

## 4. Modelo de dados e queries

Todas as tabelas envolvidas já existem no schema atual; esta spec **não adiciona migração**.

### 4.1 Tabelas consultadas

| Tabela | Uso |
|--------|-----|
| `user` | identidade, banimento, cadastro |
| `session` | `lastSeenAt` (subquery `MAX(updated_at)`) + listagem de sessões ativas |
| `account` | `provider_id` distintos |
| `venues` | venues onde `owner_id = :id` |
| `venue_members` | venues onde o usuário é member (+ role) |
| `bookings` | reservas do usuário |

### 4.2 Regras importantes

1. **Último acesso** — mesma regra da listagem: `MAX(session.updated_at)`. Se null, UI mostra `—`.
2. **Sessões ativas** — `session.expires_at > now()`. Ordenar por `updated_at DESC`. Limitar a um teto (ex.: 50 sessões) por segurança — na prática raro ter muito mais.
3. **Provedores distintos** — `SELECT DISTINCT provider_id FROM account WHERE user_id = :id`.
4. **Contagens resumo** (owner/member/bookings) — cada uma é um `COUNT(*)` com `WHERE`, executadas em paralelo no repositório para manter o overview rápido.
5. **Atividade recente no overview** — "últimas 5 reservas" = `SELECT ... FROM bookings WHERE user_id = :id ORDER BY date DESC, start_time DESC LIMIT 5`. Sem paginação aqui — é só um preview.
6. **Pagamentos** — sem query por enquanto; a aba não dispara fetch.

---

## 5. Sugestões úteis no contexto Playkourt (pós-MVP)

| Ideia | Por quê |
|-------|---------|
| **Timeline de auditoria** | Lista cronológica de ações de staff sobre esse usuário (banido por X em Y; sessão revogada por X em Y; impersonado por X por N minutos). Requer `user_audit_events`. |
| **Notas internas append-only** | Observações livres do staff com autor e timestamp. Muito usado em suporte. |
| **Último IP de login** | Já temos `session.ip_address`; mostrar na Visão geral ajuda detectar acesso suspeito. |
| **Histórico de email** | Se existir (tabela `email_changes` hipotética) — útil para recuperação de conta. |
| **Reset de senha pelo staff** | Dispara fluxo do Better Auth; evita pedir ao cliente por um canal inseguro. |
| **Exportação LGPD** | Botão que empacota dados do usuário em JSON/CSV para atender solicitações. |
| **Link direto para reservas do usuário no painel do dono** | Quando suporte precisar cruzar visão do cliente com visão do dono da venue. |
| **Contagem de cancelamentos recentes** | Sinalizador de comportamento — reservas canceladas nos últimos 30 dias. |
| **Rate limit** nas APIs `:id/*` | Evita scan de base por staff com sessão comprometida. |

---

## 6. Contrato da API

Autorização e erros comuns a todos os endpoints:

- Header: cookie de sessão do Better Auth.
- `401` sem sessão, `403` fora da allowlist, `404` se `:id` não existir na tabela `user`, `400` em params inválidos, `500` em erro inesperado.

### 6.1 `GET /api/backoffice/users/:id`

Sem query params.

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "emailVerified": true,
  "image": "string | null",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "lastSeenAt": "ISO-8601 | null",

  "banned": false,
  "banReason": "string | null",
  "banSource": "user_requested_deletion | staff | other | null",
  "bannedAt": "ISO-8601 | null",

  "providers": ["credential", "google"],

  "venuesOwnedCount": 2,
  "venuesMemberCount": 0,
  "bookingsCount": 17,
  "paymentsCount": null,

  "recentBookings": [
    {
      "id": "uuid",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "durationHours": 1.5,
      "status": "pending | confirmed | cancelled | ...",
      "courtName": "string",
      "venueName": "string"
    }
  ],

  "lastActiveSession": {
    "ipAddress": "string | null",
    "userAgent": "string | null",
    "updatedAt": "ISO-8601"
  } 
}
```

- `paymentsCount`: fixo `null` no MVP (feature ainda não existe).
- `recentBookings`: no máximo 5 itens, ordem decrescente.
- `lastActiveSession`: a sessão mais recente com `expires_at > now()`, ou `null`.

### 6.2 `GET /api/backoffice/users/:id/venues`

Sem paginação no MVP (quantidade tende a ser pequena). Retorna **duas listas** para separar os papéis na UI.

```json
{
  "owned": [
    {
      "id": "uuid",
      "name": "string",
      "cityName": "string",
      "stateUf": "SP",
      "isActive": true,
      "createdAt": "ISO-8601"
    }
  ],
  "member": [
    {
      "id": "uuid",
      "name": "string",
      "role": "admin | staff | ...",
      "cityName": "string",
      "stateUf": "SP",
      "isActive": true
    }
  ]
}
```

### 6.3 `GET /api/backoffice/users/:id/bookings`

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `status` | string | — | Filtra por status (ex.: `pending`, `confirmed`, `cancelled`) |
| `from` | `YYYY-MM-DD` | — | Data inicial (>=) |
| `to` | `YYYY-MM-DD` | — | Data final (<=) |
| `page` | number | `1` | ≥ 1 |
| `pageSize` | number | `20`, máx `100` | Clampado em 100 |

Ordenação fixa: `date DESC, start_time DESC, id ASC`.

```json
{
  "data": [
    {
      "id": "uuid",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "durationHours": 1.5,
      "status": "string",
      "courtId": "uuid",
      "courtName": "string",
      "venueId": "uuid",
      "venueName": "string",
      "createdAt": "ISO-8601"
    }
  ],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

Valor pago por reserva **não** entra no MVP; quando a feature de pagamentos existir, adicionar campo `amount`.

### 6.4 `GET /api/backoffice/users/:id/sessions`

Sem query params no MVP — só sessões ativas (`expires_at > now()`).

```json
{
  "data": [
    {
      "id": "string",
      "ipAddress": "string | null",
      "userAgent": "string | null",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601",
      "expiresAt": "ISO-8601"
    }
  ]
}
```

Ordem: `updated_at DESC`. Limite implícito: 50 (hard cap no repositório para evitar surpresa).

### 6.5 Pagamentos — placeholder

Sem endpoint nesta entrega. A UI exibe a aba com texto "Em breve — aguardando feature de pagamentos".

---

## 7. Camada de código (clean architecture)

Seguindo a convenção já estabelecida (read models e filtros dentro do arquivo do port do repositório; enums de domínio em `entity/`):

| Camada | Artefato sugerido | Caminho |
|--------|-------------------|---------|
| **Domain** | Port **novo ou estendido** `BackofficeUserRepositoryInterface` com métodos: `findOverviewById`, `listVenues`, `listBookings`, `listActiveSessions`. DTOs correspondentes (`BackofficeUserOverview`, `BackofficeUserVenueItem`, `BackofficeUserBookingItem`, `BackofficeUserSessionItem`) no mesmo arquivo. | `src/domain/user/repository/backoffice-user-repository.interface.ts` *(estender o existente)* |
| **Application** | Use cases separados por endpoint: `GetBackofficeUserOverviewUseCase`, `ListBackofficeUserVenuesUseCase`, `ListBackofficeUserBookingsUseCase`, `ListBackofficeUserActiveSessionsUseCase`. Validação de params (datas, status, paginação). | `src/application/use-cases/backoffice/` |
| **Infrastructure** | Estender `DrizzleBackofficeUserRepository` com os novos métodos. Reaproveitar a estratégia de subquery já usada para `lastSeenAt` e o helper `toDate`. | `src/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository.ts` |
| **Interface (HTTP)** | Extender `BackofficeController` com novos métodos estáticos (`getUser`, `listVenues`, `listBookings`, `listSessions`). | `src/infrastructure/controllers/backoffice.controller.ts` |
| **Interface (HTTP)** | Novos route handlers: | `src/app/api/backoffice/users/[id]/route.ts`, `.../venues/route.ts`, `.../bookings/route.ts`, `.../sessions/route.ts` |
| **Interface (UI)** | Página do detalhe com abas (client component). Componentes reutilizáveis para cabeçalho, abas, tabelas. | `src/app/backoffice/users/[id]/page.tsx` + componentes auxiliares em `src/app/backoffice/users/[id]/_components/` |

Notas de design:

- **Por que estender o repositório e não criar um novo:** coesão — o mesmo agregado (usuário visto pelo backoffice) já tem seu port. Se o arquivo crescer muito, quebrar em `backoffice-user-read.repository.ts` e `backoffice-user-write.repository.ts` na spec de banimento.
- **Caching cliente:** estado local da página por aba; sem SWR/React Query no MVP para manter a stack mínima. Se a necessidade surgir, trocar depois.
- **Server component vs client component:** o overview **poderia** ser renderizado no servidor (menos código cliente), mas manter a página client torna o padrão consistente com a listagem e simplifica as abas com lazy load. Avaliar migrar para server component só se ganharmos algo claro.

---

## 8. Critérios de aceite

1. Acessar `/backoffice/users/:id` de um usuário existente mostra cabeçalho, resumos e aba "Visão geral" já preenchidos em uma requisição.
2. Clicar em uma aba (Venues/Reservas/Sessões) dispara **uma** requisição e preenche a tabela; abas não abertas **não** fazem fetch.
3. `lastSeenAt`, cabeçalho de banimento e provedores refletem o estado do banco corretamente.
4. Página com `:id` inexistente mostra estado "Usuário não encontrado" (API responde 404; UI converte em mensagem).
5. Usuário **não** autenticado é redirecionado para `/auth/login`; usuário fora da allowlist, para `/`. APIs respondem `401`/`403`.
6. Nenhuma API fora de `/api/backoffice/*` expõe os dados desta view.
7. Aba Pagamentos aparece com placeholder "Em breve" e **não** dispara requisição.
8. Botões de ação (Banir, Deslogar, Logar como) estão presentes na UI e **desabilitados** (ou com modal "em desenvolvimento") enquanto as specs adjacentes não existirem.

---

## 9. Decisões fechadas

- [x] **Pagamentos:** placeholder "em breve" na aba; sem endpoint, sem query ao banco.
- [x] **Escopo:** somente **leitura** nesta spec. Banir, desbanir, revogar sessões, impersonar e reenviar verificação ficam em specs próprias (ver §3.2).
- [x] **Layout:** **abas** (Visão geral | Venues | Reservas | Pagamentos | Sessões), com lazy load por aba.
- [x] **Reutilização de infraestrutura:** estender `BackofficeUserRepositoryInterface` e `DrizzleBackofficeUserRepository` existentes; não criar repositório novo só por causa desta view.
- [x] **Sem migração:** todas as queries usam tabelas que já existem.

---

## 10. Referências no repositório

Arquivos já existentes que serão estendidos ou usados:

- **Port/DTO de leitura:** `src/domain/user/repository/backoffice-user-repository.interface.ts`
- **Enum de domínio:** `src/domain/user/entity/ban-source.ts`
- **Repositório Drizzle:** `src/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository.ts`
- **Controller:** `src/infrastructure/controllers/backoffice.controller.ts`
- **Middleware:** `src/infrastructure/middlewares/auth.middleware.ts` (`withBackofficeAccess`)
- **Authorization service:** `src/infrastructure/services/backoffice-access.service.ts`
- **Schema de auth:** `src/infrastructure/database/drizzle/schema/auth.ts`
- **Outros schemas consultados:** `venues`, `venueMembers`, `bookings` em `src/infrastructure/database/drizzle/schema/`
- **Layout do backoffice (guard server-side):** `src/app/backoffice/layout.tsx`
- **Spec irmã (listagem):** `docs/specs/backoffice-users-list.md`

Arquivos que esta spec vai criar:

- `src/app/backoffice/users/[id]/page.tsx` + `_components/*`
- `src/app/api/backoffice/users/[id]/route.ts`
- `src/app/api/backoffice/users/[id]/venues/route.ts`
- `src/app/api/backoffice/users/[id]/bookings/route.ts`
- `src/app/api/backoffice/users/[id]/sessions/route.ts`
- `src/application/use-cases/backoffice/GetBackofficeUserOverviewUseCase.ts`
- `src/application/use-cases/backoffice/ListBackofficeUserVenuesUseCase.ts`
- `src/application/use-cases/backoffice/ListBackofficeUserBookingsUseCase.ts`
- `src/application/use-cases/backoffice/ListBackofficeUserActiveSessionsUseCase.ts`

---

*Documento inicial (SDD). Atualizar após a implementação seguindo o padrão da spec irmã.*
