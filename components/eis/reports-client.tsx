"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/eis/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  FileText,
  ScrollText,
  Download,
  Loader2,
  Check,
} from "lucide-react"

interface Props {
  airlines: Array<{ id: string; name: string; status: string }>
}

const REPORT_TYPES = [
  {
    id: "fleet",
    title: "Fleet Export",
    description: "Export all airlines with fleet data as XLSX",
    icon: BarChart3,
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    borderColor: "border-teal-400/40",
  },
  {
    id: "scorecard",
    title: "Scorecard Export",
    description: "Export a single airline scorecard as XLSX",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/40",
  },
  {
    id: "audit",
    title: "Audit Export",
    description: "Export audit log entries as XLSX",
    icon: ScrollText,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/40",
  },
] as const

type ReportType = (typeof REPORT_TYPES)[number]["id"]

const REGIONS = ["Europe", "MEA", "APAC", "Greater China", "Americas"]
const ENGINE_TYPES = ["Trent 1000", "Trent 7000", "Trent XWB", "Trent 900", "BR725"]

export function ReportsClient({ airlines }: Props) {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [exporting, setExporting] = useState(false)

  // Fleet config
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedEngines, setSelectedEngines] = useState<string[]>([])

  // Scorecard config
  const [selectedAirline, setSelectedAirline] = useState("")
  const [includeServiceLines, setIncludeServiceLines] = useState(true)
  const [includeComments, setIncludeComments] = useState(false)

  // Audit config
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const selectedReportData = REPORT_TYPES.find((r) => r.id === selectedReport)

  function toggleMulti(value: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  function handleExport() {
    if (!selectedReport) return

    const params = new URLSearchParams({ format: "xlsx", type: selectedReport })

    if (selectedReport === "fleet") {
      if (selectedRegions.length) params.set("regions", selectedRegions.join(","))
      if (selectedEngines.length) params.set("engines", selectedEngines.join(","))
    }

    if (selectedReport === "scorecard") {
      if (!selectedAirline) return
      params.set("airlineId", selectedAirline)
      if (includeServiceLines) params.set("includeServiceLines", "1")
      if (includeComments) params.set("includeComments", "1")
    }

    if (selectedReport === "audit") {
      if (dateFrom) params.set("from", dateFrom)
      if (dateTo) params.set("to", dateTo)
    }

    setExporting(true)
    const url = `/api/export?${params.toString()}`
    window.open(url, "_blank")
    setTimeout(() => setExporting(false), 2000)
  }

  const canExport =
    selectedReport === "fleet" ||
    (selectedReport === "scorecard" && selectedAirline) ||
    selectedReport === "audit"

  return (
    <>
      <PageHeader
        title="Reports & Export"
        description="Generate and download data exports"
      />

      <div className="space-y-6">
        {/* Report type cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon
            const active = selectedReport === report.id
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={cn(
                  "panel relative text-left p-5 transition-all duration-200",
                  active
                    ? cn("ring-1", report.borderColor)
                    : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", report.bgColor)}>
                    <Icon className={cn("w-5 h-5", report.color)} />
                  </div>
                  {active && (
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", report.bgColor)}>
                      <Check className={cn("w-3 h-3", report.color)} />
                    </div>
                  )}
                </div>
                <h4 className="text-sm font-semibold">{report.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                <Badge variant="secondary" className="mt-3 text-[10px]">XLSX</Badge>
              </button>
            )
          })}
        </div>

        {/* Config panel */}
        {selectedReport && selectedReportData && (
          <div className="panel p-6 space-y-6">
            <div className="flex items-center gap-3">
              <selectedReportData.icon className={cn("w-4 h-4", selectedReportData.color)} />
              <h3 className="text-sm font-semibold">
                Configure {selectedReportData.title}
              </h3>
            </div>

            {selectedReport === "fleet" && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Regions</Label>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((region) => (
                      <button
                        key={region}
                        onClick={() => toggleMulti(region, selectedRegions, setSelectedRegions)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-md border transition-colors",
                          selectedRegions.includes(region)
                            ? "bg-teal-400/15 border-teal-400/40 text-teal-400"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        )}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                  {selectedRegions.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">All regions included by default</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Engine Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {ENGINE_TYPES.map((engine) => (
                      <button
                        key={engine}
                        onClick={() => toggleMulti(engine, selectedEngines, setSelectedEngines)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-md border transition-colors",
                          selectedEngines.includes(engine)
                            ? "bg-teal-400/15 border-teal-400/40 text-teal-400"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        )}
                      >
                        {engine}
                      </button>
                    ))}
                  </div>
                  {selectedEngines.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">All engine types included by default</p>
                  )}
                </div>
              </div>
            )}

            {selectedReport === "scorecard" && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Airline</Label>
                  <Select value={selectedAirline} onValueChange={setSelectedAirline}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an airline..." />
                    </SelectTrigger>
                    <SelectContent>
                      {airlines.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label className="text-xs text-muted-foreground">Include</Label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={includeServiceLines}
                        onCheckedChange={(c) => setIncludeServiceLines(c === true)}
                      />
                      <span className="text-sm">Service Lines</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={includeComments}
                        onCheckedChange={(c) => setIncludeComments(c === true)}
                      />
                      <span className="text-sm">Comments</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === "audit" && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={handleExport}
                disabled={!canExport || exporting}
                size="lg"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export {selectedReportData.title}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
