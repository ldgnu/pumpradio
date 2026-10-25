/**
 * AudioEngine — Manejo de streaming de audio
 * 
 * Gestiona: reproducción, volumen, reconexión automática,
 * metadata vía EventSource y el puente Web Audio para el visualizador real.
 */
import { AnalyserBridge } from './analyser.js'

export class AudioEngine {
  constructor() {
    this.audio = null
    this.streamUrl = ''
    this.metadataUrl = ''
    this.isPlaying = false
    this.isLoading = false
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.reconnectDelay = 3000
    this.eventSource = null

    // Puente Web Audio (visualizador real). Se construye PEREZOSO dentro de un
    // gesto del usuario: si nace con el contexto suspended y el elemento ya
    // suena, el MediaElementSource queda mudo para siempre.
    this.bridge = null
    this._hasGesture = false
    this._bindGesture()

    // Callbacks
    this.onMetadata = null
    this.onPlayStateChange = null
    this.onError = null
    this.onLoadingChange = null

    this.setupAudio()
  }

  // Marca "hubo gesto real"; capture para correr antes que cualquier otro handler.
  _bindGesture() {
    const mark = () => {
      this._hasGesture = true
      // Primer gesto: acá sí se puede armar el grafo (y desbloquear el ctx).
      this.ensureBridge()
    }
    for (const evt of ['pointerdown', 'touchend', 'keydown']) {
      document.addEventListener(evt, mark, { passive: true, capture: true })
    }
  }

  // Construye el grafo Web Audio una sola vez, siempre dentro de un gesto.
  ensureBridge() {
    if (this.bridge || !this._hasGesture || !this.audio) return this.bridge
    try {
      this.bridge = new AnalyserBridge(this.audio)
      this.bridge.ensureRunning()
      this.applyVolume(this.getVolume())
      // Aviso: ya hay datos de audio disponibles. Los visualizers que se
      // apagaron por falta de señal se vuelven a encender con este evento
      // (si no, quedaban muertos hasta el próximo play/pause).
      document.dispatchEvent(new CustomEvent('audio:bridge-ready'))
    } catch (e) {
      console.warn('[Audio] No se pudo crear el analizador:', e.message)
      this.bridge = null
    }
    return this.bridge
  }

  // Devuelve el puente sólo si puede entregar datos reales.
  getAnalyser() {
    return this.bridge && this.bridge.ok ? this.bridge : null
  }

  setupAudio() {
    // El grafo anterior apunta al elemento viejo: cerrarlo antes de recrear.
    if (this.bridge) {
      try { this.bridge.close() } catch { /* noop */ }
      this.bridge = null
    }

    this.audio = new Audio()
    this.audio.preload = 'none'
    // CORS: los mounts de Zeno mandan access-control-allow-origin:*, así el
    // AnalyserNode recibe audio real (sin esto el visualizador queda a ciegas).
    this.audio.crossOrigin = 'anonymous'
    // Restaurar el volumen guardado: setupAudio() se llama en cada load()/
    // reconexión y recrea el elemento → sin esto, cambiar de estación
    // resetea el volumen a 100%.
    this.audio.volume = this.getVolume() / 100

    // Si ya hubo gesto (reconexión, cambio de estación), rearmar el grafo
    // sobre el elemento nuevo para no perder el visualizador real.
    if (this._hasGesture) this.ensureBridge()

    this.audio.onplay = () => {
      this.isPlaying = true
      this.isLoading = false
      this.bridge?.ensureRunning()
      if (this.onPlayStateChange) this.onPlayStateChange(true)
      if (this.onLoadingChange) this.onLoadingChange(false)
    }

    this.audio.onpause = () => {
      this.isPlaying = false
      if (this.onPlayStateChange) this.onPlayStateChange(false)
    }

    this.audio.onwaiting = () => {
      this.isLoading = true
      if (this.onLoadingChange) this.onLoadingChange(true)
    }

    this.audio.onplaying = () => {
      this.isLoading = false
      if (this.onLoadingChange) this.onLoadingChange(false)
    }

    this.audio.onerror = () => {
      console.warn('[Audio] Error en stream')
      this.isLoading = false
      if (this.onLoadingChange) this.onLoadingChange(false)
      this.scheduleReconnect()
    }
  }

  async load(stationUrl, metadataUrl) {
    this.streamUrl = stationUrl
    this.metadataUrl = metadataUrl
    this.reconnectAttempts = 0

    // Clean up
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.setupAudio()
    this.isLoading = true
    if (this.onLoadingChange) this.onLoadingChange(true)

    this.audio.src = stationUrl
    this.audio.load()

    this.connectMetadata(metadataUrl)

    try {
      await this.audio.play()
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        console.log('[Audio] Autoplay bloqueado, esperando interacción')
        this.isLoading = false
        if (this.onLoadingChange) this.onLoadingChange(false)
      } else {
        console.warn('[Audio] Error al reproducir:', e.message)
        this.isLoading = false
        if (this.onLoadingChange) this.onLoadingChange(false)
      }
    }
  }

  async play() {
    if (!this.audio?.src) return
    try {
      await this.audio.play()
    } catch (e) {
      console.warn('[Audio] Error al hacer play:', e.message)
    }
  }

  pause() {
    this.audio?.pause()
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  setVolume(value) {
    const vol = Math.max(0, Math.min(100, value))
    this.applyVolume(vol)
    localStorage.setItem('pumpradio_volume', vol)
  }

  // Con puente Web Audio el volumen va por el GainNode (iOS ignora
  // audio.volume). Sin puente, se usa el volumen nativo del elemento.
  applyVolume(vol) {
    if (this.bridge && this.bridge.gain) {
      const t = this.bridge.ctx.currentTime
      this.bridge.gain.gain.setValueAtTime(Math.max(0, Math.min(100, vol)) / 100, t)
    } else if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(100, vol)) / 100
    }
  }

  getVolume() {
    const saved = localStorage.getItem('pumpradio_volume')
    return saved !== null ? parseInt(saved) : 80
  }

  connectMetadata(url) {
    if (!url) return
    try {
      this.eventSource = new EventSource(url)
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.streamTitle && this.onMetadata) {
            let artist = ''
            let song = data.streamTitle
            if (data.streamTitle.includes(' - ')) {
              [artist, song] = data.streamTitle.split(' - ')
            }
            this.onMetadata({ song: song.trim(), artist: artist.trim() })
          }
        } catch { /* ignore parse errors */ }
      }
    } catch (e) {
      console.warn('[Audio] Error al conectar metadata:', e.message)
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)

    this.reconnectTimer = setTimeout(() => {
      if (!this.streamUrl) return
      console.log(`[Audio] Reconectando (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.isLoading = true
      if (this.onLoadingChange) this.onLoadingChange(true)
      // Avisar a la UI (main.js muestra "Reconectando (x/y)...").
      if (this.onReconnect) this.onReconnect(this.reconnectAttempts, this.maxReconnectAttempts)

      this.setupAudio()
      this.audio.src = this.streamUrl
      this.audio.load()
      // Reanudar reproducción tras reconexión: sin este play() el elemento
      // recarga el stream pero queda mudo hasta que el usuario toque play.
      this.audio.play().catch((e) => {
        console.warn('[Audio] No se pudo reanudar tras reconexión:', e.message)
        this.isLoading = false
        if (this.onLoadingChange) this.onLoadingChange(false)
      })
    }, delay)
  }

  destroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.eventSource) this.eventSource.close()
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
    }
  }
}
