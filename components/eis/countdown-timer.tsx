"use client"

import { getDaysUntil } from "@/lib/utils"

interface CountdownTimerProps {
  eisDate: Date | string | null
  eisDateTbc?: boolean
  showOffPlan?: boolean
  ragStatuses?: string[]
}

export function CountdownTimer({
  eisDate,
  eisDateTbc,
  showOffPlan = true,
  ragStatuses,
}: CountdownTimerProps) {
  if (eisDateTbc) {
    return <span className="text-sm text-[#57606f]">TBC</span>
  }

  const days = getDaysUntil(eisDate)

  if (days === null) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-sm font-mono font-semibold text-[#ff4757]">
          {Math.abs(days)}d ago
        </span>
        <span className="rounded-full bg-[rgba(255,71,87,0.15)] px-2 py-0.5 text-xs font-medium text-[#ff4757]">
          PAST EIS
        </span>
      </span>
    )
  }

  const isOffPlan = showOffPlan && ragStatuses?.includes("R")

  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-sm font-mono font-semibold text-[#ff4757]">
          {days}d
        </span>
        {isOffPlan && (
          <span className="rounded-full bg-[rgba(255,71,87,0.15)] px-2 py-0.5 text-xs font-medium text-[#ff4757]">
            OFF PLAN
          </span>
        )}
      </span>
    )
  }

  if (days <= 180) {
    return (
      <span className="text-sm font-mono font-semibold text-[#ffa502]">
        {days}d
      </span>
    )
  }

  return (
    <span className="text-sm font-mono font-semibold text-[#2ed573]">
      {days}d
    </span>
  )
}
