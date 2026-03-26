'use client'

import React, { useState, useEffect } from 'react'
import { getTimelinePosition, getCurrentTime } from '@/utils/formatters'
import { TIMELINE_START_HOUR, PIXELS_PER_MINUTE } from '@/utils/constants'

export const CurrentTimeMarker: React.FC = () => {
  const [now, setNow] = useState(getCurrentTime)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(getCurrentTime())
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const top = getTimelinePosition(now, TIMELINE_START_HOUR, PIXELS_PER_MINUTE)

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top: `${top}px` }}
      aria-label={`Current time: ${now}`}
    >
      {/* "Now" label */}
      <span className="text-[10px] font-bold text-red-500 w-10 text-right pr-1 shrink-0 select-none">
        Now
      </span>
      {/* Red dot */}
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 -ml-1 shadow-sm" />
      {/* Red line */}
      <div className="flex-1 h-px bg-red-500 opacity-70" />
    </div>
  )
}
