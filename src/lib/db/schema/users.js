import { mysqlTable, varchar, text, tinyint, timestamp, date, mysqlEnum, int } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// USERS — todos os usuários do sistema (role define o tipo)
// ───────────────────────────────────────────────────────────────────
export const users = mysqlTable('users', {
  id:              varchar('id', { length: 36 }).primaryKey(),          // UUID
  tenant_id:       varchar('tenant_id', { length: 36 }),               // NULL = super_admin
  unit_id:         varchar('unit_id', { length: 36 }),                 // NULL = acesso a todas as unidades do tenant
  name:            varchar('name', { length: 100 }).notNull(),
  email:           varchar('email', { length: 100 }).notNull().unique(),
  password_hash:   varchar('password_hash', { length: 255 }),
  role:            mysqlEnum('role', [
                     'super_admin',
                     'tenant_admin',
                     'coach',
                     'receptionist',
                     'athlete'
                   ]).notNull().default('athlete'),
  avatar_url:      varchar('avatar_url', { length: 255 }),
  phone:           varchar('phone', { length: 20 }),
  birthdate:       date('birthdate'),
  document:        varchar('document', { length: 20 }),                // CPF
  gender:          mysqlEnum('gender', ['M', 'F', 'other']),
  is_active:       tinyint('is_active').notNull().default(1),
  email_verified:  tinyint('email_verified').notNull().default(0),
  last_login:      timestamp('last_login'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// ATHLETE_PROFILES — dados esportivos estendidos do atleta
// ───────────────────────────────────────────────────────────────────
export const athlete_profiles = mysqlTable('athlete_profiles', {
  id:                  varchar('id', { length: 36 }).primaryKey(),
  user_id:             varchar('user_id', { length: 36 }).notNull().unique(), // FK users.id
  hr_max:              int('hr_max'),                                   // FC máxima (bpm)
  hr_rest:             int('hr_rest'),                                  // FC repouso (bpm)
  hr_threshold:        int('hr_threshold'),                             // FC limiar
  vo2max:              varchar('vo2max', { length: 10 }),               // VO2max estimado
  weight_kg:           varchar('weight_kg', { length: 8 }),
  height_cm:           varchar('height_cm', { length: 8 }),
  body_fat_pct:        varchar('body_fat_pct', { length: 8 }),
  goal:                text('goal'),                                    // objetivo pessoal
  medical_notes:       text('medical_notes'),                           // restrições médicas
  emergency_contact:   varchar('emergency_contact', { length: 100 }),
  emergency_phone:     varchar('emergency_phone', { length: 20 }),
  // Zonas de FC personalizadas (sobrescrevem as da academia)
  zone1_max:           int('zone1_max'),
  zone2_max:           int('zone2_max'),
  zone3_max:           int('zone3_max'),
  zone4_max:           int('zone4_max'),
  // Plano/matrícula
  plan_id:             varchar('plan_id', { length: 36 }),
  enrollment_date:     date('enrollment_date'),
  status:              mysqlEnum('status', ['active', 'inactive', 'suspended']).notNull().default('active'),
  created_at:          timestamp('created_at').defaultNow(),
  updated_at:          timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// COACH_PROFILES — dados profissionais do coach/professor
// ───────────────────────────────────────────────────────────────────
export const coach_profiles = mysqlTable('coach_profiles', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  user_id:      varchar('user_id', { length: 36 }).notNull().unique(),  // FK users.id
  cref:         varchar('cref', { length: 30 }),                        // registro profissional
  specialties:  text('specialties'),                                    // JSON array de especialidades
  bio:          text('bio'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow().onUpdateNow(),
})
