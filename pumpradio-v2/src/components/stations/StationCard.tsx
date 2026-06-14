'use client'

import { motion } from 'framer-motion'
import { usePumpRadioStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Station } from '@/types'

interface StationCardProps {
  station: Station
  index?: number
}

export default function StationCard({ station, index = 0 }: StationCardProps) {
  const setStation = usePumpRadioStore((s) => s.setStation)
  const currentStation = usePumpRadioStore((s) => s.currentStation)
  const isPlaying = usePumpRadioStore((s) => s.isPlaying)

  const isActive = currentStation?.id === station.id
  const isLive = station.status === 'LIVE'
  const colors = station.colors
  const accentColor = colors?.primary || '#ff2200'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: 'easeOut',
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="relative"
    >
      <Card
        onClick={() => {
          if (isLive) {
            setStation(station)
          }
        }}
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300
          ${isLive ? 'hover:cursor-pointer' : 'hover:cursor-default opacity-80'}
          ${isActive ? 'ring-2' : 'ring-0'}
        `}
        style={{
          borderColor: isActive
            ? accentColor
            : `${accentColor}25`,
          boxShadow: isActive
            ? `0 0 20px ${accentColor}30, 0 0 40px ${accentColor}15`
            : `0 0 0px transparent`,
          '--card-glow': accentColor,
          background: `rgba(18, 18, 30, 0.5)`,
          backdropFilter: 'blur(12px)',
        } as React.CSSProperties}
      >
        {/* Color accent bar at top */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, transparent)`,
          }}
        />

        <div className="p-4 sm:p-5 space-y-3">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <h3
                className="font-bold text-base sm:text-lg leading-tight truncate"
                style={{
                  color: isActive ? accentColor : undefined,
                  textShadow: isActive ? `0 0 10px ${accentColor}50` : undefined,
                }}
              >
                {station.name}
              </h3>
              <p className="text-xs text-muted-foreground/70 truncate">
                {station.tagline}
              </p>
            </div>

            {/* Status Badge */}
            <div
              className={`
                shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono
                uppercase tracking-wider
                ${isLive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
              `}
            >
              {isLive ? 'LIVE' : 'SOON'}
            </div>
          </div>

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-1.5">
            {station.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-2 py-0 font-mono lowercase"
                style={{
                  borderColor: `${accentColor}30`,
                  color: `${accentColor}cc`,
                }}
              >
                #{tag}
              </Badge>
            ))}
            {station.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 font-mono text-muted-foreground"
              >
                +{station.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* BPM */}
          {station.bpm && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              <span>{station.bpm} BPM</span>
            </div>
          )}
        </div>

        {/* Hover glow effect */}
        {isLive && (
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${accentColor}10 0%, transparent 70%)`,
            }}
          />
        )}
      </Card>
    </motion.div>
  )
}
