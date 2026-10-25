/**
 * GlVisualizer — Visualizador reactivo full-screen (Canvas 2D acelerado).
 *
 * Renderiza sobre el AUDIO REAL (AnalyserNode del AudioEngine):
 *   - Espectro de barras con gradiente + glow
 *   - Partículas que explotan con cada beat detectado (energía de graves)
 *   - Flash de beat y viñeta
 *
 * Reglas:
 *   - Sin música no hay render: stop() corta el rAF y limpia el canvas
 *     (antes quedaba un "modo idle" animándose para siempre).
 *   - Si el analizador no entrega datos (stream mudo, CORS roto), el
 *     visualizador queda plano: no inventa movimiento.
 */
import { energyOf } from './analyser.js'

const NUM_BARS = 64
const NUM_PARTICLES = 160
const BEAT_DECAY = 0.86
const SMOOTH = 0.55

export class GlVisualizer {
  constructor(canvas, { getColors = null, getAnalyser = null } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.getColors = getColors
    this.getAnalyser = getAnalyser
    this.isActive = false   // sólo true mientras hay música
    this.rafId = null
    this.t = 0
    this.lastBeat = 0
    this.energy = 0
    this.flash = 0
    this._avgEnergy = 0     // media móvil para detectar el beat

    this.barLevels = new Float32Array(NUM_BARS).fill(0)
    this.particles = []
    for (let i = 0; i < NUM_PARTICLES; i++) this.particles.push(this.spawnParticle(true))

    this.onResize = this.onResize.bind(this)
    window.addEventListener('resize', this.onResize)
    this.onResize()
  }

  onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = this.width * dpr
    this.canvas.height = this.height * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  colors() {
    const cs = getComputedStyle(document.documentElement)
    const primary = cs.getPropertyValue('--accent-color').trim() || '#ff2200'
    const glow = cs.getPropertyValue('--accent-glow').trim() || '#ff6600'
    if (this.getColors) return this.getColors(primary, glow)
    return { primary, glow }
  }

