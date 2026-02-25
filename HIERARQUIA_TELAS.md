# NODUS — Mapeamento de Telas por Nível RBAC Hierárquico

## Visão Geral da Estrutura

O sistema NODUS segue o modelo **HRBAC (Hierarchical Role-Based Access Control)**, onde permissões descem na hierarquia e cada nível superior herda visibilidade sobre os níveis inferiores. A estrutura contempla quatro tipos de **tenants** (instâncias de clientes) e quatro níveis de acesso.

| Nível | Papel | Escopo |
|-------|-------|--------|
| 0 | Super Admin | Todo o SaaS (cross-tenant) |
| 1 | Tenant Admin | Franquia / Academia / Treinador Independente |
| 2 | Operacional | Recepcionista / Professor (intra-tenant) |
| 3 | Usuário Final | Aluno / Atleta (dados próprios) |

***

## NÍVEL 0 — Super Admin (Dono do SaaS)

Acesso irrestrito a todos os tenants, dados e configurações do sistema.

### Gestão de Tenants
- `Listagem de Tenants` — tabela com todos os clientes (Franquias, Academias, Treinadores), status de assinatura, data de criação, plano ativo
- `Cadastro de Novo Tenant` — formulário de criação de organização (tipo, nome, CNPJ/CPF, responsável, plano)
- `Editar Tenant` — edição de dados cadastrais, plano, status (ativo/suspenso/cancelado)
- `Detalhes do Tenant` — visão consolidada: usuários, sessões, atletas cadastrados, sensores conectados

### Planos e Assinatura
- `Listagem de Planos` — tabela de planos disponíveis (Basic, Pro, Enterprise) com recursos e limites
- `Criar/Editar Plano` — configuração de features habilitadas por plano, limites de atletas/sessões/sensores
- `Histórico de Cobranças` — fatura por tenant, status de pagamento, valor, data de vencimento

### Financeiro Global
- `Dashboard Financeiro` — MRR (Monthly Recurring Revenue), ARR, churn rate, novos clientes por período
- `Relatório de Receita` — receita por plano, por período, por tipo de tenant
- `Inadimplências` — tenants com pagamento em atraso, ações (suspender, notificar, cancelar)

### Monitoramento Global
- `Dashboard de Saúde do Sistema` — uptime, latência de WebSocket, sensores ativos globais, sessões em curso
- `Logs de Sistema` — erros, eventos críticos, ações administrativas (auditoria)
- `Monitoramento de Sessões Ativas` — visão de todas as sessões em tempo real em todos os tenants

### Configurações do Sistema
- `Integrações Globais` — configuração de gateways de pagamento, provedores de e-mail/SMS, APIs externas
- `Parâmetros de Zonas de FC` — definição dos limites padrão de zonas (Z1–Z5) usados como base
- `Configurações de Gamificação Global` — regras de pontuação padrão do sistema
- `Gerenciamento de Usuários Internos` — equipe interna do SaaS (suporte, desenvolvedores, financeiro)
- `Gerenciamento de Permissões (RBAC)` — editor de roles e permissões por tipo de tenant/nível
- `Versionamento e Changelogs` — controle de versões do sistema, release notes

***

## NÍVEL 1-A — Tenant Admin: Franqueador (Rede de Academias)

Visibilidade consolidada de todas as unidades da rede. Não vê dados de outras franquias.

### Dashboard da Franquia
- `Dashboard Consolidado da Rede` — resumo de todas as unidades: total de atletas, sessões do dia, média de FC, calorias, sensores ativos
- `Comparativo entre Unidades` — tabela/gráfico comparando performance, presença, engajamento por unidade

### Gestão de Unidades
- `Listagem de Unidades` — tabela com nome, cidade, responsável, total de atletas, status
- `Cadastro de Nova Unidade` — formulário de criação de academia vinculada à franquia
- `Editar Unidade` — edição de dados da unidade, responsável, limites
- `Detalhes da Unidade` — visão consolidada de uma unidade específica

### Gestão de Funcionários da Rede
- `Listagem de Funcionários (rede)` — todos os funcionários de todas as unidades com role, unidade e status
- `Cadastro de Funcionário` — nome, CPF, cargo, unidade vinculada, e-mail, senha inicial
- `Editar Funcionário` — alteração de dados, cargo, unidade
- `Inativar/Reativar Funcionário`

