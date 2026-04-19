# Spec: Listagem de usuários no Backoffice

**Tipo:** feature  
**Abordagem:** spec driven development (SDD)  
**Rota alvo:** `/backoffice/users`  
**Stack de referência:** Next.js (App Router), Better Auth, Drizzle, Neon Postgres, clean architecture  

---

## 1. Objetivo

Permitir que a equipe interna da plataforma **pesquise e visualize usuários** cadastrados (tabela `user` do Better Auth), com filtros por identificação e uma tabela legível com dados operacionais (cadastro, último acesso, **se o usuário está banido do sistema ou não**).

O estado **banido** será o mesmo conceito usado no produto quando:

1. **Exclusão solicitada pelo usuário** — após o fluxo de pedido de exclusão (e regras de carência/confirmação, se houver), a conta deixa de poder usar o sistema (tratada como banida / impedida de login conforme política de dados).
2. **Bloqueio pelo staff/backoffice** — a equipe precisa impedir o uso da plataforma por motivo operacional, segurança ou política.

A listagem **reflete** esse estado; os fluxos que **gravam** banimento (self-service de exclusão, tela/ação de banir no backoffice, jobs) podem ser entregues em features adjacentes, desde que compartilhem o mesmo modelo de dados.

---

## 2. Persona e permissões

| Ator | Acesso |
|------|--------|
| Equipe do backoffice (área `/backoffice` no mesmo domínio da aplicação) | Pode acessar `/backoffice/users`, pesquisar e listar usuários |

**Requisito de segurança (a implementar na mesma entrega ou imediatamente antes):**

- A rota `/backoffice/*` e/ou a API de listagem **deve** exigir autenticação e **autorização explícita** de “staff/backoffice” (papel ou allowlist de emails/domínios, ou tabela `staff_users` — **decisão pendente**).
- **Não** expor listagem de usuários em endpoint público.

> **Nota de contexto:** Hoje o projeto não documenta um papel `backoffice` no Better Auth. Esta spec assume que a implementação incluirá um critério claro de “quem é staff” antes de liberar dados sensíveis (email, IDs).

---

## 3. Escopo funcional

### 3.1 Incluído (MVP)

1. **Página** em `/backoffice/users` com:
   - **Formulário de pesquisa** com campos opcionais (podem ser combinados):
     - **ID** (UUID completo ou prefixo, conforme decisão técnica abaixo)
     - **Email** (match parcial *ou* exato — ver §6.1)
     - **Nome** (match parcial, case-insensitive)
   - **Listagem em tabela** com colunas mínimas:
     | Coluna | Descrição |
     |--------|-----------|
     | ID | UUID do usuário |
     | Nome | `user.name` |
     | Email | `user.email` |
     | Status (banimento) | Indica se o usuário **está banido** e portanto **não pode usar o sistema** — ver §4.2 (origens: pedido de exclusão ou bloqueio pelo staff) |
     | Data de cadastro | `user.created_at` |
     | Último acesso | Ver §4 |
   - **Paginação** (obrigatória para escala): cursor ou offset com `page` + `pageSize` (ex.: 20 itens por página).
   - **Estado vazio:** mensagem clara quando não houver resultados ou filtros não retornarem linhas.
   - **Loading / erro:** feedback de carregamento e erro de rede ou 403.

2. **API interna** (ex.: `GET /api/backoffice/users` ou equivalente sob `src/app/api/...`):
   - Valida query params (sanitização, tamanho máximo de strings).
   - Aplica filtros no banco (Drizzle), **sem** carregar a tabela inteira na memória.
   - Retorna DTO estável para o front (não vazar campos internos desnecessários).

### 3.2 Fora do escopo (MVP)

- Edição de perfil, **ações nesta tela** de banir/desbanir/processar exclusão, reset de senha pela equipe (a coluna **mostra** o estado; implementar os fluxos que alteram banimento pode ser outra entrega).
- Implementação completa dos fluxos de **pedido de exclusão pelo usuário** e de **banimento operacional pelo staff** — esta spec define a **semântica** do campo e a exibição na listagem; as telas/APIs que gravam esses estados devem alinhar ao mesmo modelo (§4.2).
- “Logar como usuário” (impersonation) — mencionado no produto em visão geral, mas **não** parte desta spec.
- Exportação CSV/Excel.
- Auditoria persistida (log em tabela) de quem consultou quem — desejável em fase 2.

