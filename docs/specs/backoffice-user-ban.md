# Spec: Banir e desbanir usuário pelo Backoffice

**Tipo:** feature
**Abordagem:** spec driven development (SDD)
**Superfície UI:** modal aberto em `/backoffice/users/:id` (botão **Banir / Desbanir** do cabeçalho)
**Superfície API:** `POST /api/backoffice/users/:id/ban` e `POST /api/backoffice/users/:id/unban`
**Stack de referência:** Next.js (App Router), Better Auth, Drizzle, Neon Postgres, clean architecture
**Status:** design — não implementado.
**Specs irmãs:**
- `docs/specs/backoffice-users-list.md` (listagem, implementada) — define a semântica e o modelo de dados de banimento.
- `docs/specs/backoffice-users.view.md` (visualização, implementada) — já renderiza o botão "Banir/Desbanir" com placeholder; esta spec substitui o placeholder pelo fluxo real.

---

## 1. Objetivo

Permitir que um membro do staff **grave a decisão de banir ou desbanir um usuário** a partir da ficha no backoffice, de forma rastreável e com efeito imediato (incluindo derrubar sessões ativas do alvo).

Esta é a **primeira feature que escreve** no modelo de banimento criado em `backoffice-users-list.md` §4.2 (`user.banned`, `user.ban_reason`, `user.ban_source`, `user.banned_at`). Consequentemente, ela também precisa:

1. Expor um endpoint de escrita autorizado por allowlist.
2. Garantir que um usuário banido **não consiga mais usar a aplicação** — mesmo que ainda tenha sessão válida em algum dispositivo.
3. Preservar motivo e fonte do banimento (auditoria básica; auditoria persistida em tabela dedicada fica para spec futura).

Desbanimento é o fluxo inverso: limpa o estado e permite novo login.

---

## 2. Persona e permissões

| Ator | Acesso |
|------|--------|
| Equipe do backoffice (allowlist em `BackofficeAccessService`) | Pode banir / desbanir qualquer usuário **fora** da allowlist |

Política de autorização (reaproveita a infraestrutura existente):

- APIs protegidas por `withBackofficeAccess` — `401` sem sessão, `403` fora da allowlist.
- **Staff não pode banir outro staff** nem a si mesmo — a API recusa com `403` "Não é possível banir um membro do staff" quando o email do alvo está na allowlist ou quando `actor.id === target.id`. Alterações na composição do staff continuam passando pelo deploy/env.
- Usuário final **não tem acesso** a estas rotas; tentativas devolvem `401`/`403`.

---

## 3. Escopo funcional

### 3.1 Incluído (MVP)

#### 3.1.1 Modal de banimento (abre pelo botão "Banir")

Componente novo: `src/app/backoffice/users/[id]/_components/BanUserModal.tsx`. Abre sobre a página da ficha, sem navegar.

| Elemento | Comportamento |
|----------|---------------|
| Título | "Banir usuário" |
| Subtítulo | Nome + email do alvo (derivado do overview já carregado) |
| Aviso | Banner curto: "O usuário será impedido de entrar e todas as sessões ativas serão encerradas." |
| Textarea **Motivo** | **Obrigatório**. Placeholder com exemplos ("Fraude reportada, violação dos termos, etc."). Validação cliente: `trim().length` entre **10 e 500**. |
| Botão **Cancelar** | Fecha o modal sem efeito colateral. |
| Botão **Confirmar banimento** | Chama `POST /api/backoffice/users/:id/ban`. Fica em loading enquanto a request roda. Desabilitado se motivo inválido. |
| Erro do servidor | Exibido no rodapé do modal em banner vermelho, com a mensagem do `error` do JSON. O modal **não fecha** em erro. |
| Sucesso | Fecha o modal, recarrega a overview (`fetchOverview()`) e invalida o cache da aba "Sessões" (se já carregada) — as sessões do alvo foram revogadas. Toast/alerta curto "Usuário banido." |

#### 3.1.2 Modal de desbanimento (abre pelo botão "Desbanir")

Muito mais simples: confirmação.

| Elemento | Comportamento |
|----------|---------------|
| Título | "Desbanir usuário" |
| Corpo | "Tem certeza que deseja desbanir este usuário? Ele voltará a poder entrar no sistema." |
| Botão **Cancelar** | Fecha sem efeito. |
| Botão **Confirmar** | Chama `POST /api/backoffice/users/:id/unban`. |
| Sucesso | Recarrega overview; toast "Usuário desbanido." |

