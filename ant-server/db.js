/**
 * ant-server/db.js
 *
 * Queries do banco de dados do NODUS usadas pelo servidor ANT+.
 * Usa mysql2 diretamente (sem Drizzle) para manter o ant-server independente do Next.js.
 *
 * Tabelas acessadas:
 *   - sensors              : serial, athlete_id, is_active
 *   - users                : id, name, tenant_id, gender, birthdate
 *   - athlete_profiles     : hr_max, hr_rest, weight_kg, height_cm
 *   - session_hr_series    : série temporal de FC (~5s por leitura)
 *   - session_athletes     : check-in, agregados finais por atleta/sessão
 *   - training_sessions    : sessões ativas
 *
 * Fluxo de resolução do atleta:
 *   1. ant-server detecta deviceId ANT+ (número no ar)
 *   2. Busca sensors.serial = deviceId
 *   3. Verifica se aquele sensor está atribuído a um atleta em uma
 *      sessão ATIVA via session_athletes.sensor_id (check-in)
 *   4. Se sim → grava em session_hr_series vinculado à sessão
 *   5. Se não → usa sensors.athlete_id como fallback (sem session_id)
 */

import mysql from 'mysql2/promise'

let pool = null

// ────────────────────────────────────────────────────────────
// POOL
// ────────────────────────────────────────────────────────────

export function initDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('[DB] DATABASE_URL not set in environment')
    }
    pool = mysql.createPool({
      uri:               process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit:    5,
      queueLimit:         0,
    })
    console.log('[DB] MySQL pool initialized')
  }
  return pool
}

function getPool() {
  if (!pool) throw new Error('[DB] Pool not initialized. Call initDb() first.')
  return pool
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('[DB] MySQL pool closed')
  }
}

// ────────────────────────────────────────────────────────────
// SENSORES — inicialização do AntService
// ────────────────────────────────────────────────────────────

/**
 * Retorna todos os sensores ativos.
 * Usado na inicialização do AntService para registrar os DeviceIds.
 * Não exige vínculo com atleta — o sensor pode estar livre no inventário.
 *
 * @returns {Promise<Array<{id: string, serial: string}>>}
 */
export async function getAllActiveSensors() {
  const db = getPool()
  const [rows] = await db.execute(
    `SELECT id, serial
     FROM sensors
     WHERE is_active = 1`
  )
  return rows
}

// ────────────────────────────────────────────────────────────
// RESOLUÇÃO DO ATLETA
// ────────────────────────────────────────────────────────────

/**
 * Resolve o atleta e a sessão ativa a partir do DeviceId ANT+.
 *
 * Prioridade:
 *   1. Sensor atribuído a um atleta em check-in ativo (session_athletes.sensor_id)
 *      → retorna athlete_id + session_id da sessão
 *   2. Fallback: sensors.athlete_id (vínculo histórico)
 *      → retorna athlete_id mas session_id = null
 *
 * @param {number} deviceId - DeviceId numérico ANT+
 * @returns {Promise<AthleteContext|undefined>}
 *
 * @typedef {Object} AthleteContext
 * @property {string}      athlete_id  - UUID do atleta
 * @property {string}      sensor_id   - UUID do sensor no banco
 * @property {string|null} session_id  - UUID da sessão ativa (null se fora de sessão)
 * @property {string}      name        - Nome do atleta
 * @property {string}      tenant_id   - UUID do tenant
 * @property {number}      hr_max      - FC máxima
 * @property {number}      hr_rest     - FC de repouso
 * @property {number}      weight_kg   - Peso em kg
 * @property {number}      height_cm   - Altura em cm
 * @property {string}      gender      - 'M' | 'F' | 'other'
 * @property {string|null} birthdate   - Data de nascimento (YYYY-MM-DD)
 */
