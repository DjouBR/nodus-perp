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

function calculateZone(heartRate, maxHeartRate) {
  const pct = (heartRate / maxHeartRate) * 100
  if (pct < 60) return 1
  if (pct < 70) return 2
  if (pct < 80) return 3
  if (pct < 90) return 4
  return 5
}

function calculateCaloriesPerMinute(heartRate, weight) {
  return heartRate * weight * 0.00015
}

// ────────────────────────────────────────────────────────────
// THROTTLE DE PERSISTÊNCIA NO BANCO
// ────────────────────────────────────────────────────────────

const DB_WRITE_INTERVAL_MS = 5000
const lastDbWrite = new Map()

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
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws/heartrate' })
    this.clients = new Set()
    this.athleteDataCache = new Map()
    this.calorieAccumulators = new Map()
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
  // PIPELINE PRINCIPAL
  // ───────────────────────────────────────────────────────────

  async handleHeartRateData(data) {
    try {
      // ─ DEBUG TEMPORÁRIO — remover após validar pipeline ─
      console.log(`[WS:DEBUG] HR data received: deviceId=${data.deviceId} hr=${data.heartRate}`)

      const athlete = await this.resolveAthlete(data.deviceId)

      if (!athlete) {
        console.log(`[WS:DEBUG] resolveAthlete(${data.deviceId}) => NOT FOUND`)
        return
      }

      console.log(`[WS:DEBUG] Resolved => athlete_id=${athlete.athlete_id} session_id=${athlete.session_id} sensor_id=${athlete.sensor_id}`)

      const maxHr  = athlete.hr_max  || 190
      const weight = parseFloat(athlete.weight_kg) || 70
      const zone   = calculateZone(data.heartRate, maxHr)
      const now    = Date.now()

      let calories = 0
      const acc = this.calorieAccumulators.get(athlete.athlete_id)
      if (acc) {
        const timeDiffMin = (now - acc.lastUpdate) / 1000 / 60
        calories = acc.total + calculateCaloriesPerMinute(data.heartRate, weight) * timeDiffMin
      }
      this.calorieAccumulators.set(athlete.athlete_id, { total: calories, lastUpdate: now })

      /** @type {AthleteRealtimeData} */
      const athleteData = {
        athleteId:   athlete.athlete_id,
        athleteName: athlete.name,
        tenantId:    athlete.tenant_id,
        sessionId:   athlete.session_id ?? null,
        sensorId:    athlete.sensor_id  ?? null,
        deviceId:    data.deviceId,
        heartRate:   data.heartRate,
        calories:    parseFloat(calories.toFixed(2)),
        zone,
        maxHeartRate: maxHr,
        timestamp:   data.timestamp,
      }

      this.athleteDataCache.set(athlete.athlete_id, athleteData)
      this.broadcast({ type: 'heartrate', data: athleteData })

      console.log(`[WS:DEBUG] Broadcast OK — zone=${zone} calories=${athleteData.calories} session=${athlete.session_id ?? 'none'}`)

      if (shouldWriteToDb(athlete.athlete_id)) {
        console.log(`[WS:DEBUG] Writing to DB...`)
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

  async persistAndCheckin(athlete, athleteData, zone, calories) {
    const { athlete_id, session_id, sensor_id } = athlete

    if (session_id) {
      try {
        await autoCheckin(session_id, athlete_id)
        console.log(`[WS:DEBUG] autoCheckin OK session=${session_id}`)
      } catch (err) {
        console.warn('[WebSocket] autoCheckin error:', err.message)
      }
    }

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

    console.log(`[WS:DEBUG] insertHrSeries OK — session_id=${session_id ?? 'null (no persist)'}`)
  }

  // ───────────────────────────────────────────────────────────
  // CACHE DE RESOLUÇÃO DE ATLETA (TTL 10s)
  // ───────────────────────────────────────────────────────────

  deviceAthleteCache = new Map()
  static ATHLETE_CACHE_TTL_MS = 10_000

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
    if (message.type === 'session_ended') {
      this.handleSessionEnded(message.sessionId, message.athleteIds ?? []).catch((err) => {
        console.error('[WebSocket] Error handling session_ended:', err)
      })
      return
    }
    console.log('[WebSocket] Unknown message type:', message.type)
  }

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
    this.deviceAthleteCache.clear()
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

/**
 * @typedef {Object} AthleteRealtimeData
 * @property {string}      athleteId
 * @property {string}      athleteName
 * @property {string}      tenantId
 * @property {string|null} sessionId
 * @property {string|null} sensorId
 * @property {number}      deviceId
 * @property {number}      heartRate
 * @property {number}      calories
 * @property {1|2|3|4|5}  zone
 * @property {number}      maxHeartRate
 * @property {number}      timestamp
 */
