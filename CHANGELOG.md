# NODUS - Changelog

Todas as mudancas relevantes do projeto sao documentadas aqui.


## 0.2.0 (2026-03-06)

### Novas Funcionalidades

* /coaches/[id] — perfil detalhado do coach (API + page + CoachDetailView) ([9e5a108](https://github.com/DjouBR/nodus-perp/commit/9e5a10842f7d04e6e6dc2a88124363c4040891f5))
* add all NODUS dashboard pages (home, academies, athletes, coaches, sessions, daily-logs, monitoring, reports, planning, settings) ([d26aa5b](https://github.com/DjouBR/nodus-perp/commit/d26aa5bd9057ad59034c07530393ed59f1e8d280))
* add coach_athlete role (8 roles) — schema, API, menus, middleware ([3a606db](https://github.com/DjouBR/nodus-perp/commit/3a606db0a792253488fa2fd31fcd093ad27ace8a))
* add coach_athlete to UserDropdown ROLE_LABELS, PROFILE_URL, SETTINGS_URL, EXTRA_ITEMS ([f4a7a9c](https://github.com/DjouBR/nodus-perp/commit/f4a7a9c4bc76cd702ab3ed1918555b37a8ae4e06))
* add dashboard layout with Vuexy providers, sidebar and navbar ([74e6972](https://github.com/DjouBR/nodus-perp/commit/74e69727632530ef436c73e90ebf584f83526aac))
* add full auth flow (login, register, forgot-password, reset-password, verify-email, two-steps) + NextAuth + middleware RBAC ([72aef59](https://github.com/DjouBR/nodus-perp/commit/72aef59e094170057e6bcdd20c4158e8c495ca78))
* add migrate.mjs script for running drizzle migrations with .env.local ([c898a48](https://github.com/DjouBR/nodus-perp/commit/c898a483a6f3532035ed82a70910d00289e19e18))
* add NODUS navigation menu (vertical + horizontal) ([85c5202](https://github.com/DjouBR/nodus-perp/commit/85c5202ca70f70ebf6044597526b0ff8fe176832))
* add root app layout and globals CSS ([c677bed](https://github.com/DjouBR/nodus-perp/commit/c677bed6223906546c2cb4a267c19443b9b3b0df))
* adiciona seção Financeiro no menu do Coach independente ([a647f17](https://github.com/DjouBR/nodus-perp/commit/a647f17cb8361565b4b7abfbcc19a5ed00d75354))
* auth.js e middleware atualizados — 7 roles + rotas legadas remapeadas ([ff0da0e](https://github.com/DjouBR/nodus-perp/commit/ff0da0e1335b7d455a334bc8e1786efcfcb148ca))
* coach/athletes proper page + fix redirect + update coach vertical menu ([82f74a3](https://github.com/DjouBR/nodus-perp/commit/82f74a314feb50579ac5778d69d3c48920e1e2c0))
* complete coaches module - CoachDetailView with backPath prop + async page routes ([decb4d4](https://github.com/DjouBR/nodus-perp/commit/decb4d46bfea6466c60fc688d7182f61b40649d1))
* connect NextAuth to MySQL database — real credentials via Drizzle ORM ([224918b](https://github.com/DjouBR/nodus-perp/commit/224918ba6592043e918630559920a9cdf982a85e))
* Dashboard Academia (tenant_admin) com widgets de stats, alertas, sessões e atletas ([5a62069](https://github.com/DjouBR/nodus-perp/commit/5a62069b53cfd1c8a9bf556b93e2ae23c9e124c4))
* Drizzle ORM + schema MySQL completo (tenants, users, athletes, sessions, HR, ACWR) ([d8275c7](https://github.com/DjouBR/nodus-perp/commit/d8275c7286a6f58c0843f85dfdbcdfa3f3b92116))
* dynamic sidebar menu filtered by user role (RBAC) ([35f89f0](https://github.com/DjouBR/nodus-perp/commit/35f89f09c16123fd50d8f729c080f6694ec4f9bf))
* Financeiro na Academia, novo role academy_coach com menu e dropdown completos ([cf7fa67](https://github.com/DjouBR/nodus-perp/commit/cf7fa671d44ff75e2602f5ecac2b5359badd3605))
* GET /api/athletes — lista atletas do tenant com perfil, sensor e paginação ([dd40ac3](https://github.com/DjouBR/nodus-perp/commit/dd40ac307238df3e90b543e57dd868da92f64de9))
* menu Coach independente + fix dashboard routes + dropdown Coach ([5f60124](https://github.com/DjouBR/nodus-perp/commit/5f60124e14fe6b9bd1a0e6340fd99c11402e334d))
* menu lateral e dropdown Academia/Equipes (tenant_admin) ([7011d21](https://github.com/DjouBR/nodus-perp/commit/7011d2177eb2d69e207b1b384fdb7f135974b834))
* menu lateral e dropdown Recepcionista ([5b742dc](https://github.com/DjouBR/nodus-perp/commit/5b742dc8655285c143dffb7f31a668a4e82b2cfd))
* menus laterais e dropdowns academy_athlete e athlete — menus completos ([1bd97b1](https://github.com/DjouBR/nodus-perp/commit/1bd97b11c6f8179bde37ab0b3ca52f0c2b876d48))
* middleware atualizado com todos os 7 roles e rotas completas ([7cc7dc5](https://github.com/DjouBR/nodus-perp/commit/7cc7dc5d00da11c4796e37982644b63561bba282))
* navbar reordenada + menu lateral Super Admin + dropdown Super Admin ([f7ec300](https://github.com/DjouBR/nodus-perp/commit/f7ec300f9057fd287d7a49357bf21f8768d2ebcf))
* POST /api/athletes (criar atleta) + PUT/DELETE /api/athletes/[id] ([2094440](https://github.com/DjouBR/nodus-perp/commit/209444012a796188a1224d8930896306898db572))
* **schema:** adiciona academy_coach e academy_athlete ao ENUM + migration SQL + debug endpoint ([fd79999](https://github.com/DjouBR/nodus-perp/commit/fd79999d2ebc6680c35052c6bc951cb8afa4ff20))
* seed completo com tenant, users, atletas, coaches, sessões e daily logs ([71f383f](https://github.com/DjouBR/nodus-perp/commit/71f383fa850ee2b2fe65b993ee6e88d1e0b2a8bf))
* settings por role — middleware, UserDropdown e páginas placeholder ([0c52197](https://github.com/DjouBR/nodus-perp/commit/0c52197c6d0b83aa7334b682e5a7273d1e7886f8))
* tela /athletes — listagem com tabela, busca, filtros, paginação e modal de cadastro ([a74ad57](https://github.com/DjouBR/nodus-perp/commit/a74ad578ca9c9de2c13ba70251b381aaf8cbf071))
* tela Coaches completa (tabela, filtros, modal, stats, API) + DEVELOPMENT_PLAN.md ([d445b4e](https://github.com/DjouBR/nodus-perp/commit/d445b4e3c83962ef27ba1baa50b81773cee2eed6))

### Correcoes de Bugs

* add .js extensions to schema/index.js exports for ESM compatibility ([ffd64d0](https://github.com/DjouBR/nodus-perp/commit/ffd64d04eefb2a9c4f3fe3095483106543b9bfb0))
* add coach_athlete menu block to VerticalMenu.jsx ([2f01b57](https://github.com/DjouBR/nodus-perp/commit/2f01b5707f6cb70928fafd1b026d7d68068c0eea))
* add coach_athlete to VALID_ROLES + AthleteTable detailBasePath + auth.js VALID_ROLES sync ([47c223a](https://github.com/DjouBR/nodus-perp/commit/47c223ada6e669f65bb2c86eeefdf768ad9ff6f8))
* add SessionProvider wrapper to fix useSession error ([155d8ba](https://github.com/DjouBR/nodus-perp/commit/155d8ba4767032231851d5f102ae5ce9849ed4d3))
* api/athletes/[id] - accept all 3 athlete roles (athlete|academy_athlete|coach_athlete) ([ffbd0a0](https://github.com/DjouBR/nodus-perp/commit/ffbd0a05bbdb1adaa2f56c989e7cac251cc42d7e))
* **api/athletes:** filtrar athlete + academy_athlete no GET; role automático no POST; academy_coach pode listar ([eaec978](https://github.com/DjouBR/nodus-perp/commit/eaec9780dee6ef92ca3ef9c0ae2eab1b73551d3d))
* **api/coaches:** UUID faltando no INSERT + campo specialty inexistente + Object.entries crash no GET ([987a0da](https://github.com/DjouBR/nodus-perp/commit/987a0daaece412e2b790355f96924018e363bf26))
* await params in /api/athletes/[id] route for Next.js 15 compatibility ([d803203](https://github.com/DjouBR/nodus-perp/commit/d80320352aa1aece1b29a0e58a2911d3318a0b11))
* await params in coach/athletes/[id]/page.jsx (Next.js 15 async params) ([221d524](https://github.com/DjouBR/nodus-perp/commit/221d524dd44dc54754a8c5dca92fb376b07bcb6b))
* change plans columns from tinyint to int to support Enterprise limits (999+) ([e203298](https://github.com/DjouBR/nodus-perp/commit/e20329825919b018d93c18f6209d07acc68029e6))
* **coaches:** academy_coach não existe no ENUM + 409 com mensagem clara de email duplicado em outro role ([e9f12d4](https://github.com/DjouBR/nodus-perp/commit/e9f12d4521b5fe4522542174aad4853ba70a8dc6))
* criar páginas de redirecionamento para todas as rotas novas que apontam para páginas existentes ([f6d652c](https://github.com/DjouBR/nodus-perp/commit/f6d652ccce58d03e55e7ee66812a43de9dd12fad))
* dashboard URL — todos os roles (exceto super_admin) apontam para /home ([4f72740](https://github.com/DjouBR/nodus-perp/commit/4f72740353dfffe0e0f3cd8adf04d27242eed3af))
* middleware — /settings e /profile liberados para todos os roles autenticados ([489baf6](https://github.com/DjouBR/nodus-perp/commit/489baf621d090719268075de821071ca58f8ee51))
* middleware prefix collision coach vs coach_athlete + AthleteDetailView backPath prop ([e2d1791](https://github.com/DjouBR/nodus-perp/commit/e2d1791843e98fd0405f57385c4035dae77efe46))
* **middleware:** super_admin sem acesso direto a settings de outros roles — LGPD compliance ([45f21ad](https://github.com/DjouBR/nodus-perp/commit/45f21ad039f9da65e4160bbb0f26b7750b57c9ac))
* modal background + feat: /athletes/[id] (User-View) + /profile (User-Profile) ([161cdd1](https://github.com/DjouBR/nodus-perp/commit/161cdd1d7ca407375e8759b602f6cf6a5587acc9))
* replace Vuexy branding with NODUS (menu, logo, footer) ([c994992](https://github.com/DjouBR/nodus-perp/commit/c994992a45f267f366cfe012ea4d8bfe308f2fd2))
* restore original Providers.jsx and add separate NextAuthProvider client component ([e13657c](https://github.com/DjouBR/nodus-perp/commit/e13657cd9e37e68f7ce610ce13772d2cfcaa365b))
* todos os roles usam /home como dashboard ([02125a4](https://github.com/DjouBR/nodus-perp/commit/02125a472aff0d70c22be02a66f7abd996203502))
* UserDropdown — session real, /profile, /settings, signOut correto ([986d55a](https://github.com/DjouBR/nodus-perp/commit/986d55af1f7160c144fa4d30778b807ebe66f063))

### Documentacao

* update .env.example with correct MySQL root credentials format ([d78cd9e](https://github.com/DjouBR/nodus-perp/commit/d78cd9e2dbe2424c23a8b6556cbd62c5a9f7eeda))
* update DEVELOPMENT_PLAN.md - session 05/03/2026 fixes and progress ([49eda53](https://github.com/DjouBR/nodus-perp/commit/49eda5307cf0be75c3da1048844560048cb53b18))

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
