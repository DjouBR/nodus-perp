import { WebSocketServer, WebSocket } from 'ws'
import { getAntService } from './antService.js'
import {
  resolveAthleteByDeviceId,
  autoCheckin,
  insertHrSeries,
  updateSessionAthleteAggregates,
} from './db.js'

// ────────────────────────────────────────────────────────────
// HELPERS DE CÁLCULO
// ────────────────────────────────────────────────────────────

/**
 * Calcula a zona de FC (1-5) com base na % da FC máxima.
 * Os limiares respeitam a configuração padrão do NODUS (igual ao original).
 * Na Fase futura, serão substituídos pelos valores de hr_zones_config do tenant.
 *
 * @param {number} heartRate
 * @param {number} maxHeartRate
 * @returns {1|2|3|4|5}
 */
function calculateZone(heartRate, maxHeartRate) {
  const pct = (heartRate / maxHeartRate) * 100
  if (pct < 60) return 1  // Z1: < 60%  — Very Light
  if (pct < 70) return 2  // Z2: 60-70% — Light
  if (pct < 80) return 3  // Z3: 70-80% — Moderate
  if (pct < 90) return 4  // Z4: 80-90% — Hard
  return 5                // Z5: 90%+   — Maximum
}

/**
 * Calcula calorias queimadas por minuto.
 * Fórmula simples (idêntica ao projeto original): Kcal/min ≈ HR × peso × 0.00015
 * Substituir aqui pela fórmula Keytel quando os dados de altura/sexo/idade
 * estiverem sendo passados corretamente via athlete context.
 *
 * @param {number} heartRate
 * @param {number} weight - Peso em kg
 * @returns {number} Kcal/min
 */
function calculateCaloriesPerMinute(heartRate, weight) {
  return heartRate * weight * 0.00015
}

// ────────────────────────────────────────────────────────────
// THROTTLE DE PERSISTÊNCIA NO BANCO
// ────────────────────────────────────────────────────────────

const DB_WRITE_INTERVAL_MS = 5000  // Grava no banco a cada 5s por atleta
const lastDbWrite = new Map()      // athlete_id → timestamp da última gravação

function shouldWriteToDb(athleteId) {
  const last = lastDbWrite.get(athleteId)
  const now  = Date.now()
  if (!last || now - last >= DB_WRITE_INTERVAL_MS) {
    lastDbWrite.set(athleteId, now)
    return true
  }
  return false
}

// ────────────────────────────────────────────────────────────
// SERVIDOR WEBSOCKET
// ────────────────────────────────────────────────────────────

export class HeartRateWebSocketServer {
  /**
   * @param {import('http').Server} server - Servidor HTTP do index.js
   */
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws/heartrate' })
    this.clients = new Set()

    // Cache em memória dos dados ao vivo por atleta
    // athlete_id (UUID) → AthleteRealtimeData
    this.athleteDataCache = new Map()

    // Acumuladores de calorias por atleta
    // athlete_id → { total: number, lastUpdate: number }
    this.calorieAccumulators = new Map()

    // Contexto resolvido por deviceId — evita queries desnecessarias ao banco
    // deviceId (number) → AthleteContext (do db.js)
    this.deviceAthleteCache = new Map()

