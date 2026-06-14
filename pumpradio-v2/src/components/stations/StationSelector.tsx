'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ACTIVE_STATIONS } from '@/lib/stations-config'
import StationCard from '@/components/stations/StationCard'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export default function StationSelector() {
  const [showComingSoon, setShowComingSoon] = useState(false)

  const stations = useMemo(() => {
    const all = [...ACTIVE_STATIONS].sort((a, b) => a.sortOrder - b.sortOrder)
    if (showComingSoon) return all
    return all.filter((s) => s.status === 'LIVE')
  }, [showComingSoon])

  const liveCount = ACTIVE_STATIONS.filter((s) => s.status === 'LIVE').length
  const comingSoonCount = ACTIVE_STATIONS.filter((s) => s.status === 'COMING_SOON').length

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Filter Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-lg font-bold text-foreground/90 font-mono tracking-wide uppercase">
            Stations
          </h2>
          <p className="text-sm text-muted-foreground">
            {liveCount} live &middot; {comingSoonCount} coming soon
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Show Coming Soon
          </span>
          <Switch
            checked={showComingSoon}
            onCheckedChange={setShowComingSoon}
            aria-label="Toggle coming soon stations"
          />
        </label>
      </motion.div>

      <Separator className="bg-border/50" />

      {/* Station Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {stations.map((station, i) => (
            <motion.div
              key={station.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.3,
                delay: i * 0.05,
                ease: 'easeOut',
              }}
            >
              <StationCard station={station} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {stations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <p className="font-mono text-sm uppercase tracking-wider">
            No stations available
          </p>
          <p className="text-xs mt-2">Check back later for new stations</p>
        </motion.div>
      )}
    </div>
  )
}
