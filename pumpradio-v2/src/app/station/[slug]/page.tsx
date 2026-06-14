'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { usePumpRadioStore } from '@/lib/store'
import { STATIONS_BY_SLUG, ACTIVE_STATIONS } from '@/lib/stations-config'
import NowPlaying from '@/components/player/NowPlaying'
import TransportControls from '@/components/player/TransportControls'
import StationSelector from '@/components/stations/StationSelector'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { Station, VisualizerType } from '@/types'

export default function StationPage() {
  const params = useParams()
  const slug = params?.slug as string
  const setStation = usePumpRadioStore((s) => s.setStation)
  const currentStation = usePumpRadioStore((s) => s.currentStation)
  const [currentVisualizer, setCurrentVisualizer] = useState<VisualizerType>('spectrum')

  const station: Station | undefined = slug ? STATIONS_BY_SLUG[slug] : undefined
  const isLive = station?.status === 'LIVE'

  // Auto-select this station on mount
  useEffect(() => {
    if (station && isLive && currentStation?.id !== station.id) {
      setStation(station)
    }
  }, [station?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Not found
  if (!station) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-black font-mono text-muted-foreground">
            Station Not Found
          </h1>
          <p className="text-muted-foreground/60">
            No station matches &ldquo;{slug}&rdquo;
          </p>
        </motion.div>
      </div>
    )
  }

  const accentColor = station.colors?.primary || '#ff2200'

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: station.colors?.background || 'radial-gradient(ellipse at center, #0a0a0f 0%, #000 70%)',
        }}
      />

      {/* Ambient glow */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
        }}
      />

      <div className="flex-1 px-4 sm:px-6 pb-16">
        <div className="max-w-4xl mx-auto pt-12 sm:pt-16">
          {/* Back link */}
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 font-mono"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            All Stations
          </motion.a>

          {/* Station Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="text-3xl sm:text-4xl font-black"
                style={{
                  color: accentColor,
                  textShadow: `0 0 20px ${accentColor}50`,
                }}
              >
                {station.name}
              </h1>
              <Badge
                variant={isLive ? 'default' : 'secondary'}
                className={`font-mono text-xs uppercase tracking-wider ${
                  isLive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {station.status}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground/80">{station.tagline}</p>
            <p className="mt-2 text-sm text-muted-foreground/60 max-w-xl">
              {station.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {station.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="font-mono text-xs lowercase"
                  style={{
                    borderColor: `${accentColor}30`,
                    color: `${accentColor}cc`,
                  }}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </motion.div>

          <Separator className="bg-border/30 mb-8" />

          {/* Coming Soon State */}
          {!isLive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glassmorphism rounded-2xl p-12 text-center space-y-4"
            >
              <div
                className="text-5xl font-black font-mono uppercase tracking-[0.3em]"
                style={{
                  color: accentColor,
                  opacity: 0.5,
                }}
              >
                Coming Soon
              </div>
              <p className="text-muted-foreground/60 text-sm max-w-md mx-auto">
                This station is being prepared. Tune in when it goes live for
                the full PumpRadio experience.
              </p>
            </motion.div>
          )}

          {/* Player Section for live stations */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <NowPlaying />
              <TransportControls
                currentVisualizer={currentVisualizer}
                onVisualizerChange={setCurrentVisualizer}
              />
            </motion.div>
          )}

          {/* Visualizer placeholder */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 glassmorphism rounded-2xl p-6"
            >
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-center mb-4">
                {currentVisualizer === 'spectrum' && 'Spectrum Analyzer'}
                {currentVisualizer === 'vu-meter' && 'VU Meter'}
                {currentVisualizer === 'equalizer' && 'Equalizer'}
                {currentVisualizer === 'waveform' && 'Waveform'}
                {currentVisualizer === 'particles' && 'Particle Field'}
              </p>
              <div className="h-32 flex items-end justify-center gap-0.5">
                {Array.from({ length: 48 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-t-sm"
                    style={{
                      background: `linear-gradient(to top, ${accentColor}, ${station.colors?.accent || accentColor}88)`,
                    }}
                    animate={{
                      height: `${20 + Math.sin(i * 0.3 + Date.now() * 0.002) * 30 + 10}px`,
                      opacity: 0.6 + Math.sin(i * 0.5) * 0.3,
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: i * 0.03,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Other stations */}
          <Separator className="bg-border/30 my-12" />
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-mono uppercase tracking-wide text-foreground/80">
              All Stations
            </h2>
            <StationSelector />
          </div>
        </div>
      </div>
    </div>
  )
}