### Gestão de Atletas da Rede
- `Listagem de Atletas (rede)` — todos os atletas de todas as unidades com filtros por unidade
- `Cadastro de Atleta` — formulário completo (dados pessoais, avaliação física, sensor vinculado)
- `Perfil do Atleta` — histórico de treinos, carga interna, avaliações, gráficos de evolução
- `Transferir Atleta entre Unidades`

### Sessões e Monitoramento
- `Calendário de Sessões (rede)` — visão de todas as sessões agendadas em todas as unidades
- `Monitoramento em Tempo Real (rede)` — acesso para acompanhar qualquer sessão ao vivo em qualquer unidade
- `Histórico de Sessões (rede)` — listagem com filtros por unidade, modalidade, data

### Relatórios da Franquia
- `Relatório de Presença (rede)` — presença por unidade, por período, por turma
- `Relatório de Engajamento` — frequência, assiduidade, tempo ativo por atleta
- `Relatório de Carga Interna (rede)` — TRIMP, ACWR, Training Effect consolidados por unidade
- `Relatório Financeiro (rede)` — receita por unidade (se gestão financeira habilitada no plano)

### Gamificação da Rede
- `Ranking Geral da Rede` — ranking de atletas de todas as unidades
- `Criar Desafio da Rede` — competições que abrangem todas as unidades
- `Histórico de Desafios`

### Configurações da Franquia
- `Dados da Franquia` — nome, CNPJ, logo, contato, endereço sede
- `Configurações de Zonas de FC` — personalização das zonas para a rede
- `Configurações de Planos de Atleta` — planos de matrícula disponíveis na rede
- `Notificações e Alertas` — configuração de alertas automáticos (FC crítica, ausência prolongada)
- `Configurações de Gamificação` — regras de pontos, badges e desafios da franquia

***

## NÍVEL 1-B — Tenant Admin: Academia Única (Dono/Gestor)

Controle total de sua única unidade. Escopo idêntico a uma unidade de franquia, mas sem hierarquia acima de si (exceto o Super Admin).

### Dashboard da Academia
- `Dashboard da Academia` — resumo do dia: sessões ativas, atletas conectados, média de FC, calorias, alertas

### Gestão de Funcionários
- `Listagem de Funcionários` — tabela com nome, cargo (recepcionista/professor), status
- `Cadastro de Funcionário` — formulário com dados pessoais, cargo, permissões, senha inicial
- `Editar Funcionário` — edição de dados e cargo
- `Inativar/Reativar Funcionário`
- `Histórico de Ações do Funcionário` (auditoria)

### Gestão de Atletas
- `Listagem de Atletas` — tabela com foto, nome, plano, status financeiro, último treino, sensor
- `Cadastro de Atleta` — formulário: dados pessoais, avaliação física, histórico médico, sensor, plano
- `Perfil Completo do Atleta` — histórico de treinos, evolução física, gráficos de FC, carga interna
- `Editar Atleta`
- `Inativar/Reativar Atleta`
- `Importar Atletas em Massa` (CSV)

### Gestão de Sessões
- `Calendário de Sessões` — agenda semanal/mensal com turmas e horários
- `Criar Sessão` — modalidade, professor, horário, capacidade, tipo (spinning, funcional, CrossFit, etc.)
- `Editar/Cancelar Sessão`
- `Histórico de Sessões` — listagem com dados de cada sessão encerrada

### Monitoramento em Tempo Real
- `Tela de Monitoramento ao Vivo` — grid de tiles com BPM, zona, calorias por atleta
- `Tela TV/Projetor` — versão full-screen otimizada para exibição em academia
- `Painel do Coach` — visão com lista de atletas + gráfico de FC do grupo + alertas

### Sensores e Hardware
- `Listagem de Sensores` — todos os sensores (cintos ANT+, BLE) com status (ativo/inativo/bateria)
- `Vincular Sensor a Atleta`
- `Diagnóstico de Sensor` — últimas leituras, qualidade do sinal, histórico de erros

### Carga Interna e Relatórios
- `Relatório de Carga Interna` — TRIMP, ACWR, Training Effect por atleta ou grupo
- `Relatório de Presença` — presença por atleta, turma, período
- `Relatório de Evolução` — histórico de avaliações físicas, comparativo
- `Relatório de Sessão` — sumário pós-sessão: FC média, tempo em zonas, calorias, participantes
- `Exportar Dados` (CSV, PDF)