Desbanir **não exige motivo no MVP**. Se necessário no futuro para auditoria, aceitar um campo opcional `note` na request.

#### 3.1.3 Efeitos colaterais do banimento

Ao banir, a mesma transação / chamada do use case deve:

1. Atualizar `user` com:
   - `banned = true`
   - `ban_reason = <motivo digitado>`
   - `ban_source = 'staff'`
   - `banned_at = now()`
2. **Apagar todas as sessões ativas** do alvo (`DELETE FROM session WHERE user_id = :id`). Isso é o que "derruba" o usuário de todos os dispositivos.

Ao desbanir:

1. Atualizar `user` com:
   - `banned = false`
   - `ban_reason = NULL`
   - `ban_source = NULL`
   - `banned_at = NULL`
2. **Não** mexe em sessões (elas já foram revogadas no banimento; é improvável existirem novas enquanto banido).

> Nota: banimento e limpeza de sessões são operações em tabelas distintas. O MVP executa as duas dentro do mesmo use case, na ordem "marca banido → revoga sessões". Em caso de falha ao revogar sessões depois de marcar, o usuário já fica **bloqueado no login** (§3.1.4). O risco residual é baixo o suficiente para não justificar uma transação explícita agora; se virar problema, encapsular em `db.transaction`.

#### 3.1.4 Bloqueio de uso após banimento (obrigatório no MVP)

Se esta spec só escrever o flag sem bloquear o uso, o banimento é decorativo. Portanto, no MVP:

1. **Revogação de sessões no momento do ban** (§3.1.3) → derruba sessões atuais.
2. **Hook de login** no Better Auth: bloqueia **novas autenticações** para contas com `banned = true`.
   - Implementação: extender a configuração do Better Auth em `src/infrastructure/auth/better-auth.server.ts` com um callback/hook que, após validar credenciais, consulta `user.banned` e aborta o sign-in retornando um erro genérico.
   - Mensagem para o usuário final: *"Não foi possível entrar. Se você acredita que isso é um erro, contate o suporte."* (não vaza motivo nem confirma que a conta existe).
3. **Safety net no `AuthService.getUserFromRequest`**: se, por qualquer motivo, uma sessão de usuário banido ainda for apresentada (ex.: race), o método retorna `null` — os middlewares `withAuth` e derivados tratam como não autenticado e respondem `401`.

Detalhamento técnico do hook e do safety net em §7.

#### 3.1.5 Atualização de UI já existente

- `UserHeader.tsx` (já criado): o handler atual (`onActionBan` com `alert(...)`) passa a abrir o modal correspondente ao estado atual (`banned ? Unban : Ban`). O label do botão já alterna corretamente.
- A aba **Sessões ativas** deve refletir 0 sessões logo após um banimento bem-sucedido — hoje o estado local guarda a última resposta. Solução simples: após ban bem-sucedido a página marca `sessionsLoaded = false` para forçar novo fetch quando a aba for aberta de novo.

### 3.2 Fora do escopo (MVP)

- **Auditoria persistida** de quem baniu quem (tabela `user_audit_events`). Esta spec já grava `ban_reason`, `ban_source`, `banned_at` no próprio registro do usuário, o que cobre o básico; a tabela de auditoria ficará em spec própria.
- **Banir por tempo determinado** (`banned_until`). Hoje o banimento é indefinido; liberar via desbanimento manual.
- **Pedido de exclusão pelo próprio usuário** (`ban_source = 'user_requested_deletion'`). Fluxo dedicado; esta spec só escreve `ban_source = 'staff'`.
- **Notificação ao usuário banido** por email. Pode entrar em fase 2.
- **Histórico de banimentos anteriores** (usuário banido → desbanido → banido). Hoje o desbanimento **limpa** os campos; histórico depende da tabela de auditoria de fase 2.
- **Rate limit** nas APIs de escrita. Fase 2.

---

## 4. Modelo de dados

**Não há migração nova.** Todas as colunas necessárias foram criadas em `0007_user_ban_fields.sql` (ver `backoffice-users-list.md` §4.2):

