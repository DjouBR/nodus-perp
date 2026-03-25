/**
 * ant-server/index.js
 *
 * Entry point do servidor ANT+/WebSocket do NODUS.
 *
 * - Roda como processo Node.js independente (porta 3001)
 * - Inicializa o AntService (Continuous Scanning Mode)
 * - Inicia o HeartRateWebSocketServer em /ws/heartrate
 * - Registra todos os sensores ativos do banco no AntService
 * - Expõe API REST mínima:
 *     GET  /health          — healthcheck
 *     POST /ant/start       — inicia o AntService manualmente
 *     POST /ant/stop        — para o AntService
 *     GET  /ant/status      — status do serviço + dispositivos
 *     POST /ant/reset       — reseta calorias de todos os atletas
 *
 * Variáveis de ambiente necessárias (mesmas do NODUS):
 *   DATABASE_URL=mysql://user:pass@host:3306/nodus_db
 *   ANT_SERVER_PORT=3001   (opcional, padrão 3001)
 *
 * O .env é carregado da raiz do projeto NODUS (diretório pai).
 * Não é necessário criar um .env separado dentro de ant-server/.
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Carrega o .env da raiz do NODUS (pasta pai do ant-server/)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

import http from 'http'
import { initDb, getAllActiveSensors, closeDb } from './db.js'
import { getAntService } from './antService.js'
import { HeartRateWebSocketServer } from './websocketServer.js'

const PORT = parseInt(process.env.ANT_SERVER_PORT || '3001', 10)

// ─────────────────────────────────────────────────────────────
// SERVIDOR HTTP
// ─────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS — permite que o Next.js (localhost:3000) se conecte
  res.setHeader('Access-Control-Allow-Origin', process.env.NODUS_ORIGIN || 'http://localhost:3000')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = req.url || '/'

  // ── GET /health ─────────────────────────────────────────────
  if (req.method === 'GET' && url === '/health') {
    respondJson(res, 200, { ok: true, uptime: process.uptime() })
    return
  }

  // ── GET /ant/status ─────────────────────────────────────────
  if (req.method === 'GET' && url === '/ant/status') {
    const ant = getAntService()
    respondJson(res, 200, {
      running:         ant.isServiceRunning(),
      scannedDevices:  ant.getScannedDevices(),
      detectedDevices: ant.getDetectedDevices(),
    })
    return
  }

  // ── POST /ant/start ─────────────────────────────────────────
  if (req.method === 'POST' && url === '/ant/start') {
    startAntService()
      .then(() => respondJson(res, 200, { success: true, message: 'ANT+ service started' }))
      .catch((err) => respondJson(res, 500, { success: false, error: err.message }))
    return
  }

  // ── POST /ant/stop ──────────────────────────────────────────
  if (req.method === 'POST' && url === '/ant/stop') {
    getAntService()
      .stop()
      .then(() => respondJson(res, 200, { success: true, message: 'ANT+ service stopped' }))
      .catch((err) => respondJson(res, 500, { success: false, error: err.message }))
    return
  }

  // ── POST /ant/reset ─────────────────────────────────────────
  if (req.method === 'POST' && url === '/ant/reset') {
    wsServer.resetAllCalories()
    respondJson(res, 200, { success: true, message: 'Calories reset for all athletes' })
    return
  }

  // 404
  respondJson(res, 404, { error: 'Not found' })
})

// ─────────────────────────────────────────────────────────────
// WEBSOCKET SERVER
// ─────────────────────────────────────────────────────────────

// Instanciado aqui para ter acesso ao resetAllCalories() nas rotas REST
const wsServer = new HeartRateWebSocketServer(server)

// ─────────────────────────────────────────────────────────────
// HELPER JSON
// ─────────────────────────────────────────────────────────────

function respondJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO DO ANT+
// ─────────────────────────────────────────────────────────────

/**
 * Inicia o AntService e registra todos os sensores ativos do banco.
 * - Se a antena USB não estiver conectada, loga o erro mas não derruba o processo.
 * - Cada sensor ativo vira um deviceId monitorado.
 */
async function startAntService() {
  const antService = getAntService()

  if (antService.isServiceRunning()) {
    console.log('[ANT+] Service already running')
    return
  }

  await antService.start()

  // Registra todos os sensores ativos do banco
  try {
    const sensors = await getAllActiveSensors()
    console.log(`[ANT+] Registering ${sensors.length} active sensor(s)...`)
    sensors.forEach(({ serial }) => {
      // serial = string ('ANT0001' ou '12345')
      // Tenta converter para número (DeviceId ANT+ é numérico)
      const deviceId = parseInt(serial, 10)
      if (!isNaN(deviceId)) {
        antService.scanForDevice(deviceId)
      } else {
        // Serial não numérico (ex: 'ANT0001' do seed) — mantém para compatibilidade
        console.warn(`[ANT+] Serial '${serial}' is not numeric — skipping device registration`)
        console.warn(`[ANT+] Update sensors.serial with the real ANT+ DeviceId (numeric)!`)
      }
    })
  } catch (err) {
    console.error('[ANT+] Error loading sensors from DB:', err.message)
  }
}

// ─────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────

async function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`)
  try {
    await getAntService().stop()
    await closeDb()
  } catch (err) {
    console.error('[Server] Error during shutdown:', err)
  }
  server.close(() => {
    console.log('[Server] HTTP server closed.')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

// ─────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`[Server] Loading .env from: ${resolve(__dirname, '../.env')}`)

  // 1. Inicializa pool MySQL
  initDb()

  // 2. Tenta iniciar ANT+ (não fatal se a antena não estiver conectada)
  try {
    await startAntService()
  } catch (err) {
    console.warn('[ANT+] Could not start automatically:', err.message)
    console.warn('[ANT+] POST /ant/start when the USB stick is connected.')
  }

  // 3. Sobe o servidor HTTP + WebSocket
  server.listen(PORT, () => {
    console.log(`\n🚀 ANT+ Server running on http://localhost:${PORT}`)
    console.log(`   WebSocket : ws://localhost:${PORT}/ws/heartrate`)
    console.log(`   Health    : http://localhost:${PORT}/health`)
    console.log(`   Status    : http://localhost:${PORT}/ant/status`)
    console.log(`   Start ANT : POST http://localhost:${PORT}/ant/start`)
    console.log(`   Stop ANT  : POST http://localhost:${PORT}/ant/stop`)
  })
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err)
  process.exit(1)
})
