/**
 * ant-server/db.js
 *
 * Queries do banco de dados do NODUS usadas pelo servidor ANT+.
 * Usa mysql2 diretamente (sem Drizzle) para manter o ant-server independente do Next.js.
 *
 * Tabelas acessadas:
 *   - sensors         : serial (string ANT0001), athlete_id, is_active
 *   - users           : id, name, tenant_id
 *   - athlete_profiles: hr_max, hr_rest, weight_kg
 *   - heart_rate      : persitência de leituras ANT+
 *   - training_sessions + session_athletes: check-in automático (Fase 7.5)
 */

import mysql from 'mysql2/promise'

let pool = null

/**
 * Inicializa o pool de conexões MySQL (lazy).
 * Reutiliza a mesma DATABASE_URL do NODUS (.env).
 */
export function initDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('[DB] DATABASE_URL not set in environment')
    }
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    })
    console.log('[DB] MySQL pool initialized')
  }
  return pool
}

/**
 * Retorna o pool (deve ter sido inicializado antes com initDb())
 */
function getPool() {
  if (!pool) throw new Error('[DB] Pool not initialized. Call initDb() first.')
  return pool
}

// ─────────────────────────────────────────────────────────────
// SENSORES / ATLETAS
// ─────────────────────────────────────────────────────────────

/**
 * Busca atleta pelo serial do sensor ANT+.
 *
 * No seed do NODUS, serial = 'ANT0001', 'ANT0002', etc.
 * O DeviceId real do aparelho ANT+ é um número (ex: 12345).
 * Mapeamento: sensors.serial armazena o número como string.
 *
 * @param {number} deviceId - ID numérico do dispositivo ANT+
 * @returns {Promise<AthleteRow|undefined>}
 *
 * @typedef {Object} AthleteRow
 * @property {string}  id        - UUID do usuário
 * @property {string}  name      - Nome completo
 * @property {string}  tenant_id - UUID do tenant
 * @property {number}  hr_max    - FC máxima
 * @property {number}  hr_rest   - FC de repouso
 * @property {number}  weight_kg - Peso em kg
 */
export async function getAthleteByDeviceId(deviceId) {
  const db = getPool()
  // serial armazena o deviceId como string (ex: '12345' ou 'ANT0001')
  const [rows] = await db.execute(
    `SELECT
       u.id,
       u.name,
       u.tenant_id,
       COALESCE(ap.hr_max,  190) AS hr_max,
       COALESCE(ap.hr_rest,  60) AS hr_rest,
       COALESCE(CAST(ap.weight_kg AS DECIMAL(6,2)), 70) AS weight_kg
     FROM sensors s
     JOIN users u          ON u.id = s.athlete_id
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     WHERE s.serial = ?
       AND s.is_active = 1
       AND u.is_active = 1
     LIMIT 1`,
    [String(deviceId)]
  )
  return rows.length > 0 ? rows[0] : undefined
}

/**
 * Retorna todos os sensores ativos com seus deviceIds (serial).
 * Usado na inicialização do AntService para registrar todos os atletas.
 *
 * @returns {Promise<Array<{serial: string, athlete_id: string}>>}
 */
export async function getAllActiveSensors() {
  const db = getPool()
  const [rows] = await db.execute(
    `SELECT s.serial, s.athlete_id
     FROM sensors s
     JOIN users u ON u.id = s.athlete_id
     WHERE s.is_active = 1
       AND u.is_active = 1`
  )
  return rows
}

// ─────────────────────────────────────────────────────────────
// HEART RATE — PERSISTÊNCIA
// ─────────────────────────────────────────────────────────────

/**
 * Persiste uma leitura de FC no banco.
 *
 * @param {Object} log
 * @param {string}  log.athlete_id
 * @param {string|null} log.session_id  - UUID da sessão ativa (null se fora de sessão)
 * @param {number}  log.heart_rate
 * @param {number}  log.zone           - 1 a 5
 * @param {number}  log.calories       - Kcal acumuladas
 * @param {Date}    log.timestamp
 */
export async function createHeartRateLog({ athlete_id, session_id, heart_rate, zone, calories, timestamp }) {
  const db = getPool()
  await db.execute(
    `INSERT INTO heart_rate (id, athlete_id, session_id, heart_rate, zone, calories, recorded_at)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
    [
      athlete_id,
      session_id ?? null,
      heart_rate,
      zone,
      calories,
      timestamp ?? new Date(),
    ]
  )
}

// ─────────────────────────────────────────────────────────────
// SESSÕES — CHECK-IN AUTOMÁTICO (preparado para Fase 7.5)
// ─────────────────────────────────────────────────────────────

/**
 * Retorna a sessão ativa de um tenant que contém um atleta.
 * Usado para vincular dados de FC à sessão correta.
 *
 * @param {string} tenant_id
 * @param {string} athlete_id
 * @returns {Promise<{id: string}|undefined>}
 */
export async function getActiveSessionForAthlete(tenant_id, athlete_id) {
  const db = getPool()
  const [rows] = await db.execute(
    `SELECT ts.id
     FROM training_sessions ts
     JOIN session_athletes sa ON sa.session_id = ts.id
     WHERE ts.tenant_id  = ?
       AND sa.athlete_id = ?
       AND ts.status IN ('scheduled', 'active')
       AND ts.start_datetime <= NOW()
       AND (ts.end_datetime IS NULL OR ts.end_datetime >= NOW())
     ORDER BY ts.start_datetime DESC
     LIMIT 1`,
    [tenant_id, athlete_id]
  )
  return rows.length > 0 ? rows[0] : undefined
}

/**
 * Marca check-in automático de um atleta em uma sessão.
 * Idempotente: só atualiza se ainda não fez check-in.
 *
 * @param {string} session_id
 * @param {string} athlete_id
 */
export async function autoCheckin(session_id, athlete_id) {
  const db = getPool()
  await db.execute(
    `UPDATE session_athletes
     SET checked_in = 1, checked_in_at = NOW()
     WHERE session_id = ?
       AND athlete_id = ?
       AND checked_in = 0`,
    [session_id, athlete_id]
  )
}

/**
 * Fecha o pool de conexões (graceful shutdown)
 */
export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('[DB] MySQL pool closed')
  }
}