| Coluna (`user`) | Tipo | Uso nesta spec |
|-----------------|------|----------------|
| `banned` | `boolean` | Flag principal. `true` em ban, `false` em unban. |
| `ban_reason` | `text` | Preenchido no ban com o motivo digitado; zerado no unban. |
| `ban_source` | `text` | Sempre `'staff'` nesta spec. |
| `banned_at` | `timestamptz` | `now()` no ban; `NULL` no unban. |

A tabela `session` já existe (Better Auth) e é usada pelo DELETE do §3.1.3.

---

## 5. Sugestões pós-MVP

| Ideia | Por quê |
|-------|---------|
| **Banimento temporário** (`banned_until`) com job de "desban" automático | Casos de suspensão por N dias por violação de termo. |
| **Tabela de auditoria** (`user_audit_events`) com quem baniu/desbaniu quando e por quê | Histórico preservado mesmo após desbanimentos; compliance/LGPD. |
| **Notificar o usuário por email** no ato do ban, com motivo se apropriado | Transparência e redução de tickets. |
| **Banner global para o próprio staff** ("Você baniu este usuário há X minutos") | Evita ação repetida acidental em duplo clique. |
| **Confirmação dupla** em ban (digite "BANIR") | Se o volume de erros de clique aparecer. |
| **Webhooks/eventos internos** no ban (para outras partes do sistema reagirem) | Quando aparecerem integrações (ex.: cancelar reservas futuras do banido). |
| **Cancelar reservas futuras do banido** | Discutir política: o time pode querer cancelar/reembolsar reservas pendentes ao banir. |

---

## 6. Contrato da API

Autorização comum:
- Cookie de sessão do Better Auth.
- `401` sem sessão, `403` sem allowlist, `404` se `:id` não existir, `400` em body inválido, `409` em conflito de política (ex.: banir staff), `500` erro inesperado.

### 6.1 `POST /api/backoffice/users/:id/ban`

Request body (JSON):

```json
{
  "reason": "string (10..500 chars)"
}
```

Validações (camada `application`, antes do banco):

- `:id` UUID válido (mesma regex já usada nas outras use cases de backoffice).
- `reason` obrigatório, `trim().length ∈ [10, 500]`. Fora disso → `400 "Invalid reason"`.
- Usuário alvo existe (`user.id = :id`). Caso contrário → `404`.
- Alvo **não** está na allowlist do `BackofficeAccessService` → senão `409 "Cannot ban a staff member"`.
- `actor.id !== target.id` → senão `409 "Cannot ban yourself"`. (Redundância defensiva; na prática já protegido pela regra de staff.)
- Idempotente: se `banned = true` e `ban_source = 'staff'`, a request **não é erro** — atualiza `ban_reason` para o novo texto e retorna `200`. Isso permite "editar motivo".

Response `200`:

```json
{
  "id": "uuid",
  "banned": true,
  "banReason": "string",
  "banSource": "staff",
  "bannedAt": "ISO-8601",
  "revokedSessions": 3
}
```

`revokedSessions` é o número de sessões apagadas — informativo para o cliente decidir se precisa invalidar caches locais.

### 6.2 `POST /api/backoffice/users/:id/unban`

Sem body no MVP (aceita corpo vazio ou `{}`).

Validações:

- `:id` UUID válido.
- Usuário existe.
- **Idempotente**: se `banned = false`, retorna `200` com os campos já zerados. Evita estado inconsistente caso dois staffs cliquem no mesmo momento.

Response `200`:

```json
{
  "id": "uuid",
  "banned": false,
  "banReason": null,
  "banSource": null,
  "bannedAt": null
}
```

### 6.3 Como o cliente usa as respostas

A página `/backoffice/users/:id` re-busca a overview (`GET /api/backoffice/users/:id`) depois de qualquer ban/unban bem-sucedido — não depende dos campos retornados, mas os usa para feedback imediato (ex.: toast "3 sessões revogadas").

---

## 7. Camada de código (clean architecture)

