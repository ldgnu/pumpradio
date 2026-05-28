/**
 * PumpRadio — Main Application
 * Underground hardtechno / hardcore / rave web radio player
 */

import './style.css'
import { STATIONS, DEFAULT_STATION } from './stations.js'
import { AudioEngine } from './engine.js'
import { AudioVisualizer, BarVisualizer } from './visualizer.js'
import { NewsManager } from './news.js'

class PumpRadioApp {
  constructor() {
    // Estado
    this.currentStation = null
    this.metadata = { song: 'Cargando...', artist: 'PumpRadio' }
    this.engine = new AudioEngine()
    this.newsManager = null
    this.ambientVisualizer = null
    this.barVisualizer = null
    this.volumeBeforeMute = 80
    this.shortcutsOpen = false

    // DOM refs
    this.els = {}

    this.cacheDom()
    this.populateStationSelect()
    this.bindEngineEvents()
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.loadStation(DEFAULT_STATION)
    this.initVisualizers()
    this.initNews()

    // Set initial volume from localStorage
    const savedVolume = this.engine.getVolume()
    this.els.volume.value = savedVolume
    this.engine.setVolume(savedVolume)
    this.updateVolumeIcon(savedVolume)

    console.log('[PumpRadio] 🎧 Inicializado')
  }

  populateStationSelect() {
    this.els.stationSelect.innerHTML = STATIONS.map(s =>
      `<option value="${s.id}" ${s.comingSoon ? 'disabled' : ''}>
        ${s.name}${s.comingSoon ? ' (Próximamente)' : ''}
      </option>`
    ).join('')
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
      artistName: document.getElementById('artist-name'),
      stationTag: document.getElementById('station-tag'),
      genreTags: document.getElementById('genre-tags'),
      playBtn: document.getElementById('play-btn'),
      playIcon: document.getElementById('play-icon'),
      volume: document.getElementById('volume'),
      volIcon: document.getElementById('vol-icon'),
      stationSelect: document.getElementById('station-select'),
      visualizerBars: document.getElementById('visualizer-bars'),
      ambientCanvas: document.getElementById('ambient-canvas'),
      newsContainer: document.getElementById('news-container'),
      errorOverlay: document.getElementById('error-overlay'),
      errorText: document.getElementById('error-text'),
      retryBtn: document.getElementById('retry-btn'),
      shortcutsBtn: document.getElementById('shortcuts-btn'),
      shortcutsModal: document.getElementById('shortcuts-modal'),
      loadingState: document.getElementById('loading-state'),

      // Station info
      stationDesc: document.getElementById('station-desc'),
      stationName: document.getElementById('station-name'),
    }
  }

  setupEventListeners() {
    // Play button
    this.els.playBtn.addEventListener('click', () => this.togglePlay())

    // Volume
    this.els.volume.addEventListener('input', (e) => {
      const val = parseInt(e.target.value)
      this.engine.setVolume(val)
      this.updateVolumeIcon(val)
    })

    // Volume click to mute/unmute
    this.els.volIcon.addEventListener('click', () => this.toggleMute())

    // Station selector
    this.els.stationSelect.addEventListener('change', (e) => {
      this.loadStation(e.target.value)
    })

    // Retry button
    this.els.retryBtn.addEventListener('click', () => {
      this.els.errorOverlay.classList.remove('show')
      this.loadStation(this.currentStation.id)
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
      this.els.playIcon.textContent = playing ? '⏸' : '▶'
      this.els.albumArt.classList.toggle('playing', playing)

      if (playing) {
        this.barVisualizer?.start()
      } else {
        this.barVisualizer?.stop()
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
      this.els.errorText.textContent = error.message
      this.els.errorOverlay.classList.add('show')
    }

    this.engine.onReconnect = (attempt, max) => {
      this.els.songName.textContent = `Reconectando (${attempt}/${max})...`
      this.els.artistName.textContent = this.currentStation?.name || ''
    }
  }

  loadStation(stationId) {
    const station = STATIONS.find(s => s.id === stationId) || STATIONS[0]
    this.currentStation = station

    // Update station selector
    this.els.stationSelect.value = station.id

    // Update CSS custom properties
    document.documentElement.style.setProperty('--accent-color', station.color)
    document.documentElement.style.setProperty('--accent-secondary', station.colorSecondary)
    document.documentElement.style.setProperty('--accent-glow', station.accent)

    // Update UI
    this.els.stationName.textContent = station.name
    this.els.stationDesc.textContent = station.comingSoon
      ? 'Próximamente — Música en camino. Seguí disfrutando Pump! Radio mientras tanto.'
      : station.description
    this.els.stationTag.textContent = station.comingSoon ? 'Próximamente' : station.genre

    // Update genre tags
    this.els.genreTags.innerHTML = station.tags.map(t =>
      `<span class="genre-tag">${t}</span>`
    ).join('')

    // Reset metadata
    this.els.songName.textContent = station.comingSoon ? 'Próximamente' : 'Cargando...'
    this.els.artistName.textContent = station.comingSoon ? 'Estación en preparación' : station.name

    // Reset cover
    this.els.albumImg.style.display = 'none'
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
        this.engine.audio.src = ''
      }
      this.els.playBtn.classList.remove('playing')
      this.els.playIcon.textContent = '⏸'
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
    this.els.volIcon.textContent = val === 0 ? '🔇' : val < 30 ? '🔈' : val < 70 ? '🔉' : '🔊'
  }

  updateTrackInfo(data) {
    if (data.song) {
      this.els.songName.textContent = data.song
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
      // Fallback: keep default
      delete window[callbackName]
    }
    document.body.appendChild(script)

    // Cleanup after 5s
    setTimeout(() => {
      if (window[callbackName]) {
        delete window[callbackName]
      }
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

  initVisualizers() {
    // Ambient canvas visualizer (background)
    if (this.els.ambientCanvas) {
      this.ambientVisualizer = new AudioVisualizer(this.els.ambientCanvas)
    }

    // Bar visualizer (UI bars)
    if (this.els.visualizerBars) {
      this.barVisualizer = new BarVisualizer(this.els.visualizerBars)
    }

    // Connect to analyser when audio context is available
    // This happens lazily on first play
    const checkAnalyser = setInterval(() => {
      const ctx = this.engine.audioCtx
      const source = this.engine.source
      if (ctx && source && this.ambientVisualizer) {
        this.ambientVisualizer.connect(ctx, source)
        this.ambientVisualizer.start()
        clearInterval(checkAnalyser)
      }
    }, 500)

    // Stop checking after 30s
    setTimeout(() => clearInterval(checkAnalyser), 30000)
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
    const ids = STATIONS.map(s => s.id)
    const idx = ids.indexOf(this.currentStation.id)
    const next = ids[(idx + 1) % ids.length]
    this.loadStation(next)
  }

  prevStation() {
    const ids = STATIONS.map(s => s.id)
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
