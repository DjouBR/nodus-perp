import { GarminStick2, HeartRateScanner } from 'ant-plus-next'

/**
 * ANT+ Service usando CONTINUOUS SCANNING MODE para suportar 42+ dispositivos simultaneamente
 *
 * Abordagem:
 * - Usa HeartRateScanner da biblioteca ant-plus-next
 * - Modo Continuous Scanning: receptor sempre ligado
 * - Recebe dados de TODOS os frequencímetros ANT+ na área
 * - Sem limite de dispositivos (42+)
 * - Baixa latência (~1 segundo)
 *
 * Comportamento sem antena USB:
 * - start() retorna false (não lança erro)
 * - O servidor HTTP/WS sobe normalmente
 * - Conecte a antena e chame POST /ant/start para iniciar
 */
export class AntService {
  constructor() {
    this.stick = null
    this.scanner = null
    this.callbacks = []
    this.isRunning = false
    this.monitoredDevices = new Set()    // DeviceIds que queremos monitorar
    this.lastHeartRateData = new Map()   // Últimos dados de cada dispositivo
    this.detectedDevices = new Set()     // Dispositivos detectados (mesmo sem monitorar)
    this.deviceStates = new Map()        // Estado completo de cada dispositivo

    console.log('[ANT+] Service initialized (CONTINUOUS SCANNING MODE)')
  }

