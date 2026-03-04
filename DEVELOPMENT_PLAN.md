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

## Roles do Sistema

| Role | Descrição |
|---|---|
| `super_admin` | Dono do SaaS (NODUS) — gerencia tenants e planos |
| `tenant_admin` | Dono/gestor de academia ou equipe |
| `coach` | Treinador independente (cliente pagante) |
| `academy_coach` | Treinador funcionário da academia |
| `receptionist` | Recepcionista da academia |
| `academy_athlete` | Aluno cadastrado pela academia |
| `athlete` | Atleta independente (cliente pagante) |

---

## ✅ FASE 1 — Fundação (Concluída)

### Banco de Dados
- [x] Schema MySQL completo via Drizzle ORM
  - Tabelas: `tenants`, `users`, `athletes`, `sessions`, `heart_rate`, `daily_logs`, `plans`, `acwr`
- [x] Script de migration (`migrate.mjs`)
- [x] Seed completo com dados de teste (tenant, users, atletas, coaches, sessões, daily logs)
- [x] Correção de colunas `tinyint → int` para suportar planos Enterprise

### Autenticação
- [x] NextAuth conectado ao MySQL via Drizzle ORM
- [x] JWT com `role`, `tenant_id`, `unit_id`, `avatar`
- [x] `VALID_ROLES` exportado — validação no token e sanity check no callback JWT
- [x] Suporte a Google OAuth e Facebook OAuth (pending_onboarding)
- [x] Páginas customizadas: `/login`, `/register`, `/forgot-password`

### Middleware RBAC
- [x] Proteção de rotas por role com `next-auth/middleware`
- [x] 7 roles mapeados com prefixos exclusivos
- [x] Rotas legadas remapeadas com roles corretos
- [x] Match por especificidade (rota mais longa vence)
- [x] `getHomeByRole()` e `getSettingsByRole()` para todos os roles
- [x] Conformidade LGPD: `super_admin` isolado de dados pessoais

---

## ✅ FASE 2 — Navegação e RBAC Visual (Concluída)

### Menu Lateral (VerticalMenu.jsx)
- [x] `super_admin` — Gestão, Planos, Financeiro, Monitoramento
- [x] `tenant_admin` — Cadastro, Financeiro, Sessões, Monitoramento, Diversos
- [x] `coach` — Cadastro, Financeiro, Sessões, Prescrição, Monitoramento, Diversos
- [x] `academy_coach` — Cadastro, Sessões, Prescrição, Monitoramento, Diversos
- [x] `receptionist` — Cadastro, Sessões, Financeiro, Diversos
- [x] `academy_athlete` — Treino, Histórico, Diversos
- [x] `athlete` — Treino, Histórico, Diversos
- [x] Todos os roles apontam Dashboard para `/home`

### UserDropdown (UserDropdown.jsx)
- [x] Avatar com iniciais e cor automática por nome
- [x] Nome, role label e email do usuário logado
- [x] Meu Perfil → rota por role
- [x] Mensagens → rota por role (exceto super_admin e athlete)
- [x] Avaliação Física + Financeiro (academy_athlete e athlete)
- [x] Configurações → rota por role
- [x] Botão Sair com signOut correto

### Redirects Temporários
- [x] 68 páginas `redirect()` criadas para todas as rotas novas → páginas existentes
  - Cobre: academy, coach, academy_coach, recepcionist, academy_athlete, athlete
  - Páginas sem implementação → `/home` temporariamente

---

## ✅ FASE 3 — Módulo Atletas (Concluída)

- [x] `GET /api/athletes` — listagem com paginação, busca, filtro por status, isolamento por tenant
- [x] `POST /api/athletes` — criar atleta com validação
- [x] `PUT /api/athletes/[id]` — editar atleta
- [x] `DELETE /api/athletes/[id]` — remover atleta
- [x] Tela `/athletes` — tabela com busca, filtros, paginação, modal de cadastro
- [x] Tela `/athletes/[id]` — perfil detalhado do atleta (AthleteDetailView)
- [x] `AthleteStatsBar` — cards rápidos (total, ativos, inativos)
- [x] `AthleteFilters` — busca + filtro de status
- [x] `AthleteTable` — tabela com ações (ver, editar, excluir)
- [x] `AthleteAddModal` — modal de cadastro de novo atleta

---

## 🔄 FASE 4 — Módulo Coaches (Em andamento)

- [x] `GET /api/coaches` — listagem com paginação, busca, filtro por tipo, isolamento por tenant
- [x] `POST /api/coaches` — criar coach com validação
- [x] `PUT /api/coaches/[id]` — editar coach
- [x] `DELETE /api/coaches/[id]` — remover coach
- [x] Tela `/coaches` — tabela com busca, filtros, paginação, modal de cadastro
- [x] `CoachStatsBar` — cards rápidos
- [x] `CoachFilters` — busca + filtro de tipo
- [x] `CoachTable` — tabela com ações
- [x] `CoachAddModal` — modal de cadastro
- [ ] Tela `/coaches/[id]` — perfil detalhado do coach *(próximo)*

---

## 🔲 FASE 5 — Dashboards por Role

- [ ] `/home` super_admin — métricas SaaS (tenants, MRR, alertas)
- [ ] `/home` tenant_admin — atletas ativos, sessões do dia, receita do mês
- [ ] `/home` coach — atletas do dia, próximas sessões, alertas de FC
- [ ] `/home` academy_coach — igual ao coach (sem financeiro)
- [ ] `/home` receptionist — check-ins do dia, atletas presentes
- [ ] `/home` academy_athlete / athlete — próximo treino, FC última sessão, evolução

---

## 🔲 FASE 6 — Módulo Sessões de Treino

- [ ] Schema: tabela `sessions` já existe — validar campos
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
- [ ] Pré-treino e Pós-treino (academy_athlete / athlete)
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

- [ ] `/academy/coaches` — lista de coaches da academia
- [ ] `/academy/athletes` — lista de alunos da academia
- [ ] `/academy/recepcionist` — gestão de recepcionistas
- [ ] `/coach/athletes` — atletas do coach independente
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

*Última atualização: 03/03/2026*