### Gamificação
- `Ranking da Academia` — ranking por calorias, MEPs ou tempo em zona alvo
- `Criar Desafio` — nome, critério, período, prêmio/badge
- `Gerenciar Badges` — criar, editar, atribuir badges manualmente
- `Histórico de Desafios`

### Financeiro (se habilitado)
- `Listagem de Mensalidades` — status de pagamento por atleta (pago, em atraso, a vencer)
- `Registrar Pagamento Manual`
- `Relatório Financeiro` — receita, inadimplência, projeção

### Configurações da Academia
- `Dados da Academia` — nome, CNPJ, logo, endereço, contato
- `Personalização de Zonas de FC` — limites de Z1–Z5, paleta de cores
- `Modalidades de Aula` — lista e cadastro de tipos de aula
- `Planos de Matrícula` — tipos de plano, valor, duração
- `Notificações` — alertas de FC crítica, ausências, aniversários
- `Integrações` — webhook, API externa, exportação automática
- `Configurações de Gamificação` — regras de pontos e desafios

***

## NÍVEL 1-C — Tenant Admin: Treinador Independente (Micro-Tenant)

Opera como uma academia de uma pessoa só. Interface simplificada, foco em atletas individuais e grupos pequenos.

### Dashboard Pessoal
- `Dashboard do Treinador` — atletas ativos, sessões da semana, atletas sem treino recente, alertas

### Gestão de Atletas
- `Listagem de Atletas` — tabela compacta com nome, objetivo, último treino, sensor
- `Cadastro de Atleta` — formulário simplificado (dados pessoais, objetivo, sensor, FC máx estimada)
- `Perfil do Atleta` — histórico, evolução, gráficos, anotações do treinador
- `Editar Atleta`

### Sessões e Monitoramento
- `Calendário de Sessões` — agenda pessoal de treinos
- `Criar Sessão` — modalidade, atletas participantes, data/hora
- `Monitoramento ao Vivo` — painel com tiles dos atletas da sessão
- `Histórico de Sessões`

### Prescrição de Treino
- `Planos de Treino` — criação e gestão de periodizações
- `Prescrição de Sessão` — séries, cargas, metas de zona de FC para a sessão
- `Daily Log` — registro diário de bem-estar, sono, dor, HRV do atleta

### Carga Interna e Relatórios
- `Relatório de Carga Interna` — TRIMP, ACWR, Training Effect por atleta
- `Relatório de Evolução` — histórico de avaliações e métricas
- `Relatório de Sessão` — sumário pós-sessão por atleta

### Gamificação
- `Ranking do Grupo` — ranking dos seus atletas
- `Criar Desafio Pessoal` — metas para atletas individuais ou grupo

### Configurações
- `Dados Pessoais` — nome, CPF, CREF, foto, contato
- `Personalização de Zonas de FC`
- `Notificações`

***

## NÍVEL 2-A — Operacional: Recepcionista

Foco em operações administrativas do dia a dia. **Bloqueado** para dados financeiros do dono, relatórios técnicos de treino e configurações do sistema.

### Início
- `Dashboard Recepção` — check-ins do dia, atletas presentes, pagamentos do dia, aniversariantes

### Atletas
- `Listagem de Atletas` — versão com colunas: nome, plano, status financeiro, último check-in *(sem dados de treino técnico)*
- `Cadastro de Atleta` — formulário básico: dados pessoais, plano, contato, foto *(sem campos de avaliação física)*
- `Editar Dados Cadastrais do Atleta` *(sem acesso ao perfil de treino)*
- `Controle de Presença` — check-in manual ou por QR code
- `Histórico de Presença do Atleta`

### Financeiro (limitado)
- `Listagem de Pagamentos` — status de pagamento por atleta (pago/em atraso/a vencer)
- `Registrar Pagamento` — confirmar recebimento de mensalidade
- `Emitir Comprovante de Pagamento`
- `Relatório de Inadimplência` *(apenas lista de devedores, sem valores de receita total)*

### Sessões (somente visualização)
- `Calendário de Sessões` — visualizar turmas e horários *(sem criar ou editar)*
- `Confirmar Presença em Sessão` — marcar atleta presente em turma

