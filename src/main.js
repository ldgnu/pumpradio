/**
 * PumpRadio — Main Application
 * Underground hardtechno / hardcore / rave web radio player
 */

import './style.css'
import { STATIONS, DEFAULT_STATION } from './stations.js'
import { AudioEngine } from './engine.js'
import { BarVisualizer } from './visualizer.js'
import { NewsManager } from './news.js'
import { GlVisualizer } from './gl-visualizer.js'

class PumpRadioApp {
  constructor() {
    this.currentStation = null
    this.metadata = { song: 'Cargando...', artist: 'PumpRadio' }
    this.engine = new AudioEngine()
    this.newsManager = null
    this.barVisualizer = null
    this.volumeBeforeMute = 80
    this.shortcutsOpen = false

    this.els = {}

    this.cacheDom()
    this.populateStationGrid()
    this.bindEngineEvents()
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.loadStation(DEFAULT_STATION)
    this.initBarVisualizer()
    this.initGlVisualizer()
    this.initNews()

    const savedVolume = this.engine.getVolume()
    this.els.volume.value = savedVolume
    this.engine.setVolume(savedVolume)
    this.updateVolumeIcon(savedVolume)

    console.log('[PumpRadio] Inicializado')
  }

  populateStationGrid() {
    this.els.stationGrid.innerHTML = STATIONS.map(s => `
      <button class="station-card" data-id="${s.id}" ${s.comingSoon ? 'data-coming="1"' : ''}
        style="--card-accent:${s.color};--card-accent2:${s.accent}" aria-label="${s.name}">
        <div class="sc-top">
          <span class="sc-dot"></span>
          <span class="sc-name">${s.name}</span>
          ${s.comingSoon ? '<span class="sc-soon">Próximamente</span>' : '<span class="sc-live">EN VIVO</span>'}
        </div>
        <div class="sc-tagline">${s.tagline}</div>
        <div class="sc-tags">${s.tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
      </button>
    `).join('')
  }

  cacheDom() {
    this.els = {
      app: document.getElementById('app'),
      playerSection: document.getElementById('player-section'),
      albumArt: document.getElementById('album-art'),
      albumImg: document.getElementById('album-img'),
      albumFallback: document.getElementById('album-fallback'),
      liveBadge: document.getElementById('live-badge'),
      songName: document.getElementById('song-name'),
      marquee: document.querySelector('#song-name .marquee'),
      artistName: document.getElementById('artist-name'),
      stationTag: document.getElementById('station-tag'),
      genreTags: document.getElementById('genre-tags'),
      playBtn: document.getElementById('play-btn'),
      iconPlay: document.getElementById('icon-play'),
      iconPause: document.getElementById('icon-pause'),
      volume: document.getElementById('volume'),
      volBtn: document.getElementById('vol-btn'),
      volIcon: document.getElementById('vol-icon'),
      stationGrid: document.getElementById('station-grid'),
      visualizerBars: document.getElementById('visualizer-bars'),
      newsContainer: document.getElementById('news-container'),
      shortcutsBtn: document.getElementById('shortcuts-btn'),
      shortcutsModal: document.getElementById('shortcuts-modal'),
      bgCanvas: document.getElementById('bg-canvas'),
      stationDesc: document.getElementById('station-desc'),
    }
  }

