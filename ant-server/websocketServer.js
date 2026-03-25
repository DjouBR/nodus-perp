import { WebSocketServer, WebSocket } from 'ws'
import { getAntService } from './antService.js'
import {
  getAthleteByDeviceId,
  getActiveSessionForAthlete,
  autoCheckin,
  createHeartRateLog,
} from './db.js'

// ─────────────────────────────────────────────────────────────
// HELPERS DE CÁLCULO
// ─────────────────────────────────────────────────────────────

/**
 * Calcula a zona de FC (1-5) com base na % da FC máxima.
 * Percentuais idênticos ao heart_rate_monitor original.
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
 * Fórmula simples: Kcal/min ≈ HR × peso × 0.00015
 * (idêntica ao projeto original)
 *
 * @param {number} heartRate
 * @param {number} weight  - Peso em kg
 * @returns {number}
 */
function calculateCaloriesPerMinute(heartRate, weight) {
  return heartRate * weight * 0.00015
}

// ─────────────────────────────────────────────────────────────
// THROTTLE DE PERSISTÊNCIA NO BANCO
// ─────────────────────────────────────────────────────────────

const DB_WRITE_INTERVAL_MS = 5000  // Gravar no banco a cada 5 segundos por atleta
const lastDbWrite = new Map()      // athlete_id → timestamp da última gravação

function shouldWriteToDb(athleteId) {
  const last = lastDbWrite.get(athleteId)
  const now = Date.now()
  if (!last || now - last >= DB_WRITE_INTERVAL_MS) {
    lastDbWrite.set(athleteId, now)
    return true
  }
  return false
}

// ─────────────────────────────────────────────────────────────
// SERVIDOR WEBSOCKET
// ─────────────────────────────────────────────────────────────

export class HeartRateWebSocketServer {
  /**
   * @param {import('http').Server} server - Servidor HTTP do index.js
   */
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws/heartrate' })
    this.clients = new Set()

    // Cache em memória dos dados ao vivo por atleta
    // athlete_id (string UUID) → AthleteRealtimeData
    this.athleteDataCache = new Map()

    // Acumuladores de calorias
    // athlete_id → { total: number, lastUpdate: number }
    this.calorieAccumulators = new Map()

