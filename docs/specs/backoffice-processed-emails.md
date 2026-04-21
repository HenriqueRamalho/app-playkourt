# Spec: Emails processados (envio + visualização no Backoffice)

**Tipo:** feature (infra + UI)
**Abordagem:** spec driven development (SDD)
**Rota alvo:** `/backoffice/emails`
**Stack de referência:** Next.js 16 (App Router), Better Auth, Drizzle, Neon Postgres, clean architecture
**Status:** **proposta** — decisões confirmadas (§10). Pronto para implementação.

---

## 1. Objetivo

Criar a base de envio de emails transacionais do Playkourt (boas-vindas, recuperação de senha, confirmação de reserva, notificações ao dono da venue etc.) de forma **auditável** e **segura em ambientes não-produtivos**.

Dois problemas que a feature resolve juntos:

1. **Não enviar emails reais em dev e staging.** Toda tentativa de envio é persistida num **log de emails processados**; o provedor externo só é chamado quando `NODE_ENV === "production"` ou quando `EMAIL_DELIVERY_ENABLED=true` (override manual — ver §5.4).
2. **Dar ao staff do backoffice visibilidade operacional.** Uma tela em `/backoffice/emails` permite pesquisar emails (por data, destinatário, assunto, remetente, metadados), ver o conteúdo que o usuário recebeu e reenviar em caso de problema.

A feature **não** define o conteúdo específico dos emails do produto (boas-vindas, reserva, etc.) — isso entra em features adjacentes que **consomem** o `EmailSender` exposto aqui.

---

## 2. Persona e permissões

| Ator | Acesso |
|------|--------|
| Código da aplicação (use cases) | Dispara emails via porta `EmailSender` do domínio. Nunca chama provedor direto. |
| Equipe do backoffice | Pode acessar `/backoffice/emails`, pesquisar, visualizar HTML renderizado e **reenviar** emails. |
| Provedor de email (Resend) | Chama webhook em `/api/webhooks/email/resend` para reportar eventos (`delivered`, `opened`, …). Autenticado por signing secret. |

**Requisitos de segurança:**

- `/backoffice/emails` herda o guard de `src/app/backoffice/layout.tsx` e a API `/api/backoffice/emails/*` usa `withBackofficeAccess` (mesma allowlist de `BackofficeAccessService`).
- Webhook do provedor valida assinatura (Svix no caso do Resend); requisição sem assinatura válida → `401`.
- HTML do email é renderizado em **iframe com `sandbox`** (sem `allow-scripts`, sem `allow-same-origin`), para evitar XSS caso algum template com conteúdo dinâmico escape sanitização.
- Metadados podem conter dados contextuais (ex.: `bookingId`, `venueId`, `templateName`). Não são expostos em rota pública — só pelo endpoint protegido de backoffice. O usuário destinatário, quando conhecido, vive na coluna dedicada `recipient_user_id` (§4.6), não em metadata.

---

## 3. Escopo funcional

### 3.1 MVP — Infra de envio

1. **Porta de domínio `EmailSender`** com contrato mínimo:
   ```ts
   sendEmail(input: SendEmailInput): Promise<SendEmailResult>
   ```
   onde `SendEmailInput` contém: `to: string | string[]`, `recipientUserId?: string | string[]`, `from?: string` (default em §5.3), `subject`, `html`, `text?`, `replyTo?`, `cc?`, `bcc?`, `tags?`, `metadata?` (record arbitrário string→string/number/boolean, para dados **contextuais** — não repita `userId` aqui; ver §4.6), `idempotencyKey?`.

   **Regras de `to`:**
   - Quando `to` é uma **string**, é um envio para um destinatário — gera **1 linha** em `processed_emails`.
   - Quando `to` é um **array**, a porta faz **fan-out**: gera **N linhas** em `processed_emails` (uma por destinatário), cada uma com seu próprio `providerMessageId` e ciclo de eventos independente. As linhas compartilham `metadata->>'groupId'` (UUID gerado pelo sender) para permitir agrupamento posterior.
   - `cc` e `bcc`, quando presentes, são **replicados em cada linha** do fan-out — não geram linhas próprias.

   **Regras de `recipientUserId`:**
   - Campo **opcional**. Preenchido pelo caller quando o destinatário é um usuário conhecido do sistema (`user.id`). Fica `NULL` em emails para endereços externos (convites pra não-usuários, emails institucionais, etc.).
   - Quando `to` é string, `recipientUserId` deve ser string ou `undefined`.
   - Quando `to` é array, `recipientUserId` pode ser:
     - `undefined` → todas as linhas ficam com `recipient_user_id = NULL`.
     - um array de **mesmo tamanho** de `to`, onde cada posição casa com o respectivo endereço (use `null` em posições que não são usuários do sistema). Tamanhos diferentes → erro de validação.
   - O use case **não** tenta resolver automaticamente `to_address → user.id` — essa responsabilidade fica do caller, que já conhece o contexto (está enviando email de confirmação pro user X, o `userId` já está em mão). Evita query extra no banco e remove ambiguidade quando o mesmo email está vinculado a múltiplas contas.

