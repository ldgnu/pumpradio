'use client'

import { motion } from 'framer-motion'
import { usePumpRadioStore } from '@/lib/store'
import { ACTIVE_STATIONS } from '@/lib/stations-config'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function statusDot(status: string, isPlaying: boolean): string {
  if (!isPlaying) return 'status-dot-offline'
  if (status === 'LIVE') return 'status-dot-live'
  if (status === 'COMING_SOON') return 'status-dot-connecting'
  return 'status-dot-offline'
}

export default function StationBadge() {
  const currentStation = usePumpRadioStore((s) => s.currentStation)
  const isPlaying = usePumpRadioStore((s) => s.isPlaying)
  const setStation = usePumpRadioStore((s) => s.setStation)

  if (!currentStation) return null

  const accentColor = currentStation.colors?.primary || '#ff2200'
  const liveStations = ACTIVE_STATIONS.filter((s) => s.status === 'LIVE')
  const currentIndex = liveStations.findIndex((s) => s.id === currentStation.id)

  const cycleStation = () => {
    if (liveStations.length === 0) return
    const nextIndex = (currentIndex + 1) % liveStations.length
    setStation(liveStations[nextIndex])
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={cycleStation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glassmorphism rounded-full px-4 py-2 flex items-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`status-dot ${statusDot(currentStation.status, isPlaying)}`}
              style={
                isPlaying
                  ? undefined
                  : { backgroundColor: '#ff0044', boxShadow: '0 0 6px #ff0044' }
              }
            />
            <span className="text-sm font-semibold whitespace-nowrap">
              {currentStation.name}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 font-mono uppercase tracking-wider"
              style={{
                borderColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              {currentStation.genre.split('/')[0].trim()}
            </Badge>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Click to switch station ({currentIndex + 1}/{liveStations.length})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
