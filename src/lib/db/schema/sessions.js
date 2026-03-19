import { mysqlTable, varchar, text, tinyint, timestamp, datetime, int, float, mysqlEnum, date } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// SESSION_TYPES
// ───────────────────────────────────────────────────────────────────
export const session_types = mysqlTable('session_types', {
  id:         varchar('id', { length: 36 }).primaryKey(),
  tenant_id:  varchar('tenant_id', { length: 36 }).notNull(),
  name:       varchar('name', { length: 80 }).notNull(),
  color:      varchar('color', { length: 7 }).default('#6366f1'),
  icon:       varchar('icon', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// TRAINING_SESSIONS
// tenant_id é NULL para coaches independentes (role = 'coach')
// ───────────────────────────────────────────────────────────────────
export const training_sessions = mysqlTable('training_sessions', {
  id:                   varchar('id', { length: 36 }).primaryKey(),
  tenant_id:            varchar('tenant_id', { length: 36 }),            // NULL para coach independente
  unit_id:              varchar('unit_id', { length: 36 }),
  session_type_id:      varchar('session_type_id', { length: 36 }),
  coach_id:             varchar('coach_id', { length: 36 }).notNull(),
  name:                 varchar('name', { length: 100 }).notNull(),
  start_datetime:       datetime('start_datetime').notNull(),
  end_datetime:         datetime('end_datetime'),
  duration_min:         int('duration_min').default(60),
  capacity:             int('capacity').default(30),
  status:               mysqlEnum('status', ['scheduled', 'active', 'finished', 'cancelled']).notNull().default('scheduled'),
  target_zone_min:      int('target_zone_min').default(2),
  target_zone_max:      int('target_zone_max').default(4),
  notes:                text('notes'),
  recurrence_group_id:  varchar('recurrence_group_id', { length: 36 }),
  recurrence_rule:      varchar('recurrence_rule', { length: 50 }),
  recurrence_end_date:  date('recurrence_end_date'),
  avg_hr:               int('avg_hr'),
  avg_calories:         int('avg_calories'),
  participants_count:   int('participants_count'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// SESSION_ATHLETES
// ───────────────────────────────────────────────────────────────────
export const session_athletes = mysqlTable('session_athletes', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  session_id:      varchar('session_id', { length: 36 }).notNull(),
  athlete_id:      varchar('athlete_id', { length: 36 }).notNull(),
  sensor_id:       varchar('sensor_id', { length: 36 }),
  checked_in:      tinyint('checked_in').notNull().default(0),
  avg_hr:          int('avg_hr'),
  max_hr:          int('max_hr'),
  min_hr:          int('min_hr'),
  calories:        int('calories'),
  trimp:           float('trimp'),
  training_effect: float('training_effect'),
  time_z1_sec:     int('time_z1_sec'),
  time_z2_sec:     int('time_z2_sec'),
  time_z3_sec:     int('time_z3_sec'),
  time_z4_sec:     int('time_z4_sec'),
  time_z5_sec:     int('time_z5_sec'),
  created_at:      timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// SESSION_HR_SERIES
// ───────────────────────────────────────────────────────────────────
export const session_hr_series = mysqlTable('session_hr_series', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  session_id:   varchar('session_id', { length: 36 }).notNull(),
  athlete_id:   varchar('athlete_id', { length: 36 }).notNull(),
  timestamp:    datetime('timestamp').notNull(),
  hr_bpm:       int('hr_bpm').notNull(),
  hr_zone:      int('hr_zone'),
  block_type:   varchar('block_type', { length: 30 }),
})
