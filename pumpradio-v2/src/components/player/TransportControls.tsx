'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePumpRadioStore } from '@/lib/store'
import { ACTIVE_STATIONS } from '@/lib/stations-config'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  HeartOff,
  BarChart3,
  Waves,
  LineChart,
  AudioWaveform,
  Sparkles,
} from 'lucide-react'
import type { VisualizerType } from '@/types'

interface TransportControlsProps {
  currentVisualizer?: VisualizerType
  onVisualizerChange?: (type: VisualizerType) => void
}

const VISUALIZER_MODES: { type: VisualizerType; icon: typeof BarChart3; label: string }[] = [
  { type: 'spectrum', icon: BarChart3, label: 'Spectrum' },
  { type: 'vu-meter', icon: Waves, label: 'VU Meter' },
  { type: 'equalizer', icon: LineChart, label: 'Equalizer' },
  { type: 'waveform', icon: AudioWaveform, label: 'Waveform' },
  { type: 'particles', icon: Sparkles, label: 'Particles' },
]

export default function TransportControls({
  currentVisualizer = 'spectrum',
  onVisualizerChange,
}: TransportControlsProps) {
  const currentStation = usePumpRadioStore((s) => s.currentStation)
  const isPlaying = usePumpRadioStore((s) => s.isPlaying)
  const volume = usePumpRadioStore((s) => s.volume)
  const favorites = usePumpRadioStore((s) => s.favorites)
  const setStation = usePumpRadioStore((s) => s.setStation)
  const togglePlay = usePumpRadioStore((s) => s.togglePlay)
  const setVolume = usePumpRadioStore((s) => s.setVolume)
  const addFavorite = usePumpRadioStore((s) => s.addFavorite)
  const removeFavorite = usePumpRadioStore((s) => s.removeFavorite)

  const [isFavAnimating, setIsFavAnimating] = useState(false)

  const activeStations = ACTIVE_STATIONS.filter((s) => s.status === 'LIVE')
  const currentIndex = currentStation
    ? activeStations.findIndex((s) => s.id === currentStation.id)
    : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < activeStations.length - 1

  const goToStation = useCallback(
    (dir: 'prev' | 'next') => {
      const newIndex = dir === 'prev' ? currentIndex - 1 : currentIndex + 1
      if (newIndex >= 0 && newIndex < activeStations.length) {
        setStation(activeStations[newIndex])
      }
    },
    [currentIndex, activeStations, setStation]
  )

  const isFavorite = currentStation ? favorites.includes(currentStation.id) : false

  const toggleFavorite = useCallback(() => {
    if (!currentStation) return
    setIsFavAnimating(true)
    if (isFavorite) {
      removeFavorite(currentStation.id)
    } else {
      addFavorite(currentStation.id)
    }
    setTimeout(() => setIsFavAnimating(false), 600)
  }, [currentStation, isFavorite, addFavorite, removeFavorite])

  const accentColor = currentStation?.colors?.primary || '#ff2200'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="glassmorphism rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Prev Station */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!hasPrev}
                  onClick={() => goToStation('prev')}
                  className="text-muted-foreground hover:text-foreground h-10 w-10"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous Station</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Play/Pause */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <Button
                    variant="default"
                    size="icon"
                    onClick={togglePlay}
                    disabled={!currentStation}
                    className="h-14 w-14 rounded-full text-white"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                      boxShadow: `0 0 20px ${accentColor}40`,
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 fill-white" />
                    ) : (
                      <Play className="h-6 w-6 fill-white ml-0.5" />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Next Station */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!hasNext}
                  onClick={() => goToStation('next')}
                  className="text-muted-foreground hover:text-foreground h-10 w-10"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next Station</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 px-2">
          <svg
            className="h-4 w-4 text-muted-foreground shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {volume === 0 ? (
              <>
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v4a1 1 0 0 0 1 1h2" />
                <path d="M7 7H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2l4 4V3Z" />
              </>
            ) : (
              <>
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <path
                  d={volume > 50 ? 'M15.54 8.46a5 5 0 0 1 0 7.07' : 'M19.07 4.93a10 10 0 0 1 0 14.14'}
                />
                {volume > 50 && (
                  <path
                    d={volume > 75 ? 'M19.07 4.93a10 10 0 0 1 0 14.14' : ''}
                  />
                )}
              </>
            )}
          </svg>
          <Slider
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            max={100}
            step={1}
            className="flex-1"
            aria-label="Volume"
          />
        </div>

        {/* Visualizer Modes + Favorite */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {VISUALIZER_MODES.map((mode) => {
              const Icon = mode.icon
              const isActive = currentVisualizer === mode.type
              return (
                <TooltipProvider key={mode.type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => onVisualizerChange?.(mode.type)}
                        className={`h-8 w-8 ${
                          isActive
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{mode.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>

          {/* Favorite */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  animate={
                    isFavAnimating
                      ? { scale: [1, 1.3, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    disabled={!currentStation}
                    className={`h-8 w-8 ${
                      isFavorite ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                    }`}
                  >
                    {isFavorite ? (
                      <Heart className="h-4 w-4 fill-red-500" />
                    ) : (
                      <HeartOff className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  )
}
