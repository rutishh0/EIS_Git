"use client"

import { Check } from "lucide-react"
import { getRAGDisplay } from "@/lib/utils"

interface RAGBadgeProps {
  status: string
  showLabel?: boolean
  size?: "sm" | "md"
}

export function RAGBadge({ status, showLabel = false, size = "md" }: RAGBadgeProps) {
  const { color, label, bg } = getRAGDisplay(status)

  const isComplete = status === "C"
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
  const textSize = size === "sm" ? "text-xs" : "text-sm"
  const checkSize = size === "sm" ? 8 : 10

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${textSize}`}
      style={{ backgroundColor: isComplete ? "transparent" : bg, border: isComplete ? `1px solid ${color}` : "none" }}
    >
      {isComplete ? (
        <Check size={checkSize} strokeWidth={3} className="shrink-0" style={{ color: "#2ed573" }} />
      ) : (
        <span
          className={`${dotSize} shrink-0 rounded-full`}
          style={{ backgroundColor: color }}
        />
      )}
      {showLabel && (
        <span className="font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </span>
  )
}