  hexToRgb(hex) {
    const m = hex.replace('#', '')
    const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
    const n = parseInt(full, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  spawnParticle(idle = false) {
    const dir = Math.random() * Math.PI * 2
    return {
      x: this.width / 2,
      y: this.height * 0.7,
      vx: Math.cos(dir) * (0.4 + Math.random() * 1.6),
      vy: (idle ? -0.3 : -1.2) - Math.random() * 2.2,
      life: 1,
      decay: 0.004 + Math.random() * 0.008,
      size: 1 + Math.random() * 3,
    }
  }

  // --- API pública ---
  start() {
    this.isActive = true
    if (!this.rafId) this.loop()
  }

  // Apagado real: sin música no se renderiza nada.
  stop() {
    this.isActive = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.energy = 0
    this.flash = 0
    this.barLevels.fill(0)
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  readFreq() {
    const bridge = this.getAnalyser ? this.getAnalyser() : null
    if (!bridge || !bridge.ok) return null
    bridge.ensureRunning()
    return bridge.readFrequency()
  }

  // Energía real: graves (kick) + media global. Detecta beat por salto
  // sobre la media móvil, no por un seno inventado.
  updateEnergy(freq) {
    const low = energyOf(freq, 1, 12)     // ~20-250Hz con FFT 1024
    const all = energyOf(freq, 1, freq.length)
    const target = Math.min(1, (low / 255) * 0.75 + (all / 255) * 0.45)
    this.energy += (target - this.energy) * 0.25
    this._avgEnergy += (this.energy - this._avgEnergy) * 0.05
    const jump = this.energy - this._avgEnergy
    if (this.energy > 0.18 && jump > 0.06 && this.t - this.lastBeat > 0.18) {
      this.lastBeat = this.t
      this.flash = 1
    }
    this.flash *= BEAT_DECAY
  }

  sampleBars(freq) {
    for (let i = 0; i < NUM_BARS; i++) {
      const idx = Math.floor(Math.pow(i / NUM_BARS, 1.7) * (freq.length - 1))
      const raw = i === 0 ? 0 : (freq[idx] || 0) / 255
      const prev = this.barLevels[i]
      this.barLevels[i] = prev + (raw - prev) * SMOOTH
    }
    return this.barLevels
  }

  renderBars(ctx, colors) {
    const w = this.width
    const h = this.height
    const barW = (w * 0.72) / NUM_BARS
    const maxH = h * 0.42
    const baseY = h * 0.82
    const gap = Math.max(1, barW * 0.15)
    const rgb1 = this.hexToRgb(colors.primary)
    const rgb2 = this.hexToRgb(colors.glow)

    for (let i = 0; i < NUM_BARS; i++) {
      const v = this.barLevels[i]
      const bh = Math.max(2, v * maxH)
      const x = w * 0.14 + i * barW + gap / 2
      const y = baseY - bh
      const grd = ctx.createLinearGradient(0, y, 0, baseY)
      grd.addColorStop(0, `rgb(${rgb1[0]},${rgb1[1]},${rgb1[2]})`)
      grd.addColorStop(1, `rgb(${rgb2[0]},${rgb2[1]},${rgb2[2]})`)
      ctx.fillStyle = grd
      ctx.globalAlpha = 0.35 + v * 0.6
      ctx.fillRect(x, y, barW - gap, bh)
      if (v > 0.25) {
        ctx.globalAlpha = v
        ctx.fillStyle = `rgb(${rgb2[0]},${rgb2[1]},${rgb2[2]})`
        ctx.fillRect(x, y - 2, barW - gap, 2)
      }
    }
    ctx.globalAlpha = 1
  }

  renderParticles(ctx, colors) {
    const rgb = this.hexToRgb(colors.primary)
    // Explosión sólo cuando el beat real dispara el flash
    if (this.flash > 0.05) {
      const burst = Math.floor(this.flash * 14)
      for (let i = 0; i < burst; i++) {
        if (this.particles.length < NUM_PARTICLES * 1.5) {
          const p = this.spawnParticle()
          const ang = Math.random() * Math.PI * 2
          const sp = 2 + Math.random() * 6
          p.vx = Math.cos(ang) * sp
          p.vy = Math.sin(ang) * sp - 1
          this.particles.push(p)
        }
      }
    }

    ctx.globalCompositeOperation = 'lighter'
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.life -= p.decay
      if (p.life <= 0 || p.y > this.height + 10 || p.x < -10 || p.x > this.width + 10) {
        this.particles.splice(i, 1)
        continue
      }
      ctx.globalAlpha = Math.max(0, p.life) * 0.6 * (0.25 + this.energy * 0.75)
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  renderBackground(ctx, colors) {
    const g = ctx.createRadialGradient(
      this.width / 2, this.height * 0.5, 0,
      this.width / 2, this.height * 0.5, this.width * 0.8
    )
    const rgb = this.hexToRgb(colors.primary)
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.05 + this.flash * 0.06})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.width, this.height)
  }

  renderVignette(ctx) {
    const g = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.25,
      this.width / 2, this.height / 2, this.width * 0.85
    )
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.width, this.height)
  }

  loop() {
    // Sin música no se sigue animando: corta acá y deja el canvas limpio.
    if (!this.isActive) {
      this.rafId = null
      return
    }

    this.t += 0.016
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    const freq = this.readFreq()
    if (!freq) {
      // Analizador sin datos: pantalla limpia (apagado), sin inventar nada.
      // Si se sostiene ~2s, se apaga el loop directamente: estado honesto.
      this.energy = 0
      this.flash = 0
      this.ctx.clearRect(0, 0, this.width, this.height)
      this._silentFrames = (this._silentFrames || 0) + 1
      if (this._silentFrames > 120) {
        this.stop()
        return
      }
      this.rafId = requestAnimationFrame(() => this.loop())
      return
    }
    this._silentFrames = 0

    this.updateEnergy(freq)
    this.sampleBars(freq)
    const colors = this.colors()
    this.renderBackground(ctx, colors)
    this.renderParticles(ctx, colors)
    this.renderBars(ctx, colors)
    this.renderVignette(ctx)

    this.rafId = requestAnimationFrame(() => this.loop())
  }

  destroy() {
    window.removeEventListener('resize', this.onResize)
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
