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
- [x] `SessionsAthleteView` — lista de sessões para atletas (`/sessions`)
  - Aba **"Disponíveis"**: todas as sessões não canceladas/finalizadas, com botão Check-in verde
  - Aba **"Histórico"**: **apenas sessões com `checked_in = 1`** (participação confirmada)
  - Botão Check-in/Cancelar direto no card (sem precisar abrir detalhes)
  - Modal de detalhes: data, horário, duração, capacidade, coach, zonas FC, notas
  - `canCheckIn()` — permite check-in em qualquer sessão aberta (scheduled ou active)
- [x] `NextSessionsCard` — card reutilizável para o dashboard do atleta
  - Layout com bloco de data, hora, duração, coach, badge de tipo
  - Botão "Check-in" verde / "Cancelar" vermelho direto no card
  - Loading state com `CircularProgress` por sessão individual
  - Botão "Ver mais sessões" → `/sessions`
- [x] `DashboardAthlete` — substituído card antigo (uma sessão só, sem check-in) pelo `NextSessionsCard`
- [x] `sessions/page.jsx` — renderiza view correta por role:
  - `athlete / academy_athlete / coach_athlete` → `SessionsAthleteView`
  - Demais roles → `SessionsCalendarView`
- [x] **Histórico de sessões no `AthleteDetailView`** (24/03/2026)
  - `SessionCard` expansível: bloco de data, nome + tipo (badge colorido), hora, FC méd/máx, TRIMP, kcal
  - Ao expandir: grid de métricas + barra de zonas FC (Z1→Z5) com percentuais
  - Resumo no topo da tab: total sessões, kcal acumuladas, FC média geral
  - Estado vazio com mensagem explicativa
  - API: filtro `checked_in = 1` + join `session_types` + limit 20

### Bugs corrigidos nesta fase (19-24/03/2026)

- [x] Botão Check-in sumia para sessões futuras — `canCheckIn()` exigia `isToday || isActive`
  - Corrigido: qualquer sessão com `status !== 'cancelled' && status !== 'finished'` tem o botão
- [x] Calendário da academia retornava 500 — `SESSION_SELECT_FIELDS` incluía `session_athletes.checked_in` mas a query de staff não fazia join com `session_athletes`
  - Corrigido: separado em `SESSION_SELECT_STAFF` e `SESSION_SELECT_ATHLETE`
- [x] Calendário não exibia sessões sem tipo — filtro por `activeTypes` descartava `session_type_id = null`
  - Corrigido: `typeId == null || activeTypes.includes(typeId)`
- [x] Histórico mostrava sessões não participadas — filtro usava `start_datetime < now`
  - Corrigido: filtro por `checked_in === 1`
- [x] Check-in retornava 404 "Você não está inscrito" para `academy_athlete`
  - Corrigido: auto-inscrição automática em `session_athletes` no ato do check-in para roles de academia

### Pendências desta fase / próximas evoluções

> **Nota sobre o Histórico de Sessões:**
> O comportamento ideal futuro (Fase 7) é confirmar presença via dado de FC do dispositivo ANT+.
> - Check-in automático ao detectar FC do atleta durante a janela da sessão
> - Histórico com `checked_in = 1` E `end_datetime < now` (sessão realmente encerrada)

- [ ] Cancelamento manual de sessão pelo coach (chip `cancelled` já suportado na view)
- [ ] Confirmação automática de presença via dado de FC do dispositivo ANT+ (Fase 7)
- [ ] Cron job para atualizar status de sessões no banco (Fase 16 — deploy)

---

## 🔲 FASE 5.1 Upload de Avatar (pendente)

> O campo `avatar_url varchar(255)` já existe no schema `users`.

- [ ] API `POST /api/upload/avatar` — recebe `multipart/form-data`, salva em `/public/uploads/avatars/`
- [ ] Componente `AvatarUpload` — clique no avatar abre seletor de arquivo, preview + botão salvar
- [ ] Integrar em `ClientDetailView`, `CoachDetailView`, `AthleteDetailView`
- [ ] Dependência necessária: `formidable` ou `busboy` para parse do multipart

---

## 🔲 FASE 5.2 — Dashboard Customizável pelo Usuário (futuro)

> Decisão tomada em 17/03/2026: **deixar para depois**, após a Fase 7 (Monitoramento Real).
> Faz mais sentido customizar quando os cards tiverem dados reais e o usuário souber o que quer ver.

