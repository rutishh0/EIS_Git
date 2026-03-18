"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/eis/page-header"
import { EmptyState } from "@/components/eis/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle, Bell, Calendar, CheckCircle, Clock, Edit,
  Eye, Shield, Trash2, XCircle, ExternalLink
} from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  isDismissed: boolean
  createdAt: string
  scorecard?: {
    id: string
    airlineId: string
    airline: { name: string }
  } | null
}

interface AlertsClientProps {
  notifications: Notification[]
  unreadCount: number
}

type FilterTab = "all" | "unread" | "off_plan" | "disputes" | "eis_approaching"

const TYPE_CONFIG: Record<string, {
  icon: typeof Bell
  color: string
  bg: string
  label: string
}> = {
  OFF_PLAN:          { icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-500/10",    label: "Off Plan" },
  PAST_EIS:          { icon: Clock,         color: "text-amber-500",  bg: "bg-amber-500/10",  label: "Past EIS" },
  DISPUTE_RAISED:    { icon: Shield,        color: "text-orange-500", bg: "bg-orange-500/10", label: "Dispute Raised" },
  DISPUTE_RESOLVED:  { icon: CheckCircle,   color: "text-green-500",  bg: "bg-green-500/10",  label: "Dispute Resolved" },
  EIS_APPROACHING:   { icon: Calendar,      color: "text-blue-500",   bg: "bg-blue-500/10",   label: "EIS Approaching" },
  SCORECARD_UPDATED: { icon: Edit,          color: "text-teal-500",   bg: "bg-teal-500/10",   label: "Scorecard Updated" },
  SCORECARD_OVERDUE: { icon: XCircle,       color: "text-red-500",    bg: "bg-red-500/10",    label: "Scorecard Overdue" },
  STATUS_DEGRADED:   { icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-500/10",    label: "Status Degraded" },
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",             label: "All" },
  { key: "unread",          label: "Unread" },
  { key: "off_plan",        label: "Off Plan" },
  { key: "disputes",        label: "Disputes" },
  { key: "eis_approaching", label: "EIS Approaching" },
]

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: Bell, color: "text-muted-foreground", bg: "bg-muted", label: type }
}

function filterNotifications(items: Notification[], tab: FilterTab): Notification[] {
  switch (tab) {
    case "unread":
      return items.filter((n) => !n.isRead)
    case "off_plan":
      return items.filter((n) => n.type === "OFF_PLAN")
    case "disputes":
      return items.filter((n) => n.type === "DISPUTE_RAISED" || n.type === "DISPUTE_RESOLVED")
    case "eis_approaching":
      return items.filter((n) => n.type === "EIS_APPROACHING")
    default:
      return items
  }
}

export function AlertsClient({ notifications, unreadCount }: AlertsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)

  const visible = notifications.filter((n) => !n.isDismissed)
  const filtered = filterNotifications(visible, activeTab)

  const offPlanCount = visible.filter((n) => n.type === "OFF_PLAN").length
  const disputeCount = visible.filter((n) => n.type === "DISPUTE_RAISED" || n.type === "DISPUTE_RESOLVED").length

  async function patchNotification(body: Record<string, unknown>) {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Request failed")
    }
    return res.json()
  }

  async function handleMarkRead(id: string) {
    setLoadingIds((prev) => new Set(prev).add(id))
    try {
      await patchNotification({ id, read: true })
      router.refresh()
      toast.success("Marked as read")
    } catch {
      toast.error("Failed to mark as read")
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleDismiss(id: string) {
    setLoadingIds((prev) => new Set(prev).add(id))
    try {
      await patchNotification({ id, dismissed: true })
      router.refresh()
      toast.success("Notification dismissed")
    } catch {
      toast.error("Failed to dismiss")
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      await patchNotification({ markAllRead: true })
      router.refresh()
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Failed to mark all as read")
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Review and manage system notifications">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {markingAll ? "Marking…" : "Mark All Read"}
        </Button>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Unread"
          count={unreadCount}
          icon={<Bell className="h-5 w-5 text-blue-500" />}
          accent="border-blue-500/40"
        />
        <SummaryCard
          label="Off-Plan Alerts"
          count={offPlanCount}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          accent="border-red-500/40"
        />
        <SummaryCard
          label="Disputes"
          count={disputeCount}
          icon={<Shield className="h-5 w-5 text-orange-500" />}
          accent="border-orange-500/40"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => {
          const count = filterNotifications(visible, tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {tab.label}
              <Badge
                variant={activeTab === tab.key ? "secondary" : "outline"}
                className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5 text-xs"
              >
                {count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="No notifications"
          description={
            activeTab === "all"
              ? "You're all caught up — no alerts to show."
              : `No ${FILTER_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} notifications right now.`
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const config = getConfig(n.type)
            const Icon = config.icon
            const isLoading = loadingIds.has(n.id)
            const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })

            return (
              <div
                key={n.id}
                className={cn(
                  "group relative rounded-lg border p-4 transition-colors",
                  !n.isRead
                    ? "border-l-4 border-l-primary bg-accent/30"
                    : "border-border bg-card"
                )}
              >
                <div className="flex gap-4">
                  {/* Type icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "truncate text-sm",
                              !n.isRead ? "font-semibold" : "font-medium text-muted-foreground"
                            )}
                          >
                            {n.title}
                          </h4>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        {n.scorecard?.airline && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {n.scorecard.airline.name}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo}</span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>

                    {/* Action row */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {/* Scorecard link */}
                      {n.scorecard && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/scorecards/${n.scorecard.id}`}>
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            View Scorecard
                          </Link>
                        </Button>
                      )}

                      {/* Dispute-specific action */}
                      {n.type === "DISPUTE_RAISED" && n.scorecard && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/scorecards/${n.scorecard.id}`}>
                            <Shield className="mr-1.5 h-3.5 w-3.5" />
                            Review Dispute
                          </Link>
                        </Button>
                      )}

                      {/* Off-Plan-specific action */}
                      {n.type === "OFF_PLAN" && n.scorecard && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/scorecards/${n.scorecard.id}`}>
                            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                            View Program
                          </Link>
                        </Button>
                      )}

                      {/* Past-EIS-specific actions */}
                      {n.type === "PAST_EIS" && n.scorecard && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/scorecards/${n.scorecard.id}`}>
                              <Edit className="mr-1.5 h-3.5 w-3.5" />
                              Update Scorecard
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/scorecards/${n.scorecard.id}`}>
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />
                              Close Scorecard
                            </Link>
                          </Button>
                        </>
                      )}

                      <div className="ml-auto flex items-center gap-1">
                        {!n.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkRead(n.id)}
                            disabled={isLoading}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(n.id)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  count,
  icon,
  accent,
}: {
  label: string
  count: number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className={cn("rounded-lg border-l-4 bg-card p-4", accent)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{count}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}
