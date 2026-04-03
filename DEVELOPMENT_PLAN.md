# NODUS — Plano de Desenvolvimento

> Documento de controle de progresso do projeto NODUS.
> Atualizado a cada entrega significativa.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, MUI v7, Vuexy Template |
| Backend | Next.js API Routes (Node.js) |
| Banco de Dados | MySQL + Drizzle ORM |
| Autenticação | NextAuth.js v4 (JWT + OAuth) |
| Estilo | Tailwind CSS v4 + MUI |
| Gráficos | ApexCharts (react-apexcharts) |
| Hardware | ANT+ USB via `ant-plus-next` + servidor Node.js dedicado |
| Changelog | release-it + @release-it/conventional-changelog |
| Deploy | VPS (Hetzner CX22 recomendado) — ver seção Infraestrutura |

---

## Roles do Sistema (8 roles)

| Role | Descrição |
|---|---|
| `super_admin` | Dono do SaaS (NODUS) — gerencia tenants e planos |
| `tenant_admin` | Dono/gestor de academia ou equipe |
| `coach` | Treinador independente (cliente pagante) |
| `academy_coach` | Treinador funcionário da academia |
| `receptionist` | Recepcionista da academia |
| `academy_athlete` | Aluno cadastrado pela academia |
| `coach_athlete` | Aluno do treinador independente |
| `athlete` | Atleta independente (sem vínculo) |
| `pending_onboarding` | OAuth sem cadastro completo (transitório) |

### Regras de Isolamento
- `super_admin` → acessa todos os dados de todos os tenants
- `tenant_admin`, `academy_coach`, `receptionist` → apenas dados do seu `tenant_id`
- `coach` → apenas `coach_athlete` vinculados a ele
- `academy_athlete`, `coach_athlete`, `athlete` → apenas os próprios dados

---

## ✅ FASE 1 — Fundação (Concluída)

### Banco de Dados
- [x] Schema MySQL completo via Drizzle ORM
  - Tabelas: `tenants`, `users`, `athlete_profiles`, `coach_profiles`, `sensors`, `training_sessions`, `session_athletes`, `heart_rate`, `daily_logs`, `weekly_indices`, `plans`
- [x] Script de migration (`migrate.mjs`)
- [x] Seed completo com dados de teste (tenant, users, atletas, coaches, sessões, daily logs)
- [x] Colunas ajustadas: `tinyint → int`, coluna de senha é `password_hash` (bcrypt 10 rounds)

### Autenticação
- [x] NextAuth conectado ao MySQL via Drizzle ORM
- [x] JWT com `role`, `tenant_id`, `unit_id`, `avatar`
- [x] `VALID_ROLES` exportado — validação no token e sanity check no callback JWT
- [x] Suporte a Google OAuth e Facebook OAuth — usuário cai em `pending_onboarding` se não tiver cadastro completo
- [x] Páginas customizadas: `/login`, `/register`, `/forgot-password`

### Middleware RBAC
- [x] Proteção de rotas por role com `next-auth/middleware`
- [x] `ROUTE_PERMISSIONS` como array de pares `[rota, roles[]]` — ordem garantida
- [x] Rotas mais específicas antes das genéricas (ex: `/coach_athlete` antes de `/coach`)
- [x] Algoritmo pega a rota de **maior comprimento** que bate com o pathname — sem colisões de prefixo
- [x] `getHomeByRole()` e `getSettingsByRole()` para todos os 8 roles

---

## ✅ FASE 2 — Navegação e RBAC Visual (Concluída)

### Menu Lateral (VerticalMenu.jsx)
- [x] `super_admin` — Gestão, Planos, Financeiro, Monitoramento
- [x] `tenant_admin` — Cadastro, Financeiro, Sessões, Monitoramento, Diversos
- [x] `coach` — Cadastro, Financeiro, Sessões, Prescrição, Monitoramento, Diversos
- [x] `academy_coach` — Cadastro, Sessões, Prescrição, Monitoramento, Diversos
- [x] `receptionist` — Cadastro, Sessões, Financeiro, Diversos
- [x] `academy_athlete` — Treino, Histórico, Diversos
- [x] `coach_athlete` — Treino, Histórico, Diversos
- [x] `athlete` — Treino, Histórico, Diversos

### UserDropdown (UserDropdown.jsx)
- [x] Avatar com iniciais e cor automática por nome
- [x] Nome, role label e email do usuário logado
- [x] Meu Perfil, Configurações, Sair — todos roteados por role

### Redirects Temporários
- [x] 68+ páginas `redirect()` criadas para todas as rotas novas → páginas existentes

---

## ✅ FASE 3 — Módulo Atletas (Concluída)