---

## 4. Modelo de dados e colunas “Banimento (status)” e “Último acesso”

### 4.1 O que já existe (Drizzle / Better Auth)

Tabela `user` (arquivo `schema/auth.ts`):

- `id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`

Tabela `session`:

- Vínculo `user_id`, timestamps `created_at`, `updated_at`, `expires_at`

**Último acesso (definição recomendada na spec):**

- **Último acesso** = timestamp da **sessão mais recente** associada ao usuário, por exemplo `MAX(session.updated_at)` ou o `updated_at` da sessão com `expires_at` mais recente ainda válida — **definir uma única regra** na implementação e documentar na resposta da API.
- Se o usuário **nunca logou** (só cadastro) ou não há sessões retidas: exibir **“—”** ou **“Nunca”**.

### 4.2 Banimento (coluna “Status” na UI)

**Significado:** a coluna representa se o usuário está **banido do sistema** — ou seja, **não pode autenticar nem usar a aplicação** até existir desbanimento explícito (quando previsto), conforme regras do Better Auth e do produto.

**Origens de negócio (duas frentes que convergem no mesmo estado “não pode usar o sistema”):**

| Origem | Descrição |
|--------|-----------|
| **Pedido de exclusão** | O usuário solicita sair da plataforma; após o processamento previsto (confirmação, prazo, anonimização vs bloqueio, etc.), a conta fica **impedida de uso** — na prática modelada como **banimento** (ou equivalente que invalide sessões e login). |
| **Bloqueio pelo staff** | Alguém autorizado no backoffice aplica bloqueio (fraude, termos de uso, suporte). Mesmo conceito de **banimento** no armazenamento. |

**Distinção na operação (recomendado):** mesmo que ambos usem o mesmo flag `banned` (ou similar), o produto pode precisar saber **por quê** — por exemplo `ban_reason`, texto livre, ou enum `ban_source`: `user_requested_deletion` \| `staff` \| `other`. Isso ajuda suporte e evita confundir “pediu para sair” com “foi bloqueado pela equipe”. A UI da listagem pode mostrar rótulo curto (“Banido”, “Exclusão solicitada”, “Bloqueado”) conforme esse metadado, **se existir**.

**Implementação técnica (schema):**

Hoje **não há** coluna de banimento na tabela `user` do schema atual. A direção desejada é **persistir banimento de forma explícita**, alinhada ao ecossistema Better Auth:

| Abordagem | Descrição | Notas |
|-----------|-----------|-------|
| **Plugin / campos do Better Auth** | Usar suporte nativo a banimento (ex.: `banned`, `ban_reason`, `ban_expires` conforme documentação do BA na versão do projeto) | Preferível quando couber: revogação de sessões e checagens no login ficam centralizadas no auth |
| **Extensão do schema Drizzle** | Colunas próprias espelhando a mesma semântica, com hooks no fluxo de login que consultam banimento | Útil se o BA não expuser exatamente o que o produto precisa; manter uma única fonte de verdade |

**Não usar** “status derivado só de sessão” (ex.: sem sessão ativa = inativo) como substituto de banimento — isso confunde “sumiu” com “bloqueado”.

**UI:** labels sugeridos — coluna **“Status”** ou **“Acesso”** com valores do tipo **Ativo** (não banido) / **Banido**; se houver `ban_source` ou equivalente, subtítulo ou segunda coluna opcional em fase 2.

---

## 5. Sugestões úteis no contexto Playkourt (além do MVP)

Estas colunas ou filtros costumam ajudar suporte e operações; podem entrar como **fase 2** ou **MVP+** se couber:

