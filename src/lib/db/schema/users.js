import { mysqlTable, varchar, text, tinyint, timestamp, date, mysqlEnum, int } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// USERS — todos os usuários do sistema (role define o tipo)
//
// Hierarquia de roles (8 roles):
//   super_admin     → dono da plataforma NODUS, vê tudo
//   tenant_admin    → dono/gestor de uma academia
//   academy_coach   → professor/treinador FUNCIONÁRIO de academia (cadastrado pelo tenant_admin)
//   coach           → treinador INDEPENDENTE com seus próprios alunos (cadastrado pelo super_admin)
//   receptionist    → recepcionista de uma academia (cadastrado pelo tenant_admin)
//   academy_athlete → aluno da academia (cadastrado pelo tenant_admin ou academy_coach)
//   coach_athlete   → aluno do treinador independente (cadastrado pelo coach)
//   athlete         → usuário INDEPENDENTE sem vínculo com academia ou treinador (self-register)
// ───────────────────────────────────────────────────────────────────
export const users = mysqlTable('users', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  tenant_id:       varchar('tenant_id', { length: 36 }),               // NULL = super_admin / coach independente / athlete
  unit_id:         varchar('unit_id', { length: 36 }),                 // NULL = acesso a todas as unidades
  name:            varchar('name', { length: 100 }).notNull(),
  email:           varchar('email', { length: 100 }).notNull().unique(),
  password_hash:   varchar('password_hash', { length: 255 }),
  role:            mysqlEnum('role', [
                     'super_admin',
                     'tenant_admin',
                     'academy_coach',    // professor funcionário da academia
                     'coach',            // treinador independente
                     'receptionist',     // recepcionista da academia
                     'academy_athlete',  // aluno da academia
                     'coach_athlete',    // aluno do treinador independente
                     'athlete',          // usuário independente (sem vínculo)
                   ]).notNull().default('academy_athlete'),
  avatar_url:      varchar('avatar_url', { length: 255 }),
  phone:           varchar('phone', { length: 20 }),
  birthdate:       date('birthdate'),
  document:        varchar('document', { length: 20 }),
  gender:          mysqlEnum('gender', ['M', 'F', 'other']),
  is_active:       tinyint('is_active').notNull().default(1),
  email_verified:  tinyint('email_verified').notNull().default(0),
  last_login:      timestamp('last_login'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// ATHLETE_PROFILES — dados esportivos
// Vale para: academy_athlete, coach_athlete e athlete
//
// status:
//   active           → padrão
//   inactive         → inativado manualmente pelo coach/admin
//   suspended        → suspenso por pendência financeira ou outro motivo
//   pending_deletion → coach/academia foi excluído; aluno tem 30 dias para exportar dados
//                      ou migrar para plano Atleta Independente (Fase 4.3 LGPD)
// ───────────────────────────────────────────────────────────────────
export const athlete_profiles = mysqlTable('athlete_profiles', {
  id:                      varchar('id', { length: 36 }).primaryKey(),
  user_id:                 varchar('user_id', { length: 36 }).notNull().unique(),
  coach_id:                varchar('coach_id', { length: 36 }),            // FK users.id do coach (para coach_athlete)
  hr_max:                  int('hr_max'),
  hr_rest:                 int('hr_rest'),
  hr_threshold:            int('hr_threshold'),
  vo2max:                  varchar('vo2max', { length: 10 }),
  weight_kg:               varchar('weight_kg', { length: 8 }),
  height_cm:               varchar('height_cm', { length: 8 }),
  body_fat_pct:            varchar('body_fat_pct', { length: 8 }),
  goal:                    text('goal'),
  medical_notes:           text('medical_notes'),
  emergency_contact:       varchar('emergency_contact', { length: 100 }),
  emergency_phone:         varchar('emergency_phone', { length: 20 }),
  zone1_max:               int('zone1_max'),
  zone2_max:               int('zone2_max'),
  zone3_max:               int('zone3_max'),
  zone4_max:               int('zone4_max'),
  plan_id:                 varchar('plan_id', { length: 36 }),
  enrollment_date:         date('enrollment_date'),
  status:                  mysqlEnum('status', [
                             'active',
                             'inactive',
                             'suspended',
                             'pending_deletion',  // Fase 4.3 LGPD — exclusão agendada
                           ]).notNull().default('active'),
  deletion_scheduled_at:   date('deletion_scheduled_at'),               // Fase 4.3 LGPD — data do hard delete automático
  created_at:              timestamp('created_at').defaultNow(),
  updated_at:              timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// COACH_PROFILES — dados profissionais
// Vale para: academy_coach e coach
// ───────────────────────────────────────────────────────────────────
export const coach_profiles = mysqlTable('coach_profiles', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  user_id:      varchar('user_id', { length: 36 }).notNull().unique(),
  cref:         varchar('cref', { length: 30 }),
  specialties:  text('specialties'),
  bio:          text('bio'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow().onUpdateNow(),
})