### API
- [x] `GET /api/athletes` — listagem paginada, busca, filtro de status, isolamento por tenant/role
- [x] `POST /api/athletes` — cria atleta com role automático baseado em quem cadastra
  - Senha padrão: `nodus@123` — zonas de FC calculadas automaticamente
- [x] `GET /api/athletes/[id]` — perfil completo (user + profile + sensor + logs + ACWR + sessões)
  - Aceita os 3 roles: `athlete`, `academy_athlete`, `coach_athlete`
  - `recent_sessions`: apenas sessões com `checked_in = 1`, com join em `session_types` (cor + nome), limit 20
- [x] `PUT /api/athletes/[id]` — atualiza user + profile, recalcula zonas de FC
  - `nullifyNum()` aplicado em todos os campos int/float — evita `ER_TRUNCATED_WRONG_VALUE`
  - Upsert automático: cria `athlete_profiles` se não existir
- [x] `DELETE /api/athletes/[id]` — **hard delete em cascata**
  - `session_athletes → daily_logs → weekly_indices → sensors → athlete_profiles → users`
  - Suporte a `?backup=1` (reservado para Fase 14)

### Componentes
- [x] `AthleteStatsBar`, `AthleteFilters`, `AthleteTable` (prop `detailBasePath` + `canManage`)
- [x] `AthleteAddModal` — 2 passos: dados pessoais + ficha esportiva
  - Campos obrigatórios com `*` e validação frontend para gênero e data de nascimento
- [x] `AthleteDetailView` — hero card, zonas FC, ACWR, sensor ANT+, sessões, daily logs
  - Props: `athleteId`, `backPath`, `canEdit` (usa session se omitido)
  - **Tab Sessões**: `SessionCard` expansível com data visual, métricas, barra de zonas FC, estado vazio
  - **Resumo estatístico** no topo da tab: total sessões, kcal acumuladas, FC média geral
- [x] `NodusDeleteDialog` — diálogo genérico com 3 botões: Cancelar / Backup e excluir / Apenas excluir
- [x] `NodusConfirmDialog` — diálogo de confirmação para Inativar/Reativar (toggle real)
- [x] `NodusToast` — snackbar MUI para feedback de sucesso/erro/aviso
- [x] Botão Inativar/Reativar na `AthleteTable` funciona como **toggle real** (`is_active` + `status`)

### Telas
- [x] `/athletes` e `/athletes/[id]` — para staff da academia
- [x] `/coach/athletes` e `/coach/athletes/[id]` — exclusivas do coach independente

---

## ✅ FASE 4 — Módulo Coaches (Concluída)

### API
- [x] `GET /api/coaches` — listagem paginada com isolamento por tenant
- [x] `POST /api/coaches` — criar coach com perfil profissional
- [x] `GET /api/coaches/[id]` — perfil completo (user + coach_profile + stats + sessões)
- [x] `PUT /api/coaches/[id]` — atualiza user + coach_profile (upsert)
- [x] `DELETE /api/coaches/[id]` — **hard delete + Fase 1 LGPD pending_deletion**
  - Hard delete imediato: `session_hr_series → session_athletes → training_sessions → coach_profiles → users`
  - `coach_athlete` vinculados: `is_active=0`, `status='pending_deletion'`, `deletion_scheduled_at = +30 dias`
  - TODO Fase 2: disparar notificação WhatsApp/email ao aluno + oferta de migração para plano independente

### Componentes
- [x] `CoachStatsBar`, `CoachFilters`, `CoachTable`, `CoachAddModal`
- [x] `CoachDetailView` — hero card, dados pessoais, dados profissionais (CREF, especialidades, bio)
  - Botão Editar visível apenas para `super_admin` e `tenant_admin`
- [x] `CoachTable` — toggle Inativar/Reativar + `NodusDeleteDialog` (3 botões)

### Telas
- [x] `/coaches` — listagem para tenant_admin e super_admin
- [x] `/coaches/[id]` — perfil detalhado do coach

---

## ✅ FASE 4.1 — Infraestrutura de Qualidade (Concluída)

- [x] `CHANGELOG.md` criado com histórico completo da v0.1.0
- [x] `.release-it.json` configurado com `@release-it/conventional-changelog`
- [x] `DEVELOPMENT_PLAN.md` — este arquivo
- [x] `DEPLOYMENT_PLAN.md` — criado com histórico de fixes e roadmap de CRUDs

---

## ✅ FASE 4.2 — Hotfixes de CRUD (Concluída — 06-12/03/2026)

