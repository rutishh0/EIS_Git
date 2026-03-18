"use client"

import { engineColors } from "@/lib/utils"

interface EngineBadgeProps {
  engine: string
}

export function EngineBadge({ engine }: EngineBadgeProps) {
  const color = engineColors[engine] || "#57606f"

  return (
    <span
      className="inline-flex items-center bg-secondary text-xs rounded px-2 py-0.5 border-l-2"
      style={{ borderLeftColor: color }}
    >
      {engine}
    </span>
  )
}
