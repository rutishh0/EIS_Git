"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft, Calendar, Edit3, FileText, Save, X,
  User, Package, AlertTriangle, Clock, MapPin,
  ChevronDown, MessageSquare, Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/eis/page-header"
import { RAGBadge } from "@/components/eis/rag-badge"
import { EngineBadge } from "@/components/eis/engine-badge"
import { CountdownTimer } from "@/components/eis/countdown-timer"
import { DisputeDialog } from "@/components/eis/dispute-dialog"
import {
  cn,
  computeOverallRAG,
  getRAGDisplay,
  getOffPlanStatus,
  formatDate,
  formatEISDate,
  getDaysUntil,
  getRegionDisplay,
} from "@/lib/utils"

interface ServiceLineStatus {
  id: string
  serviceLineName: string
  serviceLineCategory: string
  ragStatus: string
  statusText: string | null
  comments: string | null
  isDisputed: boolean
  disputeNote: string | null
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
  eisLeadName: string | null
  orderDetails: string | null
  status: string
  lastUpdatedAt: string
  serviceLineStatuses: ServiceLineStatus[]
}

interface ScorecardDetailClientProps {
  scorecard: Scorecard
  canEdit: boolean
}

const RAG_OPTIONS = ["R", "A", "G", "C", "NA"] as const

const EIS_RISK_LABELS: Record<string, string> = {
  NO_RISK: "No Risk",
  YES_CUSTOMER: "Yes – Customer",
  YES_RR: "Yes – RR",
}

const EIS_RISK_OPTIONS = ["NO_RISK", "YES_CUSTOMER", "YES_RR"] as const