### Bugs corrigidos
- [x] `birthdate` ISO → `yyyy-MM-dd` no `ClientDetailView`, `CoachDetailView`, `AthleteDetailView`
- [x] Botão Editar Coach visível para qualquer role → agora só `super_admin` e `tenant_admin`
- [x] Botão Editar Atleta com `(canEdit || true)` hardcoded → corrigido para usar `useSession`
- [x] `birthdate` e `gender` vazios causavam erro 500 MySQL → `nullify()` helper aplicado no POST
- [x] `isolamento coach_id` no GET `/api/athletes` — coach vê apenas seus `coach_athlete`
- [x] Campos `int/float` com `''` no PUT `/api/athletes/[id]` causavam `ER_TRUNCATED_WRONG_VALUE`
  - Resolvido com `nullifyNum()` em todos os campos numéricos do `profileUpdate`
  - Adicionado upsert no `athlete_profiles`: cria registro se não existir
- [x] Botão Inativar da `AthleteTable` só inativava, nunca reativava → toggle real implementado
  - Funciona para `academy_athlete` (via academia) e `coach_athlete` (via coach independente)

### Melhorias nas datatables
- [x] `confirm()`/`alert()` substituídos por `NodusConfirmDialog` + `NodusToast` (MUI)
- [x] `NodusDeleteDialog` — componente genérico com 3 botões (Cancelar / Backup / Excluir)
  - Substitui o antigo `NodusDeleteAthleteDialog` que era específico demais
  - Usado em `AthleteTable`, `CoachTable` e `ClientTable`
- [x] `ClientTable` — toggle Inativar/Reativar + `NodusDeleteDialog`
- [x] `AthleteTable` — toggle Inativar/Reativar + `NodusDeleteDialog`
- [x] `CoachTable` — toggle Inativar/Reativar + `NodusDeleteDialog`
- [x] Botão Excluir em todas as 3 tabelas faz **hard delete em cascata** real no banco

---

## 🔲 FASE 4.3 — LGPD: Pending Deletion + Notificações (pendente)

> Fluxo de proteção de dados ao excluir treinador/academia com alunos vinculados.
> Aprovado em 12/03/2026 — alinhado com LGPD Art. 6º, 7º e 18º.

### Fase 1 ✅ (já implementado em 12/03/2026)
- [x] Ao excluir coach: sessões e dados operacionais excluídos imediatamente
- [x] `coach_athlete` vinculados marcados como `pending_deletion` por 30 dias
  - `users.is_active = 0` (acesso bloqueado)
  - `athlete_profiles.status = 'pending_deletion'`
  - `athlete_profiles.deletion_scheduled_at = NOW() + 30 dias`
- [x] Status `pending_deletion` exibido na `AthleteTable` com badge vermelho

### Fase 2 🔲 (pendente)
- [ ] **Migration necessária**: adicionar coluna `deletion_scheduled_at DATE` na tabela `athlete_profiles`
- [ ] **Notificação automática** ao aluno quando marcado como `pending_deletion`
- [ ] **Tela de exportação de dados** (`/athlete/export`)
- [ ] **Oferta de migração** para plano Atleta Independente
- [ ] **Cron job diário** (`/api/cron/cleanup-pending-deletions`)
- [ ] **Mesmo fluxo** para `academy_athlete` ao excluir uma Academia (tenant)

---

## ✅ FASE 5 — Dashboards por Role (Concluída — 16/03/2026)

> Dashboards MVP com visual idêntico ao template_novo (Vuexy), dados simulados prontos para
> substituição por fetch real da API na Fase 5.1 real (dados reais).

### Infraestrutura de Gráficos
- [x] `react-apexcharts` + `apexcharts` adicionados como dependência
  - **Instalar localmente:** `npm install react-apexcharts apexcharts`
- [x] `src/libs/ApexCharts.jsx` — wrapper com `dynamic import` (SSR desativado)
- [x] `src/libs/styles/AppReactApexCharts.jsx` — wrapper estilizado com CSS vars do MUI palette
  - Tooltips, fontes e cores seguem o tema MUI automaticamente

### Correções de Layout
- [x] `themeConfig.js` — `contentWidth: 'compact'` → `'wide'`
  - Remove o `max-inline-size` que encolhia o conteúdo e desalinhava da navbar
- [x] Migração MUI Grid v5 → v7 nos 3 dashboards
  - `<Grid item xs={12} md={6}>` → `<Grid size={{ xs: 12, md: 6 }}>`
  - A prop `item` foi removida no MUI v7 — sem ela os breakpoints eram ignorados

### Padrão Visual (idêntico ao template_novo)
- [x] `StatCard` v2 — `CustomAvatar` rounded + valor grande + `<Chip variant='tonal'>` de trend
  - `trendUp=true` → chip verde | `trendUp=false` → chip vermelho | `undefined` → chip cinza
- [x] `OptionMenu` (`@core/components/option-menu`) em todos os cards com seletor de período
- [x] Títulos/saudações de página removidos — conteúdo começa direto nos cards

