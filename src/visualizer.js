/**
 * BarVisualizer — Barras animadas simuladas
 * No necesita Web Audio API, funciona con cualquier stream.
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
    this.container.innerHTML = ''
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
