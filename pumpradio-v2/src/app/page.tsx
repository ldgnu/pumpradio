'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePumpRadioStore } from '@/lib/store'
import { ACTIVE_STATIONS, DEFAULT_STATION } from '@/lib/stations-config'
import { Separator } from '@/components/ui/separator'
import NowPlaying from '@/components/player/NowPlaying'
import TransportControls from '@/components/player/TransportControls'
import StationBadge from '@/components/player/StationBadge'
import StationSelector from '@/components/stations/StationSelector'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { VisualizerType } from '@/types'

export default function Home() {
  const currentStation = usePumpRadioStore((s) => s.currentStation)
  const setStation = usePumpRadioStore((s) => s.setStation)
  const [currentVisualizer, setCurrentVisualizer] = useState<VisualizerType>('spectrum')

  // Auto-select default station on mount
  useEffect(() => {
    if (!currentStation) {
      const defaultStation = ACTIVE_STATIONS.find(
        (s) => s.slug === DEFAULT_STATION && s.status === 'LIVE'
      ) || ACTIVE_STATIONS.find((s) => s.status === 'LIVE')
      if (defaultStation) {
        setStation(defaultStation)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Cyberpunk Background */}
      <div
        className="fixed inset-0 -z-10 cyberpunk-grid"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(255, 34, 0, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(0, 100, 255, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(255, 0, 68, 0.05) 0%, transparent 50%),
            linear-gradient(rgba(255, 34, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 34, 0, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Ambient glow orbs */}
      <div
        className="fixed top-1/4 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 34, 0, 0.3) 0%, transparent 70%)',
        }}
      />
      <div
        className="fixed bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 200, 255, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center px-4 sm:px-6 pb-16">
          {/* Hero Section */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-4xl mx-auto pt-16 sm:pt-24 pb-8 sm:pb-12 text-center"
          >
            <h1
              className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter neon-text animate-neon-pulse"
              style={{ '--primary': '#ff2200' } as React.CSSProperties}
            >
              PumpRadio
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto font-mono tracking-wide"
            >
              Hardtechno &middot; Hardcore &middot; Nu Jazz &middot; Electronic
            </motion.p>

            {/* Station Badge (shown when a station is active) */}
            <AnimatePresence>
              {currentStation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 flex justify-center"
                >
                  <StationBadge />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.header>

          {/* Player Section (shown when station is active) */}
          <AnimatePresence mode="wait">
            {currentStation && (
              <motion.section
                key="player"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="w-full max-w-4xl mx-auto space-y-6 overflow-hidden"
              >
                <NowPlaying />
                <TransportControls
                  currentVisualizer={currentVisualizer}
                  onVisualizerChange={setCurrentVisualizer}
                />

                {/* Coming Soon placeholder for visualizer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <div className="glassmorphism rounded-2xl p-6 text-center">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      {currentVisualizer === 'spectrum' && 'Spectrum Analyzer'}
                      {currentVisualizer === 'vu-meter' && 'VU Meter'}
                      {currentVisualizer === 'equalizer' && 'Equalizer'}
                      {currentVisualizer === 'waveform' && 'Waveform'}
                      {currentVisualizer === 'particles' && 'Particle Field'}
                    </p>
                    <div className="mt-4 h-24 flex items-end justify-center gap-1">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 rounded-t-sm"
                          style={{
                            background: `linear-gradient(to top, ${currentStation?.colors?.primary || '#ff2200'}, ${currentStation?.colors?.accent || '#ff6600'})`,
                          }}
                          animate={{
                            height: `${20 + Math.sin(i * 0.5 + Date.now() * 0.001) * 40 + 10}px`,
                          }}
                          transition={{
                            duration: 0.3,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            delay: i * 0.05,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                <Separator className="bg-border/30 max-w-2xl mx-auto" />
              </motion.section>
            )}
          </AnimatePresence>

          {/* Station Selector */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full max-w-4xl mx-auto mt-8"
          >
            <StationSelector />
          </motion.section>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-16 text-center text-xs text-muted-foreground/50 font-mono"
          >
            <p>PumpRadio v2 &mdash; Underground Radio</p>
          </motion.footer>
        </div>
      </ScrollArea>
    </div>
  )
}
