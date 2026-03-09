"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Bell, AlertTriangle, Clock, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: Date | string
  scorecard: {
    airline: { id: string; name: string }
  } | null
}

interface AlertsPanelProps {
  notifications: Notification[]
}

export function AlertsPanel({ notifications }: AlertsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [markedRead, setMarkedRead] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const visibleNotifications = notifications
    .filter(n => !dismissed.has(n.id))
    .slice(0, 5)

  const filteredNotifications = filter === 'unread'
    ? visibleNotifications.filter(n => !n.isRead && !markedRead.has(n.id))
    : visibleNotifications

  const unreadCount = visibleNotifications.filter(n => !n.isRead && !markedRead.has(n.id)).length

  const dismissAlert = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
  }

  const markAsRead = (id: string) => {
    setMarkedRead(prev => new Set(prev).add(id))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'STATUS_DEGRADED': return AlertTriangle
      case 'EIS_APPROACHING': return Clock
      case 'GATE_DUE': return CheckCircle
      default: return Bell
    }
  }

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'STATUS_DEGRADED': return { bg: 'rgba(255, 71, 87, 0.1)', border: '#ff4757', icon: '#ff4757' }
      case 'EIS_APPROACHING': return { bg: 'rgba(255, 165, 2, 0.1)', border: '#ffa502', icon: '#ffa502' }
      case 'GATE_DUE': return { bg: 'rgba(46, 213, 115, 0.1)', border: '#2ed573', icon: '#2ed573' }
      default: return { bg: 'rgba(112, 161, 255, 0.1)', border: '#70a1ff', icon: '#70a1ff' }
    }
  }

  return (
    <div className="instrument-panel rounded p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Alerts</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#ff4757] text-white rounded">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-2 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-colors",
              filter === 'all' ? "bg-[#00d4aa] text-[#08090a]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              "px-2 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-colors",
              filter === 'unread' ? "bg-[#00d4aa] text-[#08090a]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No alerts
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getAlertIcon(notification.type)
            const colors = getAlertColors(notification.type)
            const isRead = notification.isRead || markedRead.has(notification.id)
            const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })

            return (
              <div
                key={notification.id}
                className={cn(
                  "relative p-3 rounded transition-all duration-200 group cursor-pointer",
                  !isRead && "border-l-2"
                )}
                style={{
                  backgroundColor: colors.bg,
                  borderLeftColor: !isRead ? colors.border : 'transparent'
                }}
                onClick={() => markAsRead(notification.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    dismissAlert(notification.id)
                  }}
                  className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>

                <div className="flex gap-3">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: colors.icon }} />
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "text-xs font-medium truncate pr-4",
                      !isRead && "text-foreground",
                      isRead && "text-muted-foreground"
                    )}>
                      {notification.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground/60 mt-1">
                      {timeAgo}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
