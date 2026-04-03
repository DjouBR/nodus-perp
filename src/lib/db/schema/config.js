/**
 * config.js — Tabelas de configuração do tenant
 *
 * hr_zones_config : percentuais e cores das 5 zonas de FC por tenant
 * sensors         : sensores ANT+/BLE cadastrados no sistema
 *
 * Estas tabelas já existiam no banco (criadas manualmente).
 * Declaradas aqui para o drizzle-kit push não tentar excluí-las.
 */

import {
  mysqlTable, varchar, int, tinyint,
  timestamp, mysqlEnum
} from 'drizzle-orm/mysql-core'

// ───────────────────────────────────────────────────────────────────
// HR_ZONES_CONFIG
// Uma linha por tenant: define os % máximo de cada zona e as cores.
// Zona 5 não tem z5_max_pct pois vai até 100% da FC máx do atleta.
// ───────────────────────────────────────────────────────────────────
export const hr_zones_config = mysqlTable('hr_zones_config', {
  id:         varchar('id',        { length: 36 }).primaryKey(),
  tenant_id:  varchar('tenant_id', { length: 36 }).notNull().unique(),

  // Percentual máximo de FC de cada zona (defaults do banco preservados)
  z1_max_pct: int('z1_max_pct').notNull().default(60),
  z2_max_pct: int('z2_max_pct').notNull().default(70),
  z3_max_pct: int('z3_max_pct').notNull().default(80),
  z4_max_pct: int('z4_max_pct').notNull().default(90),
  // z5: 90-100% (implícito, sem coluna)

  // Cores hex de cada zona
  z1_color:   varchar('z1_color',  { length: 7 }).default('#a8d8ea'),
  z2_color:   varchar('z2_color',  { length: 7 }).default('#4caf50'),
  z3_color:   varchar('z3_color',  { length: 7 }).default('#ff9800'),
  z4_color:   varchar('z4_color',  { length: 7 }).default('#f44336'),
  z5_color:   varchar('z5_color',  { length: 7 }).default('#9c27b0'),

  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
})

// ───────────────────────────────────────────────────────────────────
// SENSORS
// Sensores ANT+/BLE cadastrados. serial é o número do dispositivo
// que o ant-server usa para identificar o sensor na camada física.
// athlete_id: atleta que usa habitualmente este sensor (opcional).
// ───────────────────────────────────────────────────────────────────
export const sensors = mysqlTable('sensors', {
  id:          varchar('id',        { length: 36 }).primaryKey(),
  tenant_id:   varchar('tenant_id', { length: 36 }).notNull(),
  unit_id:     varchar('unit_id',   { length: 36 }),
  serial:      varchar('serial',    { length: 50 }).notNull().unique(),
  protocol:    mysqlEnum('protocol', ['ANT+', 'BLE', 'dual']).notNull().default('ANT+'),
  athlete_id:  varchar('athlete_id', { length: 36 }),
  battery_pct: int('battery_pct'),
  last_seen:   timestamp('last_seen'),
  is_active:   tinyint('is_active').notNull().default(1),
  created_at:  timestamp('created_at').defaultNow(),
})