### Componentes Novos
- [x] `HRZonesDonutCard` — donut ApexCharts com legenda + rótulo central + OptionMenu
- [x] `WeeklyPresenceCard` — bar chart ApexCharts com grid pontilhado + tooltip + OptionMenu
- [x] `ACWRCard` — radialBar ApexCharts semicircular (cor muda: verde/amarelo/vermelho pelo valor) + legenda de zonas
- [x] `TopAthletesCard` v2 — CustomAvatar + LinearProgress por atleta + OptionMenu (ordenação)

### Dashboards Entregues
- [x] `DashboardAcademia` (`tenant_admin`) — 4 StatCards + Alertas + HRZonesDonut + SessionsTable + TopAthletes + WeeklyPresence
- [x] `DashboardCoach` (`coach` / `academy_coach`) — 4 StatCards + SessionsTable + ACWRCard + Alertas + TopAthletes
- [x] `DashboardAthlete` (`athlete` / `academy_athlete` / `coach_athlete`) — 4 StatCards + Próxima Sessão + ACWRCard + Meu Progresso (3 barras)

### Pendente nesta fase
- [ ] Substituir dados simulados por fetch real da API (ver Fase 5.1 abaixo)
- [ ] `DashboardReception` — a definir escopo
- [ ] `DashboardSuperAdmin` — métricas SaaS (tenants, MRR, alertas)

---

## ✅ FASE 5.1 — Dashboards com Dados Reais (Concluída — 18/03/2026)

- [x] `GET /api/dashboard/athlete` — sessões no mês, calorias, streak, ranking, próxima sessão, ACWR, progresso
  - Aceita roles: `athlete`, `academy_athlete`, `coach_athlete`
- [x] `GET /api/dashboard/coach` — alunos, sessões do dia, ACWR médio, alertas, top atletas
- [x] `GET /api/dashboard/academia` — atletas ativos, sessões do dia, FC média, calorias, alertas, zonas, presença semanal
- [x] Hook `useDashboard(type)` — fetch client-side com loading/error states
- [x] `DashboardAthlete`, `DashboardCoach`, `DashboardAcademia` conectados às APIs reais

---

## ✅ FASE 5.2 — Correções de Role no Dashboard (Concluída — 18/03/2026)

> Bugs encontrados ao testar os perfis `academy_athlete`, `coach_athlete` e `academy_coach`.

- [x] `home/page.jsx` — faltavam cases para `academy_athlete`, `coach_athlete` e `academy_coach`
  - Todos caíam no fallback `<DashboardAcademia />` → chamava `/api/dashboard/academia` → **403**
  - Corrigido: `academy_athlete` + `coach_athlete` → `DashboardAthlete` | `academy_coach` → `DashboardCoach`
- [x] `middleware.js` — rota `/sessions` não permitia `ATHLETE_ROLES`
  - Botão "Ver Detalhes da Sessão" no `DashboardAthlete` redirecionava para 403
  - Corrigido: `ATHLETE_ROLES` adicionado à permissão de `/sessions`

---

## ✅ FASE 6 — Módulo Sessões de Treino (Concluída — 19-24/03/2026)

### API — Backend

- [x] `GET /api/sessions` — consciente do role:
  - **Staff** (coach, academy_coach, tenant_admin): retorna todas as sessões do tenant/coach
    - Usa `SESSION_SELECT_STAFF` — sem `checked_in`, sem join em `session_athletes` (evita erro 500)
  - **`academy_athlete` / `coach_athlete`**: retorna **todas as sessões abertas do tenant** via LEFT JOIN
    - `checked_in` preenchido apenas quando existe linha em `session_athletes` para o atleta
  - **`athlete` independente**: retorna apenas as sessões em que está inscrito (INNER JOIN)
  - **Status calculado on-the-fly** via `computeStatus(row)` (Opção A — desenvolvimento)
- [x] `POST /api/sessions` — criação com suporte a recorrência (dias da semana + data fim)
  - Insere em lotes de 50 para evitar timeout
  - Vincula `athlete_ids` via `session_athletes` automaticamente
- [x] `PUT /api/sessions/[id]` — edição de sessão individual
- [x] `DELETE /api/sessions/[id]` — exclusão/cancelamento (suporte a `?scope=future`)
- [x] `PUT /api/sessions/[id]/checkin` — alterna check-in do atleta logado
  - **`academy_athlete` / `coach_athlete`**: auto-inscrição na hora do check-in (sem inscrição prévia necessária)
  - **`athlete` independente**: exige inscrição prévia em `session_athletes`
  - Validações: sessão cancelada → 400 | sessão finalizada → 400 | sessão não encontrada → 404
