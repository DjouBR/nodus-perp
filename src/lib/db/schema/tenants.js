import { mysqlTable, varchar, text, timestamp, tinyint, mysqlEnum, int } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// PLANOS — recursos e limites por plano
// ───────────────────────────────────────────────────────────────────
export const plans = mysqlTable('plans', {
  id:                varchar('id', { length: 36 }).primaryKey(),
  name:              varchar('name', { length: 50 }).notNull(),
  max_athletes:      int('max_athletes').notNull().default(50),
  max_sessions_day:  int('max_sessions_day').notNull().default(10),
  max_sensors:       int('max_sensors').notNull().default(30),
  // tinyint(1) no banco — equivale a boolean no MySQL
  has_acwr:          tinyint('has_acwr').notNull().default(0),
  has_gamification:  tinyint('has_gamification').notNull().default(0),
  has_financial:     tinyint('has_financial').notNull().default(0),
  has_tv_mode:       tinyint('has_tv_mode').notNull().default(0),
  price_monthly:     varchar('price_monthly', { length: 10 }).notNull().default('0'),
  created_at:        timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// TENANTS — clientes do SaaS (academias, franquias, treinadores)
// ───────────────────────────────────────────────────────────────────
export const tenants = mysqlTable('tenants', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  name:         varchar('name', { length: 100 }).notNull(),
  type:         mysqlEnum('type', ['franchise', 'academy', 'trainer']).notNull().default('academy'),
  document:     varchar('document', { length: 20 }),
  plan_id:      varchar('plan_id', { length: 36 }),
  status:       mysqlEnum('status', ['active', 'suspended', 'cancelled']).notNull().default('active'),
  logo_url:     varchar('logo_url', { length: 255 }),
  phone:        varchar('phone', { length: 20 }),
  email:        varchar('email', { length: 100 }),
  address:      text('address'),
  parent_id:    varchar('parent_id', { length: 36 }),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// UNITS — unidades de uma franquia (ou a própria academia como unit única)
// ───────────────────────────────────────────────────────────────────
export const units = mysqlTable('units', {
  id:         varchar('id', { length: 36 }).primaryKey(),
  tenant_id:  varchar('tenant_id', { length: 36 }).notNull(),
  name:       varchar('name', { length: 100 }).notNull(),
  city:       varchar('city', { length: 80 }),
  state:      varchar('state', { length: 2 }),
  address:    text('address'),
  phone:      varchar('phone', { length: 20 }),
  manager_id: varchar('manager_id', { length: 36 }),
  status:     mysqlEnum('status', ['active', 'inactive']).notNull().default('active'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
})
