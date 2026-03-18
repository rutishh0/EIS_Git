"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getRAGDisplay, getRegionDisplay, formatEISDate, getDaysUntil, engineColors } from "@/lib/utils"
import { PageHeader } from "@/components/eis/page-header"
import { FilterBar, useFilterParams } from "@/components/eis/filter-bar"
import { RAGBadge } from "@/components/eis/rag-badge"
import { ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimelineAirline {
  airlineId: string
  airlineName: string
  engineType: string
  eisDate: string
  region: string
  overallRag: string
}

interface TimelineClientProps {
  airlines: TimelineAirline[]
}

const ZOOM_LEVELS = [
  { label: "1 Year", quarters: 4 },
  { label: "2 Years", quarters: 8 },
  { label: "3 Years", quarters: 12 },
  { label: "All", quarters: 0 },
]

const SIDEBAR_PX = 208

function getQuarterStart(date: Date): Date {
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1)
}

function addQuarters(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n * 3, 1)
}

function formatQuarterLabel(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `Q${q} '${String(date.getFullYear()).slice(-2)}`
}

export function TimelineClient({ airlines }: TimelineClientProps) {
  const [zoomIndex, setZoomIndex] = useState(1)
  const { regions, engines, ragStatuses } = useFilterParams()

  const now = new Date()
  const startDate = getQuarterStart(now)
  const zoom = ZOOM_LEVELS[zoomIndex]

  const filtered = useMemo(() => {
    return airlines
      .filter((a) => {
        if (regions.length > 0 && !regions.includes(a.region)) return false
        if (engines.length > 0 && !engines.includes(a.engineType)) return false
        if (ragStatuses.length > 0 && !ragStatuses.includes(a.overallRag)) return false
        return true
      })
      .sort((a, b) => new Date(a.eisDate).getTime() - new Date(b.eisDate).getTime())
  }, [airlines, regions, engines, ragStatuses])

  let quarterCount: number
  if (zoom.quarters > 0) {
    quarterCount = zoom.quarters
  } else {
    if (airlines.length === 0) {
      quarterCount = 8
    } else {
      const maxEisMs = Math.max(...airlines.map((a) => new Date(a.eisDate).getTime()))
      const endQ = addQuarters(getQuarterStart(new Date(maxEisMs)), 2)
      const diffMs = endQ.getTime() - startDate.getTime()
      quarterCount = Math.max(4, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 91.25)))
    }
  }

  const endDate = addQuarters(startDate, quarterCount)
  const totalMs = endDate.getTime() - startDate.getTime()

  function getPosition(d: Date | string): number {
    const date = typeof d === "string" ? new Date(d) : d
    return Math.max(0, Math.min(100, ((date.getTime() - startDate.getTime()) / totalMs) * 100))
  }

  const todayPos = getPosition(now)

  const quarters: { position: number; label: string }[] = []
  for (let i = 0; i <= quarterCount; i++) {
    const d = addQuarters(startDate, i)
    quarters.push({ position: getPosition(d), label: formatQuarterLabel(d) })
  }

  return (
    <>
      <PageHeader title="EIS Timeline" />
      <FilterBar />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          program{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium tabular-nums min-w-[5rem] text-center">
            {zoom.label}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Quarter header */}
        <div className="flex border-b border-border bg-muted/30">
          <div className="w-52 shrink-0 px-4 py-3 border-r border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Program
            </span>
          </div>
          <div className="flex-1 relative h-10 overflow-hidden">
            {quarters.map((q, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 flex items-center"
                style={{ left: `${q.position}%` }}
              >
                <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap pl-1.5">
                  {q.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline body */}
        <div className="relative">
          {quarters.map((q, i) => (
            <div
              key={`grid-${i}`}
              className="absolute top-0 bottom-0 border-l border-dashed border-border/40 pointer-events-none"
              style={{
                left: `calc(${SIDEBAR_PX}px + (100% - ${SIDEBAR_PX}px) * ${q.position / 100})`,
              }}
            />
          ))}

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-[5] pointer-events-none"
            style={{
              left: `calc(${SIDEBAR_PX}px + (100% - ${SIDEBAR_PX}px) * ${todayPos / 100})`,
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-teal-400 text-[8px] font-mono font-bold text-black rounded-b whitespace-nowrap">
              TODAY
            </div>
          </div>

          {filtered.map((airline) => {
            const eisPos = getPosition(airline.eisDate)
            const { color: ragColor } = getRAGDisplay(airline.overallRag)
            const engineColor = engineColors[airline.engineType] || "#57606f"
            const daysUntil = getDaysUntil(airline.eisDate)

            const barLeft = Math.min(todayPos, eisPos)
            const barWidth = Math.max(0.5, Math.abs(eisPos - todayPos))

            return (
              <Link
                key={airline.airlineId}
                href={`/airlines/${airline.airlineId}`}
                className={cn(
                  "group flex items-stretch border-b border-border/20 transition-colors",
                  "hover:bg-muted/30"
                )}
              >
                <div className="w-52 shrink-0 px-4 py-3 border-r border-border flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ragColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-teal-400 transition-colors">
                      {airline.airlineName}
                    </p>
                    <p
                      className="text-[10px] font-mono truncate"
                      style={{ color: engineColor }}
                    >
                      {airline.engineType}
                    </p>
                  </div>
                </div>

                <div className="flex-1 relative py-3">
                  <div
                    className="absolute h-6 rounded-sm transition-all duration-200 group-hover:h-7"
                    style={{
                      left: `${barLeft}%`,
                      width: `${barWidth}%`,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: `linear-gradient(90deg, ${ragColor}20 0%, ${ragColor}60 50%, ${ragColor} 100%)`,
                    }}
                  />

                  <div
                    className="absolute top-1/2 -translate-y-1/2 z-[5] transition-transform group-hover:scale-125"
                    style={{ left: `calc(${eisPos}% - 5px)` }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2 border-background"
                      style={{ backgroundColor: ragColor }}
                    />
                  </div>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border rounded-md px-3 py-2 shadow-lg z-10 pointer-events-none">
                    <p className="text-xs font-semibold whitespace-nowrap">
                      {airline.airlineName}
                    </p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {getRegionDisplay(airline.region)} · {airline.engineType}
                    </p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                      EIS: {formatEISDate(airline.eisDate)}
                    </p>
                    {daysUntil !== null && (
                      <p
                        className="text-[10px] font-semibold whitespace-nowrap mt-0.5"
                        style={{ color: ragColor }}
                      >
                        {daysUntil > 0
                          ? `${daysUntil} days remaining`
                          : daysUntil === 0
                            ? "Today"
                            : `${Math.abs(daysUntil)} days ago`}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No programs match the current filters.
              </p>
            </div>
          )}
        </div>

        {/* Quarter labels at bottom */}
        <div className="flex border-t border-border bg-muted/30">
          <div className="w-52 shrink-0 border-r border-border" />
          <div className="flex-1 relative h-8 overflow-hidden">
            {quarters.map((q, i) => (
              <div
                key={`bottom-${i}`}
                className="absolute top-0 bottom-0 flex items-center"
                style={{ left: `${q.position}%` }}
              >
                <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap pl-1.5">
                  {q.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-card border border-border rounded-lg p-4 mt-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Legend
          </span>
          <div className="w-px h-4 bg-border" />
          <RAGBadge status="G" showLabel size="sm" />
          <RAGBadge status="A" showLabel size="sm" />
          <RAGBadge status="R" showLabel size="sm" />
          <RAGBadge status="C" showLabel size="sm" />
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-4 bg-teal-400 rounded-full" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
        </div>
      </div>
    </>
  )
}
