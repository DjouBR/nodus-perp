import 'dotenv/config'
import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import * as schema from './src/lib/db/schema/index.js'

const pool = await mysql.createPool({ uri: process.env.DATABASE_URL })
const db = drizzle(pool, { schema, mode: 'default' })

console.log('\ud83c\udf31 Iniciando seed do banco NODUS...')

// ============================================================
// HELPERS
// ============================================================
const hash = (pwd) => bcrypt.hashSync(pwd, 10)
const now = new Date()
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
const dateOnly = (d) => d.toISOString().split('T')[0]

// ============================================================
// 1. PLANOS DO SAAS
// ============================================================
const planBasicId    = uuid()
const planProId      = uuid()
const planEnterprise = uuid()

await db.insert(schema.plans).values([
  { id: planBasicId,    name: 'Basic',      max_athletes: 30,  max_sessions_day: 5,  max_sensors: 15, has_acwr: 0, has_gamification: 0, has_financial: 0, has_tv_mode: 0, price_monthly: '199' },
  { id: planProId,      name: 'Pro',        max_athletes: 100, max_sessions_day: 15, max_sensors: 60, has_acwr: 1, has_gamification: 1, has_financial: 1, has_tv_mode: 1, price_monthly: '499' },
  { id: planEnterprise, name: 'Enterprise', max_athletes: 999, max_sessions_day: 99, max_sensors: 999,has_acwr: 1, has_gamification: 1, has_financial: 1, has_tv_mode: 1, price_monthly: '1299' },
])
console.log('  \u2705 Planos criados')

// ============================================================
// 2. SUPER ADMIN
// ============================================================
const superAdminId = uuid()
await db.insert(schema.users).values({
  id: superAdminId, tenant_id: null, unit_id: null,
  name: 'Super Admin NODUS', email: 'admin@nodus.app',
  password_hash: hash('admin123'), role: 'super_admin',
  is_active: 1, email_verified: 1,
})
console.log('  \u2705 Super Admin criado')

// ============================================================
// 3. TENANT — Academia FitLife
// ============================================================
const tenantId = uuid()
await db.insert(schema.tenants).values({
  id: tenantId, name: 'Academia FitLife', type: 'academy',
  document: '12.345.678/0001-99', plan_id: planProId,
  status: 'active', phone: '(19) 99999-0001',
  email: 'contato@fitlife.com.br',
  address: 'Rua das Palmeiras, 100 — Valinhos/SP',
})

// Unidade única da academia
const unitId = uuid()
await db.insert(schema.units).values({
  id: unitId, tenant_id: tenantId, name: 'FitLife Unidade Central',
  city: 'Valinhos', state: 'SP',
  address: 'Rua das Palmeiras, 100', phone: '(19) 99999-0001',
  status: 'active',
})

// Configuração de zonas de FC
await db.insert(schema.hr_zones_config).values({
  id: uuid(), tenant_id: tenantId,
  z1_max_pct: 60, z2_max_pct: 70, z3_max_pct: 80, z4_max_pct: 90,
  z1_color: '#a8d8ea', z2_color: '#4caf50',
  z3_color: '#ff9800', z4_color: '#f44336', z5_color: '#9c27b0',
})
console.log('  \u2705 Tenant + Unidade + Zonas criados')

// ============================================================
// 4. TENANT ADMIN (dono da academia)
// ============================================================
const tenantAdminId = uuid()
await db.insert(schema.users).values({
  id: tenantAdminId, tenant_id: tenantId, unit_id: unitId,
  name: 'Carlos Andreotti', email: 'academia@nodus.app',
  password_hash: hash('academia123'), role: 'tenant_admin',
  phone: '(19) 99999-0002', gender: 'M',
  is_active: 1, email_verified: 1,
})
console.log('  \u2705 Tenant Admin criado')

// ============================================================
// 5. COACHES
// ============================================================
const coach1Id = uuid()
const coach2Id = uuid()

