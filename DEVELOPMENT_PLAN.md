# NODUS — Plano de Desenvolvimento

> Documento de controle de progresso do projeto NODUS.
> Atualizado a cada entrega significativa.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15, React, MUI v6, Vuexy Template |
| Backend | Next.js API Routes (Node.js) |
| Banco de Dados | MySQL + Drizzle ORM |
| Autenticação | NextAuth.js (JWT) |
| Estilo | Tailwind CSS + MUI |
| Hardware | ANT+ USB via WebSocket |
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
  - Tabelas: `tenants`, `users`, `athlete_profiles`, `sensors`, `training_sessions`, `session_athletes`, `heart_rate`, `daily_logs`, `weekly_indices`, `plans`
- [x] Script de migration (`migrate.mjs`)
- [x] Seed completo com dados de teste (tenant, users, atletas, coaches, sessões, daily logs)
- [x] Colunas ajustadas: `tinyint → int`, coluna de senha é `password_hash` (bcrypt)

### Autenticação
- [x] NextAuth conectado ao MySQL via Drizzle ORM
- [x] JWT com `role`, `tenant_id`, `unit_id`, `avatar`
- [x] `VALID_ROLES` exportado — validação no token e sanity check no callback JWT
- [x] Suporte a Google OAuth e Facebook OAuth (`pending_onboarding`)
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
- [x] `coach_athlete` — Treino, Histórico, Diversos *(adicionado 05/03/2026)*
- [x] `athlete` — Treino, Histórico, Diversos

### UserDropdown (UserDropdown.jsx)
- [x] Avatar com iniciais e cor automática por nome
- [x] Nome, role label e email do usuário logado
- [x] Meu Perfil, Configurações, Sair — todos roteados por role

### Redirects Temporários
- [x] 68+ páginas `redirect()` criadas para todas as rotas novas → páginas existentes

---

## ✅ FASE 3 — Módulo Atletas (Concluída)

### API `/api/athletes`
- [x] `GET /api/athletes` — listagem paginada, busca, filtro de status, isolamento por tenant
  - `super_admin` → vê todos os 3 tipos de atleta
  - `coach` → apenas `coach_athlete` do seu tenant
  - demais staff → apenas `academy_athlete` do seu tenant
- [x] `POST /api/athletes` — cria atleta com role automático por quem cadastra
  - `tenant_admin` / `academy_coach` → cria `academy_athlete`
  - `coach` → cria `coach_athlete` com `coach_id` vinculado
  - `super_admin` → usa `targetRole` do body
  - Senha padrão: `nodus@123` (bcrypt 10 rounds) quando não informada
  - Zonas de FC calculadas automaticamente a partir de `hr_max`

### API `/api/athletes/[id]`
- [x] `GET /api/athletes/[id]` — perfil completo (user + profile + sensor + logs + ACWR + sessões)
  - Aceita os 3 roles de atleta: `athlete`, `academy_athlete`, `coach_athlete`
  - Controle de acesso: `coach` só acessa `coach_athlete`; staff acessa pelo `tenant_id`
- [x] `PUT /api/athletes/[id]` — atualiza user + profile, recalcula zonas de FC
- [x] `DELETE /api/athletes/[id]` — soft delete (is_active=0, status=inactive)

### Componentes de Atletas
- [x] `AthleteStatsBar` — cards rápidos (total, ativos, inativos)
- [x] `AthleteFilters` — busca + filtro de status
- [x] `AthleteTable` — tabela com avatar, FC máx, sensor, status, matrícula, ações
  - Prop `detailBasePath` dinâmica — cada role passa seu prefixo de rota
  - Prop `canManage` para controle de ações de inativação
- [x] `AthleteAddModal` — modal 2 passos (dados pessoais + ficha esportiva)
- [x] `AthleteDetailView` — perfil completo com tabs (Visão Geral / Sessões / Daily Logs)
  - Suporta prop `backPath` para breadcrumb dinâmico
  - Suporta prop `athleteId` direto (sem precisar do `params` do Next.js)
  - Hero card com banner, avatar, stats rápidas
  - Zonas de FC com cálculo automático
  - Card ACWR com interpretação (Zona Ideal / Insuficiente / Risco)
  - Card Sensor ANT+

### Telas de Atletas
- [x] `/athletes` — listagem para tenant_admin, academy_coach, receptionist
- [x] `/athletes/[id]` — perfil para staff da academia
- [x] `/coach/athletes` — listagem exclusiva do coach independente
- [x] `/coach/athletes/[id]` — perfil com breadcrumb "Meus Alunos" *(adicionado 05/03/2026)*

---

## ✅ FASE 4 — Módulo Coaches (Concluída)

- [x] `GET /api/coaches` — listagem paginada com isolamento por tenant
- [x] `POST /api/coaches` — criar coach
- [x] `PUT /api/coaches/[id]` — editar coach
- [x] `DELETE /api/coaches/[id]` — remover coach
- [x] Tela `/coaches` — tabela com busca, filtros, paginação, modal de cadastro
- [x] `CoachStatsBar`, `CoachFilters`, `CoachTable`, `CoachAddModal`
- [ ] Tela `/coaches/[id]` — perfil detalhado do coach *(próximo passo sugerido)*

---

## 🔧 Bugs Corrigidos (05/03/2026)

### RBAC / Auth
- [x] `coach_athlete` não estava em `VALID_ROLES` no `auth.js` — usuários entravam como `pending_onboarding`
- [x] Colisão de prefixo no middleware: `/coach` capturava `/coach_athlete` antes — causava `ERR_TOO_MANY_REDIRECTS`
  - Resolvido: `ROUTE_PERMISSIONS` convertido para array com ordenação por comprimento
