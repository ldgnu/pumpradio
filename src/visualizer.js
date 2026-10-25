/**
 * BarVisualizer — Barras reactivas al audio REAL.
 *
 * Antes inventaba senos + ruido (no seguía la música). Ahora lee el
 * AnalyserNode del AudioEngine (getByteFrequencyData) y mapea bandas
 * logarítmicas a las barras.
 *
 * Regla clave: sin música (pausa, sin stream, sin datos del analizador)
 * las barras quedan en su altura mínima y el loop se detiene — apagado,
 * no "animación decorativa".
 */

const BAR_COUNT = 32
const MIN_HEIGHT = 2

export class BarVisualizer {
  constructor(container, { getAnalyser = null } = {}) {
    this.container = container
    this.getAnalyser = getAnalyser
    this.bars = []
    this.isActive = false
    this.animationId = null
    this.levels = new Float32Array(BAR_COUNT) // estado suavizado
    this.init()
    this.stop() // arranca apagado: sólo se enciende con música
  }

  init() {
    this.container.innerHTML = ''
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement('div')
      bar.className = 'bar'
      bar.style.height = `${MIN_HEIGHT}px`
      this.container.appendChild(bar)
      this.bars.push(bar)
    }
  }

  // Datos reales del analizador. null = no hay audio que seguir.
  readFreq() {
    const bridge = this.getAnalyser ? this.getAnalyser() : null
    if (!bridge || !bridge.ok) return null
    bridge.ensureRunning()
    return bridge.readFrequency()
  }

  start() {
    if (this.isActive) return
    this.isActive = true
    this.container.classList.remove('idle')
    this.animate()
  }

  stop() {
    this.isActive = false
    this.container.classList.add('idle')
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    // Apagado real: todas las barras al mínimo.
    this.levels.fill(0)
    for (const bar of this.bars) bar.style.height = `${MIN_HEIGHT}px`
  }

  animate() {
    if (!this.isActive) return

    const maxHeight = Math.max(MIN_HEIGHT, this.container.clientHeight - 4)
    const freq = this.readFreq()

    if (!freq) {
      // Sin datos: apagado (barras planas) y seguimos esperando; si en ~2s
      // no aparece señal, cortamos el loop para no gastar frames al pedo.
      this.levels.fill(0)
      for (const bar of this.bars) bar.style.height = `${MIN_HEIGHT}px`
      this._silentFrames = (this._silentFrames || 0) + 1
      if (this._silentFrames > 120) {
        // ~2s sin señal: apagar de verdad (estado honesto, sin frames al pedo).
        this.animationId = null
        this.isActive = false
        this.container.classList.add('idle')
        return
      }
      this.animationId = requestAnimationFrame(() => this.animate())
      return
    }
    this._silentFrames = 0

    for (let i = 0; i < BAR_COUNT; i++) {
      // Bandas logarítmicas: más resolución en graves (donde vive el kick)
      const idx = Math.floor(Math.pow(i / BAR_COUNT, 1.6) * (freq.length - 1))
      // Los primeros bins de un stream MP3 suelen venir en 0: ignorar DC
      const raw = i === 0 ? 0 : (freq[idx] || 0) / 255
      // Suavizado: sube rápido, baja con inercia (look de VU meter)
      const prev = this.levels[i]
      this.levels[i] = raw > prev ? raw : prev * 0.72 + raw * 0.28
      const height = Math.max(MIN_HEIGHT, Math.min(maxHeight, this.levels[i] * maxHeight))
      this.bars[i].style.height = `${height}px`
    }

    this.animationId = requestAnimationFrame(() => this.animate())
  }
}