| Camada | Artefato | Caminho |
|--------|----------|---------|
| **Domain** | Estender `BackofficeUserRepositoryInterface` com: `banUser(id, input)`, `unbanUser(id)`, `deleteSessionsOfUser(id): Promise<number>`. Input: `{ reason: string; source: BanSource }`. Novos DTOs ficam no mesmo arquivo do port. | `src/domain/user/repository/backoffice-user-repository.interface.ts` |
| **Application** | Use case `BanUserFromBackofficeUseCase` — recebe `{ userId, actorId, reason }`; valida regras (§6.1), chama `repo.banUser`, depois `repo.deleteSessionsOfUser`, retorna `{ banned: true, revokedSessions, ... }`. Lança erros tipados (mapeáveis para `409`/`404` no controller). | `src/application/use-cases/backoffice/BanUserFromBackofficeUseCase.ts` |
| **Application** | Use case `UnbanUserFromBackofficeUseCase` — recebe `{ userId, actorId }`; idempotente. | `src/application/use-cases/backoffice/UnbanUserFromBackofficeUseCase.ts` |
| **Application** | Serviço de política (onde colocar "alvo é staff?"): reaproveitar `BackofficeAccessService.hasAccess(targetEmail)`. Use case recebe também o email do alvo (carregado da própria query de banimento). | — |
| **Infrastructure** | Implementar os três novos métodos em `DrizzleBackofficeUserRepository`. `banUser`/`unbanUser` fazem `UPDATE ... RETURNING`. `deleteSessionsOfUser` faz `DELETE FROM session WHERE user_id = :id RETURNING id` e devolve a contagem. | `src/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository.ts` |
| **Infrastructure (auth)** | **Hook de login do Better Auth** que bloqueia `banned = true`. Implementação: plugin/hook na config em `better-auth.server.ts`. Usa o mesmo `getDb()`/`user` schema para consultar o flag depois das credenciais serem aceitas. Retorna erro genérico se banido. | `src/infrastructure/auth/better-auth.server.ts` |
| **Infrastructure (auth)** | **Safety net em `AuthService.getUserFromRequest`**: após obter a sessão do BA, se `session.user.banned === true`, retorna `null`. Isso cobre janelas em que a sessão existia antes do ban e por algum motivo não foi apagada. | `src/infrastructure/frontend-services/auth/auth.service.ts` (ou onde `getUserFromRequest` vive hoje) |
| **Interface (HTTP)** | Estender `BackofficeController` com `banUser(req, actor, targetId)` e `unbanUser(req, actor, targetId)`. Mapeia erros para `400/404/409` conforme prefixo (`Invalid`, `Not found`, `Cannot`, etc.). | `src/infrastructure/controllers/backoffice.controller.ts` |
| **Interface (HTTP)** | Novos route handlers (ambos protegidos por `withBackofficeAccess`, recebem o `AuthUser` do actor): | `src/app/api/backoffice/users/[id]/ban/route.ts`, `.../unban/route.ts` |
| **Interface (UI)** | Modal `BanUserModal`, modal `UnbanUserModal`, wiring na `page.tsx` para substituir os `alert(...)` do handler de ban, e `setSessionsLoaded(false)` após sucesso para invalidar a aba de sessões. | `src/app/backoffice/users/[id]/_components/*` + `page.tsx` |

Notas de design:

- **Por que dois endpoints separados (ban/unban) em vez de `PATCH` genérico:** a ação é **assimétrica** — ban exige `reason`, executa side effects (revoga sessões), é mais perigosa; unban é simples. Dois endpoints deixam o contrato explícito e facilitam auditoria/observabilidade.
- **Por que idempotência:** dois staffs podem clicar "Banir" no mesmo usuário. Sem idempotência o segundo recebe erro; com idempotência o motivo mais recente prevalece e o comportamento é previsível.
- **Por que revogar sessões sempre, sem toggle:** banir sem derrubar sessões é inefetivo; fazer disso um toggle adiciona uma decisão pouco útil ao staff.
- **Por que o hook de login vai nesta spec e não na próxima:** sem ele, banir na UI é placebo. Mantém a promessa "usuário banido não pode usar o sistema" viva desde o dia 1.

---

## 8. Critérios de aceite