### Escopo planejado
- [ ] Banco: tabela `dashboard_preferences` — `user_id`, `role`, `layout_json` (cards visíveis + ordem + tamanho)
- [ ] API: `GET/PUT /api/dashboard/preferences`
- [ ] Componente `DashboardEditor` — modo de edição com drag-and-drop (ex: `dnd-kit`)
- [ ] Botão "Personalizar Dashboard" na navbar ou no canto do dashboard
- [ ] Cards disponíveis por role (ex: atleta não vê cards financeiros)
- [ ] Reset para layout padrão

---

## 🔲 FASE 7 — Monitoramento ANT+ em Tempo Real (Core do NODUS)

> **Base de referência:** repositório `heart_rate_monitor` (DjouBR) — projeto funcional com:
> - `AntService` em **Continuous Scanning Mode** via `ant-plus-next` + `GarminStick2`
> - `HeartRateWebSocketServer` via lib `ws` (Node.js nativo)
> - Cálculo de zonas de FC, calorias acumuladas e persistência no banco
> - Arquitetura: servidor Node.js separado (`server/`) + cliente React (`client/`) via WebSocket
>
> **Estratégia de integração no NODUS:** manter a arquitetura híbrida — servidor ANT+/WS
> roda como processo Node.js separado (porta própria), o Next.js se conecta via WebSocket client.

### Pré-requisitos
- [ ] Instalar dependência: `npm install ant-plus-next ws`
- [ ] Verificar que o Zadig (driver WinUSB) já está instalado para a antena USB Garmin
  - Windows: driver já instalado no projeto `heart_rate_monitor` ✅
- [ ] Garantir que `sensors.serial` no banco contém o `DeviceId` ANT+ numérico de cada atleta
  - Migração/seed pode ser necessária para popular com valores reais

### Etapa 7.1 — Servidor ANT+/WebSocket (adaptação do `heart_rate_monitor`)

> Criar `ant-server/` na raiz do NODUS — processo Node.js independente do Next.js.

- [ ] `ant-server/antService.js` — portado de `server/antService.ts` (TypeScript → JS ou manter TS)
  - Singleton `AntService` com **Continuous Scanning Mode** (`HeartRateScanner`)
  - Métodos: `start()`, `stop()`, `scanForDevice(deviceId)`, `onHeartRateData(cb)`
  - Já suporta 42+ dispositivos simultâneos sem limite de canais
- [ ] `ant-server/websocketServer.js` — adaptado de `server/websocketServer.ts`
  - Trocar `getStudentByDeviceId()` por query no banco do NODUS (via Drizzle ou mysql2 direto)
    - Buscar atleta por `sensors.serial = deviceId` (JOIN com `users` + `athlete_profiles`)
  - Cálculo de zona usando `athlete_profiles.hr_max` (já existe no NODUS) em vez de `220 - age`
  - Acumular calorias por atleta (mesma lógica do projeto original)
  - Broadcast: mesmo formato `{ type: 'heartrate', data: StudentHeartRateData }`
  - Adicionar suporte a `session_id` — vincular dados de FC à sessão ativa
- [ ] `ant-server/index.js` — entry point do servidor (HTTP + WebSocket na porta `3001`)
  - Iniciar `AntService.start()` → só se a antena USB estiver conectada
  - Graceful shutdown: `SIGTERM` fecha o stick ANT+ corretamente
- [ ] `ant-server/package.json` — dependências: `ant-plus-next`, `ws`, `mysql2` (ou reusar Drizzle)

### Etapa 7.2 — Persistência de FC no banco (tabela `heart_rate`)

> A tabela `heart_rate` já existe no schema do NODUS. Apenas adaptar o `createHeartRateLog()`.

- [ ] Verificar colunas existentes na tabela `heart_rate` e garantir compatibilidade:
  - `id`, `session_id`, `athlete_id`, `heart_rate`, `zone`, `calories`, `timestamp`
  - Se faltar coluna → criar migration
- [ ] Persistência no banco a cada leitura ANT+ (async, sem bloquear o broadcast)
- [ ] Rate limit de gravação: gravar no banco a cada **5 segundos por atleta** (evitar flood)
  - Em memória: salvar sempre para o WebSocket; no banco: throttle de 5s
