import { mysqlTable, varchar, text, tinyint, timestamp, datetime, int, float, mysqlEnum, date, decimal } from 'drizzle-orm/mysql-core'

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
// Representa a presença/check-in de um atleta em uma sessão.
// sensor_id: preenchido no CHECK-IN — NÃO é vínculo fixo.
// O mesmo atleta pode usar sensores diferentes em aulas diferentes.
// ───────────────────────────────────────────────────────────────────
export const session_athletes = mysqlTable('session_athletes', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  session_id:      varchar('session_id', { length: 36 }).notNull(),
  athlete_id:      varchar('athlete_id', { length: 36 }).notNull(),
  sensor_id:       varchar('sensor_id', { length: 36 }),               // FK sensors.id — atribuído no check-in
  checked_in:      tinyint('checked_in').notNull().default(0),
  checkin_at:      datetime('checkin_at'),                              // momento do check-in
  checkout_at:     datetime('checkout_at'),                             // momento da saída (opcional)
  avg_hr:          int('avg_hr'),
  max_hr:          int('max_hr'),
  min_hr:          int('min_hr'),
  calories:        decimal('calories', { precision: 10, scale: 2 }),
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
// Série temporal de FC por atleta por sessão.
// Gravada pelo ant-server a cada ~5 segundos enquanto a aula está ativa.
// Permite gráficos de FC do início ao fim da aula.
//
// Calendário de retenção: dados brutos por 12 meses;
// após isso, apenas os agregados em session_athletes são mantidos.
// ───────────────────────────────────────────────────────────────────
export const session_hr_series = mysqlTable('session_hr_series', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  session_id:   varchar('session_id', { length: 36 }).notNull(),        // FK training_sessions.id
  athlete_id:   varchar('athlete_id', { length: 36 }).notNull(),        // FK users.id
  sensor_id:    varchar('sensor_id', { length: 36 }),                   // FK sensors.id (qual sensor gravou)
  timestamp:    datetime('timestamp').notNull(),                        // momento da leitura
  hr_bpm:       int('hr_bpm').notNull(),                                // FC em bpm
  hr_zone:      int('hr_zone'),                                         // zona calculada (1-5)
  calories_acc: decimal('calories_acc', { precision: 10, scale: 2 }),  // calorias acumuladas até este ponto
  block_type:   varchar('block_type', { length: 30 }),                  // ex: 'warmup', 'main', 'cooldown'
})