1. Staff acessa `/backoffice/users/:id` de um usuário ativo, clica "Banir", preenche motivo válido e confirma → overview recarrega mostrando status "Bloqueado" e `ban_reason`. Resposta da API inclui contagem de sessões revogadas.
2. O mesmo usuário banido, com sessão ainda aberta em outro dispositivo, ao fazer a próxima requisição autenticada recebe `401` e é redirecionado para `/auth/login`.
3. O mesmo usuário banido tenta **entrar** de novo com credenciais corretas → recebe erro genérico "Não foi possível entrar"; nenhuma sessão é criada.
4. Staff clica "Desbanir" e confirma → overview recarrega mostrando "Ativo"; `banned_at`, `ban_reason`, `ban_source` ficam `NULL`. Usuário volta a conseguir logar normalmente.
5. Tentativa de ban com motivo vazio ou com menos de 10 caracteres → modal mostra erro de validação **sem** chamar a API.
6. Tentativa de ban via `:id` que corresponde a um email **na allowlist** → API responde `409`; UI mostra banner de erro no modal.
7. Tentativa de ban do próprio `actor.id` → `409`.
8. Usuário fora da allowlist que chama diretamente `POST /api/backoffice/users/:id/ban` via HTTP → `401` (sem sessão) ou `403` (com sessão não-staff). Sem vazamento do motivo ou do estado.
9. Duas requests simultâneas de ban no mesmo alvo → ambas retornam `200`; o `ban_reason` final é o da última a completar (idempotência).
10. Aba "Sessões ativas" aberta antes do ban mostra N sessões; após o ban, ao reabrir, mostra 0.

---

## 9. Decisões fechadas (sob validação)

- [x] **Superfície do ban:** modal (não página dedicada). Mantém o usuário no contexto da ficha.
- [x] **Motivo obrigatório no ban:** sim, 10..500 chars, validado no cliente e no servidor.
- [x] **Motivo no unban:** **não obrigatório** no MVP (nem aceito). Auditoria persistida vai cobrir o "por quê" em fase 2.
- [x] **Revogar sessões no ban:** **sempre**, sem opção no modal.
- [x] **Bloqueio efetivo:** hook de login + safety net em `getUserFromRequest` — entram **nesta spec**, não na próxima.
- [x] **`ban_source` gravado por este fluxo:** sempre `'staff'`. Self-delete (usuário pedindo exclusão) é spec própria.
- [x] **Proteção contra banir staff ou a si mesmo:** validação servidor-side, retorna `409`.
- [x] **Idempotência:** ban e unban são idempotentes; ban re-executado atualiza o motivo.
- [x] **Transação:** sem `db.transaction` no MVP — dois statements em sequência; se virar problema, encapsular depois.
- [x] **Auditoria persistida:** fora do escopo; rastreabilidade mínima é o que já fica em `user.ban_*`.

Itens que permanecem abertos ou planejados (ver §3.2):

- [ ] Tabela `user_audit_events` e dashboard de auditoria.
- [ ] Banimento temporário com `banned_until`.
- [ ] Política de cancelamento de reservas futuras ao banir.
- [ ] Notificação por email ao usuário banido.

---

## 10. Referências no repositório

Arquivos existentes a serem **estendidos**:

- `src/domain/user/repository/backoffice-user-repository.interface.ts` — port e DTOs.
- `src/domain/user/entity/ban-source.ts` — enum já existe; usado com `BanSource.STAFF`.
- `src/infrastructure/repositories/drizzle/drizzle-backoffice-user.repository.ts` — novos métodos `banUser`, `unbanUser`, `deleteSessionsOfUser`.
- `src/infrastructure/controllers/backoffice.controller.ts` — métodos `banUser`, `unbanUser`.
- `src/infrastructure/middlewares/auth.middleware.ts` — `withBackofficeAccess` já cobre.
- `src/infrastructure/services/backoffice-access.service.ts` — reaproveitado para checar "alvo é staff?".
- `src/infrastructure/auth/better-auth.server.ts` — configurar hook de sign-in que consulta `user.banned`.
- `src/infrastructure/frontend-services/auth/auth.service.ts` (ou equivalente) — safety net no `getUserFromRequest`.
- `src/app/backoffice/users/[id]/page.tsx` — substituir `alert(...)` do handler de ban pelos modais; `setSessionsLoaded(false)` após sucesso.
- `src/app/backoffice/users/[id]/_components/UserHeader.tsx` — já expõe `onActionBan`; wiring do modal entra na `page.tsx`.

Arquivos **a criar**:

- `src/app/api/backoffice/users/[id]/ban/route.ts`
- `src/app/api/backoffice/users/[id]/unban/route.ts`
- `src/application/use-cases/backoffice/BanUserFromBackofficeUseCase.ts`
- `src/application/use-cases/backoffice/UnbanUserFromBackofficeUseCase.ts`
- `src/app/backoffice/users/[id]/_components/BanUserModal.tsx`
- `src/app/backoffice/users/[id]/_components/UnbanUserModal.tsx`

---

*Documento inicial (SDD). Atualizar após a implementação, seguindo o padrão das specs irmãs.*