### Configurações Pessoais
- `Meu Perfil` — dados pessoais, foto, senha

***

## NÍVEL 2-B — Operacional: Professor / Coach

Foco em prescrição de treino, monitoramento e evolução dos atletas. **Bloqueado** para dados financeiros, relatórios de receita e configurações da academia.

### Início
- `Dashboard do Professor` — sessões do dia, atletas aguardando, alertas de carga (ACWR elevado), mensagens de atletas

### Atletas
- `Listagem de Atletas` *(da(s) sua(s) turma(s))* — nome, objetivo, sensor, status de FC, data do último treino
- `Perfil do Atleta` — histórico de treinos, evolução física, gráficos de FC, anotações
- `Editar Dados de Treino do Atleta` — objetivos, FC máxima, zonas personalizadas
- `Ficha de Avaliação Física` — inserir/editar dados de avaliação
- `Anotações do Treinador` — campo de notas técnicas e comportamentais por atleta
- `Daily Log do Atleta` — visualizar e inserir registros diários (bem-estar, sono, HRV)

### Sessões
- `Calendário de Sessões` *(apenas suas turmas)* — visualizar e editar suas sessões
- `Criar Sessão` — nova sessão nas suas turmas com modalidade e participantes
- `Prescrição de Sessão` — metas de zona, séries, cargas, observações para a aula
- `Iniciar Sessão` — ativar o monitoramento ao vivo
- `Encerrar Sessão` — finalizar e gerar sumário

### Monitoramento em Tempo Real
- `Tela de Monitoramento ao Vivo` — grid de tiles com BPM, zona, calorias, tempo em zona
- `Painel do Coach (Coach View)` — visão detalhada com alertas de zona crítica, lista de atletas, gráfico de FC do grupo
- `Tela TV/Projetor` *(iniciar modo TV)*

### Carga Interna
- `Relatório de Carga Interna por Atleta` — TRIMP, ACWR, Training Effect, gráfico de 28 dias
- `Relatório de Sessão` — sumário da sessão encerrada: FC média, tempo em zonas, calorias
- `Relatório de Presença` *(apenas suas turmas)*
- `Planejamento de Carga` — visualização do plano de periodização com carga prevista vs realizada

### Gamificação
- `Ranking da Turma` — ranking dos atletas das suas turmas
- `Criar Desafio da Turma` — desafio restrito aos seus atletas
- `Atribuir Badge Manual` a um atleta

### Configurações Pessoais
- `Meu Perfil` — dados pessoais, CREF, foto, senha
- `Minhas Preferências` — visualização padrão de zonas, alertas

***

## NÍVEL 3-A — Usuário Final: Aluno de Academia

Acesso apenas aos próprios dados. Interface mobile-first. **Bloqueado** para qualquer dado de outros atletas ou informações operacionais/financeiras da academia.

### Início
- `Home do Aluno` — próxima aula, último treino, streak de presença, ranking atual

### Meu Treino
- `Meu Plano de Treino` — visualizar a periodização prescrita pelo professor
- `Detalhes da Sessão` — modalidade, metas de zona, cargas, observações do professor
- `Daily Log` — inserir dados diários: qualidade do sono, nível de dor, bem-estar, HRV (se sensor disponível)

### Meu Histórico
- `Histórico de Treinos` — lista de sessões realizadas com sumário (FC média, calorias, zona)
- `Minha Evolução` — gráficos de FC máxima, calorias, tempo em zonas ao longo do tempo
- `Minhas Avaliações Físicas` — histórico de avaliações com evolução de peso, %gordura, VO₂ máx estimado
- `Minha Carga Interna` — gráfico de TRIMP e ACWR dos últimos 28 dias

### Monitoramento ao Vivo
- `Meu Tile ao Vivo` — visualização do próprio BPM e zona durante a sessão (mobile ou tela da academia)

### Gamificação
- `Meu Ranking` — posição no ranking da academia, pontuação, comparativo com semanas anteriores
- `Meus Badges` — coleção de conquistas
- `Desafios Ativos` — desafios disponíveis, progresso e histórico

### Financeiro (próprio)
- `Meu Status Financeiro` — próximo vencimento, histórico de pagamentos, plano atual

