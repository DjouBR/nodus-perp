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
| Hardware | ANT+ USB via WebSocket |
| Changelog | release-it + @release-it/conventional-changelog |
| Deploy | (a definir) |

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

## 🔲 FASE 5.1 — Dados Reais nos Dashboards (próximo passo)

> Substituir os dados `const` simulados por fetch da API real em cada dashboard.

- [ ] `GET /api/dashboard/academia` — atletas ativos, sessões do dia, FC média, calorias, alertas, zonas, presença semanal, top atletas
- [ ] `GET /api/dashboard/coach` — alunos do coach, sessões do dia, FC média do grupo, ACWR médio, alertas, top atletas
- [ ] `GET /api/dashboard/athlete` — sessões no mês, calorias, streak, ranking, próxima sessão, ACWR, progresso
- [ ] Conectar `DashboardAcademia`, `DashboardCoach`, `DashboardAthlete` às APIs reais

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

## 🔲 FASE 5.1 Upload de Avatar (pendente)

> O campo `avatar_url varchar(255)` já existe no schema `users`.

- [ ] API `POST /api/upload/avatar` — recebe `multipart/form-data`, salva em `/public/uploads/avatars/`
- [ ] Componente `AvatarUpload` — clique no avatar abre seletor de arquivo, preview + botão salvar
- [ ] Integrar em `ClientDetailView`, `CoachDetailView`, `AthleteDetailView`
- [ ] Dependência necessária: `formidable` ou `busboy` para parse do multipart

---

## 🔲 FASE 6 — Módulo Sessões de Treino

- [ ] Validar campos da tabela `training_sessions` existente
- [ ] `GET/POST /api/sessions` — listagem e criação
- [ ] `PUT/DELETE /api/sessions/[id]`
- [ ] Tela `/sessions` — agenda com calendário e lista
- [ ] Modal de criação de sessão (data, hora, tipo, coach, atletas)
- [ ] Histórico de sessões por atleta

---

## 🔲 FASE 7 — Monitoramento em Tempo Real (Core do NODUS)

- [ ] Driver ANT+ USB (integração com dispositivo)
- [ ] WebSocket server para streaming de FC
- [ ] Tela `/monitoring` — exibição em tempo real por atleta
- [ ] Zonas de FC com alertas visuais
- [ ] Tela TV (`/academy/tvscreen`) — exibição para academia
- [ ] Persistência dos dados de FC no banco (tabela `heart_rate`)

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

## 🔲 FASE 16 — Produção

- [ ] Definir provedor de deploy (Vercel, Railway, VPS)
- [ ] Variáveis de ambiente de produção
- [ ] Banco de dados de produção (PlanetScale ou MySQL gerenciado)
- [ ] CI/CD pipeline
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
- Dados simulados: marcados com comentário `// substituir por fetch da API (Fase 5.1 real)`

---

*Última atualização: 17/03/2026*
