"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  Clock,
  XCircle,
  MessageSquare,
  TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/eis/page-header"
import { StatCard } from "@/components/eis/stat-card"
import { RAGBadge } from "@/components/eis/rag-badge"
import { EngineBadge } from "@/components/eis/engine-badge"
import { CountdownTimer } from "@/components/eis/countdown-timer"
import { EmptyState } from "@/components/eis/empty-state"
import { formatDate, computeOverallRAG, cn } from "@/lib/utils"

interface OffPlanProgram {
  airlineId: string
  airlineName: string
  engineType: string
  eisDate: string | null
  eisLeadName: string | null
  scorecardId: string
  redServiceLines: Array<{
    id: string
    serviceLineName: string
    statusText: string | null
    comments: string | null
  }>
}

interface RecentComment {
  airlineId: string
  airlineName: string
  serviceLineName: string
  ragStatus: string
  statusText: string | null
  comments: string | null
  updatedAt: string
}

interface HeatmapRow {
  airlineId: string
  airlineName: string
  engineType: string
  eisDate: string | null
  eisDateTbc: boolean
  eisLeadName: string | null
  region: string
  scorecardId: string
  serviceLines: Array<{
    id: string
    serviceLineId: string
    serviceLineName: string
    ragStatus: string
    statusText: string | null
    comments: string | null
    isDisputed: boolean
  }>
}

interface DashboardClientProps {
  stats: {
    totalActive: number
    atRisk: number
    approachingEis: number
    overdueScorecards: number
  }
  systemStatus: {
    lastSync: string | null
    activePrograms: number
  }
  offPlanPrograms: OffPlanProgram[]
  recentComments: RecentComment[]
  heatmapData: HeatmapRow[]
  notifications: Array<any>
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DashboardClient({
  stats,
  systemStatus,
  offPlanPrograms,
  recentComments,
  heatmapData,
  notifications,
}: DashboardClientProps) {
  const router = useRouter()
  const heatmapPreview = heatmapData.slice(0, 10)

  return (
    <>
      {/* ── Header ── */}
      <PageHeader title="Command Center" description="Portfolio overview and operational status">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              systemStatus.lastSync ? "bg-[#2ed573] animate-pulse" : "bg-[#57606f]"
            )}
          />
          <span className="font-mono text-muted-foreground uppercase tracking-wider">
            {systemStatus.lastSync ? "System Online" : "Offline"}
          </span>
        </div>
      </PageHeader>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Active"
          value={stats.totalActive}
          icon={<Activity className="h-5 w-5" />}
          accentColor="#00d4aa"
        />
        <StatCard
          title="Off Plan"
          value={offPlanPrograms.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="#ff4757"
          onClick={() => router.push("/regional-summary?rag=R")}
        />
        <StatCard
          title="At Risk"
          value={stats.atRisk}
          icon={<XCircle className="h-5 w-5" />}
          accentColor="#ffa502"
        />
        <StatCard
          title="Approaching EIS"
          value={stats.approachingEis}
          icon={<Clock className="h-5 w-5" />}
          accentColor="#70a1ff"
        />
      </div>

      {/* ── Off-Plan Alerts ── */}
      {offPlanPrograms.length > 0 && (
        <section className="bg-card border border-border rounded-lg border-l-4 border-l-[#ff4757] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-[#ff4757]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#ff4757]">
              Off-Plan Alerts
            </h2>
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {offPlanPrograms.length} program{offPlanPrograms.length !== 1 && "s"}
            </span>
          </div>
          <div className="space-y-3">
            {offPlanPrograms.map((program) => (
              <div
                key={program.scorecardId}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm py-2 border-b border-border/40 last:border-0 last:pb-0"
              >
                <Link
                  href={`/airlines/${program.airlineId}`}
                  className="font-medium hover:text-primary transition-colors min-w-[140px]"
                >
                  {program.airlineName}
                </Link>
                <EngineBadge engine={program.engineType} />
                <CountdownTimer eisDate={program.eisDate} />
                <div className="flex flex-wrap gap-1 ml-auto">
                  {program.redServiceLines.map((sl) => (
                    <span
                      key={sl.id}
                      className="text-[11px] rounded bg-[rgba(255,71,87,0.1)] text-[#ff4757] px-1.5 py-0.5"
                    >
                      {sl.serviceLineName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left: Quick Heatmap Preview */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">
                Portfolio Status
              </h2>
            </div>
            <Link
              href="/regional-summary"
              className="text-xs text-primary hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          {heatmapPreview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-2 pr-4">
                      Customer
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-2 pr-4">
                      Engine
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-2 pr-4">
                      EIS Date
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-2">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapPreview.map((row) => {
                    const overallRAG = computeOverallRAG(
                      row.serviceLines.map((sl) => sl.ragStatus)
                    )
                    return (
                      <tr
                        key={row.scorecardId}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 pr-4">
                          <Link
                            href={`/airlines/${row.airlineId}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {row.airlineName}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4">
                          <EngineBadge engine={row.engineType} />
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                          {formatDate(row.eisDate)}
                        </td>
                        <td className="py-2.5">
                          <RAGBadge status={overallRAG} showLabel />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-8 w-8" />}
              title="No active programs"
              description="Active programs will appear here once data is available."
            />
          )}
        </div>

        {/* Right: Recent Comments */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider">
              Recent Comments
            </h2>
          </div>

          {recentComments.length > 0 ? (
            <div className="space-y-0">
              {recentComments.map((comment, idx) => (
                <div
                  key={`${comment.airlineId}-${comment.serviceLineName}-${idx}`}
                  className="py-3 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/airlines/${comment.airlineId}`}
                      className="text-sm font-medium hover:text-primary transition-colors truncate"
                    >
                      {comment.airlineName}
                    </Link>
                    <RAGBadge status={comment.ragStatus} size="sm" />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    {comment.serviceLineName}
                  </p>
                  {comment.comments && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {comment.comments}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-muted-foreground/70 mt-1.5">
                    {timeAgo(comment.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare className="h-8 w-8" />}
              title="No comments yet"
              description="Service line comments will appear here."
            />
          )}
        </div>
      </div>

      {/* ── System Status Bar ── */}
      <div className="flex items-center justify-between py-3 px-4 bg-card border border-border rounded-lg text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                systemStatus.lastSync ? "bg-[#2ed573] animate-pulse" : "bg-[#57606f]"
              )}
            />
            <span className="uppercase tracking-wider">
              {systemStatus.lastSync ? "Online" : "Offline"}
            </span>
          </div>
          <span className="font-mono">
            {systemStatus.activePrograms} active programs
          </span>
        </div>
        {systemStatus.lastSync && (
          <span className="font-mono">
            Last sync: {formatDate(systemStatus.lastSync)}
          </span>
        )}
      </div>
    </>
  )
}
