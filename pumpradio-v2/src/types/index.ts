export type StationStatus = 'LIVE' | 'COMING_SOON' | 'MAINTENANCE'
export type StreamQuality = 'LOW' | 'STANDARD' | 'HIGH' | 'LOSSLESS'
export type Role = 'LISTENER' | 'MODERATOR' | 'ADMIN'

export interface StationColors {
  primary: string
  secondary: string
  accent: string
  glow: string
  background: string
}

export interface StationVisualizerConfig {
  type: 'industrial' | 'euphoric' | 'organic' | 'vinyl' | 'aggressive' | 'minimal'
  particleColor: string
  spectrumStyle: 'sharp' | 'smooth' | 'flowing' | 'groove' | 'brutal' | 'subtle'
  backgroundShader: 'grid-pulse' | 'wave-field' | 'liquid-metal' | 'vinyl-grooves' | 'glitch-grid' | 'void'
}

export interface Station {
  id: string
  slug: string
  name: string
  tagline: string
  genre: string
  description: string
  colors: StationColors
  status: StationStatus
  streamUrl: string | null
  metadataUrl: string | null
  quality: StreamQuality
  bpm: number | null
  tags: string[]
  logoUrl: string | null
  backgroundUrl: string | null
  sortOrder: number
  isActive: boolean
  visualizer: StationVisualizerConfig
  createdAt: Date
  updatedAt: Date
}

export interface Track {
  id: string
  title: string
  artist: string
  album: string | null
  artworkUrl: string | null
  duration: number | null
  bpm: number | null
  genre: string | null
  isrc: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TrackStats {
  id: string
  trackId: string
  totalPlays: number
  uniqueListeners: number
  totalDuration: number
  lastPlayedAt: Date | null
  rankPosition: number | null
  weeklyPlays: number
  monthlyPlays: number
}

export interface PlayHistory {
  id: string
  trackId: string
  stationId: string
  userId: string | null
  startedAt: Date
  endedAt: Date | null
  duration: number | null
  quality: StreamQuality
  source: string
  track?: Track
  station?: Station
}

export interface Favorite {
  id: string
  userId: string
  trackId: string | null
  stationId: string | null
  createdAt: Date
  track?: Track
  station?: Station
}

export interface ListenerCount {
  id: string
  stationId: string
  count: number
  recordedAt: Date
}

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface TrackMeta {
  title: string
  artist: string
  album?: string
  artworkUrl?: string
  isrc?: string
}

export interface VisualizerData {
  frequencyData: Uint8Array
  timeData: Uint8Array
  volume: number
  beatDetected: boolean
  timestamp: number
}

export interface AudioEngineState {
  isPlaying: boolean
  isLoading: boolean
  volume: number
  currentStation: Station | null
  currentTrack: TrackMeta | null
}

export type VisualizerType = 'spectrum' | 'vu-meter' | 'equalizer' | 'waveform' | 'particles' | 'background'

export interface VisualizerConfig {
  type: VisualizerType
  enabled: boolean
  settings: Record<string, unknown>
}