2. **Implementação infra (decorators):**
   - `PersistingEmailSender` — **sempre** grava em `processed_emails` (status inicial `queued`), e delega para o sender real.
   - `ResendEmailSender` — chama a API do Resend e devolve o `providerMessageId`.
   - `NoopEmailSender` — não envia; marca o email como `suppressed_in_env`. Usado em dev/staging e nos testes.
   - A composição é feita no container de DI (§7): produção = `Persisting(Resend)`; dev/staging = `Persisting(Noop)`. Decisão de `isProduction` em um único lugar (`src/infrastructure/services/email/email-delivery-policy.ts`).

3. **Webhook `/api/webhooks/email/resend`**:
   - Valida assinatura Svix.
   - Grava em `processed_email_events` o evento bruto + timestamp.
   - Atualiza `processed_emails.last_provider_status` e `last_provider_status_at` com o status normalizado.
   - Idempotente por `(providerMessageId, providerEventId)`.

4. **Templating: React Email** (`@react-email/components` + `@react-email/render`). Templates vivem em `src/infrastructure/services/email/templates/`. Renderização para HTML e versão `text/plain` acontece antes de chamar `sendEmail` — o port recebe HTML pronto, não JSX. Isso mantém o domínio agnóstico ao motor de templates.

### 3.2 MVP — Backoffice UI

Página em `/backoffice/emails` (`src/app/backoffice/emails/page.tsx`) com:

1. **Formulário de pesquisa** (campos opcionais, combináveis):
   | Campo | Comportamento |
   |-------|---------------|
   | **Enviado entre** (`sentFrom`, `sentTo`) | Datas ISO-8601 (`date-time`). Ambos opcionais; quando presentes, filtra `created_at` entre os dois. |
   | **Destinatário** (email) | `ILIKE '%termo%'` sobre `to_address`. Trim, ≤ 255 chars. |
   | **Destinatário (usuário)** (`recipientUserId`) | UUID v4 exato. Match em `recipient_user_id`. Útil em deep-link vindo de `/backoffice/users` ("ver emails deste usuário"). |
   | **Assunto** | `ILIKE '%termo%'` sobre `subject`. Trim, ≤ 255 chars. |
   | **Remetente** | `ILIKE '%termo%'` sobre `from_address`. |
   | **Metadados** | Par `key`+`value` para match exato em `metadata ->> key = value` (JSONB). Um par por busca no MVP (ver §9 para evolução). |
   | **Provedor** | Select: `todos` / `resend` / `ses` / `noop`. |
   | **Status** | Select com estados normalizados (§4.3). |

2. **Tabela** paginada com colunas:

   | Coluna | Fonte |
   |--------|-------|
   | Destinatário | `to_address` |
   | Assunto | `subject` (truncado com tooltip) |
   | Remetente | `from_address` |
   | Enviado em | `created_at`, formato `dd/MM/yyyy HH:mm` |
   | Provedor | `provider` (enum em código: `resend` / `ses` / `noop`) — badge colorido |
   | Status do Provedor | `last_provider_status` normalizado (§4.3) — badge colorido |
   | Ações | Botão **Visualizar** (abre drawer com iframe sandbox + metadados + timeline de eventos) e **Reenviar** (ação em §3.3) |

3. **Paginação** offset/limit, default `pageSize=20`, máx `100`. Ordenação fixa `created_at DESC, id ASC` (alinhado à spec de users).

4. **Estados de UI** idênticos ao padrão da spec de users: vazio (“Nenhum email encontrado.”), loading (“Carregando...”), erro (banner vermelho).

### 3.3 MVP — Reenviar email

- Ao clicar **Reenviar**:
  1. Backend carrega o `processed_emails` original.
  2. Cria um **novo registro** `processed_emails` com mesmos `to/from/subject/html/text/metadata` e `resent_from_id` apontando para o original.
  3. Executa o pipeline normal (`PersistingEmailSender`), que decidirá se entrega de verdade baseado em `EmailDeliveryPolicy`.
  4. Responde `202 Accepted` com o `id` do novo registro.
- **Audit log:** o registro novo grava `resent_by_user_id` (o staff que acionou). Isso dá rastreabilidade mínima sem criar tabela separada de auditoria no MVP.
- **Motivo (`reason`):** campo **opcional** no modal do backoffice e no body da API (`POST /api/backoffice/emails/:id/resend`). Quando informado, é gravado em `metadata.resendReason` no registro novo.
- **Idempotência:** usa `Idempotency-Key` header opcional; sem ele, duplo clique pode gerar dois envios — aceitável no MVP porque o reenvio é uma ação explícita do staff.

### 3.4 Fora do escopo (MVP)

