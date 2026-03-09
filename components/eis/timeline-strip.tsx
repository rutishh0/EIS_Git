"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TimelineStripProps {
  data: Array<{
    airlineId: string
    airlineName: string
    region: string
    eisDate: string | Date
    overallRag: string
  }>
}

const REFERENCE_DATE = new Date()

export function TimelineStrip({ data }: TimelineStripProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activePrograms = data
    .sort((a, b) => new Date(a.eisDate).getTime() - new Date(b.eisDate).getTime())
    .slice(0, 8)

  const startDate = new Date(REFERENCE_DATE.getFullYear(), REFERENCE_DATE.getMonth(), 1)
  const endDate = new Date(REFERENCE_DATE.getFullYear() + 2, REFERENCE_DATE.getMonth(), 1)
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

  const getPosition = (dateVal: string | Date) => {
    const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
    const daysSinceStart = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100))
  }

  const todayPosition = getPosition(REFERENCE_DATE)

  const getRAGColor = (rag: string) => {
    switch (rag) {
      case 'R': return '#ff4757'
      case 'A': return '#ffa502'
      case 'G': return '#2ed573'
      case 'C': return '#00d4aa'
      default: return '#57606f'
    }
  }

  const months: { label: string; position: number }[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    months.push({
      label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      position: getPosition(current)
    })
    current.setMonth(current.getMonth() + 3)
  }

  if (!mounted) {
    return (
      <div className="instrument-panel rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">EIS Timeline</h3>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              24-Month Outlook
            </p>
          </div>
        </div>
        <div className="relative h-48 flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Loading timeline...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="instrument-panel rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">EIS Timeline</h3>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            24-Month Outlook
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2ed573]" /> On Track
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffa502]" /> At Risk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff4757]" /> Critical
          </span>
        </div>
      </div>

      <div className="relative h-48">
        <div className="absolute inset-0">
          {months.map((month, idx) => (
            <div key={idx} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: `${month.position}%` }} />
          ))}
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#00d4aa] z-20"
          style={{ left: `${todayPosition}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#00d4aa] text-[8px] font-mono font-bold text-[#08090a] rounded whitespace-nowrap">
            TODAY
          </div>
        </div>

        <div className="absolute inset-0 pt-6 pb-6 flex flex-col justify-around">
          {activePrograms.map((program) => {
            const eisPosition = getPosition(program.eisDate)
            const barStart = Math.max(0, eisPosition - 15)
            const barWidth = eisPosition - barStart
            const color = getRAGColor(program.overallRag)

            return (
              <div key={program.airlineId} className="relative h-5 group">
                <div
                  className="absolute h-full rounded-sm transition-all duration-300 group-hover:h-6 group-hover:-translate-y-0.5"
                  style={{
                    left: `${barStart}%`,
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, transparent, ${color}40, ${color})`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background z-10 transition-transform group-hover:scale-125"
                  style={{
                    left: `${eisPosition}%`,
                    backgroundColor: color,
                    marginLeft: '-5px'
                  }}
                />
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-[10px] font-mono whitespace-nowrap transition-opacity",
                    eisPosition > 50 ? "right-0 pr-2 text-right" : "left-0 pl-2"
                  )}
                  style={{
                    [eisPosition > 50 ? 'right' : 'left']: `${eisPosition > 50 ? 100 - barStart : barStart + barWidth + 2}%`,
                    color: color
                  }}
                >
                  {program.airlineName.slice(0, 12)}{program.airlineName.length > 12 ? '...' : ''}
                </div>
              </div>
            )
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-5 flex">
          {months.map((month, idx) => (
            <div key={idx} className="absolute text-[9px] font-mono text-muted-foreground -translate-x-1/2" style={{ left: `${month.position}%` }}>
              {month.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
