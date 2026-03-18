import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export function computeOverallRAG(ragStatuses: string[]): string {
  if (ragStatuses.includes("R")) return "R"
  if (ragStatuses.includes("A")) return "A"
  if (ragStatuses.every((s) => s === "C" || s === "NA")) return "C"
  return "G"
}

export function formatEISDate(date: Date | string | null, tbc?: boolean): string {
  if (tbc) return "TBC"
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function getDaysUntil(date: Date | string | null): number | null {
  if (!date) return null
  const d = typeof date === "string" ? new Date(date) : date
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export const engineColors: Record<string, string> = {
  "Trent XWB-97": "#00d4aa",
  "Trent XWB-84": "#70a1ff",
  "Trent XWB-84 EP": "#a29bfe",
  "Trent 7000": "#ffa502",
  "Trent 700": "#ff6b81",
  "Trent 1000": "#2ed573",
}

export function getRAGDisplay(rag: string) {
  const config: Record<string, { color: string; label: string; bg: string }> = {
    R: { color: "#ff4757", label: "CRITICAL", bg: "rgba(255, 71, 87, 0.15)" },
    A: { color: "#ffa502", label: "AT RISK", bg: "rgba(255, 165, 2, 0.15)" },
    G: { color: "#2ed573", label: "ON TRACK", bg: "rgba(46, 213, 115, 0.15)" },
    C: { color: "#70a1ff", label: "COMPLETE", bg: "rgba(112, 161, 255, 0.15)" },
    NA: { color: "#57606f", label: "N/A", bg: "rgba(87, 96, 111, 0.15)" },
  }
  return config[rag] || config["NA"]
}

export const SERVICE_LINE_CATEGORIES: Record<string, string[]> = {
  "Contracts": ["Product Agreement", "TotalCare Agreement"],
  "Technical Availability": ["EHM", "DACs/ Lifing Insight", "LRU Management", "LRP Management"],
  "Maintenance": ["IP Tooling", "Spare Engine - Dedicated", "On-Wing Tech Support", "Engine Split"],
  "Customer Support": ["Customer Training", "Field Support", "Airline Facility Readiness", "Flight Ops"],
  "Asset Availability": ["IP Spares", "PAS", "NDSES", "Transportation - Routine", "Transportation - Remote"],
}

export const ALL_ENGINE_TYPES = [
  "Trent XWB-97",
  "Trent XWB-84",
  "Trent XWB-84 EP",
  "Trent 7000",
  "Trent 700",
  "Trent 1000",
] as const

export const ALL_REGIONS = [
  "EUROPE",
  "MEA",
  "APAC",
  "GREATER_CHINA",
  "AMERICAS",
] as const

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function getOffPlanStatus(ragStatuses: string[], eisDate: Date | string | null): { isOffPlan: boolean; daysUntil: number | null } {
  const days = getDaysUntil(eisDate)
  const hasRed = ragStatuses.includes("R")
  const isOffPlan = hasRed && days !== null && days >= 0 && days <= 180
  return { isOffPlan, daysUntil: days }
}

export function isPastEIS(eisDate: Date | string | null, status: string): boolean {
  if (!eisDate) return false
  const days = getDaysUntil(eisDate)
  return days !== null && days < 0 && status === "ACTIVE"
}

export function getCategoryForServiceLine(serviceLineName: string): string | null {
  for (const [category, lines] of Object.entries(SERVICE_LINE_CATEGORIES)) {
    if (lines.includes(serviceLineName)) return category
  }
  return null
}
