/**
 * AudioEngine — Manejo de streaming de audio
 * 
 * Gestiona: reproducción, volumen, reconexión automática,
 * Web Audio API para visualización, estados de error.
 */

export class AudioEngine {
  constructor() {
    this.audio = null
    this.audioCtx = null
    this.source = null
    this.streamUrl = ''
    this.metadataUrl = ''
    this.isPlaying = false
    this.isLoading = false
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.eventSource = null

    // Callbacks
    this.onMetadata = null
    this.onPlayStateChange = null
    this.onError = null
    this.onLoadingChange = null
    this.onReconnect = null

    this.setupAudio()
  }

  setupAudio() {
    this.audio = new Audio()
    this.audio.preload = 'auto'

    this.audio.onplay = () => {
      this.isPlaying = true
      this.isLoading = false
      if (this.onPlayStateChange) this.onPlayStateChange(true)
      if (this.onLoadingChange) this.onLoadingChange(false)
      this.setupAudioContext()
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

    this.audio.onerror = (e) => {
      console.warn('[Audio] Error en stream:', e)
      this.isLoading = false
      if (this.onLoadingChange) this.onLoadingChange(false)
      this.scheduleReconnect()
    }

    // Autoplay attempt fails silently in most browsers,
    // user interaction is needed first
  }

  setupAudioContext() {
    if (this.audioCtx) return
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      this.source = this.audioCtx.createMediaElementSource(this.audio)
    } catch (e) {
      // AudioContext not available, visualizer won't work but audio still plays
      console.warn('[Audio] Web Audio API no disponible:', e.message)
    }
  }

  getAnalyserNode() {
    if (!this.audioCtx || !this.source) return null
    const analyser = this.audioCtx.createAnalyser()
    analyser.fftSize = 256
    this.source.connect(analyser)
    analyser.connect(this.audioCtx.destination)
    return analyser
  }

  connectStream() {
    if (!this.audioCtx || !this.source) return null
    const analyser = this.audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    this.source.connect(analyser)
    analyser.connect(this.audioCtx.destination)
    return analyser
  }

  async load(stationUrl, metadataUrl) {
    this.streamUrl = stationUrl
    this.metadataUrl = metadataUrl
    this.reconnectAttempts = 0

    // Create fresh audio element to allow reconnecting MediaElementSource
    this.setupAudio()

    // Clean up old EventSource
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    // Clean up AudioContext for new source
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      await this.audioCtx.close()
    }
    this.audioCtx = null
    this.source = null

    this.isLoading = true
    if (this.onLoadingChange) this.onLoadingChange(true)

    // Set new source
    this.audio.src = stationUrl
    this.audio.load()

    // Connect metadata
    this.connectMetadata(metadataUrl)

    // Try to play
    try {
      await this.audio.play()
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        // Browser requires user interaction
        console.log('[Audio] Autoplay bloqueado, esperando interacción')
        this.isLoading = false
        if (this.onLoadingChange) this.onLoadingChange(false)
        // Wait for user to press play
      } else {
        console.error('[Audio] Error al reproducir:', e)
        if (this.onError) this.onError(e)
      }
    }
  }

  async play() {
    if (!this.audio.src) return
    try {
      await this.audio.play()
      // Resume audio context if suspended
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }
    } catch (e) {
      if (this.onError) this.onError(e)
    }
  }

  pause() {
    this.audio.pause()
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend()
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  setVolume(value) {
    // value: 0-100
    const vol = Math.max(0, Math.min(100, value))
    this.audio.volume = vol / 100
    localStorage.setItem('pumpradio_volume', vol)
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

            this.onMetadata({
              song: song.trim(),
              artist: artist.trim()
            })
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      this.eventSource.onerror = () => {
        // EventSource auto-reconnects
      }
    } catch (e) {
      console.warn('[Audio] Error al conectar metadata:', e.message)
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.onError) this.onError(new Error('Reconexión fallida después de ' + this.maxReconnectAttempts + ' intentos'))
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)

    console.log(`[Audio] Reconnect #${this.reconnectAttempts} en ${delay}ms`)

    if (this.onReconnect) this.onReconnect(this.reconnectAttempts, this.maxReconnectAttempts)

    this.reconnectTimer = setTimeout(() => {
      if (!this.streamUrl) return
      console.log(`[Audio] Reconectando a ${this.streamUrl}`)
      this.isLoading = true
      if (this.onLoadingChange) this.onLoadingChange(true)

      // Re-create audio element to force fresh connection
      const oldAudio = this.audio
      this.setupAudio()
      this.audio.src = this.streamUrl
      this.audio.volume = oldAudio.volume || 0.8
      this.audio.load()
      this.audio.play().catch(() => {})
    }, delay)
  }

  destroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.eventSource) this.eventSource.close()
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close()
    }
  }
}
