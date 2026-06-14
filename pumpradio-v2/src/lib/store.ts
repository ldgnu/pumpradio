import { create } from 'zustand'
import type { Station, TrackMeta, VisualizerData } from '@/types'

export type Theme = 'cyberpunk' | 'terminal'

export interface PumpRadioState {
  currentStation: Station | null
  isPlaying: boolean
  isLoading: boolean
  volume: number
  visualizerData: VisualizerData | null
  currentTrack: TrackMeta | null
  favorites: string[]
  theme: Theme
}

export interface PumpRadioActions {
  setStation: (station: Station | null) => void
  setPlaying: (playing: boolean) => void
  setLoading: (loading: boolean) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  setVisualizerData: (data: VisualizerData | null) => void
  setCurrentTrack: (track: TrackMeta | null) => void
  addFavorite: (trackId: string) => void
  removeFavorite: (trackId: string) => void
  setTheme: (theme: Theme) => void
}

export type PumpRadioStore = PumpRadioState & PumpRadioActions

const initialState: PumpRadioState = {
  currentStation: null,
  isPlaying: false,
  isLoading: false,
  volume: 80,
  visualizerData: null,
  currentTrack: null,
  favorites: [],
  theme: 'cyberpunk',
}

export const usePumpRadioStore = create<PumpRadioStore>()((set) => ({
  ...initialState,

  setStation: (station) =>
    set((state) => ({
      ...state,
      currentStation: station,
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      visualizerData: null,
    })),

  setPlaying: (playing) =>
    set((state) => ({
      ...state,
      isPlaying: playing,
    })),

  setLoading: (loading) =>
    set((state) => ({
      ...state,
      isLoading: loading,
    })),

  togglePlay: () =>
    set((state) => ({
      ...state,
      isPlaying: !state.isPlaying,
    })),

  setVolume: (volume) =>
    set((state) => ({
      ...state,
      volume: Math.max(0, Math.min(100, volume)),
    })),

  setVisualizerData: (data) =>
    set((state) => ({
      ...state,
      visualizerData: data,
    })),

  setCurrentTrack: (track) =>
    set((state) => ({
      ...state,
      currentTrack: track,
    })),

  addFavorite: (trackId) =>
    set((state) => ({
      ...state,
      favorites: state.favorites.includes(trackId)
        ? state.favorites
        : [...state.favorites, trackId],
    })),

  removeFavorite: (trackId) =>
    set((state) => ({
      ...state,
      favorites: state.favorites.filter((id) => id !== trackId),
    })),

  setTheme: (theme) =>
    set((state) => ({
      ...state,
      theme,
    })),
}))