- **Anexos** (`attachments`) — `SendEmailInput` não recebe anexos na v1. Schema não terá coluna dedicada; quando precisar, adiciona-se tabela filha `processed_email_attachments` ou coluna `attachments jsonb`.
- **Templates CRUDáveis em UI** — templates ficam em código (React Email) na v1.
- **Agendamento de envio** (ex.: `sendAt`) — não há fila própria. Se precisar, entra via Trigger.dev/Inngest em fase 2.
- **Retry automático em falha do provedor** — no MVP, falha grava `failed` + `last_provider_error` e o staff reenvia manualmente pelo backoffice.
- **Exportação CSV / dashboards agregados** (taxa de abertura, bounce rate) — fase 2.
- **Rate limiting na listagem** — fase 2, alinhado com a spec de users.
- **Purge/retenção automática** — ver §4.4; política já está decidida; job de limpeza fica para quando crescer o volume.
- **Multi-provedor com failover automático** — o schema permite, mas a lógica de failover entra só se virar necessidade real.
- **Preview WYSIWYG de template antes de enviar** — usa CLI do React Email localmente.

---

## 4. Modelo de dados

### 4.1 `processed_emails`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Id interno. |
| `provider` | `text NOT NULL` | Enum em código: `resend` \| `ses` \| `noop`. |
| `provider_message_id` | `text NULL` | Id retornado pelo provedor (ex.: `re_abc123`). Null para `noop`. **Unique** parcial quando presente. |
| `from_address` | `text NOT NULL` | Email completo (pode incluir display name, ex.: `Playkourt <noreply@playkourt.com>`). Guardamos como veio. |
| `to_address` | `text NOT NULL` | **Um destinatário por registro.** Quando o caller passa `to` como array, o sender faz fan-out (ver §3.1 e §4.5). |
| `recipient_user_id` | `uuid NULL` | FK **informal** para `user.id` (sem `REFERENCES` no DB, mesma política do `resent_by_user_id` e do restante do projeto). Preenchido quando o destinatário é usuário conhecido do sistema; `NULL` para endereços externos. Ver §4.6. |
| `cc_addresses` | `text[] NULL` | |
| `bcc_addresses` | `text[] NULL` | |
| `reply_to_address` | `text NULL` | |
| `subject` | `text NOT NULL` | |
| `html_body` | `text NOT NULL` | HTML final. Usado no drawer de visualização. |
| `text_body` | `text NULL` | Versão texto. |
| `tags` | `text[] NULL` | Tags para o provedor (Resend aceita). |
| `metadata` | `jsonb NOT NULL DEFAULT '{}'::jsonb` | K/V livre para **dados contextuais** do envio (ex.: `bookingId`, `venueId`, `templateName`, `locale`, `groupId`). **Não repetir `userId` aqui** — o destinatário-usuário vive em `recipient_user_id` (§4.6). |
| `template_name` | `text NULL` | Nome do template (denormalizado de `metadata->>'templateName'` pra filtro fácil). |
| `idempotency_key` | `text NULL` | Quando setado, **unique** — evita envio duplicado por retry de use case. |
| `status` | `text NOT NULL DEFAULT 'queued'` | Enum interno (§4.2). |
| `last_provider_status` | `text NULL` | Enum normalizado do provedor (§4.3). |
| `last_provider_status_at` | `timestamptz NULL` | Quando o último evento foi recebido. |
| `last_provider_error` | `text NULL` | Mensagem de erro (falha na API ou bounce). |
| `resent_from_id` | `uuid NULL REFERENCES processed_emails(id) ON DELETE SET NULL` | Quando preenchido, o registro é um reenvio. |
| `resent_by_user_id` | `uuid NULL` | Staff que acionou reenvio. FK informal pro `user.id`. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Momento do `sendEmail`. **Campo usado pelo filtro "Enviado em"**. |
| `delivered_at` | `timestamptz NULL` | Derivado do evento `delivered`. |

**Índices previstos na migração:**

- `idx_processed_emails_created_at` em `created_at DESC` — listagem padrão.
- `idx_processed_emails_to_address` em `lower(to_address) text_pattern_ops` — suporta `ILIKE '%termo%'` razoavelmente bem pra MVP; se a tabela crescer, trocar por `pg_trgm` GIN.
- `idx_processed_emails_recipient_user_id` `WHERE recipient_user_id IS NOT NULL` — queries "todos os emails para este usuário" (suporte, página de perfil no backoffice, auditoria LGPD).
- `idx_processed_emails_provider_message_id` `UNIQUE` `WHERE provider_message_id IS NOT NULL` — idempotência do webhook.
- `idx_processed_emails_idempotency_key` `UNIQUE` `WHERE idempotency_key IS NOT NULL`.
- `idx_processed_emails_metadata_gin` `USING gin (metadata)` — busca por `metadata ->> 'key' = 'value'`.
- `idx_processed_emails_template_name` — filtro/agrupamento por template (útil pra fase 2 de métricas).

### 4.2 `status` (interno)

Enum em **código** (`src/domain/email/entity/email-status.ts`):

