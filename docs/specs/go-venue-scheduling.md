# Spec (UX): Visualização e agendamento de quadras de um venue

**Tipo:** melhoria de UX
**Abordagem:** spec driven development (SDD) — foco em fluxo/UI, sem amarrar implementação de API/domínio
**Rota alvo (atual):** `/go/venue/[venueId]/scheduling` e `/go/scheduling/[courtId]`
**Rota alvo (proposta):** `/go/venue/[venueId]/scheduling` (tela única)
**Status:** design — não implementado.
**Specs relacionadas:**

- `docs/custom_scheduling_for_court.md` — modelo de horários/bloqueios por quadra (já implementado no domínio via `CourtSchedule`).
- `docs/roadmap.md` — produto.

---

## 1. Objetivo

Reduzir para **um único passo visual** a resposta à pergunta *"tem horário bom pra mim neste venue?"*, permitindo que o usuário:

1. Veja, em uma só tela, todas as quadras do venue e seus horários disponíveis nos próximos **7 dias**.
2. Compare facilmente quadras (esporte, preço, janelas livres) sem entrar/sair de páginas intermediárias.
3. Confirme a reserva com poucos toques, com a mesma facilidade no celular e no desktop.

Meta secundária: deixar a tela apresentável o suficiente para servir como *vitrine* do venue — já que hoje ela é a primeira impressão real do produto para o cliente final.

---

## 2. Problemas do fluxo atual

Revisão honesta de `src/app/go/venue/[venueId]/scheduling/page.tsx` + `src/app/go/scheduling/[courtId]/page.tsx`:


| #   | Problema                                                                                                      | Impacto                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Dois cliques obrigatórios até *descobrir* se há horário bom (venue → quadra → formulário)                     | Usuário que quer "19h hoje" testa quadra por quadra no tentativa-e-erro      |
| 2   | Impossível comparar quadras lado a lado (preço, janelas livres, esporte)                                      | Decisão pobre; usuário desiste ou reserva subótimo                           |
| 3   | Seleção de data via `<input type="date">` nativo — pouco descobrível, sem visualização da ocupação            | No mobile o picker nativo é bom, mas quebra a sensação de "timeline semanal" |
| 4   | Lista de quadras não dá pista de ocupação ("essa está lotada hoje?")                                          | Usuário gasta tempo em opções sem espaço                                     |
| 5   | Forma + select de horário + select de duração = UX de formulário bancário                                     | Afastado do padrão de apps de reserva modernos                               |
| 6   | Sem feedback quando não há slot: usuário não é orientado a "ver o próximo dia com vaga"                       | Abandono                                                                     |
| 7   | Header de venue (endereço + horário de funcionamento) ocupa muito espaço e empurra o conteúdo útil para baixo | Mobile especialmente penalizado                                              |


---

## 3. Referências de mercado

A pesquisa foca em quem já resolveu esse problema bem (reserva de tempo/recurso):

### Categoria A — Reserva de quadras (concorrentes diretos)

- **Playtomic** *(padel/tenis, referência dominante na Europa/LatAm)* — tela combinada com data em pills no topo, seletor de duração em chip, e uma grade onde cada quadra é uma linha com janelas de horário clicáveis. É provavelmente o melhor benchmark direto.
- **MATCHi** *(Escandinávia, multisport)* — timeline horizontal com grid `quadras × horas`; células verdes = livre, cinzas = ocupado. Excelente no desktop; no mobile colapsa para lista por quadra com chips de horário.
- **ClubSpark / Ace Padel** — mesmo padrão grid, ligeiramente mais denso.
- **Alquila Tu Cancha / Reserva.com** *(LatAm)* — lista de quadras → chips de horário horizontais. Referência boa para mobile simples.

### Categoria B — Seleção de time slot (fora do esporte)

- **OpenTable / TheFork** — mostra, por restaurante, chips de horário próximos para uma data/comensais. Excelente modelo de "time chips" compactos e clicáveis em mobile.
- **Calendly / Cal.com** — data ao lado dos slots, com tipografia limpa e espaçamento generoso. Bom para inspirar a **confirmação** em drawer/sheet.
- **Booksy / Fresha** *(salões)* — grid vertical de profissionais × horas no mobile com scroll horizontal dos horários.

### Categoria C — Navegação de data