    // Handler de conexão de clientes (browser / Next.js)
    this.wss.on('connection', (ws) => {
      console.log('[WebSocket] New client connected')
      this.clients.add(ws)

      // Envia snapshot atual ao novo cliente
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

    // Registra callback no AntService para receber dados de FC
    const antService = getAntService()
    antService.onHeartRateData((data) => {
      this.handleHeartRateData(data)
    })

    console.log('[WebSocket] Server initialized on path /ws/heartrate')
  }

  /**
   * Recebe dado bruto de FC do AntService e processa:
   * 1. Busca atleta pelo DeviceId
   * 2. Calcula zona + calorias
   * 3. Faz broadcast para todos os clientes
   * 4. Persiste no banco (throttle 5s)
   * 5. Auto check-in se dentro de sessão ativa
   *
   * @param {{ deviceId: number, heartRate: number, beatCount: number, beatTime: number, timestamp: number }} data
   */
  async handleHeartRateData(data) {
    try {
      // 1. Busca atleta pelo serial (DeviceId numérico → string no banco)
      const athlete = await getAthleteByDeviceId(data.deviceId)
      if (!athlete) {
        // Silencioso: dispositivo não cadastrado no NODUS
        return
      }

      const maxHeartRate = athlete.hr_max || 190
      const weight = parseFloat(athlete.weight_kg) || 70
      const zone = calculateZone(data.heartRate, maxHeartRate)
      const now = Date.now()

      // 2. Acumula calorias
      let calories = 0
      if (this.calorieAccumulators.has(athlete.id)) {
        const acc = this.calorieAccumulators.get(athlete.id)
        const timeDiffMin = (now - acc.lastUpdate) / 1000 / 60
        calories = acc.total + calculateCaloriesPerMinute(data.heartRate, weight) * timeDiffMin
      }
      this.calorieAccumulators.set(athlete.id, { total: calories, lastUpdate: now })

      // 3. Monta o payload ao vivo
      /** @type {AthleteRealtimeData} */
      const athleteData = {
        athleteId:    athlete.id,
        athleteName:  athlete.name,
        tenantId:     athlete.tenant_id,
        deviceId:     data.deviceId,
        heartRate:    data.heartRate,
        calories:     Math.round(calories),
        zone,
        maxHeartRate,
        timestamp:    data.timestamp,
      }

      // Atualiza cache em memória
      this.athleteDataCache.set(athlete.id, athleteData)

      // 4. Broadcast imediato para todos os clientes conectados
      this.broadcast({ type: 'heartrate', data: athleteData })

      // 5. Persistência no banco (throttle 5s — não bloqueia o broadcast)
      if (shouldWriteToDb(athlete.id)) {
        this.persistHeartRateLog(athlete, athleteData, zone, calories).catch((err) => {
          console.error('[WebSocket] Error persisting heart rate log:', err)
        })
      }
    } catch (error) {
      console.error('[WebSocket] Error handling heart rate data:', error)
    }
  }

  /**
   * Persiste no banco + tenta auto check-in (Fase 7.5)
   *
   * @param {AthleteRow} athlete
   * @param {AthleteRealtimeData} athleteData
   * @param {number} zone
   * @param {number} calories
   */
  async persistHeartRateLog(athlete, athleteData, zone, calories) {
    // Busca sessão ativa do atleta para vincular e fazer auto check-in
    let sessionId = null
    try {
      const session = await getActiveSessionForAthlete(athlete.tenant_id, athlete.id)
      if (session) {
        sessionId = session.id
        // Auto check-in: só atualiza se ainda não fez (idempotente)
        await autoCheckin(session.id, athlete.id)
      }
    } catch (err) {
      console.warn('[WebSocket] Could not resolve active session:', err.message)
    }

    await createHeartRateLog({
      athlete_id: athlete.id,
      session_id: sessionId,
      heart_rate: athleteData.heartRate,
      zone,
      calories:   Math.round(calories),
      timestamp:  new Date(athleteData.timestamp),
    })
  }

  /**
   * Trata mensagens vindas dos clientes (browser / Next.js)
   * @param {WebSocket} ws
   * @param {any} message
   */
  handleClientMessage(ws, message) {
    console.log('[WebSocket] Received message:', message)

    if (message.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }))
    } else if (message.type === 'request_data') {
      this.sendCurrentDataToClient(ws)
    } else if (message.type === 'reset_calories') {
      // Reset de calorias para um atleta específico
      if (message.athleteId) {
        this.resetCalories(message.athleteId)
      } else {
        this.resetAllCalories()
      }
    }
  }

  /**
   * Envia snapshot completo ao cliente recém-conectado
   * @param {WebSocket} ws
   */
  sendCurrentDataToClient(ws) {
    const allData = Array.from(this.athleteDataCache.values())
    ws.send(JSON.stringify({ type: 'initial_data', data: allData }))
  }

  /**
   * Broadcast para todos os clientes conectados
   * @param {any} message
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message)
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr)
      }
    })
  }

  /**
   * Reset de calorias de um atleta específico
   * @param {string} athleteId - UUID do atleta
   */
  resetCalories(athleteId) {
    this.calorieAccumulators.set(athleteId, { total: 0, lastUpdate: Date.now() })
    const data = this.athleteDataCache.get(athleteId)
    if (data) {
      data.calories = 0
      this.broadcast({ type: 'heartrate', data })
    }
  }

  /**
   * Reset de calorias de todos os atletas (início de nova sessão)
   */
  resetAllCalories() {
    this.calorieAccumulators.clear()
    this.athleteDataCache.forEach((data) => { data.calories = 0 })
    this.broadcast({
      type: 'reset_all',
      data: Array.from(this.athleteDataCache.values()),
    })
  }

  /**
   * Snapshot atual de todos os atletas monitorados
   * @returns {AthleteRealtimeData[]}
   */
  getCurrentData() {
    return Array.from(this.athleteDataCache.values())
  }
}

/**
 * @typedef {Object} AthleteRealtimeData
 * @property {string}  athleteId
 * @property {string}  athleteName
 * @property {string}  tenantId
 * @property {number}  deviceId
 * @property {number}  heartRate
 * @property {number}  calories
 * @property {1|2|3|4|5} zone
 * @property {number}  maxHeartRate
 * @property {number}  timestamp
 */