- [ ] `PUT /api/sessions/[id]/start` — marca sessão como `active` + registra `start_datetime` real
- [ ] `PUT /api/sessions/[id]/finish` — marca sessão como `finished` + registra `end_datetime` real
  - Ao finalizar: calcular e salvar métricas agregadas em `session_athletes` (avg_hr, max_hr, trimp, calorias, time_z1..z5)

### Etapa 7.3 — Tela de Monitoramento em Tempo Real (`/monitoring`)

> Tela principal para staff (coach/admin) ver todos os atletas da sessão em tempo real.

- [ ] Hook `useAntWebSocket(sessionId)` — client-side WebSocket hook
  - Conecta em `ws://localhost:3001/ws/heartrate`
  - Recebe `initial_data` + updates em tempo real
  - Reconexão automática com back-off exponencial
  - Estado: `{ athletes: Map<id, AthleteRealtimeData>, connected, error }`
- [ ] `MonitoringView` — grade de cards por atleta (similar ao projeto original)
  - Card por atleta: nome, avatar, FC atual (grande), zona colorida (Z1→Z5), calorias, % FC máx
  - Badge de zona pulsante quando Z4/Z5 (alerta visual)
  - Ordenação: por zona (maior primeiro) ou por nome
  - Atleta offline (sem dado há >10s): card cinza com ícone de sinal perdido
- [ ] Seletor de sessão ativa — ao entrar na tela, escolher qual sessão monitorar
  - Filtra atletas pelo `session_id` selecionado
- [ ] Botões: "Iniciar Sessão" / "Encerrar Sessão" → chama `PUT /api/sessions/[id]/start|finish`
- [ ] Permissões: `tenant_admin`, `coach`, `academy_coach` — isolamento por tenant

### Etapa 7.4 — Tela TV (`/monitoring/tvscreen`)

> Modo de exibição para telão da academia — sem autenticação necessária (token de sala).

- [ ] Layout fullscreen: grade maior, sem sidebar, fundo escuro
- [ ] Mesmo WebSocket do `/monitoring` — só visual diferente
- [ ] Configurável: número de colunas, tamanho dos cards, exibir/ocultar nome
- [ ] Token de sala: URL com `?room=TOKEN` gerada pelo admin (sem login necessário)
- [ ] Auto-refresh se conexão cair

### Etapa 7.5 — Check-in Automático via FC

> Substitui o check-in manual quando a sessão está sendo monitorada pelo ANT+.

- [ ] Ao detectar FC de um atleta durante a janela da sessão → `session_athletes.checked_in = 1` automático
  - Lógica no servidor ANT+: se `now >= session.start_datetime - 5min` E `session.status = 'active'`
  - Evitar chamadas duplicadas: só fazer o update uma vez por atleta por sessão
- [ ] Notificar via WebSocket: `{ type: 'checkin_auto', athleteId, sessionId }`
  - A tela de monitoramento exibe badge "✓ Presença confirmada" no card do atleta

### Etapa 7.6 — Dashboard em Tempo Real (atualização das métricas)

> Após a Fase 7, os dashboards ganham dados ao vivo.

- [ ] `DashboardAcademia` — card de FC média ao vivo (via WebSocket ou polling curto de 5s)
- [ ] `DashboardCoach` — card de FC dos atletas na sessão ativa
- [ ] `DashboardAthlete` — card "Minha FC agora" quando estiver em sessão ativa

### Ordem de desenvolvimento recomendada

```
7.1 Servidor ANT+/WS  →  7.2 Persistência banco  →  7.3 Tela /monitoring
         ↓
    7.4 Tela TV  →  7.5 Check-in automático  →  7.6 Dashboard ao vivo
```

### Dependências e comandos

```bash
# No NODUS (raiz)
npm install ws

# No ant-server/
npm install ant-plus-next ws mysql2

# Rodar em paralelo (desenvolvimento)
# Terminal 1: Next.js
npm run dev

# Terminal 2: Servidor ANT+
node ant-server/index.js
```

### Decisões de arquitetura confirmadas

