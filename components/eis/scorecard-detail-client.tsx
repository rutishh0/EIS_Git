"use client"

import { useState } from "react"
import Link from "next/link"
import { cn, computeOverallRAG, getRAGDisplay, formatEISDate, getDaysUntil, engineColors, getRegionDisplay } from "@/lib/utils"
import {
  ArrowLeft, Calendar, Clock, Edit3, FileText, Plane, User,
  Package, ChevronDown, Check, AlertTriangle, MapPin,
} from "lucide-react"

interface GateReview {
  id: string
  gateNumber: number
  planDate: string | null
  actualDate: string | null
  outcome: string | null
}

interface ServiceLine {
  id: string
  serviceLineId: string
  name: string
  category: string
  guidanceText: string | null
  ragStatus: string
  statusText: string | null
  comments: string | null
  updatedAt: string
}

interface Scorecard {
  id: string
  airlineId: string
  airlineName: string
  region: string
  engineType: string
  eisDate: string | null
  eisDateTbc: boolean
  eisRisk: string
  eisLead: { id: string; name: string } | null
  orderDetails: string | null
  status: string
  lastUpdatedAt: string
  lastUpdatedBy: string | null
  gateReviews: GateReview[]
  serviceLines: ServiceLine[]
}

interface Props {
  scorecard: Scorecard
  canEdit: boolean
}

