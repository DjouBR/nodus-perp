# DEPLOYMENT_PLAN — NODUS PERP

> Documento vivo. Atualizado a cada sprint ou ciclo de fixes.

---

## STATUS ATUAL — Marco 0 (Infra + Auth + CRUDs Base)

### ✅ Concluído

| Área | O que foi feito |
|------|-----------------|
| Auth | NextAuth com CredentialsProvider + Google + Facebook, JWT com role/tenant_id/unit_id |
| Schema DB | Tabelas: users, athlete_profiles, coach_profiles, tenants, tenant_units, sensors, sessions, session_participants, daily_logs, training_plans, gamification, financial |
| Super Admin | CRUD de Clientes (tenants): list, create, view, edit (PUT) |
| Super Admin | CRUD de Usuários por role |
| Tenant Admin | CRUD de Atletas: list, create, view, edit |
| Tenant Admin | CRUD de Coaches/Professores: list, create, view |
| Coach View | Perfil próprio, lista de alunos vinculados |
| RBAC | Middleware de rota por role, `canEdit` condicional por session |
| Fix #1 | `birthdate` normalizado para `yyyy-MM-dd` no SuperAdmin ClientDetailView |
| Fix #2 | `birthdate` normalizado para `yyyy-MM-dd` no CoachDetailView |
| Fix #3 | `birthdate` normalizado para `yyyy-MM-dd` no AthleteDetailView |
| Fix #4 | Botão Editar Coach oculto para roles sem permissão (só super_admin e tenant_admin) |

---

## 🚧 ROADMAP — Marco 1 (CRUDs 100% Funcionais)

### Prioridade ALTA — Bloqueia teste real do sistema

#### 1. Exclusão (DELETE) nas datatables

| Datatable | Situação atual | O que falta |
|-----------|-----------------|-------------|
| ClientTable (SuperAdmin) | Só tem Inativar/Reativar | Botão DELETE real com confirm |
| CoachTable | ✅ Tem DELETE (`/api/coaches/:id DELETE`) | OK |
| AthleteTable | Só tem Inativar (`/api/athletes/:id DELETE` = soft delete) | Verificar se DELETE hard está implementado na API |

#### 2. Upload de foto (avatar)

- Campo `avatar_url` já existe no schema `users` ✅
- Falta:
  - API route `POST /api/upload/avatar` (salva arquivo em `/public/uploads/avatars/` ou cloud)
  - Componente `AvatarUpload` (input file + preview + crop opcional)
  - Integrar nos DetailViews: Client, Coach, Athlete
  - Gravar URL no campo `avatar_url` via PUT do usuário

#### 3. Auditória de bugs encontrados

| Bug | Arquivo | Status |
|-----|---------|--------|
| birthdate ISO → yyyy-MM-dd | ClientDetailView | ✅ Corrigido |
| birthdate ISO → yyyy-MM-dd | CoachDetailView | ✅ Corrigido |
| birthdate ISO → yyyy-MM-dd | AthleteDetailView | ✅ Corrigido |
| Botão Editar Coach visível para qualquer role | CoachDetailView | ✅ Corrigido |
| DELETE ausente na ClientTable | ClientTable.jsx | 🚧 Pendente |
| Upload de avatar não implementado | Todos os DetailViews | 🚧 Pendente |

---

## 📅 Marco 2 (Sessões + Monitoramento)

- Criar/iniciar sessões de treino
- Integração ANT+ WebSocket
- Dashboard em tempo real de FC
- TRIMP e zonas de FC calculados automaticamente

## 📅 Marco 3 (Financeiro + Gamificação)

- Planos de pagamento por tenant
- Cobrança e inadimplência
- Ranking e conquistas de atletas

---

## Arquitetura Rápida

```
nodus-perp/
├── src/app/api/          ← Route Handlers Next.js (REST API)
├── src/views/            ← Componentes de página por role
│   ├── admin/clients/    ← SuperAdmin
│   ├── athletes/         ← Tenant Admin
│   ├── coaches/          ← Tenant Admin
│   └── coach/            ← Coach View
├── src/lib/db/schema/    ← Drizzle ORM schema
└── src/libs/auth.js      ← NextAuth config
```

## Convenções

- Datas do banco MySQL → sempre normalizar com `toDateInput()` antes de `<input type="date">`
- DELETE em usuários = soft delete (is_active = 0), não remover registro
- Permissões: checar sempre pelo `session.user.role` via `useSession()`