- [x] `VerticalMenu.jsx` não tinha bloco para `coach_athlete` — menu lateral aparecia vazio

### API
- [x] `GET /api/athletes` usava `eq(users.role, 'athlete')` fixo — não retornava `coach_athlete` nem `academy_athlete`
- [x] `GET/PUT/DELETE /api/athletes/[id]` — mesmo problema — 404 para qualquer atleta não-independente
  - Resolvido: helper `isAthleteRole()` com `OR` dinâmico para os 3 roles

### Banco de Dados
- [x] Coluna de senha é `password_hash`, não `password` — query `SELECT password` retornava erro 1054
- [x] `atleta@nodus.app` (Ana Paula) estava com `role=academy_athlete` e `tenant_id` da Fitlife — corrigido para `role=athlete, tenant_id=NULL`

### Componentes
- [x] `AthleteDetailView` — breadcrumb e botão Voltar hardcoded em `/athletes` — ignorava `backPath`
- [x] `/coach/athletes/[id]/page.jsx` — `params.id` acessado síncronamente (Next.js 15 exige `await params`)

---

## 🔲 FASE 5 — Dashboards por Role

- [ ] `/home` super_admin — métricas SaaS (tenants, MRR, alertas)
- [ ] `/home` tenant_admin — atletas ativos, sessões do dia, receita do mês
- [ ] `/home` coach — alunos do dia, próximas sessões, alertas de FC
- [ ] `/home` academy_coach — igual ao coach (sem financeiro)
- [ ] `/home` receptionist — check-ins do dia, atletas presentes
- [ ] `/home` academy_athlete / coach_athlete / athlete — próximo treino, FC última sessão, evolução

---

## 🔲 FASE 6 — Módulo Sessões de Treino

- [ ] Schema: tabela `training_sessions` já existe — validar campos
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
- [ ] Persistência dos dados de FC no banco (`heart_rate` table)

---

## 🔲 FASE 8 — Módulo Prescrição de Treino

- [ ] Tela `/planning` — planejamento periodizado
- [ ] Prescrição por atleta (séries, cargas, zonas de FC alvo)
- [ ] Vinculação de prescrição com sessão
- [ ] Pré-treino e Pós-treino (academy_athlete / coach_athlete / athlete)
- [ ] ACWR — cálculo automático (tabela já existe no schema)

---

## 🔲 FASE 9 — Módulo Financeiro

- [ ] Planos e assinaturas (super_admin)
- [ ] Histórico de cobranças
- [ ] Receitas/Despesas por tenant
- [ ] Pagamentos e comprovantes (receptionist)
- [ ] Financeiro do coach independente
- [ ] Financeiro do atleta independente

---

## 🔲 FASE 10 — Módulo Gamificação

- [ ] Sistema de badges e conquistas
- [ ] Ranking por academia
- [ ] Pontuação por sessão concluída
- [ ] Tela de ranking público (TV)

---

## 🔲 FASE 11 — Módulo Permissões Dinâmicas

- [ ] Schema de permissões por usuário no banco
- [ ] Painel de permissões para tenant_admin
- [ ] Menu lateral filtrando itens por permissão da sessão
- [ ] API protegida por permissões granulares

---

## 🔲 FASE 12 — Relatórios e Evolução

- [ ] Evolução do atleta (FC histórica, cargas, ACWR)
- [ ] Relatórios por academia (frequência, desempenho)
- [ ] Exportação PDF/CSV
- [ ] Daily Logs — registro subjetivo pós-treino

---

## 🔲 FASE 13 — Páginas Próprias por Role

> Substituir os redirects temporários por páginas reais filtradas por tenant

- [x] `/coach/athletes` — lista de atletas do coach independente *(concluído)*
- [x] `/coach/athletes/[id]` — perfil com breadcrumb correto *(concluído)*
- [ ] `/coaches/[id]` — perfil detalhado do coach *(próximo)*
- [ ] `/academy/coaches` — lista de coaches da academia
- [ ] `/academy/athletes` — lista de alunos da academia
- [ ] `/academy/recepcionist` — gestão de recepcionistas
- [ ] `/academy_coach/athletes` — atletas do treinador
- [ ] Demais páginas role-específicas

---

## 🔲 FASE 14 — Produção

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
- Seed de teste usa `atleta123` para academy_athletes do seed
- Coluna no banco: `password_hash` (bcrypt 10 rounds — NUNCA `password`)

### Rotas por Role

| Role | Prefixo de rota | Rota de atletas |
|---|---|---|
| `super_admin` | `/admin` | `/athletes` (todos) |
| `tenant_admin` | `/academy` | `/athletes` |
| `coach` | `/coach` | `/coach/athletes` |
| `academy_coach` | `/academy_coach` | `/academy_coach/athletes` |
| `receptionist` | `/recepcionist` | `/recepcionist/athletes` |
| `academy_athlete` | `/academy_athlete` | — |
| `coach_athlete` | `/coach_athlete` | — |
| `athlete` | `/athlete` | — |

### Padrões de Componente
- Toda page route do Next.js 15 que acessa `params` deve ser `async` e usar `await params`
- Client Components com `params` devem usar `use(params)` do React
- `AthleteDetailView` aceita `athleteId` (direct) ou `params` (page route) + `backPath`
- `AthleteTable` aceita `detailBasePath` para definir a rota do botão "ver perfil"

---

*Última atualização: 05/03/2026*
