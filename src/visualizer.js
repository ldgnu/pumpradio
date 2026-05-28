/**
 * Visualizador de audio con Canvas API
 * Barras reactivas tipo ecualizador, inspirado en
 * hardware de sonido industrial y rave.
 */

export class AudioVisualizer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.analyser = null
    this.animationId = null
    this.isActive = false

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.width = rect.width
    this.height = rect.height
  }

  connect(audioCtx, source) {
    this.analyser = audioCtx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8
    source.connect(this.analyser)
  }

  start() {
    if (this.isActive) return
    this.isActive = true
    this.draw()
  }

  stop() {
    this.isActive = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.clear()
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  draw() {
    if (!this.isActive) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    this.ctx.clearRect(0, 0, this.width, this.height)

    const barCount = Math.min(64, bufferLength)
    const barWidth = (this.width / barCount) * 0.6
    const gap = (this.width / barCount) * 0.4
    const centerY = this.height / 2

    for (let i = 0; i < barCount; i++) {
      // Skip DC offset, spread across spectrum
      const idx = Math.floor((i / barCount) * bufferLength)
      const value = dataArray[idx] / 255

      // Symmetrical bars from center
      const barHeight = value * (this.height * 0.4)
      const x = i * (barWidth + gap) + gap / 2

      // Gradient based on frequency
      const hue = 0 + (i / barCount) * 30 // red to orange
      const opacity = 0.15 + value * 0.45

      this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${opacity})`

      // Upper bar
      this.ctx.fillRect(x, centerY - barHeight, barWidth, Math.max(1, barHeight))
      // Lower bar (mirror)
      this.ctx.fillRect(x, centerY, barWidth, Math.max(1, barHeight))
    }

    this.animationId = requestAnimationFrame(() => this.draw())
  }
}

/**
 * Visualizador simple de barras (no-WebAudio fallback / estático)
 */
export class BarVisualizer {
  constructor(container) {
    this.container = container
    this.bars = []
    this.isActive = false
    this.animationId = null
    this.init()
  }

  init() {
    const count = 32
    for (let i = 0; i < count; i++) {
      const bar = document.createElement('div')
      bar.className = 'bar'
      this.container.appendChild(bar)
      this.bars.push(bar)
    }
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
  }

  animate() {
    if (!this.isActive) return

    const maxHeight = this.container.clientHeight - 4

    for (let i = 0; i < this.bars.length; i++) {
      // Simulated frequency data using sine waves + noise
      const t = Date.now() / 1000
      const freq = 2 + (i / this.bars.length) * 8
      const value = (
        Math.sin(t * freq + i * 0.3) * 0.3 +
        Math.sin(t * freq * 1.5 + i * 0.7) * 0.2 +
        (Math.random() - 0.5) * 0.2 +
        0.3
      )
      const height = Math.max(2, Math.min(maxHeight, value * maxHeight))
      this.bars[i].style.height = `${height}px`
    }

    this.animationId = requestAnimationFrame(() => this.animate())
  }
}
