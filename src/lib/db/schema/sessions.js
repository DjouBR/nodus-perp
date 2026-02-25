import { mysqlTable, varchar, text, tinyint, timestamp, datetime, int, float, mysqlEnum } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// SESSION_TYPES — modalidades de aula (Spinning, CrossFit, Funcional...)
// ───────────────────────────────────────────────────────────────────
export const session_types = mysqlTable('session_types', {
  id:         varchar('id', { length: 36 }).primaryKey(),
  tenant_id:  varchar('tenant_id', { length: 36 }).notNull(),
  name:       varchar('name', { length: 80 }).notNull(),               // ex: "Spinning", "CrossFit"
  color:      varchar('color', { length: 7 }).default('#6366f1'),      // cor hex para o calendário
  icon:       varchar('icon', { length: 50 }),                         // ícone tabler
  created_at: timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// TRAINING_SESSIONS — cada aula/treino agendado ou realizado
// ───────────────────────────────────────────────────────────────────
export const training_sessions = mysqlTable('training_sessions', {
  id:                varchar('id', { length: 36 }).primaryKey(),
  tenant_id:         varchar('tenant_id', { length: 36 }).notNull(),
  unit_id:           varchar('unit_id', { length: 36 }),
  session_type_id:   varchar('session_type_id', { length: 36 }),
  coach_id:          varchar('coach_id', { length: 36 }).notNull(),    // FK users.id
  name:              varchar('name', { length: 100 }).notNull(),
  start_datetime:    datetime('start_datetime').notNull(),
  end_datetime:      datetime('end_datetime'),
  duration_min:      int('duration_min').default(60),
  capacity:          int('capacity').default(30),
  status:            mysqlEnum('status', ['scheduled', 'active', 'finished', 'cancelled']).notNull().default('scheduled'),
  // Zonas-alvo prescritas para a sessão
  target_zone_min:   int('target_zone_min').default(2),
  target_zone_max:   int('target_zone_max').default(4),
  notes:             text('notes'),
  // Métricas calculadas pós-sessão
  avg_hr:            int('avg_hr'),
  avg_calories:      int('avg_calories'),
  participants_count: int('participants_count'),
  created_at:        timestamp('created_at').defaultNow(),
  updated_at:        timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// SESSION_ATHLETES — quais atletas participaram de cada sessão
// ───────────────────────────────────────────────────────────────────
export const session_athletes = mysqlTable('session_athletes', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  session_id:      varchar('session_id', { length: 36 }).notNull(),    // FK training_sessions.id
  athlete_id:      varchar('athlete_id', { length: 36 }).notNull(),    // FK users.id
  sensor_id:       varchar('sensor_id', { length: 36 }),               // FK sensors.id
  checked_in:      tinyint('checked_in').notNull().default(0),
  // Métricas individuais da sessão (calculadas ao encerrar)
  avg_hr:          int('avg_hr'),
  max_hr:          int('max_hr'),
  min_hr:          int('min_hr'),
  calories:        int('calories'),
  trimp:           float('trimp'),                                      // Training Impulse
  training_effect: float('training_effect'),
  time_z1_sec:     int('time_z1_sec'),
  time_z2_sec:     int('time_z2_sec'),
  time_z3_sec:     int('time_z3_sec'),
  time_z4_sec:     int('time_z4_sec'),
  time_z5_sec:     int('time_z5_sec'),
  created_at:      timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// SESSION_HR_SERIES — série temporal de FC (1 registro por segundo por atleta)
// Tabela grande! Usar partição por mês em produção
// ───────────────────────────────────────────────────────────────────
export const session_hr_series = mysqlTable('session_hr_series', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  session_id:   varchar('session_id', { length: 36 }).notNull(),
  athlete_id:   varchar('athlete_id', { length: 36 }).notNull(),
  timestamp:    datetime('timestamp').notNull(),
  hr_bpm:       int('hr_bpm').notNull(),
  hr_zone:      int('hr_zone'),                                         // 1–5 calculado
  block_type:   varchar('block_type', { length: 30 }),                  // aquecimento, principal, cool-down
})
