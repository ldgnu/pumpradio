/**
 * GlVisualizer — Visualizador reactivo full-screen
 *
 * Canvas 2D con aceleración por hardware (compatible con cualquier stream,
 * sin necesidad de CORS). Renderiza:
 *   - Espectro de barras con gradiente + glow (centro visual)
 *   - Campo de partículas que explota con cada beat
 *   - Flash de beat y viñeta dinámica
 *   - Modo idle (ambient lento) cuando no está sonando
 *
 * El dato de audio es SIMULADO (ondas + ruido + envolvente de beat) porque
 * Zeno.fm no manda CORS y no hay acceso a Web Audio AnalyserNode real.
 * Si en el futuro el stream manda CORS, se puede inyectar FFT real.
 */

const NUM_BARS = 64
const NUM_PARTICLES = 160
const BEAT_THRESHOLD = 0.82
const BEAT_DECAY = 0.86
const SMOOTH = 0.55 // suavizado de las barras (persistencia)

export class GlVisualizer {
  constructor(canvas, { getColors = null } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.getColors = getColors
    this.isPlaying = false
    this.isActive = false
    this.rafId = null
    this.t = 0
    this.lastBeat = 0
    this.energy = 0
    this.flash = 0

    // Estado de barras suavizadas (para que no salten bruscamente)
    this.barLevels = new Float32Array(NUM_BARS).fill(0.05)

    // Partículas
    this.particles = []
    for (let i = 0; i < NUM_PARTICLES; i++) this.particles.push(this.spawnParticle(true))

    // Resize
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
    if (!this.isPlaying) this.isPlaying = true
    if (!this.rafId) this.loop()
  }

  stop() {
    this.isActive = true // seguimos renderizando pero en modo idle (fondo ambient)
    this.isPlaying = false
    if (!this.rafId) this.loop()
  }

  // Envolvente de energía (beat simulado)
  updateEnergy() {
    // Envolvente tipo kick: picos con decaimiento
    const kick = (Math.sin(this.t * 4) * 0.5 + 0.5) ** 3
    const noise = Math.random()
    const target = this.isPlaying
      ? Math.min(1, kick * 0.6 + noise * 0.5 + 0.1)
      : 0.08 + noise * 0.06
    this.energy += (target - this.energy) * 0.2
    if (this.energy > BEAT_THRESHOLD && this.t - this.lastBeat > 0.22) {
      this.lastBeat = this.t
      this.flash = 1
    }
    this.flash *= BEAT_DECAY
  }

  // Genera barras con forma de espectro (log-ish) + ruido + envolvente
  sampleBars() {
    const levels = new Float32Array(NUM_BARS)
    for (let i = 0; i < NUM_BARS; i++) {
      const f = i / NUM_BARS
      const t = this.t * (1.5 + f * 6)
      // Peso de bajos → agudos (más energía en los bajos)
      const bassWeight = (1 - f) * 0.7 + 0.3
      const base =
        Math.abs(Math.sin(t * 1.3 + f * 9)) * 0.5 * bassWeight +
        Math.abs(Math.sin(t * 2.7 - f * 5)) * 0.3 +
        Math.random() * 0.25
      const env = 0.35 + this.energy * 0.75
      levels[i] = Math.min(1, base * env)
    }
    // Suavizado temporal
    for (let i = 0; i < NUM_BARS; i++) {
      this.barLevels[i] += (levels[i] - this.barLevels[i]) * SMOOTH
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
    const idleScale = this.isPlaying ? 1 : 0.18

    for (let i = 0; i < NUM_BARS; i++) {
      const v = this.barLevels[i] * idleScale
      const bh = Math.max(2, v * maxH)
      const x = w * 0.14 + i * barW + gap / 2
      const y = baseY - bh
      // Gradiente por barra: del primario al glow
      const grd = ctx.createLinearGradient(0, y, 0, baseY)
      grd.addColorStop(0, `rgb(${rgb1[0]},${rgb1[1]},${rgb1[2]})`)
      grd.addColorStop(1, `rgb(${rgb2[0]},${rgb2[1]},${rgb2[2]})`)
      ctx.fillStyle = grd
      ctx.globalAlpha = 0.35 + v * 0.6
      ctx.fillRect(x, y, barW - gap, bh)
      // Cap point brillante
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
    // Explosión al beat
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
      ctx.globalAlpha = Math.max(0, p.life) * 0.6
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  renderBackground(ctx, colors) {
    // Degradado base muy oscuro
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
    this.t += 0.016
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    this.updateEnergy()
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