    this.wss.on('connection', (ws) => {
      console.log('[WebSocket] New client connected')
      this.clients.add(ws)
      this.sendCurrentDataToClient(ws)

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString())
          this.handleClientMessage(ws, data)
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error)
        }
      })

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected')
        this.clients.delete(ws)
      })

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error)
        this.clients.delete(ws)
      })
    })

    const antService = getAntService()
    antService.onHeartRateData((data) => this.handleHeartRateData(data))

    console.log('[WebSocket] Server initialized on path /ws/heartrate')
  }

  // ───────────────────────────────────────────────────────────
  // PIPELINE PRINCIPAL DE DADOS
  // ───────────────────────────────────────────────────────────

  /**
   * Pipeline principal: ANT+ → banco → WebSocket
   *
   * 1. Resolve atleta + sessão pelo DeviceId (cache 10s)
   * 2. Calcula zona + acumula calorias
   * 3. Broadcast imediato para todos os clientes
   * 4. A cada 5s: auto check-in + persiste em session_hr_series
   *
   * @param {{ deviceId: number, heartRate: number, beatCount: number, beatTime: number, timestamp: number }} data
   */
  async handleHeartRateData(data) {
    try {
      // 1. Resolve atleta (com cache para não bater no banco a cada segundo)
      const athlete = await this.resolveAthlete(data.deviceId)
      if (!athlete) return  // dispositivo não cadastrado no NODUS

      const maxHr  = athlete.hr_max  || 190
      const weight = parseFloat(athlete.weight_kg) || 70
      const zone   = calculateZone(data.heartRate, maxHr)
      const now    = Date.now()

      // 2. Acumula calorias
      let calories = 0
      const acc = this.calorieAccumulators.get(athlete.athlete_id)
      if (acc) {
        const timeDiffMin = (now - acc.lastUpdate) / 1000 / 60
        calories = acc.total + calculateCaloriesPerMinute(data.heartRate, weight) * timeDiffMin
      }
      this.calorieAccumulators.set(athlete.athlete_id, { total: calories, lastUpdate: now })

      // 3. Monta payload ao vivo
      /** @type {AthleteRealtimeData} */
      const athleteData = {
        athleteId:   athlete.athlete_id,
        athleteName: athlete.name,
        tenantId:    athlete.tenant_id,
        sessionId:   athlete.session_id ?? null,    // null = fora de sessão
        sensorId:    athlete.sensor_id  ?? null,    // UUID do sensor no banco
        deviceId:    data.deviceId,
        heartRate:   data.heartRate,
        calories:    parseFloat(calories.toFixed(2)),
        zone,
        maxHeartRate: maxHr,
        timestamp:   data.timestamp,
      }

      this.athleteDataCache.set(athlete.athlete_id, athleteData)

      // 4. Broadcast imediato — não bloqueia pelo banco
      this.broadcast({ type: 'heartrate', data: athleteData })

      // 5. Persistência throttled (a cada 5s)
      if (shouldWriteToDb(athlete.athlete_id)) {
        this.persistAndCheckin(athlete, athleteData, zone, calories).catch((err) => {
          console.error('[WebSocket] Error persisting HR data:', err)
        })
      }
    } catch (error) {
      console.error('[WebSocket] Error handling heart rate data:', error)
    }
  }

  // ───────────────────────────────────────────────────────────
  // PERSISTÊNCIA + CHECK-IN
  // ───────────────────────────────────────────────────────────

  /**
   * Persiste uma leitura em session_hr_series e faz auto check-in.
   * Só persiste se o atleta tiver session_id (check-in ativo).
   *
   * @param {import('./db.js').AthleteContext} athlete
   * @param {AthleteRealtimeData} athleteData
   * @param {number} zone
   * @param {number} calories
   */
  async persistAndCheckin(athlete, athleteData, zone, calories) {
    const { athlete_id, session_id, sensor_id } = athlete

    // Auto check-in (idempotente — só atualiza se ainda não fez)
    if (session_id) {
      try {
        await autoCheckin(session_id, athlete_id)
      } catch (err) {
        console.warn('[WebSocket] autoCheckin error:', err.message)
      }
    }

    // Persiste em session_hr_series (só com session_id)
    await insertHrSeries({
      session_id,
      athlete_id,
      sensor_id:    sensor_id ?? null,
      timestamp:    new Date(athleteData.timestamp),
      hr_bpm:       athleteData.heartRate,
      hr_zone:      zone,
      calories_acc: parseFloat(calories.toFixed(2)),
      block_type:   null,
    })
  }

  // ───────────────────────────────────────────────────────────
  // CACHE DE RESOLUÇÃO DE ATLETA
  // Evita queries ao banco a cada segundo por dispositivo
  // TTL: 10 segundos (o check-in muda com pouca frequência)
  // ───────────────────────────────────────────────────────────

  /** @type {Map<number, { athlete: import('./db.js').AthleteContext, cachedAt: number }>} */
  deviceAthleteCache = new Map()
  static ATHLETE_CACHE_TTL_MS = 10_000

  /**
   * Resolve o atleta pelo DeviceId com cache de 10s.
   * O cache é invalidado ao fazer reset de calorias (nova sessão).
   *
   * @param {number} deviceId
   * @returns {Promise<import('./db.js').AthleteContext|undefined>}
   */
  async resolveAthlete(deviceId) {
    const cached = this.deviceAthleteCache.get(deviceId)
    if (cached && Date.now() - cached.cachedAt < HeartRateWebSocketServer.ATHLETE_CACHE_TTL_MS) {
      return cached.athlete
    }
    const athlete = await resolveAthleteByDeviceId(deviceId)
    if (athlete) {
      this.deviceAthleteCache.set(deviceId, { athlete, cachedAt: Date.now() })
    }
    return athlete
  }

  // ───────────────────────────────────────────────────────────
  // MENSAGENS DE CLIENTES
  // ───────────────────────────────────────────────────────────

  /**
   * Mensagens aceitas pelo WebSocket:
   *   { type: 'ping' }                        → pong
   *   { type: 'request_data' }                → snapshot atual
   *   { type: 'reset_calories' }              → reset todos
   *   { type: 'reset_calories', athleteId }   → reset individual
   *   { type: 'session_ended', sessionId, athleteIds[] } → agrega e fecha sessão
   */
  handleClientMessage(ws, message) {
    if (message.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }))
      return
    }

    if (message.type === 'request_data') {
      this.sendCurrentDataToClient(ws)
      return
    }

    if (message.type === 'reset_calories') {
      if (message.athleteId) {
        this.resetCalories(message.athleteId)
      } else {
        this.resetAllCalories()
      }
      return
    }

    // Emitido pelo Next.js quando o professor encerra a aula
    // Aciona cálculo de agregados em session_athletes para todos os atletas da sessão
    if (message.type === 'session_ended') {
      this.handleSessionEnded(message.sessionId, message.athleteIds ?? []).catch((err) => {
        console.error('[WebSocket] Error handling session_ended:', err)
      })
      return
    }

    console.log('[WebSocket] Unknown message type:', message.type)
  }

  /**
   * Chamado quando o Next.js envia { type: 'session_ended', sessionId, athleteIds }.
   * Calcula e persiste os agregados finais em session_athletes.
   * Também invalida o cache de atletas para que o próximo check-in seja resolvido do banco.
   *
   * @param {string}   sessionId
   * @param {string[]} athleteIds
   */
  async handleSessionEnded(sessionId, athleteIds) {
    if (!sessionId) return
    console.log(`[WebSocket] Session ${sessionId} ended. Updating aggregates for ${athleteIds.length} athletes...`)

    for (const athleteId of athleteIds) {
      try {
        await updateSessionAthleteAggregates(sessionId, athleteId)
      } catch (err) {
        console.error(`[WebSocket] Error updating aggregates for ${athleteId}:`, err.message)
      }
    }

    // Invalida cache de resolução para todos os dispositivos desta sessão
    this.deviceAthleteCache.clear()
    console.log(`[WebSocket] Aggregates updated and athlete cache cleared.`)
  }

  // ───────────────────────────────────────────────────────────
  // BROADCAST + HELPERS
  // ───────────────────────────────────────────────────────────

  sendCurrentDataToClient(ws) {
    const allData = Array.from(this.athleteDataCache.values())
    ws.send(JSON.stringify({ type: 'initial_data', data: allData }))
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message)
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr)
      }
    })
  }

  resetCalories(athleteId) {
    this.calorieAccumulators.set(athleteId, { total: 0, lastUpdate: Date.now() })
    this.deviceAthleteCache.forEach((v, k) => {
      if (v.athlete?.athlete_id === athleteId) this.deviceAthleteCache.delete(k)
    })
    const data = this.athleteDataCache.get(athleteId)
    if (data) {
      data.calories = 0
      this.broadcast({ type: 'heartrate', data })
    }
  }

  resetAllCalories() {
    this.calorieAccumulators.clear()
    this.deviceAthleteCache.clear()   // força re-resolve do banco na próxima leitura
    this.athleteDataCache.forEach((data) => { data.calories = 0 })
    this.broadcast({
      type: 'reset_all',
      data: Array.from(this.athleteDataCache.values()),
    })
  }

  getCurrentData() {
    return Array.from(this.athleteDataCache.values())
  }
}

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AthleteRealtimeData
 * @property {string}      athleteId
 * @property {string}      athleteName
 * @property {string}      tenantId
 * @property {string|null} sessionId    - UUID da sessão ativa (null = fora de sessão)
 * @property {string|null} sensorId     - UUID do sensor no banco
 * @property {number}      deviceId     - DeviceId numérico ANT+
 * @property {number}      heartRate
 * @property {number}      calories     - Calorias acumuladas
 * @property {1|2|3|4|5}  zone
 * @property {number}      maxHeartRate
 * @property {number}      timestamp
 */