| Valor | Significado |
|-------|-------------|
| `queued` | Registro gravado; ainda não chamamos o provedor. |
| `sent` | Provedor aceitou a mensagem (retornou `providerMessageId`). |
| `delivered` | Webhook confirmou entrega na caixa do destinatário. |
| `failed` | Provedor rejeitou no envio (4xx/5xx da API ou bounce). |
| `suppressed_in_env` | `NoopEmailSender` — não saiu do ambiente (dev/staging). |

Regra: `status` é uma projeção interna do que sabemos hoje; `last_provider_status` é o estado bruto normalizado do último evento (mais granular; inclui `opened`, `clicked`, `complained`, `delivery_delayed`).

### 4.3 `last_provider_status` (normalizado)

Enum em **código** (`src/domain/email/entity/provider-status.ts`), independente do provedor:

| Valor | Exibido como | Origem Resend | Origem SES (futuro) |
|-------|--------------|---------------|---------------------|
| `sent` | Enviado | `email.sent` | `Send` |
| `delivered` | Entregue | `email.delivered` | `Delivery` |
| `opened` | **Aberto** | `email.opened` | `Open` |
| `clicked` | Clicado | `email.clicked` | `Click` |
| `bounced` | Devolvido | `email.bounced` | `Bounce` |
| `complained` | Spam/Complaint | `email.complained` | `Complaint` |
| `delayed` | Atrasado | `email.delivery_delayed` | — |
| `failed` | Falhou | erro 4xx/5xx da API | `Rejected` |

O `EmailEventNormalizer` (§7) traduz o payload do provedor pra esse enum e grava o evento bruto em `processed_email_events` (§4.4). Valores não mapeados caem em `failed` + log estruturado — nunca perdemos o evento bruto.

### 4.4 `processed_email_events`

| Coluna | Tipo | |
|--------|------|-|
| `id` | `uuid PK` | |
| `processed_email_id` | `uuid NOT NULL REFERENCES processed_emails(id) ON DELETE CASCADE` | |
| `provider_event_id` | `text NULL` | Id do evento no provedor (Resend manda em `svix-id`). |
| `provider` | `text NOT NULL` | |
| `raw_status` | `text NOT NULL` | Valor cru do provedor. |
| `normalized_status` | `text NOT NULL` | Enum de §4.3. |
| `payload` | `jsonb NOT NULL` | Payload bruto do webhook pra debug. |
| `occurred_at` | `timestamptz NOT NULL` | Timestamp reportado pelo provedor. |
| `received_at` | `timestamptz NOT NULL DEFAULT now()` | |

**Unique parcial:** `(processed_email_id, provider_event_id) WHERE provider_event_id IS NOT NULL` — garante idempotência do webhook sem custar em eventos anônimos.

**Política de retenção (decidida; execução em fase 2):**

| Tabela | Prazo |
|--------|-------|
| `processed_emails` | **12 meses** |
| `processed_email_events` | **6 meses** |

Motivação: minimizar dado pessoal armazenado (alinhamento com LGPD), reduzir custo de storage no Neon (HTML transacional pesa ~20–80 KB por email) e manter só o que tem utilidade operacional real. Eventos caem antes porque perdem valor mais rápido — saber que um email foi aberto 7 meses atrás quase nunca ajuda.

**Escape hatch:** registros com `metadata->>'retain' = 'permanent'` ficam **fora do purge** (ex.: recibo de pagamento, nota fiscal, confirmação legal de cancelamento). Cabe aos use cases que enviam esses tipos setar a flag explicitamente.

**Implementação do purge (fora do MVP):** cron diário (Neon scheduled query ou endpoint interno disparado por cron externo) rodando:

```sql
DELETE FROM processed_emails
 WHERE created_at < now() - interval '12 months'
   AND (metadata ->> 'retain') IS DISTINCT FROM 'permanent';

DELETE FROM processed_email_events
 WHERE received_at < now() - interval '6 months';
```

No MVP **nada é deletado** — só documentamos a política e deixamos o schema preparado (índice em `created_at`, GIN em `metadata`). Revisitar quando o volume justificar.

### 4.5 Semântica de `to` e fan-out

- `to: string` → **1 envio, 1 linha** em `processed_emails`.
- `to: string[]` (tamanho N) → **N envios independentes, N linhas**, cada uma com seu próprio `provider_message_id` e ciclo de eventos (entregue/aberto/bounce por destinatário). As N linhas compartilham `metadata->>'groupId'` (UUID gerado pelo sender no momento do fan-out) para permitir agrupar a batch posteriormente.

Por que fan-out em vez de array na coluna:

- Filtros, status por destinatário (aberturas/bounces são por pessoa) e o painel do backoffice ficam naturais.
- Reenvio seletivo: staff pode reenviar só pra uma das N pessoas que não receberam, sem ter que refazer a batch inteira.
- Índices e queries continuam simples — não precisamos de `text[]` + `GIN` em `to_addresses` para fazer `ILIKE`.

### 4.6 `recipient_user_id` (destinatário-usuário, quando conhecido)

**Por que existe como coluna dedicada** (e não só em `metadata`):