  /**
   * Inicia o serviço ANT+ em Continuous Scanning Mode.
   *
   * @returns {Promise<boolean>} true se iniciou com sucesso, false se a antena não foi encontrada
   */
  async start() {
    if (this.isRunning) {
      console.log('[ANT+] Service already running')
      return true
    }

    console.log('[ANT+] Starting ANT+ stick in CONTINUOUS SCANNING mode...')
    this.stick = new GarminStick2()

    // stick.open() retorna false imediatamente se a antena não estiver conectada
    // Tratamos isso como erro não-fatal: servidor continua rodando sem ANT+
    const opened = this.stick.open()
    if (!opened) {
      console.warn('[ANT+] USB stick not found or could not be opened.')
      console.warn('[ANT+] Plug the ANT+ stick and call POST /ant/start to retry.')
      this.stick = null
      return false
    }

    // Aguarda o evento 'startup' que confirma que o stick está pronto
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ANT+ stick startup timeout (5s)'))
      }, 5000)

      this.stick.on('startup', () => {
        clearTimeout(timeout)
        console.log('[ANT+] Stick started successfully')
        resolve()
      })

      this.stick.on('shutdown', () => {
        console.log('[ANT+] Stick shutdown')
        this.isRunning = false
      })
    })

    console.log('[ANT+] Creating Heart Rate Scanner (Continuous Scanning Mode)...')
    this.scanner = new HeartRateScanner(this.stick)

    // Escuta eventos de dados de TODOS os dispositivos em range
    this.scanner.on('heartRateData', (data) => {
      this.handleHeartRateData(data)
    })

    console.log('[ANT+] Starting continuous scan for ALL heart rate monitors...')
    await this.scanner.scan()

    this.isRunning = true
    console.log('[ANT+] Continuous Scanning Mode active - listening to ALL heart rate monitors in range')
    console.log('[ANT+] Service started, ready to receive data from 42+ devices')
    return true
  }

  /**
   * Processa dados de FC vindos de qualquer dispositivo
   */
  handleHeartRateData(data) {
    const deviceId = data.DeviceId

    if (!deviceId || deviceId === 0) return

    this.deviceStates.set(deviceId, data)

    if (!this.detectedDevices.has(deviceId)) {
      this.detectedDevices.add(deviceId)
      console.log(`[ANT+] New device detected: ${deviceId} (HR: ${data.ComputedHeartRate} bpm)`)
      console.log(`[ANT+] Total devices detected: ${this.detectedDevices.size}`)
    }

    // Se não estamos monitorando este dispositivo, ignorar silenciosamente
    if (!this.monitoredDevices.has(deviceId)) return

    // Log apenas quando há mudança significativa na FC
    const lastData = this.lastHeartRateData.get(deviceId)
    const hrChanged = !lastData || lastData.heartRate !== data.ComputedHeartRate
    if (hrChanged) {
      console.log(`[ANT+] Device ${deviceId}: HR ${data.ComputedHeartRate} bpm, Beat Count: ${data.BeatCount}`)
    }

    const heartRateData = {
      deviceId:  deviceId,
      heartRate: data.ComputedHeartRate || 0,
      beatCount: data.BeatCount || 0,
      beatTime:  data.BeatTime  || 0,
      timestamp: Date.now(),
    }

    this.lastHeartRateData.set(deviceId, heartRateData)

    // Notifica todos os callbacks registrados
    this.callbacks.forEach((callback) => {
      try {
        callback(heartRateData)
      } catch (error) {
        console.error('[ANT+] Error in callback:', error)
      }
    })
  }

  /**
   * Para o serviço ANT+ e fecha todas as conexões
   */
  async stop() {
    if (!this.isRunning) return

    console.log('[ANT+] Stopping ANT+ service...')

    if (this.scanner) {
      try {
        this.scanner = null
        console.log('[ANT+] Scanner stopped')
      } catch (error) {
        console.warn('[ANT+] Warning on stopping scanner:', error)
      }
    }

    if (this.stick) {
      try {
        this.stick.close()
      } catch (error) {
        console.error('[ANT+] Error closing stick:', error)
      }
      this.stick = null
    }

    this.monitoredDevices.clear()
    this.lastHeartRateData.clear()
    this.detectedDevices.clear()
    this.deviceStates.clear()
    this.isRunning = false
    console.log('[ANT+] Service stopped')
  }

  /**
   * Adiciona um dispositivo à lista de monitoramento
   * @param {number} deviceId - ID numérico ANT+ do dispositivo
   */
  scanForDevice(deviceId) {
    if (!this.isRunning) {
      console.error('[ANT+] Cannot add device: service not running')
      return
    }

    if (this.monitoredDevices.has(deviceId)) {
      console.log(`[ANT+] Device ${deviceId} already in monitoring list`)
      return
    }

    console.log(`[ANT+] Adding device ${deviceId} to monitoring list`)
    this.monitoredDevices.add(deviceId)
    console.log(`[ANT+] Now monitoring ${this.monitoredDevices.size} device(s) in continuous scanning mode`)

    if (this.detectedDevices.has(deviceId)) {
      console.log(`[ANT+] Device ${deviceId} already detected and transmitting!`)
      const state = this.deviceStates.get(deviceId)
      if (state) {
        console.log(`[ANT+] Current HR: ${state.ComputedHeartRate} bpm`)
      }
    } else {
      console.log(`[ANT+] Waiting for device ${deviceId} to transmit...`)
    }
  }

  /**
   * Remove um dispositivo da lista de monitoramento
   * @param {number} deviceId
   */
  stopScanForDevice(deviceId) {
    if (!this.monitoredDevices.has(deviceId)) {
      console.log(`[ANT+] Device ${deviceId} not in monitoring list`)
      return
    }
    this.monitoredDevices.delete(deviceId)
    this.lastHeartRateData.delete(deviceId)
    console.log(`[ANT+] Removed device ${deviceId} from monitoring list`)
    console.log(`[ANT+] Now monitoring ${this.monitoredDevices.size} device(s)`)
  }

  /**
   * Registra um callback para receber dados de FC
   * @param {Function} callback
   */
  onHeartRateData(callback) {
    this.callbacks.push(callback)
  }

  /**
   * Remove um callback previamente registrado
   * @param {Function} callback
   */
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) this.callbacks.splice(index, 1)
  }

  /** @returns {number[]} IDs dos dispositivos sendo monitorados */
  getScannedDevices() {
    return Array.from(this.monitoredDevices)
  }

  /** @returns {number[]} IDs de todos os dispositivos detectados (monitorados ou não) */
  getDetectedDevices() {
    return Array.from(this.detectedDevices)
  }

  /**
   * Último dado de FC de um dispositivo específico
   * @param {number} deviceId
   */
  getLastHeartRateData(deviceId) {
    return this.lastHeartRateData.get(deviceId)
  }

  /**
   * Estado completo de um dispositivo (inclui RSSI, threshold, etc.)
   * @param {number} deviceId
   */
  getDeviceState(deviceId) {
    return this.deviceStates.get(deviceId)
  }

  /** @returns {boolean} */
  isServiceRunning() {
    return this.isRunning
  }
}

// Singleton — mesma instância em todo o processo
let antServiceInstance = null

export function getAntService() {
  if (!antServiceInstance) {
    antServiceInstance = new AntService()
  }
  return antServiceInstance
}
