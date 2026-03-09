"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn, engineColors, getRegionDisplay } from "@/lib/utils"
import { Filter, ChevronRight, Calendar } from "lucide-react"

interface TimelineAirline {
  airlineId: string
  airlineName: string
  region: string
  engineType: string
  eisDate: string
  eisLead: string
  overallRag: string
  gates: Array<{ gateNumber: number; planDate: string | null; actualDate: string | null; outcome: string | null }>
}

interface Props {
  airlines: TimelineAirline[]
}

const regions = ["all", "EUROPE", "MEA", "GREATER_CHINA", "APAC", "AMERICAS"]
const zoomLevels = [
  { label: "6M", months: 6 },
  { label: "12M", months: 12 },
  { label: "24M", months: 24 },
  { label: "ALL", months: 36 },
]

export function TimelineClient({ airlines }: Props) {
  const [regionFilter, setRegionFilter] = useState("all")
  const [zoomIndex, setZoomIndex] = useState(2)

  const zoom = zoomLevels[zoomIndex]
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + zoom.months, 1)
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const filtered = useMemo(() => {
    return airlines
      .filter(a => regionFilter === "all" || a.region === regionFilter)
      .sort((a, b) => new Date(a.eisDate).getTime() - new Date(b.eisDate).getTime())
  }, [airlines, regionFilter])

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr)
    const daysSinceStart = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100))
  }

  const todayPosition = getPosition(now.toISOString())

  const months: { date: Date; position: number }[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    months.push({ date: new Date(current), position: getPosition(current.toISOString()) })
    current.setMonth(current.getMonth() + 1)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getRAGColor = (rag: string) => {
    switch (rag) {
      case 'R': return '#ff4757'
      case 'A': return '#ffa502'
      case 'G': return '#2ed573'
      case 'C': return '#00d4aa'
      default: return '#57606f'
    }
  }

  return (
    <>
      <header className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">Program Management</p>
        <h1 className="text-3xl font-light tracking-tight">EIS <span className="text-gradient font-semibold">Timeline</span></h1>
      </header>

      {/* Controls */}
      <div className="instrument-panel rounded p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <div className="flex gap-1">
              {regions.map(region => (
                <button key={region} onClick={() => setRegionFilter(region)}
                  className={cn("px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all",
                    regionFilter === region ? "bg-[#00d4aa] text-[#08090a]" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}>
                  {region === 'all' ? 'All' : getRegionDisplay(region)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">View</span>
            <div className="flex gap-1 bg-secondary/30 p-1 rounded">
              {zoomLevels.map((level, idx) => (
                <button key={level.label} onClick={() => setZoomIndex(idx)}
                  className={cn("px-3 py-1.5 text-[10px] font-mono font-semibold rounded transition-all",
                    zoomIndex === idx ? "bg-[#00d4aa] text-[#08090a]" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-[11px] font-mono text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{filtered.length}</span> active programs
          </p>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="instrument-panel rounded overflow-hidden">
        <div className="flex border-b border-border/30 bg-secondary/30">
          <div className="w-56 shrink-0 px-4 py-3 border-r border-border/30">
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Program</span>
          </div>
          <div className="flex-1 relative h-10">
            {months.map((month, idx) => (
              <div key={idx} className="absolute py-3" style={{ left: `${month.position}%` }}>
                <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">
                  {month.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-0 bottom-0 w-0.5 bg-[#00d4aa] z-20 pointer-events-none"
            style={{ left: `calc(224px + (100% - 224px) * ${todayPosition / 100})` }}>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#00d4aa] text-[7px] font-mono font-bold text-[#08090a] rounded whitespace-nowrap">TODAY</div>
          </div>

          {filtered.map((airline) => {
            const eisPosition = getPosition(airline.eisDate)
            const ragColor = getRAGColor(airline.overallRag)
            const engineColor2 = engineColors[airline.engineType] || '#57606f'
            const barStart = Math.max(0, eisPosition - 15)
            const barWidth = Math.max(5, eisPosition - barStart)

            return (
              <Link key={airline.airlineId} href={`/airlines/${airline.airlineId}`}
                className="group flex items-stretch border-b border-border/20 hover:bg-secondary/20 transition-colors">
                <div className="w-56 shrink-0 px-4 py-3 border-r border-border/30 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ragColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-[#00d4aa] transition-colors">{airline.airlineName}</p>
                    <p className="text-[10px] font-mono truncate" style={{ color: engineColor2 }}>{airline.engineType}</p>
                  </div>
                </div>
                <div className="flex-1 relative py-3 px-2">
                  <div className="absolute inset-0">
                    {months.map((month, idx) => (<div key={idx} className="absolute top-0 bottom-0 border-r border-border/10" style={{ left: `${month.position}%` }} />))}
                  </div>
                  <div className="absolute h-6 rounded-sm transition-all duration-300 group-hover:h-7" style={{
                    left: `${barStart}%`, width: `${barWidth}%`, top: '50%', transform: 'translateY(-50%)',
                    background: `linear-gradient(90deg, transparent 0%, ${ragColor}40 50%, ${ragColor} 100%)`,
                  }} />
                  <div className="absolute top-1/2 -translate-y-1/2 z-10 transition-transform group-hover:scale-125"
                    style={{ left: `calc(${eisPosition}% - 6px)` }}>
                    <div className="w-3 h-3 rounded-full border-2 border-background" style={{ backgroundColor: ragColor }} />
                  </div>
                  {airline.gates.map((gate) => {
                    if (!gate.planDate) return null
                    const gatePos = getPosition(gate.planDate)
                    if (gatePos < 0 || gatePos > 100) return null
                    return (
                      <div key={gate.gateNumber} className="absolute top-1/2 -translate-y-1/2 z-5" style={{ left: `calc(${gatePos}% - 4px)` }}>
                        <div className={cn("w-2 h-2 rounded-full border",
                          gate.outcome === 'Passed' ? "bg-[#00d4aa] border-[#00d4aa]" : "bg-transparent border-muted-foreground/50"
                        )} />
                      </div>
                    )
                  })}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{formatDate(airline.eisDate)}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            )
          })}

          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No programs found for selected filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="instrument-panel rounded p-4 mt-6">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Legend</span>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00d4aa]" /><span className="text-xs text-muted-foreground">EIS Milestone</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-[#00d4aa] bg-[#00d4aa]" /><span className="text-xs text-muted-foreground">Gate Passed</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-muted-foreground/50 bg-transparent" /><span className="text-xs text-muted-foreground">Gate Pending</span></div>
          <div className="w-px h-4 bg-border/50" />
          <div className="flex items-center gap-2"><div className="h-3 w-8 rounded-sm bg-gradient-to-r from-transparent via-[#2ed573]/40 to-[#2ed573]" /><span className="text-xs text-muted-foreground">On Track</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-8 rounded-sm bg-gradient-to-r from-transparent via-[#ffa502]/40 to-[#ffa502]" /><span className="text-xs text-muted-foreground">At Risk</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-8 rounded-sm bg-gradient-to-r from-transparent via-[#ff4757]/40 to-[#ff4757]" /><span className="text-xs text-muted-foreground">Critical</span></div>
        </div>
      </div>
    </>
  )
}