- É uma **relação de primeira classe** com `user` — merece tratamento de primeira classe no schema.
- Queries "todos os emails enviados para o usuário X" são comuns (suporte, página de perfil do usuário no backoffice, auditoria LGPD, request do próprio usuário pedindo exportação de dados pessoais) e ficam triviais com coluna indexada.
- Deixa `metadata` coerente: ele continua sendo o "saco" de **dados contextuais** do envio (o que está sendo comunicado — reserva, relatório, boleto), não a identidade do destinatário.

**Regras de preenchimento (no `SendEmailUseCase`):**

- O **caller** (quem dispara o email) é quem informa `recipientUserId` — ver §3.1. Nada de resolver automaticamente `to_address → user.id`.
- `NULL` é um estado **válido e esperado** em casos como:
  - Email-convite para alguém que **ainda não tem conta** (onboarding de dono de venue, convite pra membro de venue).
  - Email para endereço institucional (`contato@fornecedor.com`, notificação operacional pro time).
  - Relatórios agendados para emails fixos (`relatorios@playkourt.com`).
- Quando há fan-out (§4.5) e só parte dos destinatários são usuários conhecidos, o caller passa `recipientUserId` como array alinhado com `to`, usando `null` nas posições que não são usuários.

**Observação sobre consistência:** a coluna **não** é atualizada se o usuário mudar de email depois do envio. O registro é um snapshot histórico do que o sistema enviou, não uma view dinâmica do usuário atual. Isso é intencional — o backoffice precisa ver exatamente o email que saiu.

---

## 5. Ferramenta recomendada

### 5.1 Provedor: **Resend**

Motivos para escolher como padrão do MVP:

- DX nativa com Next.js (maintido pela Vercel) e SDK `resend` oficial pra Node.
- **React Email** é do mesmo time — templating previsível, mesma lib pra render local e envio.
- Webhooks assinados com **Svix** (biblioteca pronta: `svix` npm) — validação em 2 linhas.
- Dashboard deles já serve de "dev inbox" quando precisamos inspecionar. Para dev local sem dashboard, o `NoopEmailSender` + `/backoffice/emails` já cobre.
- Free tier de 3k emails/mês cobre MVP folgado.

### 5.2 Templating: **React Email** (`@react-email/components`, `@react-email/render`)

- Templates ficam em `src/infrastructure/services/email/templates/*.tsx` como componentes React.
- `render(<WelcomeEmail ... />)` devolve HTML + versão texto.
- Dev pode rodar `npx react-email dev` localmente para preview; não virou dependência do runtime.

### 5.3 Remetente padrão (constante em código)

O email de origem padrão fica numa **constante** no código, não em variável de ambiente — é um identidade do produto, não segredo:

```ts
// src/infrastructure/services/email/email-defaults.ts
export const DEFAULT_FROM_ADDRESS =
  "Playkourt <noreply@playkourt.com>";
```

**Regras no `SendEmailUseCase`:**

- Se `input.from` for omitido → usa `DEFAULT_FROM_ADDRESS`.
- Se `input.from` for passado (ex.: `"Relatórios Playkourt <relatorios@playkourt.com>"`) → é permitido e grava em `processed_emails.from_address`.
- Validação: domínio final do `from` precisa estar na allowlist `ALLOWED_SENDER_DOMAINS` (array em código, inicia com `["playkourt.com"]`). Fora da lista → rejeita com `InvalidSenderError`. Isso evita que um bug / caller mal configurado tente enviar como `@gmail.com` (Resend também recusa, mas falhar cedo é melhor).
- O domínio precisa estar **verificado no provedor** (DKIM/SPF no Resend) — responsabilidade de configuração, não da feature.

### 5.4 Policy de ambiente

Variáveis de ambiente:

```
EMAIL_PROVIDER=resend|ses|noop       # default: resend em prod; noop caso contrário
EMAIL_DELIVERY_ENABLED=true|false    # override explícito para forçar envio em staging
RESEND_API_KEY=...                   # obrigatório quando provider=resend
RESEND_WEBHOOK_SECRET=...            # obrigatório quando provider=resend
```

Regra única implementada em `EmailDeliveryPolicy.shouldDeliver()`:

```
if EMAIL_DELIVERY_ENABLED === "true" → true   (override manual — staging pode enviar)
if NODE_ENV === "production"         → true
otherwise                            → false
```

Quando `false`, o container retorna `Persisting(Noop)` no lugar de `Persisting(Resend)` — nenhum consumidor precisa saber disso.

**Uso prático do override em staging:** quando o time precisar testar o template real numa caixa de entrada de verdade (ex.: QA homologando layout em clientes Gmail/Outlook), liga `EMAIL_DELIVERY_ENABLED=true` temporariamente no ambiente de staging, envia o que precisa, e desliga de novo. Recomendação operacional: manter a flag em **`false`** por padrão em staging e só subir para `true` durante janelas de teste.

### 5.4 Alternativas consideradas