export function ScorecardDetailClient({ scorecard, canEdit }: Props) {
  const [standardOpen, setStandardOpen] = useState(true)
  const [additionalOpen, setAdditionalOpen] = useState(true)

  const overallRag = computeOverallRAG(scorecard.serviceLines.map(sl => sl.ragStatus))
  const rag = getRAGDisplay(overallRag)
  const engineColor = engineColors[scorecard.engineType] || '#57606f'
  const days = getDaysUntil(scorecard.eisDate)
  const eisColor = days !== null && days <= 90 ? '#ff4757' : days !== null && days <= 180 ? '#ffa502' : '#2ed573'

  const standardServices = scorecard.serviceLines.filter(sl => sl.category === 'STANDARD')
  const additionalServices = scorecard.serviceLines.filter(sl => sl.category === 'ADDITIONAL')

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const eisRiskDisplay: Record<string, string> = {
    NO_RISK: 'No Risk',
    YES_CUSTOMER: 'Yes – Customer',
    YES_RR: 'Yes – RR',
  }

  return (
    <>
      {/* Back & Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/airlines" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/api/export?airlineId=${scorecard.airlineId}&format=xlsx`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary/50 border border-border/50 rounded hover:border-[#00d4aa]/30 transition-colors">
            <FileText className="w-4 h-4" />
            Export
          </button>
          {canEdit && (
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#00d4aa] text-[#08090a] rounded font-medium hover:bg-[#00d4aa]/90 transition-colors">
              <Edit3 className="w-4 h-4" />
              Edit Scorecard
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="instrument-panel rounded overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: rag.color }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${engineColor}20` }}>
                    <Plane className="w-7 h-7" style={{ color: engineColor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-semibold">{scorecard.airlineName}</h1>
                      <div className="px-2 py-1 rounded text-[10px] font-mono font-semibold" style={{ backgroundColor: rag.bg, color: rag.color }}>
                        {rag.label}
                      </div>
                    </div>
                    <p className="text-sm font-mono" style={{ color: engineColor }}>{scorecard.engineType}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{getRegionDisplay(scorecard.region)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">EIS Lead</span>
                  </div>
                  <p className="text-sm font-medium truncate">{scorecard.eisLead?.name || 'TBC'}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Order</span>
                  </div>
                  <p className="text-sm font-medium truncate">{scorecard.orderDetails || '—'}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">EIS Risk</span>
                  </div>
                  <p className="text-sm font-medium truncate">{eisRiskDisplay[scorecard.eisRisk] || scorecard.eisRisk}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Last Update</span>
                  </div>
                  <p className="text-sm font-medium">{formatDate(scorecard.lastUpdatedAt)}</p>
                  {scorecard.lastUpdatedBy && <p className="text-[10px] text-muted-foreground">by {scorecard.lastUpdatedBy}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Gate Reviews */}
          <div className="instrument-panel rounded p-6">
            <h2 className="text-sm font-semibold mb-1">Gate Reviews</h2>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-6">6-Gate EIS Process</p>
            <div className="relative overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 min-w-[600px]">
                {scorecard.gateReviews.map((gate, index) => {
                  const isPassed = gate.outcome === 'Passed'
                  const prevPassed = index > 0 && scorecard.gateReviews[index - 1]?.outcome === 'Passed'
                  return (
                    <div key={gate.gateNumber} className="flex flex-col items-center relative">
                      <div className="relative flex items-center w-full justify-center">
                        {index > 0 && <div className={cn("absolute right-1/2 h-0.5 w-full", prevPassed || isPassed ? "bg-[#00d4aa]" : "bg-border/50")} />}
                        {index < scorecard.gateReviews.length - 1 && <div className={cn("absolute left-1/2 h-0.5 w-full", isPassed ? "bg-[#00d4aa]" : "bg-border/50")} />}
                        <div className={cn(
                          "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                          isPassed ? "bg-[#00d4aa] border-[#00d4aa] text-[#08090a]" : "bg-card border-border/50"
                        )}>
                          {isPassed ? <Check className="w-5 h-5" /> : <span className="text-sm font-mono font-bold text-muted-foreground">{gate.gateNumber}</span>}
                        </div>
                      </div>
                      <div className="mt-3 text-center w-full">
                        <p className="text-xs font-semibold">Gate {gate.gateNumber}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1">{formatDate(gate.planDate)}</p>
                        {gate.actualDate && <p className="text-[9px] font-mono text-[#00d4aa] mt-0.5">Actual: {formatDate(gate.actualDate)}</p>}
                        {gate.outcome && (
                          <div className={cn("mt-2 mx-auto w-fit px-2 py-0.5 rounded text-[8px] font-mono font-bold", isPassed ? "bg-[#00d4aa]/20 text-[#00d4aa]" : "bg-secondary text-muted-foreground")}>
                            {gate.outcome}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* EIS Countdown */}
          <div className="instrument-panel rounded p-6 relative overflow-hidden" style={{ borderColor: `${eisColor}30` }}>
            <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(ellipse at top right, ${eisColor}, transparent 70%)` }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" style={{ color: eisColor }} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Entry Into Service</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{formatEISDate(scorecard.eisDate, scorecard.eisDateTbc)}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-light tabular-nums" style={{ color: eisColor }}>
                  {days !== null ? Math.abs(days) : '—'}
                </span>
                <span className="text-lg text-muted-foreground">
                  {days !== null ? (days < 0 ? 'days overdue' : 'days') : ''}
                </span>
              </div>
              <div className="mt-6 mb-2">
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                  <span>Program Start</span>
                  <span>EIS Target</span>
                </div>
                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${days !== null ? Math.min(100, Math.max(0, 100 - (days / 365) * 100)) : 0}%`,
                    backgroundColor: eisColor
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Service Status Summary */}
          <div className="instrument-panel rounded p-4">
            <h3 className="text-sm font-semibold mb-4">Service Status</h3>
            <div className="space-y-3">
              {(['C', 'G', 'A', 'R', 'NA'] as const).map(status => {
                const display = getRAGDisplay(status)
                const count = scorecard.serviceLines.filter(sl => sl.ragStatus === status).length
                if (count === 0) return null
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: display.color }} />
                      <span className="text-xs text-muted-foreground">{display.label}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold" style={{ color: display.color }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Service Lines - Full Width */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceLineSection title="Standard Services" services={standardServices} isOpen={standardOpen} onToggle={() => setStandardOpen(!standardOpen)} />
          <ServiceLineSection title="Additional Services" services={additionalServices} isOpen={additionalOpen} onToggle={() => setAdditionalOpen(!additionalOpen)} />
        </div>
      </div>
    </>
  )
}

function ServiceLineSection({ title, services, isOpen, onToggle }: { title: string; services: ServiceLine[]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="instrument-panel rounded overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
        <div>
          <h3 className="text-sm font-semibold text-left">{title}</h3>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{services.length} items</p>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="border-t border-border/30">
          {services.map((service, idx) => {
            const display = getRAGDisplay(service.ragStatus)
            return (
              <div key={service.id} className={cn("p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors", idx < services.length - 1 && "border-b border-border/20")}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: display.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{service.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{service.statusText || '—'}</p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded text-[9px] font-mono font-semibold shrink-0 ml-2" style={{ backgroundColor: display.bg, color: display.color }}>
                  {display.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
