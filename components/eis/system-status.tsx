"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"

interface SystemStatusProps {
  lastSync: string | null
  activePrograms: number
}

export function SystemStatus({ lastSync, activePrograms }: SystemStatusProps) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000)
    return () => clearInterval(interval)
  }, [])

  const syncText = lastSync
    ? formatDistanceToNow(new Date(lastSync), { addSuffix: true })
    : "No data"

  return (
    <div className="flex items-center gap-6 text-[11px] font-mono">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className={`w-2 h-2 rounded-full bg-[#2ed573] ${pulse ? 'opacity-100' : 'opacity-60'} transition-opacity duration-1000`} />
          <div className={`absolute inset-0 w-2 h-2 rounded-full bg-[#2ed573] ${pulse ? 'animate-ping' : ''}`} />
        </div>
        <span className="text-muted-foreground">LIVE</span>
      </div>
      <div className="flex items-center gap-4 px-4 py-2 bg-secondary/30 rounded border border-border/50">
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground text-[9px] uppercase tracking-wider">Last Sync</span>
          <span className="text-foreground">{syncText}</span>
        </div>
        <div className="w-px h-6 bg-border/50" />
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground text-[9px] uppercase tracking-wider">Active Programs</span>
          <span className="text-[#00d4aa]">{activePrograms}</span>
        </div>
      </div>
    </div>
  )
}