| Decisão | Escolha | Motivo |
|---|---|---|
| Driver ANT+ | `ant-plus-next` | Já usado e funcionando no `heart_rate_monitor` |
| Modo de scanning | Continuous Scanning (`HeartRateScanner`) | Suporta 42+ dispositivos sem limite de canais |
| Servidor WS | Node.js `ws` nativo na porta 3001 | WebSocket não suportado em API routes do Next.js |
| Persistência | Throttle 5s por atleta | Evita flood no MySQL; em memória é sempre ao vivo |
| Check-in | Manual agora → Automático via FC na Fase 7 | Progressive enhancement |
| TV Screen | Token de sala sem login | UX: telão não precisa de autenticação |

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

> Funciona em notebook (Chrome/Edge/Firefox) e celular (Android nativo, iOS Safari 16.4+)

### Banco de Dados (migration necessária)
- [ ] Tabela `push_subscriptions`
  - Colunas: `id`, `user_id` (FK), `endpoint`, `p256dh`, `auth`, `device_info`, `created_at`

### Implementação
- [ ] Gerar par de chaves VAPID: `npx web-push generate-vapid-keys`
- [ ] Configurar `next-pwa` para registro automático do Service Worker
- [ ] `POST /api/push/subscribe` — salva subscription do dispositivo
- [ ] `POST /api/push/send` — dispara notificação via lib `web-push`
- [ ] Casos de uso: alerta de FC alta durante sessão, notificar check-in, lembrete de treino agendado

---

## 🔲 FASE 11 — OAuth Social (Google + Facebook)

> Providers já configurados no NextAuth — faltam apenas as credenciais e a tela de onboarding

