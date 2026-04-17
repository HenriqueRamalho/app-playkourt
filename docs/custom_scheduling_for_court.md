Feature: Personalização de horários de uma quadra específica
  Como dono de um estabelecimento
  Quero personalizar os horários de funcionamento de uma quadra específica
  Para que ela possa operar de forma independente do horário geral do estabelecimento

Contexto no sistema:
Quadra é court
Estabelecimento é venue


Cenário 1 — Herdar horário do estabelecimento (padrão)
Scenario: Quadra segue o horário do estabelecimento por padrão
  Given que existe uma quadra cadastrada no meu estabelecimento
  And o estabelecimento funciona de "06:00" às "23:00"
  When eu acesso as configurações de horário dessa quadra
  Then devo ver a opção "Seguir horário do estabelecimento" marcada por padrão
  And os horários exibidos devem ser "06:00" às "23:00"

Cenário 2 — Ativar horário específico para a quadra
Scenario: Dono ativa horário próprio para a quadra
  Given que a quadra está configurada para seguir o horário do estabelecimento
  When eu desmarco a opção "Seguir horário do estabelecimento"
  Then o sistema deve habilitar os campos de horário específico da quadra
  And os campos devem ser pré-preenchidos com o horário atual do estabelecimento

Cenário 3 — Definir horário reduzido por limitação física
Scenario: Quadra sem iluminação funciona apenas durante o dia
  Given que a quadra possui horário específico ativado
  When eu defino o horário de funcionamento de "06:00" às "18:00"
  And salvo as configurações
  Then a quadra deve aceitar agendamentos somente entre "06:00" e "18:00"
  And horários fora desse intervalo devem aparecer como indisponíveis

Cenário 4 — Definir horários diferentes por dia da semana
Scenario: Quadra tem horários distintos entre dias úteis e fim de semana
  Given que a quadra possui horário específico ativado
  When eu configuro de segunda a sexta das "08:00" às "22:00"
  And configuro sábado e domingo das "07:00" às "20:00"
  And salvo as configurações
  Then agendamentos de dias úteis devem respeitar o intervalo "08:00"–"22:00"
  And agendamentos de fim de semana devem respeitar o intervalo "07:00"–"20:00"

Cenário 5 — Bloquear a quadra em uma data específica
Scenario: Quadra bloqueada pontualmente para manutenção
  Given que a quadra possui horário específico ativado
  When eu adiciono uma exceção de bloqueio total para o dia "20/04/2026"
  And salvo as configurações
  Then nenhum agendamento deve ser permitido nessa quadra no dia "20/04/2026"
  And agendamentos já existentes nessa data devem ser sinalizados para o dono revisar
  And antes de confirmar o bloqueio também deve ser exibido para o dono da quadra que existem agendamentos previstos neste dia

Cenário 6 — Bloquear um período parcial do dia por contrato fixo
Scenario: Quadra indisponível pela manhã por contrato com escola
  Given que a quadra possui horário específico ativado
  When eu adiciono um bloqueio recorrente de "07:00" às "12:00" de segunda a sexta
  And salvo as configurações
  Then agendamentos avulsos nesse intervalo devem ser bloqueados
  And o restante do horário da quadra deve permanecer disponível para reservas

  Obs: No futuro será feito uma administração de mensalistas, porém aqui se trata de um bloqueio recorrente apenas.


Cenário 7 — Reverter para o horário do estabelecimento
Scenario: Dono desativa o horário específico da quadra
  Given que a quadra possui horário específico configurado de "08:00" às "18:00"
  When eu marco novamente a opção "Seguir horário do estabelecimento"
  And confirmo a ação
  Then o horário da quadra deve voltar a seguir o do estabelecimento
  And as configurações específicas anteriores devem ser descartadas

