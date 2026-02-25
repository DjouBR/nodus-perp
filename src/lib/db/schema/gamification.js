import { mysqlTable, varchar, text, tinyint, timestamp, date, int, mysqlEnum } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// BADGES — conquistas disponíveis na plataforma
// ───────────────────────────────────────────────────────────────────
export const badges = mysqlTable('badges', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  tenant_id:   varchar('tenant_id', { length: 36 }),                   // NULL = badge global do sistema
  name:        varchar('name', { length: 80 }).notNull(),
  description: text('description'),
  icon:        varchar('icon', { length: 50 }),                        // ícone tabler
  color:       varchar('color', { length: 7 }).default('#f59e0b'),
  criteria:    text('criteria'),                                       // JSON: regra para ganhar
  created_at:  timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// ATHLETE_BADGES — badges conquistados por cada atleta
// ───────────────────────────────────────────────────────────────────
export const athlete_badges = mysqlTable('athlete_badges', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  athlete_id:   varchar('athlete_id', { length: 36 }).notNull(),
  badge_id:     varchar('badge_id', { length: 36 }).notNull(),
  awarded_by:   varchar('awarded_by', { length: 36 }),                  // NULL = sistema automático
  awarded_at:   timestamp('awarded_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// CHALLENGES — desafios criados por coaches/admins
// ───────────────────────────────────────────────────────────────────
export const challenges = mysqlTable('challenges', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  tenant_id:   varchar('tenant_id', { length: 36 }).notNull(),
  created_by:  varchar('created_by', { length: 36 }).notNull(),         // FK users.id
  name:        varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  criteria:    mysqlEnum('criteria', ['calories', 'sessions', 'zone_time', 'streak']).notNull(),
  target:      int('target').notNull(),
  start_date:  date('start_date').notNull(),
  end_date:    date('end_date').notNull(),
  badge_id:    varchar('badge_id', { length: 36 }),                     // badge concedido ao vencer
  status:      mysqlEnum('status', ['active', 'finished', 'cancelled']).notNull().default('active'),
  created_at:  timestamp('created_at').defaultNow(),
})

export const challenge_participants = mysqlTable('challenge_participants', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  challenge_id: varchar('challenge_id', { length: 36 }).notNull(),
  athlete_id:   varchar('athlete_id', { length: 36 }).notNull(),
  progress:     int('progress').notNull().default(0),
  completed:    tinyint('completed').notNull().default(0),
  completed_at: timestamp('completed_at'),
  joined_at:    timestamp('joined_at').defaultNow(),
})
