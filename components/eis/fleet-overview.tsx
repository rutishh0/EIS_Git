"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn, computeOverallRAG, getRAGDisplay, formatEISDate, getDaysUntil, engineColors, getRegionDisplay } from "@/lib/utils"
import { ChevronRight, ArrowUpDown, Filter } from "lucide-react"

interface FleetOverviewProps {
  data: Array<{
    id: string
    airlineId: string
    customer: string
    engineType: string
    region: string
    eisDate: Date | string | null
    eisDateTbc: boolean
    status: string
    ragStatuses: string[]
    gateReviews: Array<{ gateNumber: number; outcome: string | null }>
  }>
  selectedRegion: string
  onRegionChange: (region: string) => void
}

const regions = ["all", "EUROPE", "MEA", "GREATER_CHINA", "AFRICA", "APAC", "AMERICAS"]

export function FleetOverview({ data, selectedRegion, onRegionChange }: FleetOverviewProps) {
  const [sortBy, setSortBy] = useState<'eisDate' | 'customer' | 'rag'>('eisDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filteredData = useMemo(() => {
    let filtered = data.filter(s => s.status === 'ACTIVE')

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(s => s.region === selectedRegion)
    }

    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'eisDate') {
        const aTime = a.eisDate ? new Date(a.eisDate).getTime() : Infinity
        const bTime = b.eisDate ? new Date(b.eisDate).getTime() : Infinity
        comparison = aTime - bTime
      } else if (sortBy === 'customer') {
        comparison = a.customer.localeCompare(b.customer)
      } else if (sortBy === 'rag') {
        const ragOrder: Record<string, number> = { 'R': 0, 'A': 1, 'G': 2, 'C': 3, 'NA': 4 }
        comparison = (ragOrder[computeOverallRAG(a.ragStatuses)] ?? 4) - (ragOrder[computeOverallRAG(b.ragStatuses)] ?? 4)
      }
      return sortDir === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [data, selectedRegion, sortBy, sortDir])

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  return (
    <div className="instrument-panel rounded overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Fleet Overview</h3>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {filteredData.length} Active Programs
            </p>
          </div>
          <Link
            href="/airlines"
            className="flex items-center gap-1 text-xs text-[#00d4aa] hover:underline"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Region filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => onRegionChange(region)}
                className={cn(
                  "px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-all",
                  selectedRegion === region
                    ? "bg-[#00d4aa] text-[#08090a]"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {region === 'all' ? 'All' : getRegionDisplay(region)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left p-3 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                <button onClick={() => toggleSort('rag')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Status <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-3 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                <button onClick={() => toggleSort('customer')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Operator <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-3 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Engine</th>
              <th className="text-left p-3 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                <button onClick={() => toggleSort('eisDate')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  EIS Date <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-3 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Countdown</th>
              <th className="text-left p-3 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Gate</th>
              <th className="text-right p-3 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((scorecard, idx) => {
              const overallRag = computeOverallRAG(scorecard.ragStatuses)
              const rag = getRAGDisplay(overallRag)
              const days = getDaysUntil(scorecard.eisDate)
              const lastCompletedGate = [...scorecard.gateReviews]
                .reverse()
                .find(g => g.outcome === 'Passed')?.gateNumber || 0
              const engineColor = engineColors[scorecard.engineType] || '#57606f'

              return (
                <tr
                  key={scorecard.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors group"
                >
                  <td className="p-3">
                    <div
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono font-semibold"
                      style={{ backgroundColor: rag.bg, color: rag.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rag.color }} />
                      {rag.label}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{scorecard.customer}</span>
                      <span className="text-[10px] text-muted-foreground">{getRegionDisplay(scorecard.region)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div
                      className="inline-flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono bg-secondary/50"
                      style={{ borderLeft: `2px solid ${engineColor}` }}
                    >
                      {scorecard.engineType}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm font-mono tabular-nums">
                      {formatEISDate(scorecard.eisDate, scorecard.eisDateTbc)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className={cn(
                      "text-sm font-mono tabular-nums",
                      days !== null && days <= 90 ? "text-[#ff4757]" : days !== null && days <= 180 ? "text-[#ffa502]" : "text-[#2ed573]"
                    )}>
                      {days !== null ? (days > 0 ? `${days}d` : 'PAST') : '—'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map(gate => (
                        <div
                          key={gate}
                          className={cn(
                            "w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold",
                            gate <= lastCompletedGate
                              ? "bg-[#00d4aa] text-[#08090a]"
                              : "bg-secondary/50 text-muted-foreground"
                          )}
                        >
                          {gate}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/airlines/${scorecard.airlineId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-secondary/50 hover:bg-[#00d4aa] hover:text-[#08090a] rounded transition-all opacity-0 group-hover:opacity-100"
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