- **Airbnb** — calendário com pista de disponibilidade por dia (barras/pontos).
- **Google Flights** — pills horizontais de datas com preço/indicador por dia; ótimo padrão pra empurrar o usuário pra dias com melhor oferta.

### O que extraímos


| Padrão                                                                   | De onde                                        | Aplicamos?          |
| ------------------------------------------------------------------------ | ---------------------------------------------- | ------------------- |
| Data em **pills horizontais** (7 dias) com indicador de ocupação por dia | Playtomic, Google Flights                      | **Sim** — primário  |
| Grid **quadras × horas** com células clicáveis                           | MATCHi, Playtomic, Booksy                      | **Sim, no desktop** |
| Lista por quadra com **chips de horário scrolláveis**                    | Playtomic mobile, OpenTable, Alquila Tu Cancha | **Sim, no mobile**  |
| Duração como **segmented control** (1h / 1h30 / 2h)                      | Playtomic                                      | **Sim**             |
| Confirmação em **bottom sheet** (mobile) / **drawer lateral** (desktop)  | Cal.com, Booksy                                | **Sim**             |
| Empty state com **"próxima data com vaga"**                              | Airbnb, Google Flights                         | **Sim**             |


---

## 4. Decisão de fluxo (com trade-offs)

### Opção considerada A — manter duas páginas, melhorar cada uma

Prós: menor mudança; fica mais simples por página.
Contras: **o problema raiz (dois cliques pra descobrir horário) permanece**. Só trocamos a cortina da mesma porta. Continua ruim no mobile porque o usuário precisa entrar/sair pra comparar quadras.

### Opção considerada B — tela única com grid unificado *(adotada)*

Prós:

- Resolve o problema real: o usuário vê tudo que importa em uma tela.
- Alinha-se ao padrão dos concorrentes diretos (Playtomic, MATCHi) — o que é UX "aprendida" pra boa parte dos clientes.
- Reduz pull-to-refresh, back-navigations e estados intermediários.

Contras:

- Mais densidade na tela: exige design cuidadoso (hierarquia, tamanhos de toque).
- Mais dados carregados de uma vez (todas as quadras × 7 dias × slots) — precisa atenção à performance (ver §9).

### Opção considerada C — fluxo "hora primeiro"

(Ex.: "mostre todas as quadras livres hoje às 19h".)

Prós: ótimo pra quem tem horário fixo.
Contras: perde a identidade da quadra (nome/preço/esporte) na primeira rolada; ruim pra quem está decidindo *onde* jogar. Melhor como **filtro complementar**, não como tela principal.

### Escolha

**Opção B — tela única**, combinando:

- **Desktop (≥ md)**: grid `quadras × horas`.
- **Mobile (< md)**: lista vertical de quadras com chips de horário em scroll horizontal.
- Fase 2 (§11): toggle "vista por horário" que ativa a opção C como filtro.

A URL continua sendo `/go/venue/[venueId]/scheduling`. A rota `/go/scheduling/[courtId]` deixa de ser ponto de entrada do usuário, mas permanece viva como **deep link** (ex.: compartilhar uma quadra específica) — abre a mesma tela do venue já com aquela quadra em destaque (rolagem até a linha; sem mudar o grid).

---

## 5. Anatomia da tela

### 5.1 Cabeçalho (compacto)

Mobile e desktop: **uma única linha de informação** (não card).

- Linha 1: nome do venue (título grande) + botão "Voltar" à esquerda.
- Linha 2: endereço resumido (bairro · cidade) + link "Ver detalhes" que abre o drawer lateral com endereço completo, telefone e **horários de funcionamento do venue** (que hoje ocupam meio ecrã à toa).
- Sem card; só tipografia e um `MapPin`/`Phone` ícone inline.

> O card volumoso de "Horário de funcionamento" que existe hoje vira um **detalhe opcional** no drawer — o que o usuário precisa saber é quando cada quadra está aberta, não o venue como um todo.

### 5.2 Barra de controles (sticky no topo após scroll)

Sempre visível enquanto o usuário navega pela grade. Ordem:

1. **Data** — pills horizontais dos próximos 7 dias.
  - Rótulos: "Hoje", "Amanhã", depois abreviação + dia (`Qua 22`).
  - Cada pill mostra um **indicador de ocupação** (discreto): um pontinho/barra em verde (≥50% livre), âmbar (<50%), ou ausência quando fechado. Baseado em referência do Google Flights/Airbnb.
  - Scroll horizontal no mobile; no desktop cabe no width da página.
