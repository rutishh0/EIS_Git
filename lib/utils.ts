import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Region enum to display name
export const regionDisplay: Record<string, string> = {
  EUROPE: "Europe",
  MEA: "MEA",
  GREATER_CHINA: "Greater China",
  AFRICA: "Africa",
  APAC: "APAC",
  AMERICAS: "Americas",
}

export function getRegionDisplay(region: string): string {
  return regionDisplay[region] || region
}

// Compute overall RAG from array of statuses: R > A > G > C
export function computeOverallRAG(ragStatuses: string[]): string {
  if (ragStatuses.includes("R")) return "R"
  if (ragStatuses.includes("A")) return "A"
  if (ragStatuses.every((s) => s === "C" || s === "NA")) return "C"
  return "G"
}

// Format date for display
export function formatEISDate(date: Date | string | null, tbc?: boolean): string {
  if (tbc) return "TBC"
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// Days until a date from now
export function getDaysUntil(date: Date | string | null): number | null {
  if (!date) return null
  const d = typeof date === "string" ? new Date(date) : date
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// Engine type to color mapping
export const engineColors: Record<string, string> = {
  "Trent XWB-97": "#00d4aa",
  "Trent XWB-84": "#70a1ff",
  "Trent XWB-84 EP": "#a29bfe",
  "Trent 7000": "#ffa502",
  "Trent 700": "#ff6b81",
  "Trent 1000": "#2ed573",
}

// RAG status display config
export function getRAGDisplay(rag: string) {
  const config: Record<string, { color: string; label: string; bg: string }> = {
    R: { color: "#ff4757", label: "CRITICAL", bg: "rgba(255, 71, 87, 0.15)" },
    A: { color: "#ffa502", label: "AT RISK", bg: "rgba(255, 165, 2, 0.15)" },
    G: { color: "#2ed573", label: "ON TRACK", bg: "rgba(46, 213, 115, 0.15)" },
    C: { color: "#00d4aa", label: "COMPLETE", bg: "rgba(0, 212, 170, 0.15)" },
    NA: { color: "#57606f", label: "N/A", bg: "rgba(87, 96, 111, 0.15)" },
  }
  return config[rag] || config["NA"]
}
