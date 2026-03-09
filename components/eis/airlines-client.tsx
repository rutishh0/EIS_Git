"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  cn,
  computeOverallRAG,
  getRAGDisplay,
  formatEISDate,
  getDaysUntil,
  engineColors,
  getRegionDisplay,
} from "@/lib/utils"
import {
  Search,
  LayoutGrid,
  List,
  Plane,
  Clock,
  ChevronRight,
  Filter,
  MapPin,
  User,
  Shield,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Airline {
  id: string
  name: string
  region: string
  engineType: string
  eisDate: string | null
  eisDateTbc: boolean
  eisRisk: string
  eisLead: string
  status: string
  lastUpdatedAt: string
  ragStatuses: string[]
  gateReviews: Array<{ gateNumber: number; outcome: string | null }>
}

interface AirlinesClientProps {
  airlines: Airline[]
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const regions = [
  { value: "all", label: "All" },
  { value: "EUROPE", label: getRegionDisplay("EUROPE") },
  { value: "MEA", label: getRegionDisplay("MEA") },
  { value: "GREATER_CHINA", label: getRegionDisplay("GREATER_CHINA") },
  { value: "APAC", label: getRegionDisplay("APAC") },
  { value: "AMERICAS", label: getRegionDisplay("AMERICAS") },
]

const statuses = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
  { value: "ON_HOLD", label: "On Hold" },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AirlinesClient({ airlines }: AirlinesClientProps) {
  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  /* Filtered + searched data */
  const filtered = useMemo(() => {
    return airlines.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase())
      const matchesRegion = regionFilter === "all" || a.region === regionFilter
      const matchesStatus = statusFilter === "all" || a.status === statusFilter
      return matchesSearch && matchesRegion && matchesStatus
    })
  }, [airlines, search, regionFilter, statusFilter])

  /* Summary counts */
  const activeCount = airlines.filter((a) => a.status === "ACTIVE").length
  const atRiskCount = airlines.filter(
    (a) => computeOverallRAG(a.ragStatuses) === "R" || computeOverallRAG(a.ragStatuses) === "A"
  ).length

  return (
    <>
      {/* Page header */}
      <header className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
          Fleet Management
        </p>
        <div className="flex items-end justify-between">
          <h1 className="text-4xl font-light tracking-tight">
            Airline <span className="text-gradient font-semibold">Programs</span>
          </h1>
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            <span>
              TOTAL: <span className="text-foreground">{airlines.length}</span>
            </span>
            <span>
              ACTIVE: <span className="text-[#2ed573]">{activeCount}</span>
            </span>
            <span>
              AT RISK: <span className="text-[#ffa502]">{atRiskCount}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Controls bar */}
      <div className="instrument-panel rounded p-4 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search airline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border/50 rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#00d4aa]/50 focus:ring-1 focus:ring-[#00d4aa]/20 transition-all"
            />
          </div>

          {/* Region filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {regions.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRegionFilter(r.value)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-all",
                    regionFilter === r.value
                      ? "bg-[#00d4aa] text-[#08090a]"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-muted-foreground shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-all",
                    statusFilter === s.value
                      ? "bg-[#00d4aa] text-[#08090a]"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded transition-all",
                viewMode === "grid"
                  ? "bg-[#00d4aa] text-[#08090a]"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded transition-all",
                viewMode === "list"
                  ? "bg-[#00d4aa] text-[#08090a]"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="mt-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Showing {filtered.length} of {airlines.length} programs
        </p>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="instrument-panel rounded p-16 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
            <Plane className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground">No programs found</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {search || regionFilter !== "all" || statusFilter !== "all"
              ? "No airlines match your current filters. Try adjusting your search criteria."
              : "Import data or create a new airline scorecard to get started."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ============== GRID VIEW ============== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((airline) => (
            <AirlineCard key={airline.id} airline={airline} />
          ))}
        </div>
      ) : (
        /* ============== LIST VIEW ============== */
        <div className="space-y-2">
          {filtered.map((airline) => (
            <AirlineRow key={airline.id} airline={airline} />
          ))}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Grid Card                                                          */
/* ------------------------------------------------------------------ */

function AirlineCard({ airline }: { airline: Airline }) {
  const overallRag = computeOverallRAG(airline.ragStatuses)
  const rag = getRAGDisplay(overallRag)
  const days = getDaysUntil(airline.eisDate)
  const engineColor = engineColors[airline.engineType] || "#57606f"
  const lastCompletedGate =
    [...airline.gateReviews].reverse().find((g) => g.outcome === "Passed")?.gateNumber || 0

  const statusColor =
    airline.status === "ACTIVE"
      ? "#2ed573"
      : airline.status === "ON_HOLD"
      ? "#ffa502"
      : "#57606f"

  return (
    <Link href={`/airlines/${airline.id}`} className="group block">
      <div className="relative instrument-panel rounded overflow-hidden hover:border-[#00d4aa]/30 transition-all duration-300">
        {/* Top accent line using engine color */}
        <div className="h-[2px]" style={{ background: engineColor }} />

        <div className="p-4">
          {/* Header: name + RAG badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Engine icon circle */}
              <div
                className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${engineColor}15`, border: `1px solid ${engineColor}40` }}
              >
                <Plane className="w-4 h-4" style={{ color: engineColor }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate group-hover:text-[#00d4aa] transition-colors">
                  {airline.name}
                </h3>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {airline.engineType}
                </p>
              </div>
            </div>

            {/* RAG badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono font-semibold shrink-0"
              style={{ backgroundColor: rag.bg, color: rag.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: rag.color }}
              />
              {rag.label}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
            {/* EIS Date */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono tabular-nums text-secondary-foreground">
                {formatEISDate(airline.eisDate, airline.eisDateTbc)}
              </span>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">T-</span>
              <span
                className={cn(
                  "text-xs font-mono font-semibold tabular-nums",
                  days !== null && days <= 90
                    ? "text-[#ff4757]"
                    : days !== null && days <= 180
                    ? "text-[#ffa502]"
                    : "text-[#2ed573]"
                )}
              >
                {days !== null ? (days > 0 ? `${days}d` : "PAST") : "---"}
              </span>
            </div>

            {/* Region */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-secondary-foreground">
                {getRegionDisplay(airline.region)}
              </span>
            </div>

            {/* Lead */}
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-secondary-foreground truncate">{airline.eisLead}</span>
            </div>
          </div>

          {/* Bottom bar: gate progress + status */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            {/* Gate progress */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-muted-foreground mr-1">GATE</span>
              {[1, 2, 3, 4, 5, 6].map((gate) => (
                <div
                  key={gate}
                  className={cn(
                    "w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-colors",
                    gate <= lastCompletedGate
                      ? "bg-[#00d4aa] text-[#08090a]"
                      : "bg-secondary/50 text-muted-foreground"
                  )}
                >
                  {gate}
                </div>
              ))}
            </div>

            {/* Status pill */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              {airline.status === "ON_HOLD" ? "HOLD" : airline.status}
            </div>
          </div>
        </div>

        {/* Hover arrow */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-[#00d4aa]" />
        </div>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  List Row                                                           */
/* ------------------------------------------------------------------ */

function AirlineRow({ airline }: { airline: Airline }) {
  const overallRag = computeOverallRAG(airline.ragStatuses)
  const rag = getRAGDisplay(overallRag)
  const days = getDaysUntil(airline.eisDate)
  const engineColor = engineColors[airline.engineType] || "#57606f"
  const lastCompletedGate =
    [...airline.gateReviews].reverse().find((g) => g.outcome === "Passed")?.gateNumber || 0

  const statusColor =
    airline.status === "ACTIVE"
      ? "#2ed573"
      : airline.status === "ON_HOLD"
      ? "#ffa502"
      : "#57606f"

  return (
    <Link href={`/airlines/${airline.id}`} className="group block">
      <div className="instrument-panel rounded hover:border-[#00d4aa]/30 transition-all duration-300 px-4 py-3">
        <div className="flex items-center gap-4">
          {/* RAG indicator */}
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono font-semibold shrink-0 w-24 justify-center"
            style={{ backgroundColor: rag.bg, color: rag.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: rag.color }}
            />
            {rag.label}
          </div>

          {/* Engine icon + name */}
          <div className="flex items-center gap-3 min-w-0 w-56 shrink-0">
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${engineColor}15`, border: `1px solid ${engineColor}40` }}
            >
              <Plane className="w-3.5 h-3.5" style={{ color: engineColor }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium truncate group-hover:text-[#00d4aa] transition-colors">
                {airline.name}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                {airline.engineType}
              </p>
            </div>
          </div>

          {/* Region */}
          <div className="hidden md:flex items-center gap-1.5 w-28 shrink-0">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-secondary-foreground">
              {getRegionDisplay(airline.region)}
            </span>
          </div>

          {/* EIS Date */}
          <div className="hidden lg:flex items-center gap-1.5 w-32 shrink-0">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-mono tabular-nums text-secondary-foreground">
              {formatEISDate(airline.eisDate, airline.eisDateTbc)}
            </span>
          </div>

          {/* Countdown */}
          <div className="hidden lg:block w-16 shrink-0">
            <span
              className={cn(
                "text-xs font-mono font-semibold tabular-nums",
                days !== null && days <= 90
                  ? "text-[#ff4757]"
                  : days !== null && days <= 180
                  ? "text-[#ffa502]"
                  : "text-[#2ed573]"
              )}
            >
              {days !== null ? (days > 0 ? `T-${days}d` : "PAST") : "---"}
            </span>
          </div>

          {/* Gate progress */}
          <div className="hidden xl:flex items-center gap-0.5 shrink-0">
            {[1, 2, 3, 4, 5, 6].map((gate) => (
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

          {/* Status */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              {airline.status === "ON_HOLD" ? "HOLD" : airline.status}
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-[#00d4aa] transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}