await db.insert(schema.users).values([
  {
    id: coach1Id, tenant_id: tenantId, unit_id: unitId,
    name: 'Jo\u00e3o Silva', email: 'coach@nodus.app',
    password_hash: hash('coach123'), role: 'coach',
    phone: '(19) 99999-0003', gender: 'M',
    birthdate: '1988-05-14',
    is_active: 1, email_verified: 1,
  },
  {
    id: coach2Id, tenant_id: tenantId, unit_id: unitId,
    name: 'Maria Costa', email: 'maria.coach@nodus.app',
    password_hash: hash('coach123'), role: 'coach',
    phone: '(19) 99999-0004', gender: 'F',
    birthdate: '1991-09-22',
    is_active: 1, email_verified: 1,
  },
])

await db.insert(schema.coach_profiles).values([
  { id: uuid(), user_id: coach1Id, cref: 'CREF 001234-G/SP', specialties: JSON.stringify(['Spinning', 'Funcional']), bio: 'Especialista em treinamento cardiovascular com 10 anos de experi\u00eancia.' },
  { id: uuid(), user_id: coach2Id, cref: 'CREF 005678-G/SP', specialties: JSON.stringify(['CrossFit', 'HIIT']),      bio: 'Coach certificada CrossFit L2, especialista em alta intensidade.' },
])
console.log('  \u2705 Coaches criados')

// ============================================================
// 6. RECEPCIONISTA
// ============================================================
const receptionId = uuid()
await db.insert(schema.users).values({
  id: receptionId, tenant_id: tenantId, unit_id: unitId,
  name: 'Fernanda Lima', email: 'recepcao@nodus.app',
  password_hash: hash('recepcao123'), role: 'receptionist',
  phone: '(19) 99999-0005', gender: 'F',
  is_active: 1, email_verified: 1,
})
console.log('  \u2705 Recepcionista criada')

// ============================================================
// 7. ATlETAS (10 atletas)
// ============================================================
const atletasData = [
  { name: 'Ana Paula Souza',    email: 'atleta@nodus.app',          pwd: 'atleta123', gender: 'F', birth: '1995-03-10', hr_max: 192, hr_rest: 58, weight: 62.5, height: 165, bf: 22.1 },
  { name: 'Bruno Oliveira',     email: 'bruno@fitlife.com',          pwd: 'atleta123', gender: 'M', birth: '1990-07-25', hr_max: 188, hr_rest: 62, weight: 82.0, height: 178, bf: 15.3 },
  { name: 'Carla Mendes',       email: 'carla@fitlife.com',          pwd: 'atleta123', gender: 'F', birth: '1998-11-05', hr_max: 195, hr_rest: 55, weight: 58.0, height: 162, bf: 24.5 },
  { name: 'Diego Santos',       email: 'diego@fitlife.com',          pwd: 'atleta123', gender: 'M', birth: '1987-02-18', hr_max: 182, hr_rest: 68, weight: 90.0, height: 182, bf: 18.7 },
  { name: 'Elaine Rodrigues',   email: 'elaine@fitlife.com',         pwd: 'atleta123', gender: 'F', birth: '1993-06-30', hr_max: 190, hr_rest: 60, weight: 65.0, height: 168, bf: 21.8 },
  { name: 'F\u00e1bio Carvalho',     email: 'fabio@fitlife.com',          pwd: 'atleta123', gender: 'M', birth: '1985-09-12', hr_max: 179, hr_rest: 70, weight: 88.0, height: 175, bf: 20.2 },
  { name: 'Gabriela Nunes',     email: 'gabriela@fitlife.com',       pwd: 'atleta123', gender: 'F', birth: '1999-01-08', hr_max: 198, hr_rest: 52, weight: 55.0, height: 160, bf: 19.9 },
  { name: 'Henrique Alves',     email: 'henrique@fitlife.com',       pwd: 'atleta123', gender: 'M', birth: '1992-04-14', hr_max: 186, hr_rest: 64, weight: 78.0, height: 176, bf: 14.1 },
  { name: 'Isabela Castro',     email: 'isabela@fitlife.com',        pwd: 'atleta123', gender: 'F', birth: '1996-08-20', hr_max: 193, hr_rest: 57, weight: 60.0, height: 163, bf: 23.4 },
  { name: 'Jo\u00e3o Marcos Pereira', email: 'joaomarcos@fitlife.com',     pwd: 'atleta123', gender: 'M', birth: '1989-12-03', hr_max: 184, hr_rest: 66, weight: 85.0, height: 180, bf: 16.8 },
]

