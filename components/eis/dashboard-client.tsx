"use client"

import { useState, useEffect } from "react"
import { SystemStatus } from "@/components/eis/system-status"
import { QuickStats } from "@/components/eis/quick-stats"
import { FleetOverview } from "@/components/eis/fleet-overview"
import { TimelineStrip } from "@/components/eis/timeline-strip"
import { ActiveMissions } from "@/components/eis/active-missions"
import { AlertsPanel } from "@/components/eis/alerts-panel"
import { computeOverallRAG } from "@/lib/utils"

interface DashboardClientProps {
  stats: {
    totalActive: number
    atRisk: number
    approachingEis: number
    overdueScorecards: number
  }
  portfolio: Array<{
    id: string
    airlineId: string
    customer: string
    engineType: string
    region: string
    eisDate: Date | string | null
    eisDateTbc: boolean
    eisRisk: string
    status: string
    lastUpdatedAt: Date | string
    ragStatuses: string[]
    gateReviews: Array<{ gateNumber: number; planDate: Date | string | null; actualDate: Date | string | null; outcome: string | null }>
  }>
  systemStatus: {
    activePrograms: number
    lastSync: string | null
  }
  notifications: Array<{
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: Date | string
    scorecard: { airline: { id: string; name: string } } | null
  }>
}

export function DashboardClient({ stats, portfolio, systemStatus, notifications }: DashboardClientProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toISOString().slice(11, 19))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const timelineData = portfolio
    .filter(p => p.status === "ACTIVE" && p.eisDate)
    .map(p => ({
      airlineId: p.airlineId,
      airlineName: p.customer,
      region: p.region,
      eisDate: p.eisDate!,
      overallRag: computeOverallRAG(p.ragStatuses),
    }))

  return (
    <>
      {/* Header with system status */}
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
            Civil Aerospace Division
          </p>
          <h1 className="text-4xl font-light tracking-tight">
            EIS <span className="text-gradient font-semibold">Command Center</span>
          </h1>
        </div>
        <SystemStatus
          lastSync={systemStatus.lastSync}
          activePrograms={systemStatus.activePrograms}
        />
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {/* Quick Stats Row */}
        <div className="col-span-12">
          <QuickStats {...stats} />
        </div>

        {/* Main content area */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <TimelineStrip data={timelineData} />
          <FleetOverview
            data={portfolio}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
          />
        </div>

        {/* Right Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <ActiveMissions data={portfolio} />
          <AlertsPanel notifications={notifications} />
        </div>
      </div>

      {/* Bottom status bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#0c0d0f] border-t border-border/50 flex items-center justify-between px-6 text-[10px] font-mono text-muted-foreground z-40">
        <div className="flex items-center gap-6">
          <span>SYS.STATUS: <span className="text-[#2ed573]">OPERATIONAL</span></span>
          <span>DATA.SYNC: <span className="text-[#00d4aa]">LIVE</span></span>
          <span>REGION: <span className="text-foreground">{selectedRegion === 'all' ? 'GLOBAL' : selectedRegion.toUpperCase()}</span></span>
        </div>
        <div className="flex items-center gap-6">
          <span>UTC {currentTime}</span>
          <span>v2.4.1</span>
        </div>
      </footer>
    </>
  )
}