export async function resolveAthleteByDeviceId(deviceId) {
  const db = getPool()

  // — Passo 1: Sensor em check-in ativo em uma sessão
  const [activeRows] = await db.execute(
    `SELECT
       sa.athlete_id,
       sa.session_id,
       s.id          AS sensor_id,
       u.name,
       u.tenant_id,
       u.gender,
       u.birthdate,
       COALESCE(ap.hr_max,                             190) AS hr_max,
       COALESCE(ap.hr_rest,                             60) AS hr_rest,
       COALESCE(CAST(ap.weight_kg AS DECIMAL(6,2)),     70) AS weight_kg,
       COALESCE(CAST(ap.height_cm AS DECIMAL(6,2)),    170) AS height_cm
     FROM sensors s
     JOIN session_athletes sa ON sa.sensor_id = s.id
                              AND sa.checked_in = 1
     JOIN training_sessions ts ON ts.id = sa.session_id
                               AND ts.status IN ('scheduled', 'active')
                               AND ts.start_datetime <= NOW()
                               AND (ts.end_datetime IS NULL OR ts.end_datetime >= NOW())
     JOIN users u             ON u.id = sa.athlete_id
                              AND u.is_active = 1
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     WHERE s.serial    = ?
       AND s.is_active = 1
     LIMIT 1`,
    [String(deviceId)]
  )

  if (activeRows.length > 0) {
    return { ...activeRows[0], session_id: activeRows[0].session_id ?? null }
  }

  // — Passo 2: Fallback — vínculo histórico sensors.athlete_id
  const [fallbackRows] = await db.execute(
    `SELECT
       u.id          AS athlete_id,
       NULL          AS session_id,
       s.id          AS sensor_id,
       u.name,
       u.tenant_id,
       u.gender,
       u.birthdate,
       COALESCE(ap.hr_max,                             190) AS hr_max,
       COALESCE(ap.hr_rest,                             60) AS hr_rest,
       COALESCE(CAST(ap.weight_kg AS DECIMAL(6,2)),     70) AS weight_kg,
       COALESCE(CAST(ap.height_cm AS DECIMAL(6,2)),    170) AS height_cm
     FROM sensors s
     JOIN users u             ON u.id = s.athlete_id
                              AND u.is_active = 1
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     WHERE s.serial    = ?
       AND s.is_active = 1
     LIMIT 1`,
    [String(deviceId)]
  )

  return fallbackRows.length > 0 ? { ...fallbackRows[0], session_id: null } : undefined
}

// Alias para compatibilidade com websocketServer.js (que ainda usa getAthleteByDeviceId)
export const getAthleteByDeviceId = resolveAthleteByDeviceId

// ────────────────────────────────────────────────────────────
// GRAVAÇÃO DE FC — session_hr_series
// ────────────────────────────────────────────────────────────

/**
 * Persiste uma leitura de FC em session_hr_series.
 * Só grava se houver session_id ativo (atleta com check-in).
 * Fora de sessão, os dados transitam pelo WebSocket mas não são persistidos.
 *
 * @param {Object} entry
 * @param {string}      entry.session_id   - UUID da sessão
 * @param {string}      entry.athlete_id   - UUID do atleta
 * @param {string}      entry.sensor_id    - UUID do sensor (banco, não DeviceId)
 * @param {Date}        entry.timestamp    - momento da leitura
 * @param {number}      entry.hr_bpm       - FC em bpm
 * @param {number}      entry.hr_zone      - zona 1-5
 * @param {number}      entry.calories_acc - calorias acumuladas
 * @param {string|null} entry.block_type   - 'warmup' | 'main' | 'cooldown' | null
 */