const athleteIds = []
for (const a of atletasData) {
  const userId = uuid()
  athleteIds.push(userId)
  await db.insert(schema.users).values({
    id: userId, tenant_id: tenantId, unit_id: unitId,
    name: a.name, email: a.email,
    password_hash: hash(a.pwd), role: 'athlete',
    gender: a.gender, birthdate: a.birth,
    is_active: 1, email_verified: 1,
  })
  await db.insert(schema.athlete_profiles).values({
    id: uuid(), user_id: userId,
    hr_max: a.hr_max, hr_rest: a.hr_rest,
    weight_kg: String(a.weight), height_cm: String(a.height),
    body_fat_pct: String(a.bf),
    enrollment_date: dateOnly(daysAgo(Math.floor(Math.random() * 180))),
    status: 'active',
    // Zonas calculadas automaticamente (% da FC máx)
    zone1_max: Math.round(a.hr_max * 0.60),
    zone2_max: Math.round(a.hr_max * 0.70),
    zone3_max: Math.round(a.hr_max * 0.80),
    zone4_max: Math.round(a.hr_max * 0.90),
  })
}
console.log('  \u2705 10 Atletas criados com perfis')

// ============================================================
// 8. SENSORES ANT+
// ============================================================
const sensorValues = athleteIds.map((aid, i) => ({
  id: uuid(), tenant_id: tenantId, unit_id: unitId,
  serial: `ANT${String(i + 1).padStart(4, '0')}`,
  protocol: 'ANT+', athlete_id: aid,
  battery_pct: 70 + Math.floor(Math.random() * 30),
  last_seen: daysAgo(Math.floor(Math.random() * 3)),
  is_active: 1,
}))
await db.insert(schema.sensors).values(sensorValues)
console.log('  \u2705 10 Sensores ANT+ vinculados')

// ============================================================
// 9. MODALIDADES
// ============================================================
const stSpinningId   = uuid()
const stCrossId      = uuid()
const stFuncionalId  = uuid()

await db.insert(schema.session_types).values([
  { id: stSpinningId,  tenant_id: tenantId, name: 'Spinning',   color: '#6366f1', icon: 'tabler-bike' },
  { id: stCrossId,     tenant_id: tenantId, name: 'CrossFit',   color: '#ef4444', icon: 'tabler-barbell' },
  { id: stFuncionalId, tenant_id: tenantId, name: 'Funcional',  color: '#f59e0b', icon: 'tabler-run' },
])
console.log('  \u2705 Modalidades criadas')

// ============================================================
// 10. SESSÕES (7 dias anteriores + hoje)
// ============================================================
const sessions = []
for (let d = 6; d >= 0; d--) {
  const day = daysAgo(d)
  const dateStr = dateOnly(day)

  // Spinning manhã
  const s1 = uuid()
  sessions.push({
    id: s1, tenant_id: tenantId, unit_id: unitId,
    session_type_id: stSpinningId, coach_id: coach1Id,
    name: 'Spinning Manh\u00e3',
    start_datetime: new Date(`${dateStr}T07:00:00`),
    end_datetime:   new Date(`${dateStr}T08:00:00`),
    duration_min: 60, capacity: 20,
    status: d === 0 ? 'finished' : 'finished',
    target_zone_min: 2, target_zone_max: 4,
    avg_hr: 138 + Math.floor(Math.random() * 10),
    participants_count: 12 + Math.floor(Math.random() * 6),
  })

  // CrossFit tarde
  const s2 = uuid()
  sessions.push({
    id: s2, tenant_id: tenantId, unit_id: unitId,
    session_type_id: stCrossId, coach_id: coach2Id,
    name: 'CrossFit Turma A',
    start_datetime: new Date(`${dateStr}T18:00:00`),
    end_datetime:   new Date(`${dateStr}T19:00:00`),
    duration_min: 60, capacity: 25,
    status: 'finished',
    target_zone_min: 3, target_zone_max: 5,
    avg_hr: 155 + Math.floor(Math.random() * 12),
    participants_count: 18 + Math.floor(Math.random() * 6),
  })
}

