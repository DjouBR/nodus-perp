import { mysqlTable, varchar, text, timestamp, date, int, mysqlEnum } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// ATHLETE_PLANS — planos de matrícula dos atletas na academia
// ───────────────────────────────────────────────────────────────────
export const athlete_plans = mysqlTable('athlete_plans', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  tenant_id:       varchar('tenant_id', { length: 36 }).notNull(),
  name:            varchar('name', { length: 80 }).notNull(),           // ex: Mensal, Trimestral
  duration_days:   int('duration_days').notNull(),
  price:           int('price').notNull(),                              // em centavos
  description:     text('description'),
  is_active:       int('is_active').notNull().default(1),
  created_at:      timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// PAYMENTS — pagamentos de mensalidades dos atletas
// ───────────────────────────────────────────────────────────────────
export const payments = mysqlTable('payments', {
  id:            varchar('id', { length: 36 }).primaryKey(),
  tenant_id:     varchar('tenant_id', { length: 36 }).notNull(),
  athlete_id:    varchar('athlete_id', { length: 36 }).notNull(),       // FK users.id
  plan_id:       varchar('plan_id', { length: 36 }),                    // FK athlete_plans.id
  amount:        int('amount').notNull(),                               // em centavos
  due_date:      date('due_date').notNull(),
  paid_date:     date('paid_date'),
  status:        mysqlEnum('status', ['pending', 'paid', 'overdue', 'cancelled']).notNull().default('pending'),
  method:        mysqlEnum('method', ['cash', 'pix', 'credit_card', 'debit_card', 'transfer']),
  notes:         text('notes'),
  registered_by: varchar('registered_by', { length: 36 }),              // FK users.id (recepcionista)
  created_at:    timestamp('created_at').defaultNow(),
})
