# NODUS - Changelog

Todas as mudancas relevantes do projeto sao documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com) e [Conventional Commits](https://www.conventionalcommits.org).

---

## [0.1.0] - 2026-03-05

### Novas Funcionalidades

- Autenticacao completa com NextAuth.js (JWT + Google OAuth + Facebook OAuth)
- Sistema RBAC com 8 roles: super_admin, tenant_admin, coach, academy_coach, receptionist, academy_athlete, coach_athlete, athlete
- Middleware de protecao de rotas com isolamento por tenant_id
- Menu lateral (VerticalMenu.jsx) com secoes especificas por role incluindo coach_athlete
- UserDropdown com avatar, role label e rotas dinamicas por role
- API completa de atletas: GET, POST, PUT, DELETE /api/athletes e /api/athletes/[id]
- Tela /athletes com tabela, busca, filtros, paginacao e modal de cadastro
- Tela /athletes/[id] com perfil completo (hero card, zonas de FC, ACWR, sensor, sessoes, daily logs)
- Tela /coach/athletes - listagem exclusiva do coach independente
- Tela /coach/athletes/[id] - perfil com breadcrumb dinamico via prop backPath
- API completa de coaches: GET, POST, PUT, DELETE /api/coaches e /api/coaches/[id]
- Tela /coaches com tabela, busca, filtros, paginacao e modal de cadastro
- Tela /coaches/[id] com perfil completo (dados pessoais, dados profissionais, sessoes, edicao inline)
- 68+ redirects temporarios para rotas role-especificas
- Seed completo com dados de teste (tenants, usuarios, atletas, coaches, sessoes, daily logs)

### Correcoes de Bugs

- coach_athlete ausente de VALID_ROLES - usuarios caiam em pending_onboarding
- Colisao de prefixo no middleware: /coach capturava /coach_athlete - ERR_TOO_MANY_REDIRECTS
- VerticalMenu.jsx sem bloco para role coach_athlete - menu lateral vazio
- GET/PUT/DELETE /api/athletes/[id] usava role=athlete fixo - 404 para coach_athlete e academy_athlete
- GET /api/athletes nao retornava coach_athlete nem academy_athlete
- params.id acessado de forma sincrona em page routes do Next.js 15 - corrigido para async/await params
- Coluna de senha referenciada como password - corrigido para password_hash
- AthleteDetailView com breadcrumb hardcoded em /athletes - refatorado para prop backPath
- CoachDetailView refatorado de use(params) para props diretas coachId + backPath + backLabel

### Documentacao

- DEVELOPMENT_PLAN.md com fases, roles, convencoes, tabela de rotas por role e bugs corrigidos
- Secao de Convencoes do Projeto adicionada ao plano de desenvolvimento