// Sessões agendadas para hoje/amanhã
const todayStr = dateOnly(now)
sessions.push({
  id: uuid(), tenant_id: tenantId, unit_id: unitId,
  session_type_id: stFuncionalId, coach_id: coach1Id,
  name: 'Funcional Tarde',
  start_datetime: new Date(`${todayStr}T17:00:00`),
  duration_min: 50, capacity: 20,
  status: 'scheduled',
  target_zone_min: 2, target_zone_max: 4,
})

await db.insert(schema.training_sessions).values(sessions)
console.log(`  \u2705 ${sessions.length} Sess\u00f5es criadas`)

// ============================================================
// 11. DAILY LOGS (7 dias para os 3 primeiros atletas)
// ============================================================
const dailyLogs = []
for (let d = 6; d >= 0; d--) {
  for (const aid of athleteIds.slice(0, 3)) {
    dailyLogs.push({
      id: uuid(), athlete_id: aid, tenant_id: tenantId,
      log_date: dateOnly(daysAgo(d)),
      wellness_score: 3 + Math.floor(Math.random() * 3),
      sleep_quality:  3 + Math.floor(Math.random() * 3),
      fatigue:        1 + Math.floor(Math.random() * 4),
      pain_level:     1 + Math.floor(Math.random() * 3),
      stress_level:   1 + Math.floor(Math.random() * 4),
      hrv:            55 + Math.floor(Math.random() * 30),
      rhr:            55 + Math.floor(Math.random() * 15),
      sleep_hours:    6 + Math.random() * 2.5,
    })
  }
}
await db.insert(schema.daily_logs).values(dailyLogs)
console.log(`  \u2705 ${dailyLogs.length} Daily Logs criados`)

// ============================================================
// 12. PLANOS DE MATRÍCULA
// ============================================================
await db.insert(schema.athlete_plans).values([
  { id: uuid(), tenant_id: tenantId, name: 'Mensal',      duration_days: 30,  price: 15000, is_active: 1 },
  { id: uuid(), tenant_id: tenantId, name: 'Trimestral',  duration_days: 90,  price: 39000, is_active: 1 },
  { id: uuid(), tenant_id: tenantId, name: 'Semestral',   duration_days: 180, price: 69000, is_active: 1 },
  { id: uuid(), tenant_id: tenantId, name: 'Anual',       duration_days: 365, price: 120000, is_active: 1 },
])
console.log('  \u2705 Planos de matr\u00edcula criados')

// ============================================================
// 13. BADGES
// ============================================================
await db.insert(schema.badges).values([
  { id: uuid(), tenant_id: null,     name: 'Primeira Sess\u00e3o',  description: 'Completou a primeira sess\u00e3o de treino',          icon: 'tabler-star',      color: '#f59e0b' },
  { id: uuid(), tenant_id: null,     name: 'Streak 7 dias',    description: 'Treinou 7 dias consecutivos',                      icon: 'tabler-flame',     color: '#ef4444' },
  { id: uuid(), tenant_id: null,     name: 'Zona 5 Warrior',   description: 'Passou mais de 10 min na zona 5 em uma sess\u00e3o',   icon: 'tabler-bolt',      color: '#9c27b0' },
  { id: uuid(), tenant_id: tenantId, name: 'Top FitLife',      description: 'Ficou no top 3 do ranking mensal da academia',     icon: 'tabler-trophy',    color: '#f59e0b' },
  { id: uuid(), tenant_id: tenantId, name: '100 Sess\u00f5es',     description: 'Completou 100 sess\u00f5es na FitLife',                icon: 'tabler-award',     color: '#6366f1' },
])
console.log('  \u2705 Badges criados')

console.log('\n\ud83c\udf89 Seed conclu\u00eddo com sucesso!')
console.log('\n\ud83d\udd11 Contas de acesso:')
console.log('   Super Admin  : admin@nodus.app       / admin123')
console.log('   Academia     : academia@nodus.app    / academia123')
console.log('   Coach 1      : coach@nodus.app       / coach123')
console.log('   Coach 2      : maria.coach@nodus.app / coach123')
console.log('   Recep\u00e7\u00e3o    : recepcao@nodus.app    / recepcao123')
console.log('   Atleta       : atleta@nodus.app      / atleta123')

await pool.end()
process.exit(0)