- [x] `GET /api/dashboard/athlete/sessions` — rota dedicada para o card do dashboard
  - `academy_athlete` / `coach_athlete` → vê todas as sessões abertas do tenant
  - `athlete` independente → só as sessões em que está inscrito
  - Ordenação: check-in feito → inscrito sem check-in → demais abertas
  - Máximo 2 resultados para o card

### Componentes / Views — Frontend

- [x] `SessionsCalendarView` — calendário FullCalendar para staff (coach, admin, receptionist)
  - Filtro por tipo de sessão no sidebar — sessões sem `session_type_id` sempre exibidas (correção 24/03)
  - **Bug corrigido (27/03/2026)**: calendário não atualizava ao criar/editar sessão
    - Causa: FullCalendar não re-renderizava automaticamente ao trocar o state `events`
    - Correção: após `fetchSessions()`, usa `calApi.removeAllEvents()` + `calApi.addEvent()` via `calendarRef`
- [x] `SessionsAthleteView` — lista de sessões para atletas (`/sessions`)
  - Aba **"Disponíveis"**: todas as sessões não canceladas/finalizadas, com botão Check-in verde
  - Aba **"Histórico"**: **apenas sessões com `checked_in = 1`** (participação confirmada)
  - Botão Check-in/Cancelar direto no card (sem precisar abrir detalhes)
  - Modal de detalhes: data, horário, duração, capacidade, coach, zonas FC, notas
  - `canCheckIn()` — permite check-in em qualquer sessão aberta (scheduled ou active)
- [x] `NextSessionsCard` — card reutilizável para o dashboard do atleta
- [x] `DashboardAthlete` — substituído card antigo pelo `NextSessionsCard`
- [x] `sessions/page.jsx` — renderiza view correta por role
- [x] **Histórico de sessões no `AthleteDetailView`** (24/03/2026)

### Pendências desta fase / próximas evoluções
- [ ] Cancelamento manual de sessão pelo coach (chip `cancelled` já suportado na view)
- [ ] Cron job para atualizar status de sessões no banco (Fase 16 — deploy)

---

## ✅ FASE 7 — Monitoramento ANT+ em Tempo Real (Em andamento)

> Pipeline completo ANT+ → WebSocket → banco de dados validado com dispositivo físico real.

### ✅ Etapa 7.1 — Servidor ANT+/WebSocket (Concluída — 26/03/2026)
- [x] `ant-server/antService.js` — `AntService` com Continuous Scanning Mode (`HeartRateScanner`)
  - Suporta 42+ dispositivos simultâneos sem limite de canais
  - Métodos: `start()`, `stop()`, `scanForDevice(deviceId)`, `onHeartRateData(cb)`
- [x] `ant-server/websocketServer.js` — `HeartRateWebSocketServer`
  - `resolveAthleteByDeviceId()` — resolve atleta + sessão ativa + sensor por `DeviceId` ANT+
  - Cache TTL 10s por dispositivo — evita queries excessivas no banco
  - Throttle de gravação: 5s por atleta — em memória sempre ao vivo para o WS
  - Cálculo de zonas FC usando `athlete_profiles.hr_max`
  - Acúmulo de calorias por atleta em memória
  - Broadcast: `{ type: 'heartrate', data: AthleteRealtimeData }`
  - Suporte a mensagens do cliente: `ping`, `request_data`, `reset_calories`, `session_ended`
- [x] `ant-server/db.js` — queries MySQL diretas (sem Drizzle):
  - `resolveAthleteByDeviceId(deviceId)` — JOIN `sensors → session_athletes → training_sessions → athlete_profiles → users`
  - `autoCheckin(sessionId, athleteId)` — check-in automático ao detectar FC
  - `insertHrSeries(data)` — grava em `session_hr_series`
  - `updateSessionAthleteAggregates(sessionId, athleteId)` — agrega métricas ao encerrar sessão
  - `getAllActiveSensors()` — carrega sensores ativos do banco na inicialização
- [x] `ant-server/index.js` — entry point HTTP + WebSocket na porta `3001`
  - REST mínima: `GET /health`, `POST /ant/start|stop`, `GET /ant/status`, `POST /ant/reset`
  - Graceful shutdown com `SIGTERM`/`SIGINT`

### ✅ Etapa 7.2 — Persistência de FC no banco (Concluída — 27/03/2026)
- [x] Tabela `session_hr_series` — gravação validada em ambiente real
  - Colunas: `id`, `session_id`, `athlete_id`, `sensor_id`, `timestamp`, `hr_bpm`, `hr_zone`, `calories_acc`, `block_type`
- [x] Throttle de 5s por atleta funcionando (2 registros em ~10s de teste confirmado)
- [x] `autoCheckin` automático ao detectar FC durante sessão ativa