### Pré-requisitos
- [ ] Criar app no [Google Cloud Console](https://console.cloud.google.com) — ativar OAuth 2.0
- [ ] Criar app no [Meta for Developers](https://developers.facebook.com) — ativar Facebook Login
- [ ] Adicionar Redirect URIs de produção em ambos
- [ ] Preencher variáveis no `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`

### Implementação
- [ ] Tela `/onboarding` — para usuários OAuth com `role=pending_onboarding`
- [ ] Testar fluxo completo Google → onboarding → dashboard
- [ ] Testar fluxo completo Facebook → onboarding → dashboard

---

## 🔲 FASE 12 — Gamificação

- [ ] Sistema de badges e conquistas
- [ ] Ranking por academia
- [ ] Pontuação por sessão concluída
- [ ] Tela de ranking público (TV)

---

## 🔲 FASE 13 — Módulo Permissões Dinâmicas

- [ ] Schema de permissões granulares por usuário no banco
- [ ] Painel de permissões para `tenant_admin`
- [ ] Menu lateral filtrando itens por permissão da sessão
- [ ] API protegida por permissões granulares

---

## 🔲 FASE 14 — Relatórios e Evolução

- [ ] Evolução do atleta (FC histórica, cargas, ACWR)
- [ ] Relatórios por academia (frequência, desempenho)
- [ ] **Exportação PDF/CSV** — inclui fluxo de portabilidade LGPD (Fase 4.3)
- [ ] Daily Logs — registro subjetivo pós-treino

---

## 🔲 FASE 15 — Páginas Próprias por Role

> Substituir os redirects temporários por páginas reais filtradas por tenant

- [x] `/coach/athletes` e `/coach/athletes/[id]` *(concluído na Fase 3)*
- [x] `/coaches/[id]` *(concluído na Fase 4)*
- [ ] `/academy/coaches` — lista de coaches da academia
- [ ] `/academy/athletes` — lista de alunos da academia
- [ ] `/academy/recepcionist` — gestão de recepcionistas
- [ ] `/academy_coach/athletes` — atletas do treinador da academia
- [ ] Demais páginas role-específicas

---

## 🔲 FASE 16 — Produção e Deploy

> Decisão de infraestrutura tomada em 19/03/2026.

### Infraestrutura escolhida: VPS (Hetzner CX22)

| Critério | Decisão |
|---|---|
| Servidor | **Hetzner CX22** — 2 vCPU, 4 GB RAM, 40 GB SSD, ~€ 3,79/mês |
| App | Next.js rodando via **PM2** (processo persistente) |
| ANT+ Server | Processo separado via **PM2** também (porta 3001) |
| Proxy reverso | **Nginx** + Certbot (HTTPS gratuito via Let's Encrypt) |
| Banco de dados | **MySQL 8** local no VPS (não exposto externamente) |
| Deploy automático | **GitHub Actions** — `git push main` → deploy no servidor |
| Cron de sessões | **crontab** no servidor — a cada 5 min (Opção B, ver abaixo) |
| Domínio | Domínio próprio (~R$ 40/ano no Registro.br para `.com.br`) |
| Backup | MySQL dump automático para bucket S3 ou Cloudflare R2 |
| **Custo total** | **~R$ 25–35/mês** |

### Por que não Vercel
- WebSocket não suportado (obrigatório para ANT+/monitoramento em tempo real)
- MySQL precisa de banco externo (custo adicional)
- Cold start em serverless prejudica UX
- Plano Pro: $20/mês por usuário — inviável para SaaS multi-tenant

### Por que não InfinityFree
- Hospedagem PHP/cPanel — **não roda Node.js / Next.js**
- Sem suporte a WebSocket
- MySQL não aceita conexões externas

### Por que não Railway (como opção definitiva)
- Boa opção gerenciada, mas custo imprevisível em picos
- Menos autonomia que VPS
- Recomendado apenas como ambiente de teste/staging antes da migração para VPS

### Status do cron de sessões

| Opção | Status | Quando usar |
|---|---|---|
| **Opção A** — `computeStatus()` on-the-fly na API | ✅ **Ativo agora** | Desenvolvimento / sem servidor ainda |
| **Opção B** — cron job `GET /api/cron/sessions-status` a cada 5 min | 🔲 Pendente | Ao fazer deploy no VPS |

> A Opção A já está implementada em `GET /api/sessions` — status calculado na hora do fetch, banco não é atualizado. Funciona perfeitamente para desenvolvimento local e testes.
> A Opção B será implementada junto com o GitHub Actions de deploy (Fase 16).

### Checklist de deploy (pendente — após MVP)
- [ ] Provisionar VPS Hetzner CX22
- [ ] Instalar Node.js 20 LTS + PM2 + Nginx + MySQL 8 + Certbot
- [ ] Configurar `.env` de produção
- [ ] Configurar GitHub Actions para deploy automático via SSH
- [ ] Configurar crontab para `GET /api/cron/sessions-status` (Opção B)
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

### Datas
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
- Sem essas funções, `''` em coluna `int` causa `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD` no MySQL

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
- Diálogos de confirmação: sempre usar `NodusConfirmDialog` ou `NodusDeleteDialog` — NUNCA `confirm()`/`alert()` nativos

### Padrões de Dashboard
- Grid: sempre `<Grid size={{ xs: 12, md: 6 }}>` — API MUI v7 (não usar `item xs={}`)
- Gráficos: sempre via `AppReactApexCharts` com `dynamic import` (SSR: false)
- StatCards: usar `<StatCard>` com `CustomAvatar` rounded + `<Chip variant='tonal'>` para trend
- Layout: `contentWidth: 'wide'` no themeConfig — nunca `'compact'` (quebra o Grid)

### Status de Sessão (como funciona)
- O banco **sempre** armazena o status original (`scheduled`, `cancelled`)
- A API sobrescreve o status na resposta usando `computeStatus()` (Opção A, ativo agora)
- `cancelled` é imutável — só pode ser definido manualmente pelo coach via `PUT /api/sessions/[id]`
- Na Fase 16 (deploy), migrar para Opção B: cron atualizando o banco diretamente

### Check-in e Histórico de Sessões (comportamento atual vs. futuro)

| Aspecto | Comportamento Atual | Comportamento Futuro (Fase 7) |
|---|---|---|
| Check-in | Manual — atleta clica no botão | Automático via FC do dispositivo ANT+ |
| Histórico | Sessões com `checked_in = 1` | Sessões com `checked_in = 1` **E** `end_datetime < now` |
| Confirmação de presença | Ato de clicar no botão | Dado de FC detectado durante a sessão |

### Arquitetura ANT+ (Fase 7)
- **Servidor ANT+**: processo Node.js separado em `ant-server/` na porta **3001**
- **Lib**: `ant-plus-next` com `GarminStick2` + `HeartRateScanner` em Continuous Scanning Mode
- **DeviceId**: o campo `sensors.serial` do NODUS armazena o ID numérico ANT+ de cada atleta
- **WebSocket path**: `ws://localhost:3001/ws/heartrate` (mesmo padrão do projeto original)
- **Throttle banco**: gravação a cada 5s por atleta — em memória sempre ao vivo para o WS

---

*Última atualização: 24/03/2026 — Fase 6 concluída ✅ | Fase 7 planejada 🔲*