2. **Duração** — segmented control: `1h` / `1h30` / `2h` / `+`. O botão `+` abre um stepper com outras durações permitidas pela quadra (mantém compatibilidade com o array atual de `DURATION_OPTIONS`).
3. **Esporte** — toggle group já existente, só aparece se o venue tem mais de um esporte. Posicionado à direita.

No mobile, controles ficam em duas linhas (data acima; duração + esporte abaixo).

### 5.3 Corpo — desktop (≥ md)

**Grid `quadras × horas`** estilo Playtomic/MATCHi:

```
               06  07  08  09  ... 21  22  23
Quadra 1 (P)   ·   ·   X   X   ·   ·   ·   ·
Quadra 2 (T)   X   X   ·   ·   ·   ·   ·   ·
Quadra 3 (P)   ·   ·   ·   ·   ·   ·   ·   ·
```

- **Coluna esquerda fixa** (sticky): nome da quadra + badge do esporte + preço/hora.
- **Colunas de hora** em intervalos de **30 minutos** (mesmo intervalo do domínio `CourtSchedule.getAvailableSlots`), com marcações visuais a cada hora cheia.
- **Células**:
  - *Disponível*: fundo leve (tom secundário), cursor pointer, hover mostra tooltip com horário exato e preço para a duração escolhida.
  - *Ocupada*: fundo sólido cinza, sem interação.
  - *Bloqueada* (ex.: bloqueio recorrente por escola): hachurada com tooltip do motivo (`reason`) — reaproveita `schedule.getBlocksForDate`.
  - *Fora do horário de funcionamento*: sem preenchimento (cor do fundo da tela) — o cinza é reservado para "ocupada".
- **Hora atual**: se a data selecionada é hoje, uma linha vertical sutil marca a hora atual (tipo Google Calendar). Horários passados ficam visualmente atenuados e não clicáveis.
- **Hover em célula disponível** realça a "faixa" correspondente à duração (ex.: se duração = 2h, passar o mouse em `19:00` destaca `19:00–21:00`). Isso antecipa o que será reservado e dá feedback sobre conflitos.
- Clique em célula → abre **drawer de confirmação** (§5.5).

### 5.4 Corpo — mobile (< md)

Grid não funciona em telas estreitas. Usamos o padrão **lista por quadra + chips de horário**:

```
┌────────────────────────────────────────────┐
│ Quadra 1 — Padel · R$ 120/h                │
│ [08:00] [08:30] [09:00] [09:30] [10:00] →  │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────┐
│ Quadra 2 — Tênis · R$ 90/h                 │
│ Sem horários disponíveis nesta data.       │
│ [Ver próxima data com vaga →]              │
└────────────────────────────────────────────┘
```

- **Card por quadra**, compacto (sem descrição longa; texto da quadra como subtítulo opcional).
- **Chips de horário** em scroll horizontal — 44×40px de toque mínimo (acima do 44pt recomendado).
- Chips mostram `HH:MM` (hora de início). Duração vem da barra de controles.
- Primeiro chip da linha alinhado à esquerda; a rolagem começa pelo horário *imediatamente após* a hora atual (se a data for hoje), de modo que o usuário não precise dar swipe pra ver algo relevante.
- Tap no chip → **bottom sheet** de confirmação (§5.5).

### 5.5 Confirmação da reserva (drawer / bottom sheet)

Mesmo conteúdo nos dois breakpoints, layout adaptado:

- **Desktop**: drawer lateral direito (~420px), fica aberto sobre a grid.
- **Mobile**: bottom sheet.

Campos:

1. Resumo da seleção em uma linha forte: **"Quadra 1 · Qua 22 Abr · 19:00–20:30"**.
2. **Stepper de duração** para ajuste fino sem fechar o sheet (+30min, até o limite do slot). Se o ajuste tornar a janela inviável, desabilita o botão principal e mostra o motivo.
3. Preço final destacado (duração × `pricePerHour`).
4. (Opcional, quando existir) campo "Observação" (ex.: "jogo com amigos") — fora de escopo do MVP desta spec.
5. CTA primário: **"Reservar"** — reaproveita `goService.createBooking`. Em sucesso, vai para `/go/reservations` como hoje.
6. Link secundário: "Trocar de quadra" → fecha o sheet, mantém data/horário selecionados, destaca linhas do grid com o mesmo horário livre (quando for o caso).