### ✅ Etapa 7.3 — Sala de Espera / Lobby (Tela 1) (Concluída — 01/04/2026)
- [x] `LobbyView.jsx` — tela de pré-sessão para staff
  - Carrega atletas inscritos + status de check-in
  - Confirmação de presença (check-in manual pelo staff)
  - Atribuição de sensor ANT+ por atleta
  - Gera e exibe link do Monitor de Atletas (Tela 2)
  - Botão "Iniciar Sessão" → PUT `/api/sessions/[id]/start`
- [x] **Walk-in** (03/04/2026): botão "+ Walk-in" com modal de busca de atletas
  - Busca em tempo real via `GET /api/athletes?search=...`
  - Insere via `POST /api/sessions/[id]/walkin` com `status = 'walk_in'`
  - Atleta aparece na lista imediatamente com badge **Walk-in** no card
  - Visível para: `coach`, `academy_coach`, `tenant_admin`, `receptionist`
- [x] **Correção NextAuth** (01/04/2026): erro ao abrir sala de espera resolvido

### ✅ Etapa 7.4 — Monitor de Atletas / TV (Tela 2) (Concluída — 02/04/2026)
- [x] `public/monitor/index.html` — tela fullscreen para TV/SmartTV
  - Acesso via token púublico (sem autenticação): `/monitor/[token]`
  - Grade de cards dinâmica por número de atletas (1 a 42+)
  - Atualização em tempo real via WebSocket (`ws://[host]:3001/ws/heartrate`)
  - Cards com FC, zona colorida, calorias, % FC máx, cronômetro de sessão
  - Overlay **"Sessão Encerrada"** quando token revogado ou sessão finalizada
  - Overlay **"Sessão em Breve"** com countdown regressivo para sessões `scheduled`/`pending`
    - Polling a cada 30s: recarrega automaticamente quando sessão muda para `active`
    - Evita conexão prematura ao WS antes da sessão começar
- [x] `GET /api/monitor/[token]` — rota pública que valida o token e retorna:
  - `sessionId`, `sessionName`, `sessionStatus`, `scheduledAt`, `tenantId`, `antServerPort`

### 🔲 Etapa 7.5 — Monitor Treinador (Tela 3) (Próximo passo)
- [ ] View `/sessions/[id]/monitor` — tela com autenticação para o coach
  - Mesmos dados do Monitor TV + controles de sessão
  - Botões: "Encerrar Sessão", "Resetar Calorias", "Remover Atleta"
  - Gráfico de histórico de FC em tempo real por atleta
  - Alertas visuais: FC acima de Z5, atleta desconectado
- [ ] `PUT /api/sessions/[id]/finish` — muda status para `finished` + agrega métricas
  - Pontuação por zona: `Z1×1.0 + Z2×1.5 + Z3×2.5 + Z4×4.0 + Z5×3.0` pts/min
- [ ] Etapa 7.6 — Check-in automático via FC (já funciona parcialmente via `autoCheckin`)

### Decisões e descobertas da Fase 7

| Item | Decisão/Descoberta |
|---|---|
| Zeros no terminal (`0`) | Vêm da lib `ant-plus-next` internamente — não são do nosso código, podem ser ignorados |
| Timezone MySQL | MySQL rodava em UTC puro; sessões salvas em horário de Brasília → `start_datetime <= NOW()` falhava |
| Solução timezone | `SET GLOBAL time_zone = '-03:00'` + `default-time-zone = '-03:00'` no `my.ini` |
| `sensors.serial` | Deve conter o `DeviceId` ANT+ numérico real (ex: `42873`) — valores como `ANT0001` são ignorados |
| `session_id = null` | Ocorre quando a sessão não está `active` OU `start_datetime > NOW()` — sessão precisa estar ativa e no horário |

---

## 🔲 FASE 5.1 Upload de Avatar (pendente)

> O campo `avatar_url varchar(255)` já existe no schema `users`.

- [ ] API `POST /api/upload/avatar` — recebe `multipart/form-data`, salva em `/public/uploads/avatars/`
- [ ] Componente `AvatarUpload` — clique no avatar abre seletor de arquivo, preview + botão salvar
- [ ] Integrar em `ClientDetailView`, `CoachDetailView`, `AthleteDetailView`
- [ ] Dependência necessária: `formidable` ou `busboy` para parse do multipart

---

## 🔲 FASE 5.2 — Dashboard Customizável pelo Usuário (futuro)

- [ ] Banco: tabela `dashboard_preferences` — `user_id`, `role`, `layout_json`
- [ ] API: `GET/PUT /api/dashboard/preferences`
- [ ] Componente `DashboardEditor` — modo de edição com drag-and-drop
- [ ] Botão "Personalizar Dashboard" na navbar ou no canto do dashboard

