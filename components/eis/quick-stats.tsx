"use client"

import { Plane, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"

interface QuickStatsProps {
  totalActive: number
  atRisk: number
  approachingEis: number
  overdueScorecards: number
}

export function QuickStats({ totalActive, atRisk, approachingEis, overdueScorecards }: QuickStatsProps) {
  const stats = [
    {
      label: "Active Programs",
      value: totalActive,
      subtext: "In Progress",
      icon: Plane,
      color: "#00d4aa",
      bgGlow: "rgba(0, 212, 170, 0.1)",
    },
    {
      label: "At Risk",
      value: atRisk,
      subtext: "Require Attention",
      icon: AlertTriangle,
      color: "#ffa502",
      bgGlow: "rgba(255, 165, 2, 0.1)",
    },
    {
      label: "EIS < 6 Months",
      value: approachingEis,
      subtext: "Approaching",
      icon: Clock,
      color: "#70a1ff",
      bgGlow: "rgba(112, 161, 255, 0.1)",
    },
    {
      label: "Overdue Updates",
      value: overdueScorecards,
      subtext: "> 30 Days",
      icon: CheckCircle2,
      color: "#ff4757",
      bgGlow: "rgba(255, 71, 87, 0.1)",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className="group relative instrument-panel rounded p-4 hover:border-[#00d4aa]/30 transition-all duration-300 overflow-hidden"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {/* Background glow effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(ellipse at center, ${stat.bgGlow}, transparent 70%)` }}
          />

          <div className="relative z-10">
            {/* Icon and label row */}
            <div className="flex items-center justify-between mb-3">
              <stat.icon
                className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ color: stat.color }}
              />
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                {stat.subtext}
              </span>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-light tabular-nums tracking-tight"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
            </div>

            {/* Label */}
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {stat.label}
            </p>
          </div>

          {/* Corner accent */}
          <div
            className="absolute top-0 right-0 w-8 h-8 opacity-20"
            style={{
              background: `linear-gradient(135deg, transparent 50%, ${stat.color} 50%)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