export async function insertHrSeries({ session_id, athlete_id, sensor_id, timestamp, hr_bpm, hr_zone, calories_acc, block_type }) {
  if (!session_id) return   // sem sessão ativa, não persiste
  const db = getPool()
  await db.execute(
    `INSERT INTO session_hr_series
       (id, session_id, athlete_id, sensor_id, \`timestamp\`, hr_bpm, hr_zone, calories_acc, block_type)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session_id,
      athlete_id,
      sensor_id   ?? null,
      timestamp   ?? new Date(),
      hr_bpm,
      hr_zone     ?? null,
      calories_acc ?? 0,
      block_type  ?? null,
    ]
  )
}

// Alias para compatibilidade com websocketServer.js (que ainda usa createHeartRateLog)
export const createHeartRateLog = ({ athlete_id, session_id, sensor_id, heart_rate, zone, calories, timestamp }) =>
  insertHrSeries({
    session_id,
    athlete_id,
    sensor_id,
    timestamp,
    hr_bpm:       heart_rate,
    hr_zone:      zone,
    calories_acc: calories,
    block_type:   null,
  })

// ────────────────────────────────────────────────────────────
// SESSÕES — check-in e agregados
// ────────────────────────────────────────────────────────────

/**
 * Marca check-in automático de um atleta em uma sessão quando
 * o sensor é detectado pela antena.
 * Idempotente: só atualiza se ainda não fez check-in.
 *
 * @param {string} session_id
 * @param {string} athlete_id
 */
export async function autoCheckin(session_id, athlete_id) {
  const db = getPool()
  await db.execute(
    `UPDATE session_athletes
     SET checked_in = 1,
         checkin_at = NOW()
     WHERE session_id = ?
       AND athlete_id = ?
       AND checked_in = 0`,
    [session_id, athlete_id]
  )
}

/**
 * Atualiza os agregados finais de um atleta em uma sessão.
 * Calculado a partir dos dados brutos de session_hr_series.
 * Chamado ao encerrar a sessão (status → 'finished') ou ao
 * fazer checkout manual do atleta.
 *
 * @param {string} session_id
 * @param {string} athlete_id
 */
export async function updateSessionAthleteAggregates(session_id, athlete_id) {
  const db = getPool()

  // Calcula agregados diretamente do banco a partir da série
  const [rows] = await db.execute(
    `SELECT
       ROUND(AVG(hr_bpm))         AS avg_hr,
       MAX(hr_bpm)                AS max_hr,
       MIN(hr_bpm)                AS min_hr,
       MAX(calories_acc)          AS calories,
       SUM(CASE WHEN hr_zone = 1 THEN 5 ELSE 0 END) AS time_z1_sec,
       SUM(CASE WHEN hr_zone = 2 THEN 5 ELSE 0 END) AS time_z2_sec,
       SUM(CASE WHEN hr_zone = 3 THEN 5 ELSE 0 END) AS time_z3_sec,
       SUM(CASE WHEN hr_zone = 4 THEN 5 ELSE 0 END) AS time_z4_sec,
       SUM(CASE WHEN hr_zone = 5 THEN 5 ELSE 0 END) AS time_z5_sec
     FROM session_hr_series
     WHERE session_id = ?
       AND athlete_id = ?`,
    [session_id, athlete_id]
  )

  if (!rows.length || rows[0].avg_hr === null) return

  const agg = rows[0]
  await db.execute(
    `UPDATE session_athletes
     SET avg_hr      = ?,
         max_hr      = ?,
         min_hr      = ?,
         calories    = ?,
         time_z1_sec = ?,
         time_z2_sec = ?,
         time_z3_sec = ?,
         time_z4_sec = ?,
         time_z5_sec = ?
     WHERE session_id = ?
       AND athlete_id = ?`,
    [
      agg.avg_hr,
      agg.max_hr,
      agg.min_hr,
      agg.calories,
      agg.time_z1_sec,
      agg.time_z2_sec,
      agg.time_z3_sec,
      agg.time_z4_sec,
      agg.time_z5_sec,
      session_id,
      athlete_id,
    ]
  )

  console.log(`[DB] Aggregates updated for athlete ${athlete_id} in session ${session_id}`)
}

/**
 * Retorna a sessão ativa de um tenant para um atleta.
 * Usado como fallback se o check-in não foi feito ainda.
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
