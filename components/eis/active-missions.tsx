"use client"

import Link from "next/link"
import { computeOverallRAG, getDaysUntil, engineColors } from "@/lib/utils"
import { ArrowRight, Clock } from "lucide-react"

interface ActiveMissionsProps {
  data: Array<{
    id: string
    airlineId: string
    customer: string
    engineType: string
    eisDate: Date | string | null
    ragStatuses: string[]
    gateReviews: Array<{ gateNumber: number; outcome: string | null }>
  }>
}

export function ActiveMissions({ data }: ActiveMissionsProps) {
  const now = new Date()
  const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)

  const urgentPrograms = data
    .filter(s => {
      if (!s.eisDate) return false
      const eisDate = new Date(s.eisDate)
      return eisDate <= sixMonths && eisDate > now
    })
    .sort((a, b) => new Date(a.eisDate!).getTime() - new Date(b.eisDate!).getTime())
    .slice(0, 4)

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return { bg: 'rgba(255, 71, 87, 0.2)', border: '#ff4757', text: '#ff4757' }
    if (days <= 90) return { bg: 'rgba(255, 165, 2, 0.2)', border: '#ffa502', text: '#ffa502' }
    return { bg: 'rgba(0, 212, 170, 0.2)', border: '#00d4aa', text: '#00d4aa' }
  }

  return (
    <div className="instrument-panel rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#ffa502] animate-pulse" />
          <h3 className="text-sm font-semibold">Priority Missions</h3>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
          EIS &lt; 6 Months
        </span>
      </div>

      <div className="space-y-2">
        {urgentPrograms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No urgent programs
          </div>
        ) : (
          urgentPrograms.map((program, idx) => {
            const days = getDaysUntil(program.eisDate)!
            const urgency = getUrgencyColor(days)
            const completedGates = program.gateReviews.filter(g => g.outcome === 'Passed').length

            return (
              <Link
                key={program.id}
                href={`/airlines/${program.airlineId}`}
                className="group block"
              >
                <div
                  className="relative p-3 rounded transition-all duration-300 hover:translate-x-1"
                  style={{
                    backgroundColor: urgency.bg,
                    borderLeft: `3px solid ${urgency.border}`
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium group-hover:text-[#00d4aa] transition-colors">
                        {program.customer}
                      </h4>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {program.engineType}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" style={{ color: urgency.text }} />
                      <span
                        className="text-xs font-mono font-semibold tabular-nums"
                        style={{ color: urgency.text }}
                      >
                        {days}d
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map(gate => (
                        <div
                          key={gate}
                          className="w-2 h-2 rounded-sm"
                          style={{
                            backgroundColor: gate <= completedGates
                              ? '#00d4aa'
                              : 'rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {urgentPrograms.length > 0 && (
        <Link
          href="/airlines"
          className="mt-4 flex items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-[#00d4aa] transition-colors"
        >
          View all programs <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}
