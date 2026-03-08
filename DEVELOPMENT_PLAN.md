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
- [x] `DELETE /api/athletes/[id]` — soft delete (is_active=0, status=inactive)

### Componentes
- [x] `AthleteStatsBar`, `AthleteFilters`, `AthleteTable` (prop `detailBasePath` + `canManage`)
- [x] `AthleteAddModal` — 2 passos: dados pessoais + ficha esportiva
- [x] `AthleteDetailView` — hero card, zonas FC, ACWR, sensor ANT+, sessões, daily logs
  - Props: `athleteId`, `backPath`, `canEdit` (usa session se omitido)

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
- [x] `DELETE /api/coaches/[id]` — soft delete

### Componentes
- [x] `CoachStatsBar`, `CoachFilters`, `CoachTable`, `CoachAddModal`
- [x] `CoachDetailView` — hero card, dados pessoais, dados profissionais (CREF, especialidades, bio)
  - Botão Editar visível apenas para `super_admin` e `tenant_admin`

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

## ✅ FASE 4.2 — Hotfixes de CRUD (Concluída — 06-08/03/2026)

### Bugs corrigidos
- [x] `birthdate` ISO → `yyyy-MM-dd` no `ClientDetailView` (SuperAdmin)
- [x] `birthdate` ISO → `yyyy-MM-dd` no `CoachDetailView`
- [x] `birthdate` ISO → `yyyy-MM-dd` no `AthleteDetailView`
- [x] Botão Editar Coach visível para qualquer role → agora só `super_admin` e `tenant_admin`
- [x] Botão Editar Atleta com `(canEdit || true)` hardcoded → corrigido para usar `useSession`
  - Roles que podem editar atletas: `super_admin`, `tenant_admin`, `coach`, `academy_coach`

### Melhorias nas datatables
- [x] `ClientTable` — adicionado botão **Excluir** (`tabler-trash`) com `confirm()` + `DELETE /api/admin/clients/:id`
  - Separado de Inativar: inativar = `PUT is_active=0`; excluir = `DELETE`
  - Ícone de Inativar mudado para `text-warning` (antes era `text-error`)
- [x] `AthleteTable` — adicionado botão **Excluir** (`tabler-trash`) com `confirm()` + `DELETE /api/athletes/:id`
  - Inativar usa `PUT is_active=0` (não chama DELETE); excluir chama `DELETE`
- [x] `CoachTable` — já possuía DELETE desde a Fase 4 ✅

---

## 🔲 FASE 5 — Dashboards por Role *(próximo passo)*

- [ ] `/home` `super_admin` — métricas SaaS (tenants ativos, MRR, alertas)
- [ ] `/home` `tenant_admin` — atletas ativos, sessões do dia, receita do mês
- [ ] `/home` `coach` — alunos do dia, próximas sessões, alertas de FC
- [ ] `/home` `academy_coach` — igual ao coach (sem financeiro)
- [ ] `/home` `receptionist` — check-ins do dia, atletas presentes
- [ ] `/home` `academy_athlete` / `coach_athlete` / `athlete` — próximo treino, FC última sessão, evolução

---

## 🔲 FASE 5.1 — Upload de Avatar (pendente)

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
- [ ] Exportação PDF/CSV
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
- DELETE em usuários = soft delete via API (`is_active=0`); excluir da tabela = chamar `DELETE` HTTP
- Permissões: checar sempre `session.user.role` via `useSession()` — nunca hardcodar `true`

---

*Última atualização: 08/03/2026*
