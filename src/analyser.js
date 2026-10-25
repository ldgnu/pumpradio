/**
 * analyser.js — Puente Web Audio para PumpRadio.
 *
 * Conecta el <audio> a un AnalyserNode real: sin esto el visualizador no
 * puede "seguir la música" (solo puede inventar senos y ruido).
 *
 * Grafo:  mediaElementSource → analyser → gain → destination
 *
 * Requiere que el elemento tenga crossOrigin='anonymous' y que el stream
 * mande CORS. Los mounts de Zeno responden `access-control-allow-origin: *`
 * tanto en el redirect como en el host final, así que el analizador recibe
 * audio real.
 *
 * IMPORTANTE (bug aprendido en pumphradio-terminal): el grafo debe crearse
 * DENTRO de un gesto del usuario. Si el AudioContext nace suspended y el
 * elemento ya está sonando, Chrome/Safari dejan el MediaElementSource en
 * silencio permanente (energía 0 para siempre).
 */
const FFT = 1024

export class AnalyserBridge {
  constructor(audioElement) {
    this.audio = audioElement
    this.ctx = null
    this.analyser = null
    this.gain = null
    this.source = null
    this.freq = null
    this.wave = null
    this.ok = false
    try {
      this.build()
    } catch (e) {
      console.warn('[analyser] no se pudo construir el grafo Web Audio:', e.message)
    }
  }

  build() {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC || !this.audio) return
    this.ctx = new AC({ latencyHint: 'playback' })
    this.source = this.ctx.createMediaElementSource(this.audio)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = FFT
    this.analyser.smoothingTimeConstant = 0.8
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 1

    this.source.connect(this.analyser)
    this.analyser.connect(this.gain)
    this.gain.connect(this.ctx.destination)

    this.freq = new Uint8Array(this.analyser.frequencyBinCount) // 512
    this.wave = new Uint8Array(this.analyser.fftSize)           // 1024
    this.ok = true
  }

  // iOS: 'suspended' (autoplay) o 'interrupted' (llamada, lock, Siri).
  ensureRunning() {
    if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
      this.ctx.resume().catch(() => {})
    }
  }

  readFrequency() {
    if (!this.ok || !this.analyser || !this.freq) return null
    this.analyser.getByteFrequencyData(this.freq)
    return this.freq
  }

  readWaveform() {
    if (!this.ok || !this.analyser || !this.wave) return null
    this.analyser.getByteTimeDomainData(this.wave)
    return this.wave
  }

  disconnect() {
    if (this.source) { try { this.source.disconnect() } catch { /* noop */ } }
    if (this.analyser) { try { this.analyser.disconnect() } catch { /* noop */ } }
    if (this.gain) { try { this.gain.disconnect() } catch { /* noop */ } }
  }

  close() {
    this.disconnect()
    if (this.ctx && this.ctx.state !== 'closed') {
      try { this.ctx.close() } catch { /* noop */ }
    }
  }
}

/**
 * Energía media (0-255) de un Uint8Array de frecuencias.
 * ~0 significa silencio real (o analizador mudo). El visualizador usa esto
 * para apagarse en vez de inventar movimiento.
 */
export function energyOf(freq, from = 0, to = null) {
  if (!freq || !freq.length) return 0
  const end = to === null ? freq.length : Math.min(to, freq.length)
  let sum = 0
  for (let i = from; i < end; i++) sum += freq[i]
  return sum / Math.max(1, end - from)
}
