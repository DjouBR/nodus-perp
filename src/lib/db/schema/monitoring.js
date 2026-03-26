import { mysqlTable, varchar, tinyint, timestamp, int, mysqlEnum } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// SENSORS — cintos ANT+ e sensores BLE
//
// athlete_id é opcional: representa o ÚLTIMO atleta que usou o sensor
// (histório/referência). O vínculo real por sessão fica em
// session_athletes.sensor_id (atribuído no check-in).
// ───────────────────────────────────────────────────────────────────
export const sensors = mysqlTable('sensors', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  tenant_id:       varchar('tenant_id', { length: 36 }).notNull(),
  unit_id:         varchar('unit_id', { length: 36 }),
  serial:          varchar('serial', { length: 50 }).notNull().unique(),
  protocol:        mysqlEnum('protocol', ['ANT+', 'BLE', 'dual']).notNull().default('ANT+'),
  athlete_id:      varchar('athlete_id', { length: 36 }),               // último atleta (referência histórica)
  battery_pct:     int('battery_pct'),
  last_seen:       timestamp('last_seen'),
  is_active:       tinyint('is_active').notNull().default(1),
  created_at:      timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// HR_ZONES_CONFIG — configuração de zonas de FC por tenant
// ───────────────────────────────────────────────────────────────────
export const hr_zones_config = mysqlTable('hr_zones_config', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  tenant_id:    varchar('tenant_id', { length: 36 }).notNull().unique(),
  // Limites superiores de cada zona (% da FC máxima)
  z1_max_pct:   int('z1_max_pct').notNull().default(60),
  z2_max_pct:   int('z2_max_pct').notNull().default(70),
  z3_max_pct:   int('z3_max_pct').notNull().default(80),
  z4_max_pct:   int('z4_max_pct').notNull().default(90),
  // Zona 5: acima de z4_max_pct
  // Cores hex por zona
  z1_color:     varchar('z1_color', { length: 7 }).default('#a8d8ea'),
  z2_color:     varchar('z2_color', { length: 7 }).default('#4caf50'),
  z3_color:     varchar('z3_color', { length: 7 }).default('#ff9800'),
  z4_color:     varchar('z4_color', { length: 7 }).default('#f44336'),
  z5_color:     varchar('z5_color', { length: 7 }).default('#9c27b0'),
  updated_at:   timestamp('updated_at').defaultNow().onUpdateNow(),
})