export function ScorecardDetailClient({ scorecard, canEdit }: ScorecardDetailClientProps) {
  const router = useRouter()

  const [headerEditing, setHeaderEditing] = useState(false)
  const [headerDraft, setHeaderDraft] = useState({
    eisDate: scorecard.eisDate ?? "",
    eisRisk: scorecard.eisRisk,
  })
  const [headerSaving, setHeaderSaving] = useState(false)

  const [editingRAG, setEditingRAG] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{ id: string; field: "statusText" | "comments" } | null>(null)
  const [fieldDraft, setFieldDraft] = useState("")
  const [saving, setSaving] = useState(false)

  const [disputeTarget, setDisputeTarget] = useState<ServiceLineStatus | null>(null)
  const [disputeLoading, setDisputeLoading] = useState(false)

  const [standardOpen, setStandardOpen] = useState(true)
  const [additionalOpen, setAdditionalOpen] = useState(true)

  const allRagStatuses = scorecard.serviceLineStatuses.map((sl) => sl.ragStatus)
  const overallRag = computeOverallRAG(allRagStatuses)
  const { isOffPlan } = getOffPlanStatus(allRagStatuses, scorecard.eisDate)
  const days = getDaysUntil(scorecard.eisDate)
  const eisColor = days !== null && days <= 90 ? "#ff4757" : days !== null && days <= 180 ? "#ffa502" : "#2ed573"

  const standardServices = scorecard.serviceLineStatuses.filter(
    (sl) => sl.serviceLineCategory === "STANDARD"
  )
  const additionalServices = scorecard.serviceLineStatuses.filter(
    (sl) => sl.serviceLineCategory === "ADDITIONAL"
  )

  const saveHeaderChanges = useCallback(async () => {
    setHeaderSaving(true)
    try {
      const body: Record<string, unknown> = {}
      if (headerDraft.eisDate !== (scorecard.eisDate ?? "")) {
        body.eisDate = headerDraft.eisDate || null
      }
      if (headerDraft.eisRisk !== scorecard.eisRisk) {
        body.eisRisk = headerDraft.eisRisk
      }
      if (Object.keys(body).length === 0) {
        setHeaderEditing(false)
        return
      }
      const res = await fetch(`/api/scorecards/${scorecard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to update scorecard")
      toast.success("Scorecard updated")
      setHeaderEditing(false)
      router.refresh()
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setHeaderSaving(false)
    }
  }, [headerDraft, scorecard, router])

  const changeRAGStatus = useCallback(
    async (serviceLineStatusId: string, ragStatus: string) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/scorecards/${scorecard.id}/service-lines`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceLineStatusId, ragStatus }),
        })
        if (!res.ok) throw new Error("Failed to update status")
        toast.success("Status updated")
        setEditingRAG(null)
        router.refresh()
      } catch {
        toast.error("Failed to update status")
      } finally {
        setSaving(false)
      }
    },
    [scorecard.id, router]
  )

  const saveFieldEdit = useCallback(
    async (serviceLineStatusId: string, field: "statusText" | "comments", value: string) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/scorecards/${scorecard.id}/service-lines`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceLineStatusId, [field]: value || null }),
        })
        if (!res.ok) throw new Error("Failed to save")
        toast.success("Saved")
        setEditingField(null)
        router.refresh()
      } catch {
        toast.error("Failed to save")
      } finally {
        setSaving(false)
      }
    },
    [scorecard.id, router]
  )

  const submitDispute = useCallback(
    async (note: string) => {
      if (!disputeTarget) return
      setDisputeLoading(true)
      try {
        const res = await fetch(`/api/scorecards/${scorecard.id}/service-lines/dispute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceLineStatusId: disputeTarget.id,
            disputeNote: note,
          }),
        })
        if (!res.ok) throw new Error("Failed to submit dispute")
        toast.success("Dispute submitted")
        setDisputeTarget(null)
        router.refresh()
      } catch {
        toast.error("Failed to submit dispute")
      } finally {
        setDisputeLoading(false)
      }
    },
    [disputeTarget, scorecard.id, router]
  )

  function startFieldEdit(sl: ServiceLineStatus, field: "statusText" | "comments") {
    setEditingField({ id: sl.id, field })
    setFieldDraft(field === "statusText" ? (sl.statusText ?? "") : (sl.comments ?? ""))
  }

  function isOffPlanServiceLine(sl: ServiceLineStatus): boolean {
    return sl.ragStatus === "R" && days !== null && days >= 0 && days <= 180
  }

  function canDispute(sl: ServiceLineStatus): boolean {
    return isOffPlanServiceLine(sl) && !sl.isDisputed
  }

  return (
    <>
      <PageHeader title={scorecard.airlineName}>
        <Link
          href="/regional-summary"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Regional Summary
        </Link>
      </PageHeader>

      {/* Header card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
        <div className="h-1.5" style={{ backgroundColor: getRAGDisplay(overallRag).color }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-semibold">{scorecard.airlineName}</h2>
                  <EngineBadge engine={scorecard.engineType} />
                  <RAGBadge status={overallRag} showLabel />
                  {isOffPlan && (
                    <Badge variant="destructive" className="text-xs">
                      OFF PLAN
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {getRegionDisplay(scorecard.region)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatEISDate(scorecard.eisDate, scorecard.eisDateTbc)}
                  </span>
                  <CountdownTimer
                    eisDate={scorecard.eisDate}
                    eisDateTbc={scorecard.eisDateTbc}
                    ragStatuses={allRagStatuses}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `/api/export?airlineId=${scorecard.airlineId}&format=xlsx`,
                    "_blank"
                  )
                }
              >
                <FileText className="w-4 h-4" />
                Export
              </Button>
              {canEdit && !headerEditing && (
                <Button
                  size="sm"
                  onClick={() => {
                    setHeaderDraft({
                      eisDate: scorecard.eisDate ?? "",
                      eisRisk: scorecard.eisRisk,
                    })
                    setHeaderEditing(true)
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {headerEditing && (
                <>
                  <Button
                    size="sm"
                    onClick={saveHeaderChanges}
                    disabled={headerSaving}
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHeaderEditing(false)}
                    disabled={headerSaving}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCell icon={User} label="EIS Lead" value={scorecard.eisLeadName || "TBC"} />
            <InfoCell icon={Package} label="Order Details" value={scorecard.orderDetails || "—"} />

            {headerEditing ? (
              <div className="p-3 bg-secondary/30 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    EIS Date
                  </span>
                </div>
                <Input
                  type="date"
                  value={headerDraft.eisDate ? headerDraft.eisDate.slice(0, 10) : ""}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({ ...prev, eisDate: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
            ) : (
              <InfoCell
                icon={Calendar}
                label="EIS Date"
                value={formatEISDate(scorecard.eisDate, scorecard.eisDateTbc)}
              />
            )}

            {headerEditing ? (
              <div className="p-3 bg-secondary/30 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    EIS Risk
                  </span>
                </div>
                <select
                  value={headerDraft.eisRisk}
                  onChange={(e) =>
                    setHeaderDraft((prev) => ({ ...prev, eisRisk: e.target.value }))
                  }
                  className="h-8 w-full text-sm rounded border border-border bg-background px-2"
                >
                  {EIS_RISK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {EIS_RISK_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <InfoCell
                icon={AlertTriangle}
                label="EIS Risk"
                value={EIS_RISK_LABELS[scorecard.eisRisk] || scorecard.eisRisk}
              />
            )}
          </div>
        </div>
      </div>

      {/* EIS countdown + status summary + disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div
          className="bg-card border border-border rounded-lg p-6 relative overflow-hidden"
          style={{ borderColor: `${eisColor}30` }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(ellipse at top right, ${eisColor}, transparent 70%)`,
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4" style={{ color: eisColor }} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Entry Into Service
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {formatEISDate(scorecard.eisDate, scorecard.eisDateTbc)}
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className="text-5xl font-light tabular-nums"
                style={{ color: eisColor }}
              >
                {days !== null ? Math.abs(days) : "—"}
              </span>
              <span className="text-lg text-muted-foreground">
                {days !== null ? (days < 0 ? "days overdue" : "days") : ""}
              </span>
            </div>
            <div className="mt-6 mb-2">
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                <span>Program Start</span>
                <span>EIS Target</span>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${days !== null ? Math.min(100, Math.max(0, 100 - (days / 365) * 100)) : 0}%`,
                    backgroundColor: eisColor,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-4">Service Status Summary</h3>
          <div className="space-y-3">
            {(["C", "G", "A", "R", "NA"] as const).map((status) => {
              const display = getRAGDisplay(status)
              const count = scorecard.serviceLineStatuses.filter(
                (sl) => sl.ragStatus === status
              ).length
              if (count === 0) return null
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: display.color }}
                    />
                    <span className="text-xs text-muted-foreground">{display.label}</span>
                  </div>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{ color: display.color }}
                  >
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-4">Disputes</h3>
          {scorecard.serviceLineStatuses.filter((sl) => sl.isDisputed).length === 0 ? (
            <p className="text-xs text-muted-foreground">No active disputes.</p>
          ) : (
            <div className="space-y-2">
              {scorecard.serviceLineStatuses
                .filter((sl) => sl.isDisputed)
                .map((sl) => (
                  <div
                    key={sl.id}
                    className="flex items-start gap-2 p-2 rounded bg-[rgba(255,71,87,0.08)] border border-[rgba(255,71,87,0.2)]"
                  >
                    <Flag className="w-3.5 h-3.5 text-[#ff4757] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{sl.serviceLineName}</p>
                      {sl.disputeNote && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {sl.disputeNote}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Service line sections */}
      <div className="space-y-6">
        <ServiceLineSection
          title="Standard Services"
          services={standardServices}
          isOpen={standardOpen}
          onToggle={() => setStandardOpen(!standardOpen)}
          canEdit={canEdit}
          editingRAG={editingRAG}
          setEditingRAG={setEditingRAG}
          editingField={editingField}
          fieldDraft={fieldDraft}
          setFieldDraft={setFieldDraft}
          saving={saving}
          onChangeRAG={changeRAGStatus}
          onStartFieldEdit={startFieldEdit}
          onSaveFieldEdit={saveFieldEdit}
          onCancelFieldEdit={() => setEditingField(null)}
          isOffPlanServiceLine={isOffPlanServiceLine}
          canDispute={canDispute}
          onDispute={setDisputeTarget}
        />
        <ServiceLineSection
          title="Additional Services"
          services={additionalServices}
          isOpen={additionalOpen}
          onToggle={() => setAdditionalOpen(!additionalOpen)}
          canEdit={canEdit}
          editingRAG={editingRAG}
          setEditingRAG={setEditingRAG}
          editingField={editingField}
          fieldDraft={fieldDraft}
          setFieldDraft={setFieldDraft}
          saving={saving}
          onChangeRAG={changeRAGStatus}
          onStartFieldEdit={startFieldEdit}
          onSaveFieldEdit={saveFieldEdit}
          onCancelFieldEdit={() => setEditingField(null)}
          isOffPlanServiceLine={isOffPlanServiceLine}
          canDispute={canDispute}
          onDispute={setDisputeTarget}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Last updated {formatDate(scorecard.lastUpdatedAt)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(
              `/api/export?airlineId=${scorecard.airlineId}&format=xlsx`,
              "_blank"
            )
          }
        >
          <FileText className="w-4 h-4" />
          Export
        </Button>
      </div>

      <DisputeDialog
        open={!!disputeTarget}
        onOpenChange={(open) => {
          if (!open) setDisputeTarget(null)
        }}
        serviceLineName={disputeTarget?.serviceLineName ?? ""}
        airlineName={scorecard.airlineName}
        currentStatus={disputeTarget?.ragStatus ?? ""}
        onSubmit={submitDispute}
        loading={disputeLoading}
      />
    </>
  )
}

function InfoCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="p-3 bg-secondary/30 rounded">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  )
}

interface ServiceLineSectionProps {
  title: string
  services: ServiceLineStatus[]
  isOpen: boolean
  onToggle: () => void
  canEdit: boolean
  editingRAG: string | null
  setEditingRAG: (id: string | null) => void
  editingField: { id: string; field: "statusText" | "comments" } | null
  fieldDraft: string
  setFieldDraft: (v: string) => void
  saving: boolean
  onChangeRAG: (id: string, status: string) => Promise<void>
  onStartFieldEdit: (sl: ServiceLineStatus, field: "statusText" | "comments") => void
  onSaveFieldEdit: (id: string, field: "statusText" | "comments", value: string) => Promise<void>
  onCancelFieldEdit: () => void
  isOffPlanServiceLine: (sl: ServiceLineStatus) => boolean
  canDispute: (sl: ServiceLineStatus) => boolean
  onDispute: (sl: ServiceLineStatus) => void
}

function ServiceLineSection({
  title,
  services,
  isOpen,
  onToggle,
  canEdit,
  editingRAG,
  setEditingRAG,
  editingField,
  fieldDraft,
  setFieldDraft,
  saving,
  onChangeRAG,
  onStartFieldEdit,
  onSaveFieldEdit,
  onCancelFieldEdit,
  isOffPlanServiceLine,
  canDispute,
  onDispute,
}: ServiceLineSectionProps) {
  if (services.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div>
          <h3 className="text-sm font-semibold text-left">{title}</h3>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {services.length} items
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border/30">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-secondary/30 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <div className="col-span-3">Service Line</div>
            <div className="col-span-1 text-center">RAG</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-3">Comments</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {services.map((sl, idx) => {
            const display = getRAGDisplay(sl.ragStatus)
            const isEditingThisRAG = editingRAG === sl.id
            const isEditingThisStatus =
              editingField?.id === sl.id && editingField.field === "statusText"
            const isEditingThisComments =
              editingField?.id === sl.id && editingField.field === "comments"
            const offPlan = isOffPlanServiceLine(sl)

            return (
              <div
                key={sl.id}
                className={cn(
                  "grid grid-cols-12 gap-2 px-4 py-3 items-start hover:bg-secondary/10 transition-colors",
                  idx < services.length - 1 && "border-b border-border/20"
                )}
              >
                {/* Service line name + badges */}
                <div className="col-span-3 flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: display.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{sl.serviceLineName}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {offPlan && (
                        <Badge variant="destructive" className="text-[9px]">
                          OFF PLAN
                        </Badge>
                      )}
                      {sl.isDisputed && (
                        <Badge
                          variant="destructive"
                          className="text-[9px]"
                        >
                          <Flag className="w-2.5 h-2.5" />
                          DISPUTED
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* RAG status */}
                <div className="col-span-1 flex justify-center relative">
                  {canEdit ? (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setEditingRAG(isEditingThisRAG ? null : sl.id)
                        }
                        className="cursor-pointer"
                        disabled={saving}
                      >
                        <RAGBadge status={sl.ragStatus} showLabel size="sm" />
                      </button>
                      {isEditingThisRAG && (
                        <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg p-1 flex flex-col gap-0.5 min-w-[100px]">
                          {RAG_OPTIONS.map((opt) => {
                            const optDisplay = getRAGDisplay(opt)
                            return (
                              <button
                                key={opt}
                                onClick={() => onChangeRAG(sl.id, opt)}
                                disabled={saving}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs hover:bg-secondary/50 transition-colors w-full text-left",
                                  sl.ragStatus === opt && "bg-secondary/30"
                                )}
                              >
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: optDisplay.color }}
                                />
                                <span style={{ color: optDisplay.color }}>
                                  {optDisplay.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <RAGBadge status={sl.ragStatus} showLabel size="sm" />
                  )}
                </div>

                {/* Status text */}
                <div className="col-span-3">
                  {isEditingThisStatus ? (
                    <div className="flex flex-col gap-1">
                      <Textarea
                        value={fieldDraft}
                        onChange={(e) => setFieldDraft(e.target.value)}
                        className="min-h-[60px] text-xs"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() =>
                            onSaveFieldEdit(sl.id, "statusText", fieldDraft)
                          }
                          disabled={saving}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2"
                          onClick={onCancelFieldEdit}
                          disabled={saving}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "text-xs text-muted-foreground",
                        canEdit &&
                          "cursor-pointer hover:text-foreground hover:bg-secondary/30 rounded px-1 py-0.5 -mx-1 transition-colors"
                      )}
                      onClick={
                        canEdit
                          ? () => onStartFieldEdit(sl, "statusText")
                          : undefined
                      }
                    >
                      {sl.statusText || "—"}
                    </p>
                  )}
                </div>

                {/* Comments */}
                <div className="col-span-3">
                  {isEditingThisComments ? (
                    <div className="flex flex-col gap-1">
                      <Textarea
                        value={fieldDraft}
                        onChange={(e) => setFieldDraft(e.target.value)}
                        className="min-h-[60px] text-xs"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() =>
                            onSaveFieldEdit(sl.id, "comments", fieldDraft)
                          }
                          disabled={saving}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2"
                          onClick={onCancelFieldEdit}
                          disabled={saving}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "text-xs text-muted-foreground",
                        canEdit &&
                          "cursor-pointer hover:text-foreground hover:bg-secondary/30 rounded px-1 py-0.5 -mx-1 transition-colors"
                      )}
                      onClick={
                        canEdit
                          ? () => onStartFieldEdit(sl, "comments")
                          : undefined
                      }
                    >
                      {sl.comments || "—"}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-center gap-1">
                  {canDispute(sl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-[#ff4757] border-[#ff4757]/30 hover:bg-[rgba(255,71,87,0.08)]"
                      onClick={() => onDispute(sl)}
                    >
                      <MessageSquare className="w-3 h-3" />
                      Dispute
                    </Button>
                  )}
                  {sl.isDisputed && (
                    <Badge variant="outline" className="text-[9px] text-[#ff4757] border-[#ff4757]/30">
                      <Flag className="w-2.5 h-2.5" />
                      Disputed
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
