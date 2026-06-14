'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { AudioEngineState, Station, TrackMeta, VisualizerData } from '@/types'

interface AudioEngineCallbacks {
  onMetadata?: (meta: TrackMeta) => void
  onPlayStateChange?: (playing: boolean) => void
  onLoadingChange?: (loading: boolean) => void
  onError?: (error: Error) => void
  onVisualizerData?: (data: VisualizerData) => void
  onVolumeChange?: (volume: number) => void
}

interface AudioEngineControls {
  play: () => Promise<void>
  pause: () => void
  togglePlay: () => Promise<void>
  setVolume: (volume: number) => void
  getVolume: () => number
  loadStation: (station: Station) => Promise<void>
  destroy: () => void
  getVisualizerData: () => VisualizerData | null
}

const FFT_SIZE = 2048
const SMOOTHING_TIME_CONSTANT = 0.8
const BEAT_THRESHOLD = 0.7
const BEAT_DECAY = 0.95

export function useAudioEngine(callbacks: AudioEngineCallbacks = {}): AudioEngineControls & { state: AudioEngineState } {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const timeArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const animationRef = useRef<number | null>(null)
  const beatStateRef = useRef({ lastBeat: 0, energy: 0 })

  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isLoading: false,
    volume: 80,
    currentStation: null,
    currentTrack: null,
  })

  const currentStationRef = useRef<Station | null>(null)
  const metadataEventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const buildAudioGraph = useCallback(() => {
    if (!audioRef.current) return

    // Create AudioContext
    ctxRef.current = new AudioContext({ latencyHint: 'playback' })

    // Create nodes
    sourceRef.current = ctxRef.current.createMediaElementSource(audioRef.current)
    analyserRef.current = ctxRef.current.createAnalyser()
    gainRef.current = ctxRef.current.createGain()

    // Configure analyser
    analyserRef.current.fftSize = FFT_SIZE
    analyserRef.current.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT
    
    const bufferLength = analyserRef.current.frequencyBinCount
    dataArrayRef.current = new Uint8Array(bufferLength)
    timeArrayRef.current = new Uint8Array(bufferLength)

    // Connect graph: Source -> Analyser -> Gain -> Destination
    sourceRef.current.connect(analyserRef.current)
    analyserRef.current.connect(gainRef.current)
    gainRef.current.connect(ctxRef.current.destination)

    // Set initial volume
    gainRef.current.gain.value = state.volume / 100

    // Resume context if suspended
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
  }, [state.volume])

  const calculateRMS = useCallback((): number => {
    if (!timeArrayRef.current) return 0
    let sum = 0
    for (let i = 0; i < timeArrayRef.current.length; i++) {
      const val = (timeArrayRef.current[i] - 128) / 128
      sum += val * val
    }
    return Math.sqrt(sum / timeArrayRef.current.length)
  }, [])

  const detectBeat = useCallback((frequencyData: Uint8Array): boolean => {
    let sum = 0
    const bassBins = Math.floor(frequencyData.length * 0.1) // Low frequencies
    for (let i = 0; i < bassBins; i++) {
      sum += frequencyData[i]
    }
    const avgBass = sum / bassBins
    const normalizedBass = avgBass / 255

    const now = Date.now()
    const { lastBeat, energy } = beatStateRef.current

    // Beat detection with decay
    const newEnergy = Math.max(energy * BEAT_DECAY, normalizedBass)
    beatStateRef.current.energy = newEnergy

    const isBeat = newEnergy > BEAT_THRESHOLD && (now - lastBeat) > 100 // Min 100ms between beats
    
    if (isBeat) {
      beatStateRef.current.lastBeat = now
    }

    return isBeat
  }, [])

  const renderLoop = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !timeArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    analyserRef.current.getByteTimeDomainData(timeArrayRef.current)

    const volume = calculateRMS()
    const beatDetected = detectBeat(dataArrayRef.current)

    // Update state
    callbacks.onVolumeChange?.(volume)
    callbacks.onVisualizerData?.({
      frequencyData: new Uint8Array(dataArrayRef.current),
      timeData: new Uint8Array(timeArrayRef.current),
      volume,
      beatDetected,
      timestamp: Date.now(),
    })

    animationRef.current = requestAnimationFrame(renderLoop)
  }, [callbacks, calculateRMS, detectBeat])

  const connectMetadata = useCallback((metadataUrl: string) => {
    if (metadataEventSourceRef.current) {
      metadataEventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource(metadataUrl)
      metadataEventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.streamTitle && callbacks.onMetadata) {
            let artist = ''
            let song = data.streamTitle
            if (data.streamTitle.includes(' - ')) {
              [artist, song] = data.streamTitle.split(' - ', 2)
            }
            const meta: TrackMeta = {
              title: song.trim(),
              artist: artist.trim() || currentStationRef.current?.name || 'Unknown',
            }
            callbacks.onMetadata(meta)
            setState((prev: AudioEngineState) => ({ ...prev, currentTrack: meta }))
          }
        } catch {
          // Ignore parse errors
        }
      }

      eventSource.onerror = () => {
        console.warn('[AudioEngine] Metadata connection error')
        eventSource.close()
      }
    } catch (e) {
      console.warn('[AudioEngine] Failed to connect metadata:', e)
    }
  }, [callbacks])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) return
    
    reconnectAttemptsRef.current++
    const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1)
    
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    
    reconnectTimerRef.current = setTimeout(() => {
      const station = currentStationRef.current
      if (!station?.streamUrl || !audioRef.current) return
      
      setState((prev: AudioEngineState) => ({ ...prev, isLoading: true }))
      callbacks.onLoadingChange?.(true)
      
      audioRef.current.src = station.streamUrl
      audioRef.current.load()
      connectMetadata(station.metadataUrl || '')
      
      audioRef.current.play().catch(console.warn)
    }, delay)
  }, [callbacks, connectMetadata])

  const loadStation = useCallback(async (station: Station) => {
    // Cleanup previous
    if (metadataEventSourceRef.current) {
      metadataEventSourceRef.current.close()
      metadataEventSourceRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectAttemptsRef.current = 0

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    currentStationRef.current = station
    setState((prev: AudioEngineState) => ({ 
      ...prev, 
      currentStation: station, 
      currentTrack: null,
      isLoading: true,
      isPlaying: false 
    }))

    callbacks.onLoadingChange?.(true)
    callbacks.onPlayStateChange?.(false)

    if (station.status === 'COMING_SOON' || !station.streamUrl) {
      setState((prev: AudioEngineState) => ({ ...prev, isLoading: false }))
      callbacks.onLoadingChange?.(false)
      return
    }

    buildAudioGraph()

    audioRef.current = new Audio(station.streamUrl)
    audioRef.current.crossOrigin = 'anonymous'
    audioRef.current.preload = 'none'

    // Audio event handlers
    audioRef.current.onplay = () => {
      setState((prev: AudioEngineState) => ({ ...prev, isPlaying: true, isLoading: false }))
      callbacks.onPlayStateChange?.(true)
      callbacks.onLoadingChange?.(false)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      renderLoop()
    }

    audioRef.current.onpause = () => {
      setState((prev: AudioEngineState) => ({ ...prev, isPlaying: false }))
      callbacks.onPlayStateChange?.(false)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }

    audioRef.current.onwaiting = () => {
      setState((prev: AudioEngineState) => ({ ...prev, isLoading: true }))
      callbacks.onLoadingChange?.(true)
    }

    audioRef.current.onplaying = () => {
      setState((prev: AudioEngineState) => ({ ...prev, isLoading: false }))
      callbacks.onLoadingChange?.(false)
    }

    audioRef.current.onerror = () => {
      console.warn('[AudioEngine] Stream error')
      setState((prev: AudioEngineState) => ({ ...prev, isLoading: false }))
      callbacks.onLoadingChange?.(false)
      scheduleReconnect()
    }

    // Connect metadata
    connectMetadata(station.metadataUrl || '')

    audioRef.current.src = station.streamUrl
    audioRef.current.load()

    if (gainRef.current) {
      gainRef.current.gain.value = state.volume / 100
    }

    try {
      await audioRef.current.play()
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        console.log('[AudioEngine] Autoplay blocked, waiting for interaction')
        setState((prev: AudioEngineState) => ({ ...prev, isLoading: false }))
        callbacks.onLoadingChange?.(false)
      } else {
        console.warn('[AudioEngine] Play error:', e)
        scheduleReconnect()
      }
    }
  }, [buildAudioGraph, callbacks, connectMetadata, scheduleReconnect, state.volume])

  const play = useCallback(async () => {
    if (audioRef.current && audioRef.current.src) {
      try {
        await audioRef.current.play()
      } catch (e) {
        console.warn('[AudioEngine] Play error:', e)
      }
    }
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(async () => {
    if (state.isPlaying) {
      pause()
    } else {
      await play()
    }
  }, [state.isPlaying, play, pause])

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(100, volume))
    setState((prev: AudioEngineState) => ({ ...prev, volume: clamped }))
    if (gainRef.current) {
      gainRef.current.gain.value = clamped / 100
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped / 100
    }
    localStorage.setItem('pumpradio_volume', clamped.toString())
    callbacks.onVolumeChange?.(clamped)
  }, [callbacks])

  const getVolume = useCallback(() => {
    const saved = localStorage.getItem('pumpradio_volume')
    return saved ? parseInt(saved, 10) : 80
  }, [])

  const getVisualizerData = useCallback((): VisualizerData | null => {
    if (!dataArrayRef.current || !timeArrayRef.current) return null
    return {
      frequencyData: new Uint8Array(dataArrayRef.current),
      timeData: new Uint8Array(timeArrayRef.current),
      volume: calculateRMS(),
      beatDetected: false,
      timestamp: Date.now(),
    }
  }, [calculateRMS])

  const destroy = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (metadataEventSourceRef.current) metadataEventSourceRef.current.close()
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (sourceRef.current) sourceRef.current.disconnect()
    if (analyserRef.current) analyserRef.current.disconnect()
    if (gainRef.current) gainRef.current.disconnect()
    if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close()
  }, [])

  // Restore volume on init
  useEffect(() => {
    const savedVolume = getVolume()
    setState((prev: AudioEngineState) => ({ ...prev, volume: savedVolume }))
  }, [getVolume])

  // Cleanup on unmount
  useEffect(() => {
    return () => destroy()
  }, [destroy])

  return {
    state,
    play,
    pause,
    togglePlay,
    setVolume,
    getVolume,
    loadStation,
    destroy,
    getVisualizerData,
  }
}