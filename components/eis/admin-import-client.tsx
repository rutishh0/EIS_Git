"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Upload, History, FileSpreadsheet, CheckCircle2, AlertCircle, XCircle, RefreshCw, HardDrive, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminImportClient() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleImport = async () => {
    if (!selectedFile) return
    setUploadProgress(0)

    const reader = new FileReader()
    reader.onload = async () => {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return 0
          if (prev >= 90) { clearInterval(interval); return 90 }
          return prev + 10
        })
      }, 200)
      try {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [{ name: selectedFile.name, data: reader.result as string }]
          }),
        })
        clearInterval(interval)
        setUploadProgress(res.ok ? 100 : null)
      } catch {
        clearInterval(interval)
        setUploadProgress(null)
      }
    }
    reader.onerror = () => setUploadProgress(null)
    reader.readAsDataURL(selectedFile)
  }

  const recentImports = [
    { id: "1", filename: "EIS_Metric_Tool_2026_EMEA.xlsb", date: "01 Mar 2026", status: "success", records: 12, size: "2.4 MB" },
    { id: "2", filename: "EIS_Metric_Tool_2026_APAC.xlsx", date: "28 Feb 2026", status: "success", records: 8, size: "1.8 MB" },
    { id: "3", filename: "EIS_Metric_Tool_2025_Americas.xlsb", date: "20 Feb 2026", status: "partial", records: 5, size: "1.2 MB" },
  ]

  const statusIcons = { success: CheckCircle2, partial: AlertCircle, failed: XCircle }
  const statusColors = { success: "text-emerald-400", partial: "text-amber-400", failed: "text-red-400" }
  const statusBg = { success: "bg-emerald-500/10", partial: "bg-amber-500/10", failed: "bg-red-500/10" }

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground">Command</Link>
          <span>/</span>
          <span className="text-foreground">Excel Import</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Data Import</h1>
        <p className="text-muted-foreground text-sm mt-1">Import scorecard data from EIS Metric Tool Excel files</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          {/* Drop Zone */}
          <div className="instrument-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center"><Upload className="w-5 h-5 text-teal-400" /></div>
              <div><h2 className="font-semibold">Upload File</h2><p className="text-sm text-muted-foreground">Import from .xlsx or .xlsb files</p></div>
            </div>

            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              className={cn("relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-all",
                isDragging ? "border-[#00d4aa] bg-[#00d4aa]/5" : "border-border hover:border-[#00d4aa]/50 hover:bg-secondary/30"
              )}>
              <input type="file" accept=".xlsx,.xlsb" onChange={handleFileSelect} className="absolute inset-0 cursor-pointer opacity-0" />
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors", isDragging ? "bg-[#00d4aa]/20" : "bg-secondary")}>
                <HardDrive className={cn("w-8 h-8", isDragging ? "text-[#00d4aa]" : "text-muted-foreground")} />
              </div>
              <p className="text-sm font-medium mb-1">{isDragging ? "Drop file here" : "Drag and drop your Excel file"}</p>
              <p className="text-xs text-muted-foreground">or click to browse files</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground/60">
                <span className="flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> .xlsx</span>
                <span className="flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> .xlsb</span>
                <span>Max 25 MB</span>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5 text-emerald-400" /></div>
                  <div><p className="font-medium text-sm">{selectedFile.name}</p><p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p></div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedFile(null); setUploadProgress(null) }} className="text-muted-foreground hover:text-foreground">Remove</Button>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{uploadProgress < 100 ? "Processing file..." : "Import complete"}</span>
                  <span className="font-mono text-[#00d4aa]">{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <Button onClick={handleImport} disabled={!selectedFile || (uploadProgress !== null && uploadProgress < 100)}
              className="w-full mt-4 gap-2 bg-[#00d4aa] hover:bg-[#00d4aa]/90 text-[#08090a] disabled:opacity-50">
              {uploadProgress !== null && uploadProgress < 100 ? <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</> : <><ArrowRight className="w-4 h-4" /> Start Import</>}
            </Button>
          </div>

          {/* Requirements */}
          <div className="instrument-panel p-4">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">File Requirements</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Use the official EIS Metric Tool template", "Ensure all required columns are present", "Data will be validated before import", "Existing records will be updated, new ones created"].map((req, idx) => (
                <li key={idx} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {req}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Import History */}
        <div className="lg:col-span-2">
          <div className="instrument-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><History className="w-4 h-4 text-muted-foreground" /> Import History</h2>
            </div>
            <div className="space-y-3">
              {recentImports.map(item => {
                const StatusIcon = statusIcons[item.status as keyof typeof statusIcons]
                return (
                  <div key={item.id} className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", statusBg[item.status as keyof typeof statusBg])}>
                        <StatusIcon className={cn("w-4 h-4", statusColors[item.status as keyof typeof statusColors])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.filename}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{item.date}</span><span>·</span><span>{item.records} records</span><span>·</span><span>{item.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