### Configurações Pessoais
- `Meu Perfil` — foto, dados pessoais, senha, preferências de notificação
- `Meu Sensor` — visualizar sensor vinculado, status de bateria
- `Metas Pessoais` — definir meta de calorias, meta de sessões por semana

***

## NÍVEL 3-B — Usuário Final: Atleta de Treinador Independente

Interface idêntica ao aluno de academia, mas com foco na comunicação direta com o treinador e sem contexto de academia física.

### Início
- `Home do Atleta` — próxima sessão, plano da semana, mensagens do treinador, streak

### Meu Treino
- `Plano de Periodização` — treinos prescritos pelo treinador com metas de zona e carga
- `Sessão de Hoje` — detalhamento da sessão com metas e observações
- `Daily Log` — registro diário de bem-estar, sono, dor, HRV, alimentação
- `Resposta ao Treinador` — campo de feedback sobre o treino

### Meu Histórico
- `Histórico de Sessões` — sumário de cada sessão com FC, calorias, zonas
- `Minha Evolução` — gráficos de progresso ao longo do tempo
- `Minhas Avaliações` — histórico de avaliações físicas
- `Minha Carga Interna` — TRIMP, ACWR, gráfico de 28 dias

### Monitoramento ao Vivo
- `Meu Tile ao Vivo` — visualização do próprio BPM durante sessão guiada pelo treinador

### Gamificação
- `Meu Ranking` — posição entre os atletas do treinador
- `Meus Badges` — conquistas e desafios completados
- `Desafios Ativos` — desafios criados pelo treinador

### Configurações Pessoais
- `Meu Perfil` — foto, dados pessoais, senha, preferências
- `Meu Sensor` — sensor vinculado e status
- `Metas Pessoais`

***

## Matriz de Acesso Consolidada

| Tela / Módulo | Super Admin | Franqueador | Academia | Treinador Indep. | Recepcionista | Professor | Aluno | Atleta |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard Global / Financeiro | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestão de Tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard da Rede/Unidade | ✅ | ✅ | ✅ | ✅ | 🔶 | 🔶 | ❌ | ❌ |
| Cadastro de Funcionários | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cadastro de Atletas (completo) | ✅ | ✅ | ✅ | ✅ | 🔶 | 🔶 | ❌ | ❌ |
| Monitoramento ao Vivo (coach view) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Meu Tile ao Vivo | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Prescrição de Treino | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | 👁️ | 👁️ |
| Carga Interna (grupo) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Minha Carga Interna | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Relatório Financeiro (academia) | ✅ | ✅ | ✅ | 🔶 | ❌ | ❌ | ❌ | ❌ |
| Meu Status Financeiro | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gamificação (gerenciar) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Gamificação (participar) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Sensores / Hardware | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 👁️ | 👁️ |
| Configurações do Sistema | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configurações da Academia | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Meu Perfil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daily Log | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |

> **Legenda:** ✅ Acesso completo | 🔶 Acesso parcial/limitado | 👁️ Somente leitura dos próprios dados | ❌ Sem acesso

***

## Observações de Implementação (NODUS / nodus-perp)

- **Multi-tenant isolation**: cada tenant deve ter um `tenant_id` em todas as queries — nunca retornar dados cross-tenant sem ser o Super Admin.[1]
- **JWT com claims de role**: o token deve carregar `role`, `tenant_id`, `unit_id` e `user_id` para que o middleware de autorização valide cada rota sem consultar o banco a cada request.
- **Herança de permissões**: o Franqueador herda a visão de todas as suas unidades; o Professor herda visão dos atletas das suas turmas; o Aluno vê apenas a si mesmo.
- **Feature flags por plano**: telas como "Carga Interna", "Daily Log" e "Gamificação Avançada" devem ser habilitadas/desabilitadas conforme o plano contratado pelo tenant — verificar `tenant.plan.features` antes de renderizar rotas.
- **Tela de TV/Projetor**: acessível pelo Professor e pelo Tenant Admin; deve funcionar sem autenticação ativa (token de sessão temporário) para exibição em TVs da academia.
- **Recepcionista vs Professor**: são roles distintos dentro do mesmo tenant. A separação no menu lateral do Vuexy deve usar `NavigationMenu` com `children` filtrados por `role`.[2]
