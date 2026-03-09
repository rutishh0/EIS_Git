"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Clock, History, Search, Filter, Edit, Plus, Trash2, Shield, FileSpreadsheet, ArrowRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AuditLog {
  id: string
  user: string
  airline: string
  action: string
  fieldChanged: string | null
  oldValue: string | null
  newValue: string | null
  changedAt: string
}

interface Props {
  logs: AuditLog[]
  page: number
  totalPages: number
  total: number
}

const actionConfig: Record<string, { icon: typeof Edit; color: string; bg: string; label: string }> = {
  update: { icon: Edit, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Update" },
  create: { icon: Plus, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Create" },
  delete: { icon: Trash2, color: "text-red-400", bg: "bg-red-500/10", label: "Delete" },
  import: { icon: FileSpreadsheet, color: "text-amber-400", bg: "bg-amber-500/10", label: "Import" },
  role_change: { icon: Shield, color: "text-violet-400", bg: "bg-violet-500/10", label: "Role Change" },
}

const filterOptions = [
  { value: "all", label: "All" },
  { value: "update", label: "Updates" },
  { value: "create", label: "Creates" },
  { value: "delete", label: "Deletes" },
  { value: "import", label: "Imports" },
]

export function AdminAuditClient({ logs, page, totalPages, total }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const filtered = logs.filter(log => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      if (!log.user.toLowerCase().includes(search) && !log.airline.toLowerCase().includes(search) && !(log.fieldChanged || '').toLowerCase().includes(search)) return false
    }
    if (actionFilter !== "all" && log.action !== actionFilter) return false
    return true
  })

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return {
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const updateCount = logs.filter(l => l.action === "update").length
  const createCount = logs.filter(l => l.action === "create").length
  const importCount = logs.filter(l => l.action === "import").length

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground">Command</Link><span>/</span><span className="text-foreground">Audit Log</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete history of all system changes</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Events", value: total, color: "text-foreground" },
          { label: "Updates", value: updateCount, color: "text-cyan-400" },
          { label: "Creates", value: createCount, color: "text-emerald-400" },
          { label: "Imports", value: importCount, color: "text-amber-400" },
        ].map(stat => (
          <div key={stat.label} className="instrument-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</div>
            <div className={cn("text-2xl font-mono font-semibold", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="instrument-panel p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by user, target, or field..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
              {filterOptions.map(option => (
                <button key={option.value} onClick={() => setActionFilter(option.value)}
                  className={cn("px-3 py-1.5 text-xs rounded transition-colors",
                    actionFilter === option.value ? "bg-[#00d4aa] text-[#08090a]" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}>{option.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Showing <span className="text-foreground font-medium">{filtered.length}</span> of <span className="text-foreground font-medium">{total}</span> entries</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="instrument-panel overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2"><History className="w-4 h-4 text-muted-foreground" /> Activity Timeline</h3>
        </div>
        <div className="relative px-4 py-6">
          <div className="absolute left-9 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {filtered.map(log => {
              const config = actionConfig[log.action] || actionConfig.update
              const ActionIcon = config.icon
              const { date, time } = formatTimestamp(log.changedAt)
              const initials = log.user.split(" ").map(n => n[0]).join("")
              return (
                <div key={log.id} className="relative flex gap-4">
                  <div className={cn("relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border", config.bg)}>
                    <ActionIcon className={cn("w-5 h-5", config.color)} />
                  </div>
                  <div className="flex-1 bg-secondary/30 rounded-lg p-4 border border-border/50">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-card flex items-center justify-center text-xs font-medium border border-border">{initials}</div>
                        <div>
                          <p className="font-medium">{log.user}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-xs px-2 py-0.5 rounded", config.bg, config.color)}>{config.label}</span>
                            <span className="text-sm text-muted-foreground">{log.airline}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Clock className="w-3 h-3" /> <span>{date}</span> <span className="text-muted-foreground/50">at</span> <span>{time}</span>
                      </div>
                    </div>
                    {log.fieldChanged && (
                      <div className="mt-3 p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Changed: <span className="text-foreground">{log.fieldChanged}</span></p>
                        <div className="flex items-center gap-2">
                          {log.oldValue && <span className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20">{log.oldValue}</span>}
                          {log.oldValue && log.newValue && <ArrowRight className="w-4 h-4 text-muted-foreground/50" />}
                          {log.newValue && <span className="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{log.newValue}</span>}
                        </div>
                      </div>
                    )}
                    {!log.fieldChanged && (log.oldValue || log.newValue) && <p className="mt-2 text-sm text-muted-foreground">{log.oldValue || log.newValue}</p>}
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No logs match your search criteria</p>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-center gap-2">
            {page > 1 && <Link href={`/admin/audit-log?page=${page - 1}`}><Button variant="outline" size="sm" className="border-border text-muted-foreground">Previous</Button></Link>}
            <span className="text-sm text-muted-foreground flex items-center px-3">Page {page} of {totalPages}</span>
            {page < totalPages && <Link href={`/admin/audit-log?page=${page + 1}`}><Button variant="outline" size="sm" className="border-border text-muted-foreground">Next</Button></Link>}
          </div>
        )}
      </div>
    </>
  )
}
