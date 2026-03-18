"use client"

import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: "up" | "down" | "neutral"
  accentColor?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  accentColor,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 flex items-start gap-4",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors"
      )}
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : undefined}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick() } : undefined}
    >
      <div className="shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono">{value}</span>
          {trend && trend !== "neutral" && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-[#2ed573]",
                trend === "down" && "text-[#ff4757]"
              )}
            >
              {trend === "up" ? "▲" : "▼"}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}
