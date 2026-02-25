import { mysqlTable, varchar, text, tinyint, timestamp, date, int, float, mysqlEnum } from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// DAILY_LOGS — registro diário de bem-estar do atleta
// ───────────────────────────────────────────────────────────────────
export const daily_logs = mysqlTable('daily_logs', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  athlete_id:      varchar('athlete_id', { length: 36 }).notNull(),     // FK users.id
  tenant_id:       varchar('tenant_id', { length: 36 }).notNull(),
  log_date:        date('log_date').notNull(),
  // Bem-estar subjetivo (escala 1–5)
  wellness_score:  int('wellness_score'),                               // percepção geral
  sleep_quality:   int('sleep_quality'),                               // qualidade do sono
  fatigue:         int('fatigue'),                                     // nível de fadiga
  pain_level:      int('pain_level'),                                  // dor muscular
  stress_level:    int('stress_level'),                                // estresse
  // Métricas objetivas
  hrv:             int('hrv'),                                         // HRV matinal (ms)
  rhr:             int('rhr'),                                         // FC repouso matinal
  sleep_hours:     float('sleep_hours'),
  weight_kg:       float('weight_kg'),
  notes:           text('notes'),
  created_at:      timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// WEEKLY_INDICES — índices calculados semanalmente por atleta (TRIMP, ACWR)
// Populado por job periódico (cron diário)
// ───────────────────────────────────────────────────────────────────
export const weekly_indices = mysqlTable('weekly_indices', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  athlete_id:      varchar('athlete_id', { length: 36 }).notNull(),
  tenant_id:       varchar('tenant_id', { length: 36 }).notNull(),
  week_start:      date('week_start').notNull(),                        // segunda-feira da semana
  trimp_weekly:    float('trimp_weekly'),                               // carga aguda (7 dias)
  trimp_chronic:   float('trimp_chronic'),                              // carga crônica (28 dias)
  acwr:            float('acwr'),                                       // acute:chronic ratio
  atl:             float('atl'),                                        // Acute Training Load
  ctl:             float('ctl'),                                        // Chronic Training Load
  tsb:             float('tsb'),                                        // Training Stress Balance
  sessions_count:  int('sessions_count'),
  total_calories:  int('total_calories'),
  created_at:      timestamp('created_at').defaultNow(),
})

// ───────────────────────────────────────────────────────────────────
// PHYSICAL_ASSESSMENTS — avaliações físicas periódicas
// ───────────────────────────────────────────────────────────────────
export const physical_assessments = mysqlTable('physical_assessments', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  athlete_id:      varchar('athlete_id', { length: 36 }).notNull(),
  tenant_id:       varchar('tenant_id', { length: 36 }).notNull(),
  assessed_by:     varchar('assessed_by', { length: 36 }),              // FK users.id (coach)
  assessment_date: date('assessment_date').notNull(),
  weight_kg:       float('weight_kg'),
  height_cm:       float('height_cm'),
  body_fat_pct:    float('body_fat_pct'),
  muscle_mass_kg:  float('muscle_mass_kg'),
  bmi:             float('bmi'),
  vo2max:          float('vo2max'),
  hr_max_measured: int('hr_max_measured'),
  resting_hr:      int('resting_hr'),
  notes:           text('notes'),
  created_at:      timestamp('created_at').defaultNow(),
})
