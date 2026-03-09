"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Bell, AlertTriangle, Clock, CheckCircle, X, Filter, Settings, Trash2 } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  scorecard: { airline: { id: string; name: string } } | null
}

interface Props {
  notifications: Notification[]
  initialUnreadCount: number
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  STATUS_DEGRADED: { icon: AlertTriangle, color: '#ff4757', bg: 'rgba(255, 71, 87, 0.1)', label: 'Critical' },
  EIS_APPROACHING: { icon: Clock, color: '#ffa502', bg: 'rgba(255, 165, 2, 0.1)', label: 'Warning' },
  GATE_DUE: { icon: CheckCircle, color: '#2ed573', bg: 'rgba(46, 213, 115, 0.1)', label: 'Gate Due' },
  SCORECARD_OVERDUE: { icon: Bell, color: '#70a1ff', bg: 'rgba(112, 161, 255, 0.1)', label: 'Info' },
}

const alertSettingsDefs = [
  { key: 'eisApproaching', label: 'EIS Approaching (90 days)', type: 'EIS_APPROACHING' },
  { key: 'criticalStatus', label: 'Critical Status Changes', type: 'STATUS_DEGRADED' },
  { key: 'scorecardReminders', label: 'Scorecard Update Reminders', type: 'SCORECARD_OVERDUE' },
  { key: 'gateDue', label: 'Gate Review Due', type: 'GATE_DUE' },
] as const

function AlertSettingsPanel() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    eisApproaching: true,
    criticalStatus: true,
    scorecardReminders: true,
    gateDue: false,
  })

  const toggle = (key: string) => setSettings(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="instrument-panel rounded p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Alert Settings</h3>
      </div>
      <div className="space-y-3">
        {alertSettingsDefs.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{setting.label}</span>
            <button onClick={() => toggle(setting.key)}
              className={cn("w-8 h-4 rounded-full transition-colors relative", settings[setting.key] ? "bg-[#00d4aa]" : "bg-secondary")}>
              <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", settings[setting.key] ? "left-4" : "left-0.5")} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotificationsClient({ notifications: initial, initialUnreadCount }: Props) {
  const [notifications, setNotifications] = useState(initial)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'critical') return n.type === 'STATUS_DEGRADED'
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const criticalCount = notifications.filter(n => n.type === 'STATUS_DEGRADED').length

  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id))
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  const clearAll = () => setNotifications([])

  return (
    <>
      <header className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">Alert Center</p>
        <h1 className="text-3xl font-light tracking-tight"><span className="text-gradient font-semibold">Notifications</span></h1>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Filter bar */}
          <div className="instrument-panel rounded p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-muted-foreground" />
                <div className="flex gap-1">
                  {(['all', 'unread', 'critical'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={cn("px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all",
                        filter === f
                          ? (f === 'critical' ? "bg-[#ff4757] text-white" : "bg-[#00d4aa] text-[#08090a]")
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      )}>
                      {f === 'all' ? `All (${notifications.length})` : f === 'unread' ? `Unread (${unreadCount})` : `Critical (${criticalCount})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAllRead} className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Mark All Read</button>
                <button onClick={clearAll} className="p-1.5 text-muted-foreground hover:text-[#ff4757] transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Notification list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="instrument-panel rounded p-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground">{filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}</p>
              </div>
            ) : filtered.map(n => {
              const config = typeConfig[n.type] || typeConfig.SCORECARD_OVERDUE
              const Icon = config.icon
              const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
              return (
                <div key={n.id} className={cn("instrument-panel rounded p-4 transition-all duration-200 cursor-pointer group", !n.isRead && "border-l-2")}
                  style={{ borderLeftColor: !n.isRead ? config.color : 'transparent' }} onClick={() => markRead(n.id)}>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: config.bg }}>
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={cn("text-sm font-semibold", n.isRead && "text-muted-foreground")}>{n.title}</h4>
                          {n.scorecard?.airline && <p className="text-xs font-mono mt-0.5" style={{ color: config.color }}>{n.scorecard.airline.name}</p>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); dismiss(n.id) }} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary rounded">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 mt-2">{timeAgo}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="instrument-panel rounded p-4">
            <h3 className="text-sm font-semibold mb-4">Summary</h3>
            <div className="space-y-3">
              {Object.entries(typeConfig).map(([type, config]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold" style={{ color: config.color }}>
                    {notifications.filter(n => n.type === type).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <AlertSettingsPanel />
        </div>
      </div>
    </>
  )
}
