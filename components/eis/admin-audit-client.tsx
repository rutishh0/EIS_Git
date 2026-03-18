"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Clock,
  Edit,
  Plus,
  Trash2,
  Upload as ImportIcon,
  FileText,
  Search,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/eis/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AuditLog {
  id: string
  action: string
  fieldChanged: string | null
  oldValue: string | null
  newValue: string | null
  changedAt: string
  user: { displayName: string }
  scorecard?: { airline: { name: string } } | null
}

interface AdminAuditClientProps {
  logs: AuditLog[]
  page: number
  totalPages: number
  total: number
}

const actionConfig: Record<
  string,
  { icon: typeof Edit; color: string; bg: string; label: string }
> = {
  update: {
    icon: Edit,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    label: "Update",
  },
  create: {
    icon: Plus,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "Create",
  },
  import: {
    icon: ImportIcon,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    label: "Import",
  },
  delete: {
    icon: Trash2,
    color: "text-red-400",
    bg: "bg-red-500/10",
    label: "Delete",
  },
}

function getActionKey(action: string): string {
  const lower = action.toLowerCase()
  if (lower.includes("import")) return "import"
  if (lower.includes("create")) return "create"
  if (lower.includes("delete")) return "delete"
  if (lower.includes("update")) return "update"
  return "update"
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return {
    date: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

export function AdminAuditClient({
  logs,
  page,
  totalPages,
  total,
}: AdminAuditClientProps) {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const filtered = logs.filter((log) => {
    const key = getActionKey(log.action)
    if (actionFilter !== "all" && key !== actionFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const user = log.user.displayName.toLowerCase()
      const airline = (log.scorecard?.airline?.name || "").toLowerCase()
      const field = (log.fieldChanged || "").toLowerCase()
      if (!user.includes(q) && !airline.includes(q) && !field.includes(q))
        return false
    }
    return true
  })

  const updateCount = logs.filter(
    (l) => getActionKey(l.action) === "update"
  ).length
  const createCount = logs.filter(
    (l) => getActionKey(l.action) === "create"
  ).length
  const importCount = logs.filter(
    (l) => getActionKey(l.action) === "import"
  ).length

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Complete history of all system changes"
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Entries",
            value: total,
            color: "text-foreground",
          },
          {
            label: "Updates",
            value: updateCount,
            color: "text-blue-400",
          },
          {
            label: "Creates",
            value: createCount,
            color: "text-emerald-400",
          },
          {
            label: "Imports",
            value: importCount,
            color: "text-purple-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                s.color
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by user, airline, or field…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="update">Updates</SelectItem>
            <SelectItem value="create">Creates</SelectItem>
            <SelectItem value="import">Imports</SelectItem>
            <SelectItem value="delete">Deletes</SelectItem>
          </SelectContent>
        </Select>
        <p className="ml-auto text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filtered.length}
          </span>{" "}
          of <span className="font-medium text-foreground">{total}</span>{" "}
          entries
        </p>
      </div>

      {/* Timeline */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Activity Timeline</h3>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No logs match your criteria
            </p>
          </div>
        ) : (
          <div className="relative px-4 py-6">
            <div className="absolute bottom-0 left-9 top-0 w-px bg-border" />
            <div className="space-y-4">
              {filtered.map((log) => {
                const key = getActionKey(log.action)
                const config = actionConfig[key] || actionConfig.update
                const ActionIcon = config.icon
                const { date, time } = formatTimestamp(log.changedAt)
                const initials = log.user.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                const airline = log.scorecard?.airline?.name

                return (
                  <div key={log.id} className="relative flex gap-4">
                    <div
                      className={cn(
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border",
                        config.bg
                      )}
                    >
                      <ActionIcon
                        className={cn("h-5 w-5", config.color)}
                      />
                    </div>
                    <div className="flex-1 rounded-lg border border-border/50 bg-secondary/30 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-xs font-medium">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium">
                              {log.user.displayName}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  config.bg,
                                  config.color
                                )}
                              >
                                {config.label}
                              </Badge>
                              {airline && (
                                <span className="text-sm text-muted-foreground">
                                  {airline}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {date} at {time}
                        </div>
                      </div>

                      {log.fieldChanged && (
                        <div className="mt-3 rounded-lg bg-background/50 p-3">
                          <p className="mb-2 text-xs text-muted-foreground">
                            Field:{" "}
                            <span className="text-foreground">
                              {log.fieldChanged}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {log.oldValue && (
                              <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-400">
                                {log.oldValue}
                              </span>
                            )}
                            {log.oldValue && log.newValue && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                            )}
                            {log.newValue && (
                              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                                {log.newValue}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {!log.fieldChanged &&
                        (log.oldValue || log.newValue) && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {log.oldValue || log.newValue}
                          </p>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-border p-4">
            {page > 1 ? (
              <Link href={`/admin/audit-log?page=${page - 1}`}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            <span className="tabular-nums text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={`/admin/audit-log?page=${page + 1}`}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