O sheet **não navega** — abre sobre a tela. Isso preserva a sensação de "uma tela só".

---

## 6. Estados vazios e bordas


| Situação                                                      | Tratamento                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Venue sem quadras                                             | Tela já dá placeholder; mantemos ("Nenhuma quadra disponível para esta modalidade.")                                                                                                                                                                                                                  |
| Data selecionada sem qualquer horário livre em nenhuma quadra | Banner central: **"Nenhum horário disponível nesta data. Ver próxima data com vaga →"**. O link salta para a próxima das 7 pills que tem disponibilidade. Se nenhuma das 7, banner muda para "Nenhuma vaga nos próximos 7 dias" + telefone do venue.                                                  |
| Quadra fechada no dia (`schedule.isDateOpen === false`)       | No desktop, linha inteira recebe estado "cortina" (fundo listrado) com motivo (`getClosedReason`) na lateral. No mobile, card da quadra substitui chips por uma frase com o motivo.                                                                                                                   |
| Bloqueio recorrente parcial (ex.: escola das 07–12h)          | Célula hachurada com tooltip. No mobile, chips simplesmente não aparecem para esse intervalo — o usuário vê só horários viáveis.                                                                                                                                                                      |
| Horário clicado ficou indisponível entre exibir e confirmar   | No submit, mostrar erro no próprio sheet ("Esse horário acabou de ser reservado — escolha outro") e **invalidar** o slot na UI.                                                                                                                                                                       |
| Usuário não logado                                            | Ao tentar reservar (click em chip/célula), mandar para `/auth/login?next=...` preservando a intenção. Hoje o redirecionamento é feito ao entrar na página de agendamento — neste fluxo, postergar até o momento do primeiro clique de reserva melhora a conversão (deixa o usuário *explorar* antes). |


---

## 7. Filtros e navegação secundária

- **Filtro de esporte** (já existente) permanece como toggle group; no grid desktop ele esconde as linhas das quadras não correspondentes; no mobile, os cards.
- **Seleção de duração** influencia quais slots aparecem clicáveis (durações maiores reduzem slots). Hoje o cálculo já é `schedule.getAvailableSlots(date, durationHours)` — basta usar por quadra.
- Nada de *multi-venue*/busca nesta tela. Busca continua em `/go`.

---

## 8. Acessibilidade e toque

- Todos os alvos clicáveis com **≥ 40×40px** (idealmente 44×44 para mobile).
- Grid desktop: navegação por teclado (`←/→` move entre colunas, `↑/↓` entre quadras, `Enter` abre o sheet). Referência: Google Calendar.
- Tooltips via `aria-describedby`; motivo de bloqueio acessível também em modo "long press"/focus no mobile.
- Contraste das células disponível / ocupada em modo claro e escuro: ocupada precisa ser *claramente* não-interativa (sem apenas "cinza diferente de cinza").
- Anunciar mudanças de estado com `aria-live` na barra de controles ao trocar data/duração ("3 quadras com disponibilidade em 22 de abril.").

---

## 9. Performance e dados

Intencionalmente fora do escopo desta spec — mas dois pontos que impactam a UX e não podem ser ignorados:

- O dado necessário para a tela é: **todas as quadras do venue** + **slots disponíveis** para **cada quadra × cada um dos 7 dias × duração escolhida**. Hoje `goService.getVenueWithCourts(venueId)` traz as quadras mas sem slots; e `getAvailableSlots` é calculado no cliente a partir de `businessHours + exceptions + recurringBlocks`, o que **não considera reservas existentes** de outros usuários.
- O ponto cego atual: o filtro "ocupada" não existe ainda — `CourtSchedule.getAvailableSlots` só exclui fechamento e bloqueios, não reservas. **Para esta tela funcionar, o backend precisa considerar reservas ao devolver slots disponíveis** (ou expor reservas por quadra/data para o cliente subtrair). Essa é a principal dependência técnica.
- Contrato mínimo esperado (sugestão, **não** final):
  ```
  GET /api/go/venues/:venueId/availability?from=YYYY-MM-DD&days=7&durationHours=1
  → { courts: [{ id, name, sportType, pricePerHour,
                 byDate: { 'YYYY-MM-DD': { openSlots: ['08:00', ...],
                                           blocks: [{start, end, reason}],
                                           closedReason?: string } } }] }
  ```
  Mantém o cálculo no servidor, onde reservas vivem, e devolve algo pronto pra renderizar.