---

## 🔲 FASE 8 — Módulo Prescrição de Treino

- [ ] Tela `/planning` — planejamento periodizado
- [ ] Prescrição por atleta (séries, cargas, zonas de FC alvo)
- [ ] Vinculação de prescrição com sessão
- [ ] Pré-treino e Pós-treino
- [ ] ACWR — cálculo automático (tabela `weekly_indices` já existe)

---

## 🔲 FASE 9 — Módulo Financeiro

- [ ] Planos e assinaturas (super_admin)
- [ ] Histórico de cobranças
- [ ] Receitas/Despesas por tenant
- [ ] Pagamentos e comprovantes (receptionist)
- [ ] Financeiro do coach independente
- [ ] Financeiro do atleta independente

---

## 🔲 FASE 10 — PWA + Notificações Push

- [ ] Tabela `push_subscriptions`
- [ ] `next-pwa` para registro automático do Service Worker
- [ ] `POST /api/push/subscribe` e `POST /api/push/send`
- [ ] Casos de uso: alerta FC alta, check-in confirmado, lembrete de treino

---

## 🔲 FASE 11 — OAuth Social (Google + Facebook)

- [ ] Criar apps no Google Cloud Console e Meta for Developers
- [ ] Tela `/onboarding` para usuários com `role=pending_onboarding`
- [ ] Testar fluxo completo Google e Facebook

---

## 🔲 FASE 12 — Gamificação

- [ ] Sistema de badges e conquistas
- [ ] Ranking por academia
- [ ] Pontuação por sessão: `Z1×1.0 + Z2×1.5 + Z3×2.5 + Z4×4.0 + Z5×3.0` pts/min (configurável)
- [ ] Tela de ranking púublico (TV)
- [ ] XP acumulado, streaks de frequência, leaderboard global por período

---

## 🔲 FASE 13 — Módulo Permissões Dinâmicas

- [ ] Schema de permissões granulares por usuário no banco
- [ ] Painel de permissões para `tenant_admin`
- [ ] Menu lateral filtrando itens por permissão da sessão

---

## 🔲 FASE 14 — Relatórios e Evolução

- [ ] Evolução do atleta (FC histórica, cargas, ACWR)
- [ ] Relatórios por academia (frequência, desempenho)
- [ ] **Exportação PDF/CSV** — inclui fluxo de portabilidade LGPD (Fase 4.3)
- [ ] Daily Logs — registro subjetivo pós-treino

---

## 🔲 FASE 15 — Páginas Próprias por Role

- [x] `/coach/athletes` e `/coach/athletes/[id]` *(concluído na Fase 3)*
- [x] `/coaches/[id]` *(concluído na Fase 4)*
- [ ] `/academy/coaches`, `/academy/athletes`, `/academy/recepcionist`
- [ ] `/academy_coach/athletes`
- [ ] Demais páginas role-especÚtaficas

---

## 🔲 FASE 16 — Produção e Deploy

### Infraestrutura escolhida: VPS (Hetzner CX22)

