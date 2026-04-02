import {
  mysqlTable, varchar, int, float, decimal,
  datetime, timestamp, mysqlEnum, index
} from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// ANT_SENSORS
// Registro dos sensores ANT+ conhecidos pelo sistema.
// device_id: número do dispositivo ANT+ (Device Number, 16-bit)
// ───────────────────────────────────────────────────────────────────
export const ant_sensors = mysqlTable('ant_sensors', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  tenant_id:   varchar('tenant_id', { length: 36 }),
  device_id:   int('device_id').notNull(),
  label:       varchar('label', { length: 60 }),
  type:        mysqlEnum('type', ['hrm', 'power', 'speed', 'cadence']).default('hrm'),
  is_active:   int('is_active').default(1),
  last_seen:   datetime('last_seen'),
  created_at:  timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// SESSION_HR_SERIES (movida de sessions.js para cá)
// Série temporal de FC por atleta por sessão.
// Gravada pelo ant-server a cada ~5 segundos enquanto a aula está ativa.
//
// Índices declarados no schema para nunca serem perdidos no drizzle-kit push.
// ───────────────────────────────────────────────────────────────────
export const session_hr_series = mysqlTable(
  'session_hr_series',
  {
    id:           varchar('id', { length: 36 }).primaryKey(),
    session_id:   varchar('session_id', { length: 36 }).notNull(),
    athlete_id:   varchar('athlete_id', { length: 36 }).notNull(),
    sensor_id:    varchar('sensor_id', { length: 36 }),
    timestamp:    datetime('timestamp').notNull(),
    hr_bpm:       int('hr_bpm').notNull(),
    hr_zone:      int('hr_zone'),
    calories_acc: decimal('calories_acc', { precision: 10, scale: 2 }),
    block_type:   varchar('block_type', { length: 30 }),
  },
  (table) => ([
    index('idx_hrs_session_athlete').on(table.session_id, table.athlete_id),
    index('idx_hrs_athlete_time').on(table.athlete_id, table.timestamp),
    index('idx_hrs_session_time').on(table.session_id, table.timestamp),
  ])
)