- Pills de data carregam um sumário barato (`occupancyHint`) por dia para pintar o indicador (§5.2) sem carregar a grade inteira.

Implementação e modelagem ficam para spec complementar quando for executar.

---

## 10. Critérios de aceite (UX)

1. Usuário entra em `/go/venue/:id/scheduling` e vê, sem rolar no desktop, pelo menos 3 quadras com seus horários de hoje.
2. Trocar a pill de data **não** recarrega a página; a grade atualiza em < 300ms em rede normal.
3. No mobile, é possível reservar um horário em **no máximo 3 toques** a partir da entrada na tela: (a) pill da data (se não for hoje), (b) chip do horário, (c) botão "Reservar" no bottom sheet.
4. Em qualquer célula disponível do desktop, o hover destaca a faixa correspondente à duração atual (ex.: `19:00–20:30` para duração 1h30).
5. Se a data escolhida não tem nenhum horário livre em nenhuma quadra, a UI sugere pular para a próxima data com vaga dentro dos 7 dias, sem digitar.
6. Deep link `/go/scheduling/:courtId` abre a mesma tela do venue já rolada até a quadra correspondente, com a linha em destaque.
7. Header do venue (endereço + horário de funcionamento) **não ocupa mais do que uma linha visível** acima da fold do mobile.
8. Tentativa de reservar slot que virou indisponível entre render e submit exibe erro dentro do sheet e invalida o slot na grade sem fechar o sheet.
9. Navegação por teclado no grid permite chegar de `Hoje` até um slot clicável sem usar mouse, com indicadores de foco visíveis.
10. Contraste e hit areas do grid e dos chips passam em WCAG AA tanto no tema claro quanto escuro.

---

## 11. Fora do escopo / ideias de fase 2


| Ideia                                                                         | Por quê                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Vista "por horário"** como alternativa ao grid (opção C do §4)              | Para o cliente que só quer "qualquer quadra às 19h". Entra depois, baseado em uso. |
| **Favoritar quadra**                                                          | Personalização; fila de "minhas quadras" no topo.                                  |
| **Preço dinâmico** (noturno, fim-de-semana)                                   | Depende do modelo de preços suportar variação; hoje é `pricePerHour` simples.      |
| **Indicador "últimas vagas"**                                                 | Quando restam N ou menos slots no dia; precisa definir N e evitar dark-patterns.   |
| **Compartilhar uma quadra/horário** via link (com pré-seleção no drawer)      | Extensão natural do deep link do §10.6.                                            |
| **Carrossel de fotos por quadra** na linha esquerda do grid ou no card mobile | Vitrine; depende de suporte a imagens na entidade `court`.                         |
| **Notificar quando abrir vaga** em slot lotado                                | Conversão quando o dia preferido está cheio.                                       |
| **Visualização semanal "minha agenda"** (vista de usuário, não de venue)      | Fica em `/go/reservations`, não aqui.                                              |


---

## 12. Decisões fechadas

- **Tela única** (uma rota só) substitui o fluxo atual de duas páginas.
- **Desktop:** grid quadras × horas (estilo Playtomic/MATCHi).
- **Mobile:** lista por quadra com chips de horário em scroll horizontal (estilo Playtomic/OpenTable).
- **Horizonte de agendamento:** 7 dias à frente, em pills horizontais.
- **Granularidade do slot:** 30 minutos (mantém o que o domínio já faz).
- **Confirmação:** drawer lateral no desktop, bottom sheet no mobile — **sem** mudar de rota.
- **Rota legada** `/go/scheduling/:courtId` sobrevive como deep link, abre a nova tela do venue com a quadra em destaque.
- **Login exigido no momento do click de reserva**, não ao entrar na tela — permite exploração livre.
- **Filtro de esporte** permanece; não é dominante.
- **Indicação de ocupação por dia** nas pills do topo (implementação fica para a spec técnica).

Itens que permanecem em aberto (a decidir na execução):

- Formato exato da API de disponibilidade (§9).
- Se o cálculo de slot com reservas fica no servidor ou no cliente.
- Tokens de cor específicos para "ocupada / bloqueada / fora de horário" no design system.
- Se o sheet de confirmação incorpora pagamento no futuro ou só agenda (como hoje).

---

*Documento de spec UX (SDD). Uma spec técnica complementar (API, camadas de código, contratos de dados) deve acompanhar esta antes da implementação.*