| Opção | Por que não agora |
|-------|-------------------|
| **Amazon SES** | Mais barato em escala, mas precisa SNS → HTTP pra webhooks, identidade/DKIM via IAM — DX pior no começo. Schema já aceita trocar depois via port. |
| **Mailtrap Email Sending + Testing** | O "Email Testing" é bom como sandbox, mas duplica o papel do `NoopEmailSender` + backoffice. Adiciona vendor lock. |
| **Postmark** | Excelente confiabilidade, mas sem React Email nativo e preço pior. |
| **Nodemailer direto em SMTP** | Perdemos webhooks e estatísticas de abertura/click sem montar infra própria. |
| **Trigger.dev / Inngest** | Útil para agendamento e retries, mas overkill pro MVP. Pode entrar para a camada de orquestração em fase 2. |

---

## 6. Contrato da API

### 6.1 `GET /api/backoffice/emails`

Headers: cookie de sessão do Better Auth.

Query params (todos opcionais):

| Param | Tipo | Validação |
|-------|------|-----------|
| `sentFrom`, `sentTo` | ISO-8601 | Se ambos presentes, `sentFrom <= sentTo`. |
| `to` | string | trim, ≤ 255 chars. `ILIKE '%x%'` sobre `to_address`. |
| `subject` | string | trim, ≤ 255 chars. `ILIKE '%x%'`. |
| `from` | string | trim, ≤ 255 chars. `ILIKE '%x%'`. |
| `recipientUserId` | string | UUID v4 exato (regex antes do banco). Match exato em `recipient_user_id`. Valor inválido → `400`. |
| `metadataKey` + `metadataValue` | string | ambos obrigatórios se um vier. ≤ 100 / 500 chars. Match exato. |
| `provider` | `resend` \| `ses` \| `noop` | |
| `status` | valor de §4.3 | |
| `page`, `pageSize` | int | `page >= 1`, `pageSize in [1, 100]`, default `1/20`. |