| Ideia | Por quê |
|-------|---------|
| **Motivo / data do banimento** | Exibir `ban_reason`, `banned_at` ou quem aplicou (staff) — depende do modelo escolhido em §4.2. |
| **Email verificado** | Coluna ou ícone (`user.email_verified`) — reduz dúvida em suporte (“não recebeu email”). |
| **Provedores de login** | Agregar a partir de `account.provider_id` (ex.: `credential` vs `google`) — útil para debug de OAuth. |
| **Papel no produto** | Contagens ou badges: *dono de venue* (`venues.owner_id`), *membro de venue* (`venue_members`) — ajuda a priorizar suporte sem abrir outras telas. |
| **Data de última atualização de perfil** | `user.updated_at` — distingue “último login” de “última mudança de nome/email”. |
| **Ordenação** | Por cadastro (desc), último acesso (desc), email (asc). |
| **Rate limiting** | Na API de busca, limitar requisições por IP/usuário staff — evita abuso e scan de base. |
| **Busca por domínio de email** | Filtro `*@empresa.com` se o match parcial de email for suportado. |

---

## 6. Contrato da API (rascunho para implementação)

### 6.1 Request

`GET /api/backoffice/users`

Query params (todos opcionais):

| Param | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | UUID exato ou prefixo (se prefixo: validar formato e índice) |
| `email` | string | Substring ou exato (definir) |
| `name` | string | Substring, `ILIKE` |
| `page` | number | Default `1` |
| `pageSize` | number | Default `20`, máximo `100` |
| `banned` | boolean \| string | Opcional: filtrar só banidos (`true`) ou só não banidos (`false`) |
| `sort` | string | Ex.: `createdAt_desc` \| `lastSeen_desc` (opcional MVP) |

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
      "banSource": "user_requested_deletion | staff | null",
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

- `banned` + `banReason` + `banSource`: refletem o modelo de §4.2; se o schema ainda não tiver `ban_source`, pode retornar `banSource: null` até a migração.
- `total`: total de linhas que batem o filtro (para paginação). Em bases muito grandes, pode-se documentar limite de **contagem exata vs aproximada** (fase 2).

---

## 7. Camada de código (alinhamento clean architecture)

Ordem sugerida:

1. **Domain:** interface `BackofficeUserListItem` (inclui `banned` e metadados de banimento conforme §4.2), critérios de busca (value object ou DTO de entrada).
2. **Application:** use case `ListUsersForBackofficeUseCase` (ou nome equivalente) — sem dependência de HTTP.
3. **Infrastructure:** `DrizzleUserAdminRepository` ou extensão do repositório existente com método de listagem + join/agregação em `session`.
4. **Interface:** página `src/app/backoffice/users/page.tsx` + componentes de tabela/filtro; controller ou route handler chamando o use case.

---

## 8. Critérios de aceite (testáveis)

1. Com usuários no banco, acessar `/backoffice/users` mostra tabela paginada.
2. Filtrar por email parcial retorna apenas correspondentes (comportamento definido em §6.1).
3. Coluna “último acesso” reflete a regra única definida em §4.1.
4. Coluna de **status / banimento** está alinhada a §4.2: usuário não banido aparece como com acesso permitido; banido (por qualquer origem válida no modelo) aparece como banido.
5. Usuário **não** autenticado ou **sem** papel de backoffice recebe **403** na API e não vê dados (ou redirecionamento para login — alinhar com restante do app).
6. Nenhuma rota pública expõe a listagem completa.

---

## 9. Decisões pendentes (checklist antes de codar)

- [ ] Definição de **staff/backoffice** (role BA, env, ou tabela).
- [ ] Modelo de **banimento** no banco e no Better Auth (plugin oficial vs colunas Drizzle + validação no login) e campos opcionais `ban_reason`, `ban_expires`, **`ban_source`** (pedido de exclusão vs staff).
- [ ] **UUID:** busca só exata ou prefixo (prefixo exige cuidado com índice).
- [ ] Email: **contém** (ILIKE) vs **igualdade** para evitar vazamento por força bruta em emails conhecidos (rate limit mitiga).

---

## 10. Referências no repositório

- Schema: `src/infrastructure/database/drizzle/schema/auth.ts`
- Layout backoffice (nav já aponta para usuários): `src/app/backoffice/layout.tsx`
- Padrão de API + middleware: `src/infrastructure/middlewares/auth.middleware.ts` (estender com guard de staff)

---

*Documento inicial gerado para SDD. Atualizar este arquivo quando decisões da §9 forem fechadas.*
