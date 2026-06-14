'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePumpRadioStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import type { StreamQuality } from '@/types'

function qualityLabel(quality: StreamQuality): string {
  switch (quality) {
    case 'LOW': return '64kbps'
    case 'STANDARD': return '128kbps'
    case 'HIGH': return '320kbps'
    case 'LOSSLESS': return 'FLAC'
    default: return '128kbps'
  }
}

function statusLabel(isPlaying: boolean, isLoading: boolean): { text: string; dotClass: string } {
  if (isLoading) return { text: 'CONNECTING', dotClass: 'status-dot-connecting' }
  if (isPlaying) return { text: 'LIVE', dotClass: 'status-dot-live' }
  return { text: 'OFFLINE', dotClass: 'status-dot-offline' }
}

export default function NowPlaying() {
  const currentStation = usePumpRadioStore((s) => s.currentStation)
  const currentTrack = usePumpRadioStore((s) => s.currentTrack)
  const isPlaying = usePumpRadioStore((s) => s.isPlaying)
  const isLoading = usePumpRadioStore((s) => s.isLoading)

  if (!currentStation) return null

  const status = statusLabel(isPlaying, isLoading)
  const accentColor = currentStation.colors?.primary || '#ff2200'
  const trackTitle = currentTrack?.title || 'Waiting for track...'
  const artistName = currentTrack?.artist || currentStation.name

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStation.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="glassmorphism-card rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Album Art */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="relative mx-auto"
          >
            <div
              className="album-art-gradient w-40 h-40 sm:w-52 sm:h-52 mx-auto shadow-2xl"
              style={{
                boxShadow: `0 0 30px ${accentColor}40, 0 0 60px ${accentColor}20`,
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-0 w-40 h-40 sm:w-52 sm:h-52 mx-auto rounded-full"
              style={{
                background: `radial-gradient(circle, transparent 50%, ${accentColor}10 100%)`,
              }}
            />
          </motion.div>

          {/* Track Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center space-y-2"
          >
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight neon-text truncate max-w-full"
              style={{ '--primary': accentColor } as React.CSSProperties}
            >
              {trackTitle}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground/80 font-medium">
              {artistName}
            </p>
          </motion.div>

          {/* Badges Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {/* Status */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-mono uppercase tracking-wider">
              <span className={`status-dot ${status.dotClass}`} />
              <span>{status.text}</span>
            </div>

            {/* BPM */}
            {currentStation.bpm && (
              <Badge
                variant="outline"
                className="font-mono text-xs border-primary/30 text-primary"
              >
                {currentStation.bpm} BPM
              </Badge>
            )}

            {/* Genre */}
            <Badge
              variant="secondary"
              className="text-xs truncate max-w-[160px]"
            >
              {currentStation.genre}
            </Badge>

            {/* Quality */}
            <Badge
              variant="outline"
              className="font-mono text-xs text-muted-foreground border-muted-foreground/30"
            >
              {qualityLabel(currentStation.quality)}
            </Badge>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
