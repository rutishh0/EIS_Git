"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FileText, FileSpreadsheet, Download, Calendar, Filter, Clock, Check, ChevronRight, Settings } from "lucide-react"

interface Props {
  airlines: Array<{ id: string; name: string; status: string }>
}

const reportTypes = [
  { id: "scorecard-pdf", title: "Individual Scorecard", description: "Export a single airline scorecard with service lines and gate reviews", icon: FileText, format: "XLSX", color: "#ff4757" },
  { id: "portfolio-excel", title: "Portfolio Overview", description: "Export full portfolio with all airlines and service lines", icon: FileSpreadsheet, format: "XLSX", color: "#2ed573" },
  { id: "filtered-export", title: "Filtered Export", description: "Export filtered subset based on region or status", icon: Filter, format: "XLSX", color: "#70a1ff" },
  { id: "weekly-snapshot", title: "Weekly Snapshot", description: "Export current portfolio snapshot with all data", icon: Calendar, format: "XLSX", color: "#ffa502" },
]

const regions = ["All Regions", "Europe", "MEA", "APAC", "Greater China", "Americas"]

export function ReportsClient({ airlines }: Props) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [selectedAirline, setSelectedAirline] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("All Regions")
  const [includeOptions, setIncludeOptions] = useState({ serviceLines: true, gateReviews: true, auditLog: false })

  const selectedReportData = reportTypes.find(r => r.id === selectedReport)

  const handleExport = () => {
    const params = new URLSearchParams()

    if (selectedReport === "scorecard-pdf" && selectedAirline && selectedAirline !== "all") {
      params.set("airlineId", selectedAirline)
    }

    if (selectedReport === "filtered-export" && selectedRegion !== "All Regions") {
      params.set("region", selectedRegion)
    }

    params.set("format", "xlsx")

    const url = `/api/export?${params.toString()}`
    window.open(url, '_blank')
  }

  return (
    <>
      <header className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">Data Export</p>
        <h1 className="text-3xl font-light tracking-tight"><span className="text-gradient font-semibold">Reports</span></h1>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Report Types */}
          <div className="instrument-panel rounded p-4">
            <h3 className="text-sm font-semibold mb-4">Report Types</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {reportTypes.map(report => (
                <button key={report.id} onClick={() => setSelectedReport(report.id)}
                  className={cn("group relative text-left p-4 rounded border transition-all duration-200",
                    selectedReport === report.id ? "bg-secondary/50 border-[#00d4aa]" : "bg-secondary/20 border-transparent hover:bg-secondary/40 hover:border-border"
                  )}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: `${report.color}20` }}>
                      <report.icon className="w-5 h-5" style={{ color: report.color }} />
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${report.color}20`, color: report.color }}>{report.format}</span>
                  </div>
                  <h4 className="text-sm font-semibold mt-3">{report.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                  {selectedReport === report.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 rounded-full bg-[#00d4aa] flex items-center justify-center"><Check className="w-2.5 h-2.5 text-[#08090a]" /></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration */}
          {selectedReport && (
            <div className="instrument-panel rounded p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Configure Export</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Selected:</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: selectedReportData?.color }}>{selectedReportData?.title}</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {selectedReport === "scorecard-pdf" && (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Select Airline</label>
                    <select value={selectedAirline} onChange={e => setSelectedAirline(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00d4aa] transition-colors">
                      <option value="all">Choose airline...</option>
                      {airlines.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
                {(selectedReport === "filtered-export" || selectedReport === "portfolio-excel") && (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Region</label>
                    <div className="flex flex-wrap gap-1">
                      {regions.map(region => (
                        <button key={region} onClick={() => setSelectedRegion(region)}
                          className={cn("px-2 py-1 text-[10px] font-mono rounded transition-all",
                            selectedRegion === region ? "bg-[#00d4aa] text-[#08090a]" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                          )}>{region}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/30 pt-4 mb-6">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3 block">Include in Export</label>
                <div className="space-y-2">
                  {([
                    { key: "serviceLines", label: "Service Line Status" },
                    { key: "gateReviews", label: "Gate Review History" },
                    { key: "auditLog", label: "Audit Log (last 30 days)" },
                  ] as const).map(option => (
                    <label key={option.key} className="flex items-center gap-3 cursor-pointer group">
                      <div onClick={() => setIncludeOptions(prev => ({ ...prev, [option.key]: !prev[option.key] }))}
                        className={cn("w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                          includeOptions[option.key] ? "bg-[#00d4aa] border-[#00d4aa]" : "border-muted-foreground/50 group-hover:border-muted-foreground"
                        )}>
                        {includeOptions[option.key] && <Check className="w-2.5 h-2.5 text-[#08090a]" />}
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={handleExport}
                className="w-full sm:w-auto px-6 py-3 bg-[#00d4aa] text-[#08090a] font-semibold text-sm rounded hover:bg-[#00e4b8] transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Report
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="instrument-panel rounded p-4">
            <h3 className="text-sm font-semibold mb-4">Recent Exports</h3>
            <div className="space-y-2">
              {[
                { name: "Portfolio_Overview.xlsx", size: "245 KB", isPdf: false },
                { name: "Emirates_Scorecard.pdf", size: "128 KB", isPdf: true },
                { name: "Weekly_Snapshot.pdf", size: "89 KB", isPdf: true },
              ].map((file, idx) => (
                <div key={idx} className="group flex items-center justify-between p-3 bg-secondary/30 rounded hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    {file.isPdf ? <FileText className="w-4 h-4 shrink-0 text-[#ff4757]" /> : <FileSpreadsheet className="w-4 h-4 shrink-0 text-[#2ed573]" />}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          <div className="instrument-panel rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Scheduled Reports</h3>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="p-3 bg-secondary/30 rounded mb-3">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#00d4aa] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Weekly Portfolio Snapshot</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Every Monday at 9:00 AM</p>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00d4aa]/20 text-[#00d4aa] mt-2 inline-block">ACTIVE</span>
                </div>
              </div>
            </div>
            <button className="w-full px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border/50 rounded hover:border-border transition-colors flex items-center justify-center gap-2">
              Manage Schedules <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