  setupEventListeners() {
    // Play button
    this.els.playBtn.addEventListener('click', () => this.togglePlay())

    // Volume slider
    this.els.volume.addEventListener('input', (e) => {
      const val = parseInt(e.target.value)
      this.engine.setVolume(val)
      this.updateVolumeIcon(val)
    })

    // Volume click to mute/unmute
    this.els.volBtn.addEventListener('click', () => this.toggleMute())

    // Station cards
    this.els.stationGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.station-card')
      if (!card) return
      if (card.dataset.coming) return
      this.loadStation(card.dataset.id)
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e))

    // Shortcuts info toggle
    this.els.shortcutsBtn.addEventListener('click', () => {
      this.shortcutsOpen = !this.shortcutsOpen
      this.els.shortcutsModal.classList.toggle('show', this.shortcutsOpen)
    })

    // Close shortcuts on click outside
    document.addEventListener('click', (e) => {
      if (this.shortcutsOpen &&
          !this.els.shortcutsModal.contains(e.target) &&
          !this.els.shortcutsBtn.contains(e.target)) {
        this.shortcutsOpen = false
        this.els.shortcutsModal.classList.remove('show')
      }
    })

    // Media Session API
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.engine.play())
      navigator.mediaSession.setActionHandler('pause', () => this.engine.pause())
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prevStation())
      navigator.mediaSession.setActionHandler('nexttrack', () => this.nextStation())
    }
  }

  bindEngineEvents() {
    this.engine.onPlayStateChange = (playing) => {
      this.els.playBtn.classList.toggle('playing', playing)
      this.els.iconPlay.classList.toggle('hidden', playing)
      this.els.iconPause.classList.toggle('hidden', !playing)
      this.els.albumArt.classList.toggle('playing', playing)

      if (playing) {
        this.barVisualizer?.start()
        this.glVisualizer?.start()
      } else {
        this.barVisualizer?.stop()
        this.glVisualizer?.stop()
      }
    }

    this.engine.onLoadingChange = (loading) => {
      this.els.playBtn.classList.toggle('loading', loading)
      this.els.songName.classList.toggle('loading', loading)
      this.els.artistName.classList.toggle('loading', loading)
    }

    this.engine.onMetadata = (data) => {
      this.metadata = data
      this.updateTrackInfo(data)
      this.updateCoverArt(data)
      this.updateMediaSession(data)
    }

    this.engine.onError = (error) => {
      console.error('[PumpRadio] Error:', error.message)
    }

    this.engine.onReconnect = (attempt, max) => {
      this.setMarquee(`Reconectando (${attempt}/${max})...`)
      this.els.artistName.textContent = this.currentStation?.name || ''
    }
  }

  setMarquee(text) {
    if (this.els.marquee) {
      this.els.marquee.textContent = text
      this.els.marquee.dataset.text = text
      this.updateMarqueeOverflow()
    }
  }

  updateMarqueeOverflow() {
    const el = this.els.songName
    const inner = this.els.marquee
    if (!el || !inner) return
    // Activar marquee solo si el título desborda el contenedor
    requestAnimationFrame(() => {
      el.classList.toggle('marquee-active', inner.scrollWidth > el.clientWidth)
    })
  }

  loadStation(stationId) {
    const station = STATIONS.find(s => s.id === stationId) || STATIONS[0]
    this.currentStation = station

    // Update CSS custom properties (el visualizador las lee cada frame)
    document.documentElement.style.setProperty('--accent-color', station.color)
    document.documentElement.style.setProperty('--accent-secondary', station.colorSecondary)
    document.documentElement.style.setProperty('--accent-glow', station.accent)

    // Active card state
    this.els.stationGrid.querySelectorAll('.station-card').forEach(c => {
      c.classList.toggle('active', c.dataset.id === station.id)
    })

    // Update UI
    this.els.stationDesc.textContent = station.comingSoon
      ? 'Próximamente — Música en camino. Seguí disfrutando Pump! Radio mientras tanto.'
      : station.description
    this.els.stationTag.textContent = station.comingSoon ? 'Próximamente' : station.genre
    this.els.stationTag.classList.toggle('soon', station.comingSoon)

    // Update genre tags
    this.els.genreTags.innerHTML = station.tags.map(t =>
      `<span class="genre-tag">${t}</span>`
    ).join('')

    // Reset metadata
    this.setMarquee(station.comingSoon ? 'Próximamente' : 'Cargando...')
    this.els.artistName.textContent = station.comingSoon ? 'Estación en preparación' : station.name

    // Reset cover
    this.els.albumImg.style.display = 'none'
    // restaurar el fallback: un cover previo de Deezer lo ocultó via onload y
    // si el nuevo track no tiene cover, el box quedaba vacío
    this.els.albumFallback.style.display = ''
    this.els.albumFallback.textContent = station.name.charAt(0)

    // Disable play button if coming soon
    this.els.playBtn.classList.toggle('coming-soon', station.comingSoon)

    // Load stream (only if not coming soon)
    if (!station.comingSoon) {
      this.engine.load(station.streamUrl, station.metadataUrl)
    } else {
      // Stop any playing audio
      if (this.engine && this.engine.audio) {
        this.engine.audio.pause()
      }
      this.els.playBtn.classList.remove('playing')
      this.els.iconPlay.classList.remove('hidden')
      this.els.iconPause.classList.add('hidden')
      if (this.barVisualizer) this.barVisualizer.stop()
    }
  }

  togglePlay() {
    this.engine.togglePlay()
  }

  toggleMute() {
    const vol = parseInt(this.els.volume.value)
    if (vol > 0) {
      this.volumeBeforeMute = vol
      this.els.volume.value = 0
      this.engine.setVolume(0)
      this.updateVolumeIcon(0)
    } else {
      this.els.volume.value = this.volumeBeforeMute
      this.engine.setVolume(this.volumeBeforeMute)
      this.updateVolumeIcon(this.volumeBeforeMute)
    }
  }

  updateVolumeIcon(val) {
    const muted = val === 0
    this.els.volBtn.classList.toggle('muted', muted)
    this.els.volIcon.classList.toggle('muted', muted)
  }

  updateTrackInfo(data) {
    if (data.song) {
      this.setMarquee(data.song)
      document.title = `${data.song} — ${data.artist} | ${this.currentStation.name}`
    }
    if (data.artist) {
      this.els.artistName.textContent = data.artist
    }
  }

  updateCoverArt(data) {
    // Try Deezer API for cover art (JSONP)
    const query = encodeURIComponent(`${data.artist} ${data.song}`)
    const callbackName = `pumpradioCover_${Date.now()}`

    window[callbackName] = (response) => {
      if (response.data && response.data.length > 0) {
        const url = response.data[0].album.cover_big || response.data[0].artist.picture_big
        this.els.albumImg.src = url
        this.els.albumImg.style.display = 'block'
        this.els.albumImg.onload = () => {
          this.els.albumFallback.style.display = 'none'
        }
      }
      delete window[callbackName]
    }

    const script = document.createElement('script')
    script.src = `https://api.deezer.com/search?q=${query}&output=jsonp&callback=${callbackName}`
    script.onerror = () => {
      delete window[callbackName]
    }
    document.body.appendChild(script)

    setTimeout(() => {
      if (window[callbackName]) delete window[callbackName]
      if (script.parentNode) script.parentNode.remove()
    }, 5000)
  }

  updateMediaSession(data) {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: data.song || this.currentStation.name,
      artist: data.artist || 'PumpRadio',
      album: this.currentStation.name,
      artwork: [
        { src: '/pumpradio-logo-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pumpradio-logo-512.png', sizes: '512x512', type: 'image/png' }
      ]
    })
  }

  initBarVisualizer() {
    if (this.els.visualizerBars) {
      this.barVisualizer = new BarVisualizer(this.els.visualizerBars)
    }
  }

  initGlVisualizer() {
    if (this.els.bgCanvas) {
      this.glVisualizer = new GlVisualizer(this.els.bgCanvas)
      this.glVisualizer.stop() // arranca en modo idle (ambient)
    }
  }

  initNews() {
    if (this.els.newsContainer) {
      this.newsManager = new NewsManager(this.els.newsContainer)
      this.newsManager.init()
    }
  }

  handleKeyboard(e) {
    const key = e.key.toLowerCase()

    // Don't interfere with input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
    // Si un botón tiene foco, Space/K los maneja el navegador (evitar doble toggle)
    if ((key === ' ' || key === 'k') && e.target.tagName === 'BUTTON') return

    switch (key) {
      case ' ':
      case 'k':
        e.preventDefault()
        this.togglePlay()
        break
      case 'm':
        this.toggleMute()
        break
      case 'arrowup':
        e.preventDefault()
        this.adjustVolume(5)
        break
      case 'arrowdown':
        e.preventDefault()
        this.adjustVolume(-5)
        break
      case 'arrowright':
      case 'n':
        this.nextStation()
        break
      case 'arrowleft':
      case 'p':
        this.prevStation()
        break
      case 'f':
        this.toggleFullscreen()
        break
      case '?':
        this.shortcutsOpen = !this.shortcutsOpen
        this.els.shortcutsModal.classList.toggle('show', this.shortcutsOpen)
        break
    }
  }

  adjustVolume(delta) {
    const current = parseInt(this.els.volume.value)
    const newVal = Math.max(0, Math.min(100, current + delta))
    this.els.volume.value = newVal
    this.engine.setVolume(newVal)
    this.updateVolumeIcon(newVal)
  }

  nextStation() {
    const ids = STATIONS.filter(s => !s.comingSoon).map(s => s.id)
    const idx = ids.indexOf(this.currentStation.id)
    const next = ids[(idx + 1) % ids.length]
    this.loadStation(next)
  }

  prevStation() {
    const ids = STATIONS.filter(s => !s.comingSoon).map(s => s.id)
    const idx = ids.indexOf(this.currentStation.id)
    const prev = ids[(idx - 1 + ids.length) % ids.length]
    this.loadStation(prev)
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  new PumpRadioApp()
})
