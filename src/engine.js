/**
 * AudioEngine — Manejo de streaming de audio
 * 
 * Gestiona: reproducción, volumen, reconexión automática,
 * metadata vía EventSource.
 * Sin Web Audio API (Zeno no soporta CORS).
 */

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

    // Callbacks
    this.onMetadata = null
    this.onPlayStateChange = null
    this.onError = null
    this.onLoadingChange = null

    this.setupAudio()
  }

  setupAudio() {
    this.audio = new Audio()
    this.audio.preload = 'none'

    this.audio.onplay = () => {
      this.isPlaying = true
      this.isLoading = false
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

      this.setupAudio()
      this.audio.src = this.streamUrl
      this.audio.volume = 0.8
      this.audio.load()
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