| Critério | Decisão |
|---|---|
| Servidor | **Hetzner CX22** — 2 vCPU, 4 GB RAM, 40 GB SSD, ~€ 3,79/mês |
| App | Next.js rodando via **PM2** |
| ANT+ Server | Processo separado via **PM2** (porta 3001) |
| Proxy reverso | **Nginx** + Certbot (HTTPS gratuito via Let's Encrypt) |
| Banco de dados | **MySQL 8** local no VPS |
| Deploy automático | **GitHub Actions** — `git push main` → deploy no servidor |
| Cron de sessões | **crontab** no servidor — a cada 5 min |
| Domínio | Domínio próprio (~R$ 40/ano no Registro.br) |
| Backup | MySQL dump automático para bucket S3 ou Cloudflare R2 |
| **Custo total** | **~R$ 25–35/mês** |

### Checklist de deploy (pendente — após MVP)
- [ ] Provisionar VPS Hetzner CX22
- [ ] Instalar Node.js 20 LTS + PM2 + Nginx + MySQL 8 + Certbot
- [ ] Configurar `.env` de produção
- [ ] Configurar GitHub Actions para deploy automático via SSH
- [ ] Configurar crontab para `GET /api/cron/sessions-status`
- [ ] Configurar backup automático MySQL
- [ ] Apontar domínio e emitir certificado SSL
- [ ] Testes E2E (Playwright ou Cypress)
- [ ] Monitoramento de erros (Sentry)

---

## Convenções do Projeto

### Senhas
- Senha padrão para novos cadastros: `nodus@123`
- Seed de teste usa `atleta123` para academy_athletes
- Coluna no banco: `password_hash` (bcrypt 10 rounds — NUNCA `password`)

### Datas e Timezone
- MySQL configurado com `default-time-zone = '-03:00'` (Brasília) no `my.ini`
- Datas salvas no banco em horário de Brasília — **não usar UTC** nas API routes
- MySQL retorna `date` como ISO string (`2000-01-01T00:00:00.000Z`)
- **Sempre** normalizar com `toDateInput(d)` antes de popular `<input type="date">`:
  ```js
  const toDateInput = d => {
    if (!d) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
    const parsed = new Date(d)
    if (isNaN(parsed.getTime())) return ''
    return parsed.toISOString().slice(0, 10)
  }
  ```

### Nullify — Proteção de Campos MySQL
- `nullify(v)`: converte `''`, `undefined`, `null` → `null` (campos texto/date)
- `nullifyNum(v)`: converte `''`, `undefined`, `null` → `null`; converte string numérica → Number (campos `int`/`float`)
- **Sempre** aplicar nos campos de formulário antes de enviar ao banco

### Padrão de Commits (Conventional Commits)

| Prefixo | Uso | Aparece no Changelog |
|---|---|---|
| `feat:` | Nova funcionalidade | Sim |
| `fix:` | Correção de bug | Sim |
| `docs:` | Documentação | Sim |
| `refactor:` | Refatoração sem mudar comportamento | Sim |
| `perf:` | Melhoria de performance | Sim |
| `test:` | Testes | Sim |
| `chore:` | Manutenção (configs, deps) | Oculto |
| `style:` | Estilo visual sem lógica | Oculto |

### Rotas por Role

| Role | Prefixo | Rota de atletas | Rota de coaches |
|---|---|---|---|
| `super_admin` | `/admin` | `/athletes` | `/coaches` |
| `tenant_admin` | `/academy` | `/athletes` | `/coaches` |
| `coach` | `/coach` | `/coach/athletes` | — |
| `academy_coach` | `/academy_coach` | `/academy_coach/athletes` | — |
| `receptionist` | `/recepcionist` | `/recepcionist/athletes` | — |
| `academy_athlete` | `/academy_athlete` | — | — |
| `coach_athlete` | `/coach_athlete` | — | — |
| `athlete` | `/athlete` | — | — |

### Padrões de Componente
- Page routes Next.js 15 com `params`: sempre `async function` + `await params`
- Client Components com `params`: usar `use(params)` do React
- Views de detalhe aceitam props diretas: `athleteId`/`coachId` + `backPath` + `canEdit`
- Tables aceitam `detailBasePath` para montar a rota do botão "ver perfil" dinamicamente
- **Inativar** = `PUT is_active=0` (soft); **Excluir** = `DELETE` (hard delete em cascata)
- Permissões: checar sempre `session.user.role` via `useSession()` — nunca hardcodar `true`
- Diálogos de confirmação: sempre usar `NodusConfirmDialog` ou `NodusDeleteDialog`

### Padrões de Dashboard
- Grid: sempre `<Grid size={{ xs: 12, md: 6 }}>` — API MUI v7
- Gráficos: sempre via `AppReactApexCharts` com `dynamic import` (SSR: false)
- StatCards: usar `<StatCard>` com `CustomAvatar` rounded + `<Chip variant='tonal'>` para trend
- Layout: `contentWidth: 'wide'` no themeConfig

### Status de Sessão
- O banco **sempre** armazena o status original (`scheduled`, `cancelled`)
- A API sobrescreve o status na resposta usando `computeStatus()` (Opção A, ativo agora)
- `cancelled` é imutável — só pode ser definido manualmente pelo coach
- Na Fase 16 (deploy), migrar para Opção B: cron atualizando o banco diretamente

### Arquitetura ANT+ (Fase 7)
- **Servidor ANT+**: processo Node.js separado em `ant-server/` na porta **3001**
- **Lib**: `ant-plus-next` com `GarminStick2` + `HeartRateScanner` em Continuous Scanning Mode
- **DeviceId**: `sensors.serial` armazena o ID numérico ANT+ real (ex: `42873`) — valores como `ANT0001` são ignorados
- **Zeros no terminal**: gerados internamente pela lib `ant-plus-next` — ignorar
- **Timezone**: MySQL configurado em `-03:00`; `resolveAthleteByDeviceId` usa `NOW()` que agora bate com horário local
- **WebSocket path**: `ws://localhost:3001/ws/heartrate`
- **Throttle banco**: gravação a cada 5s por atleta; em memória sempre ao vivo para o WS

---

*Última atualização: 03/04/2026 — Etapas 7.3 (Lobby + Walk-in) e 7.4 (Monitor TV + Sessão em Breve) concluídas ✅ | Próximo: Etapa 7.5 — Monitor Treinador (Tela 3) 🔲*