Resposta `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "provider": "resend",
      "providerMessageId": "re_abc123",
      "to": "user@example.com",
      "recipientUserId": "uuid | null",
      "from": "Playkourt <noreply@playkourt.com>",
      "subject": "Sua reserva foi confirmada",
      "templateName": "booking-confirmed",
      "status": "sent",
      "lastProviderStatus": "opened",
      "lastProviderStatusAt": "2026-04-21T13:22:10Z",
      "createdAt": "2026-04-21T13:20:01Z",
      "resentFromId": null
    }
  ],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

Códigos: `200`, `400`, `401`, `403`, `500` (idêntico ao padrão da spec de users).

### 6.2 `GET /api/backoffice/emails/:id`

Retorna o registro completo para o drawer de visualização: inclui `htmlBody`, `textBody`, `metadata`, `ccAddresses`, `bccAddresses`, e o array `events` (projetado de `processed_email_events` ordenado por `occurredAt DESC`, máx 50).

### 6.3 `POST /api/backoffice/emails/:id/resend`

- Body vazio (opcional `{ "reason": "texto livre" }` — grava em `metadata.resendReason`).
- Cria novo `processed_emails` com `resent_from_id = :id` e `resent_by_user_id = session.user.id`.
- Resposta `202`:
  ```json
  { "id": "uuid-do-novo-registro" }
  ```

### 6.4 `POST /api/webhooks/email/resend`

- Valida assinatura Svix (`svix-id`, `svix-timestamp`, `svix-signature`) com `RESEND_WEBHOOK_SECRET`.
- Deserializa payload, grava em `processed_email_events`, atualiza projeções em `processed_emails`.
- Respostas: `200` OK, `401` assinatura inválida, `404` email não encontrado (só loga, ainda retorna 200 pro provedor não re-tentar infinito), `500` erro inesperado.

---

## 7. Camada de código (clean architecture)

| Camada | Artefato | Caminho proposto |
|--------|----------|------------------|
| **Domain** | Porta `EmailSender` + input/result | `src/domain/email/service/email-sender.interface.ts` |
| **Domain** | Entidade `ProcessedEmail` + enums `EmailStatus`, `EmailProvider`, `ProviderStatus` | `src/domain/email/entity/*.ts` |
| **Domain** | Porta `ProcessedEmailRepository` + DTOs de leitura (`ListProcessedEmailsCriteria`, `ProcessedEmailListItem`, `ProcessedEmailDetail`) | `src/domain/email/repository/processed-email-repository.interface.ts` |
| **Application** | Use case `SendEmailUseCase` (validações, enriquece metadata, chama porta) | `src/application/use-cases/email/SendEmailUseCase.ts` |
| **Application** | Use case `ListProcessedEmailsForBackofficeUseCase` | `src/application/use-cases/backoffice/ListProcessedEmailsForBackofficeUseCase.ts` |
| **Application** | Use case `GetProcessedEmailForBackofficeUseCase` | `.../GetProcessedEmailForBackofficeUseCase.ts` |
| **Application** | Use case `ResendProcessedEmailUseCase` | `.../ResendProcessedEmailUseCase.ts` |
| **Application** | Use case `RecordEmailProviderEventUseCase` (consumido pelo webhook) | `src/application/use-cases/email/RecordEmailProviderEventUseCase.ts` |
| **Infrastructure** | `ResendEmailSender` (adapter do SDK) | `src/infrastructure/services/email/resend-email-sender.ts` |
| **Infrastructure** | `NoopEmailSender` | `src/infrastructure/services/email/noop-email-sender.ts` |
| **Infrastructure** | `PersistingEmailSender` (decorator) | `src/infrastructure/services/email/persisting-email-sender.ts` |
| **Infrastructure** | `EmailDeliveryPolicy` | `src/infrastructure/services/email/email-delivery-policy.ts` |
| **Infrastructure** | `ResendEventNormalizer` | `src/infrastructure/services/email/resend-event-normalizer.ts` |
| **Infrastructure** | Templates React Email | `src/infrastructure/services/email/templates/*.tsx` |
| **Infrastructure** | Repositório Drizzle | `src/infrastructure/repositories/drizzle/drizzle-processed-email.repository.ts` |
| **Infrastructure** | Schema Drizzle | `src/infrastructure/database/drizzle/schema/email.ts` |
| **Infrastructure** | Container/DI para compor senders | `src/infrastructure/services/email/email-container.ts` |
| **Interface (HTTP)** | Controller backoffice | `src/infrastructure/controllers/backoffice-email.controller.ts` |
| **Interface (HTTP)** | Controller webhook | `src/infrastructure/controllers/email-webhook.controller.ts` |
| **Interface (HTTP)** | Route handlers | `src/app/api/backoffice/emails/route.ts`, `.../[id]/route.ts`, `.../[id]/resend/route.ts`, `src/app/api/webhooks/email/resend/route.ts` |
| **Interface (UI)** | Página `/backoffice/emails` | `src/app/backoffice/emails/page.tsx` |
| **Interface (UI)** | Componente drawer de visualização | `src/app/backoffice/emails/_components/email-detail-drawer.tsx` |

Convenção mantida: read models no mesmo arquivo do port (padrão de `court-repository.interface.ts`, `backoffice-user-repository.interface.ts`). Enums em `entity/`.

### Composição do `EmailSender` (exemplo)

```ts
// email-container.ts
const delivery = new EmailDeliveryPolicy(env);
const real = delivery.shouldDeliver()
  ? new ResendEmailSender(env.RESEND_API_KEY)
  : new NoopEmailSender();
export const emailSender = new PersistingEmailSender(
  processedEmailRepository,
  real,
);
```

Nenhum use case sabe qual adapter está ativo — a troca entre "enviar" e "suprimir" fica 100% na composição.

---

## 8. Fluxos

### 8.1 Envio (caminho feliz, produção)

1. Use case de negócio monta dados e chama `emailSender.sendEmail(input)`.
2. `PersistingEmailSender` grava registro com `status=queued` e devolve `id` interno.
3. Chama `ResendEmailSender` → SDK → Resend.
4. Resposta com `providerMessageId` → `PersistingEmailSender` atualiza registro pra `status=sent`, `provider_message_id`.
5. Minutos depois, Resend chama webhook → `RecordEmailProviderEventUseCase` grava evento e projeta `last_provider_status=delivered`, depois `opened`, etc.

### 8.2 Envio em dev/staging

- Passos 1–2 iguais.
- Passo 3 chama `NoopEmailSender`, que retorna `{ suppressed: true }`.
- `PersistingEmailSender` grava `status=suppressed_in_env`. Nenhuma chamada de rede acontece.
- Staff abre `/backoffice/emails` e inspeciona como se tivesse sido enviado.

### 8.3 Reenvio

- Staff clica **Reenviar** → `POST /api/backoffice/emails/:id/resend`.
- Use case carrega original, cria input idêntico (pode sobrescrever `idempotencyKey` com novo UUID), chama `emailSender.sendEmail(input)`.
- Grava `resent_from_id` e `resent_by_user_id` **no registro novo** (não no antigo).

### 8.4 Falha no provedor

- `ResendEmailSender` captura erro, devolve `{ status: "failed", error: msg }`.
- `PersistingEmailSender` atualiza `status=failed` e `last_provider_error`.
- UI do backoffice mostra badge vermelho "Falhou" e habilita botão Reenviar (já habilitado sempre, na verdade).

---

## 9. Sugestões úteis pós-MVP

| Ideia | Por quê |
|-------|---------|
| **Busca fuzzy com `pg_trgm`** em `subject`/`to_address` | `ILIKE '%x%'` começa a doer quando a tabela cresce. GIN + trgm melhora. |
| **Filtro de metadados com múltiplas chaves** | API já aceita — UI limita a uma no MVP. |
| **Retry automático com backoff** para `failed` em falhas 5xx do provedor | Entraria via fila (Inngest/Trigger.dev) — ver §3.4. |
| **Agregações por template** (taxa de abertura, bounce rate) | Fase 2 com dashboard no backoffice. |
| **Impersonate "ver email como usuário"** — deep-link do backoffice pra rodar um novo envio pro próprio staff | Debug rápido de template em prod sem incomodar cliente real. |
| **Supressão de domínios** (lista de "não enviar") | Proteção de staff/QA em prod contra testes acidentais. Já dá pra fazer hoje com uma flag em `EmailDeliveryPolicy`. |
| **Webhook do SES** (quando migrar) | Reaproveita `EmailEventNormalizer`; é só escrever `SesEventNormalizer`. |
| **Purge job** | Aplicar a política de §4.4 via cron (Neon scheduled queries ou job externo). |
| **Export CSV** | Alinhado com spec de users. |
| **Templates versionados** | Guardar snapshot do template usado (hash + versão) em `metadata` pra reproduzir exatamente o que o usuário viu. |

---

## 10. Decisões fechadas

- [x] **Padrão**: email log / outbox com decorator de persistência.
- [x] **Provedor na v1: Resend.** Arquitetura pronta para migrar para **SES** depois via adapter novo que implementa a porta `EmailSender` — nenhum use case muda. `EmailEventNormalizer` ganhará um irmão `SesEventNormalizer`.
- [x] **Templating: React Email** (`@react-email/components` + `@react-email/render`).
- [x] **Remetente padrão**: `"Playkourt <noreply@playkourt.com>"` como **constante em código** (`DEFAULT_FROM_ADDRESS`). API permite outros remetentes (ex.: `relatorios@playkourt.com`) desde que o domínio esteja na allowlist `ALLOWED_SENDER_DOMAINS` (inicial: `["playkourt.com"]`) e verificado no provedor.
- [x] **Override manual em staging** permitido via `EMAIL_DELIVERY_ENABLED=true` — útil em janelas de teste de layout em caixas reais. Padrão em staging: `false`.
- [x] **Retenção**: 12 meses em `processed_emails`, 6 meses em `processed_email_events`. Registros com `metadata->>'retain' = 'permanent'` ficam fora do purge. Job de limpeza entra em fase 2.
- [x] **Reenvio cria novo registro** referenciando o original via `resent_from_id`. Campo `reason` **opcional** (grava em `metadata.resendReason`).
- [x] **Anexos: fora do MVP.** Schema não inclui `attachments`.
- [x] **Multi-destinatário**: caller decide — `to: string` = 1 envio / 1 linha; `to: string[]` = fan-out em N linhas independentes agrupadas por `metadata.groupId`.
- [x] **Destinatário-usuário**: coluna dedicada `recipient_user_id` (FK informal pro `user.id`), não em `metadata`. `NULL` quando o destinatário não é usuário do sistema. Caller informa explicitamente via `recipientUserId` no `SendEmailInput` — sem lookup automático por `to_address`. Ver §3.1 e §4.6.
- [x] **Enums em código** (não no Postgres) — alinhado à regra do projeto.
- [x] **UI fica em `/backoffice/emails`** atrás do mesmo guard da listagem de users (`withBackofficeAccess`).
- [x] **Webhook único** por provedor, idempotente por `(providerMessageId, providerEventId)`.
- [x] **HTML renderizado em iframe `sandbox`** no drawer do backoffice.

---

## 11. Critérios de aceite

1. Chamar `emailSender.sendEmail(...)` em qualquer use case **grava** o registro em `processed_emails`.
2. Em `NODE_ENV !== "production"` e `EMAIL_DELIVERY_ENABLED != "true"`, **nenhuma** requisição sai para o provedor (teste: pode rodar com `RESEND_API_KEY` vazio sem erros).
3. Em produção, o envio sai, `providerMessageId` é persistido e o webhook atualiza `last_provider_status`.
4. `/backoffice/emails` abre com a tabela paginada, filtros operando como descrito em §3.2 e §6.1.
5. Visualização mostra HTML do email dentro de iframe sandbox + timeline de eventos.
6. Reenviar cria **novo** registro com `resent_from_id` apontando pro original e `resent_by_user_id` = staff logado.
7. Usuário não-staff recebe `401/403` em `/api/backoffice/emails/*` (mesmo contrato da spec de users).
8. Webhook com assinatura inválida responde `401` e não grava evento.
9. Quando o caller passa `recipientUserId` no `SendEmailInput`, o valor é gravado em `recipient_user_id`. Filtrar por `recipientUserId` na API retorna só os emails daquele usuário. Omisso → `NULL`, sem lookup automático.

---

## 12. Dependências a adicionar

Runtime:

- `resend`
- `@react-email/components`
- `@react-email/render`
- `svix` (validação de webhook)

Dev (opcional):

- `react-email` (CLI para preview local dos templates)

---

## 13. Referências no repositório (ao implementar)

Serão preenchidas após implementação, seguindo o padrão da seção 10 da spec de users. Arquivos esperados listados em §7.

---

*Decisões consolidadas em §10. Próximo passo: implementação — começar pela migração `0008_processed_emails.sql` + schema Drizzle + porta `EmailSender`.*
