"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Upload, FileUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/eis/page-header"
import { Button } from "@/components/ui/button"

interface ImportResult {
  airlinesCreated: number
  scorecardsUpdated: number
  serviceLinesMapped: number
  errors: string[]
  totalParsed: number
}

export function AdminImportClient() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function validateFile(file: File): string | null {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (![".xlsx", ".xls"].includes(ext)) {
      return "Please select a valid Excel file (.xlsx or .xls)"
    }
    if (file.size > 10 * 1024 * 1024) {
      return "File size must be under 10 MB"
    }
    return null
  }

  function handleFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setSelectedFile(file)
    setResult(null)
    setError(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    if (!selectedFile) return
    setUploading(true)
    setResult(null)
    setError(null)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(selectedFile)
      })

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: [{ name: selectedFile.name, data: base64 }],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Import failed")
      }

      setResult(data)
      toast.success(
        `Import complete — ${data.airlinesCreated} created, ${data.scorecardsUpdated} updated`
      )
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setSelectedFile(null)
    setResult(null)
    setError(null)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <>
      <PageHeader
        title="Excel Import"
        description="Import scorecard data from EIS Metric Tool Excel files"
      />

      <div className="max-w-2xl space-y-6">
        {/* Upload Panel */}
        <div className="rounded-lg border border-border bg-card p-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <Upload
              className={cn(
                "mb-4 h-10 w-10",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p className="text-sm font-medium">
              {isDragging
                ? "Drop your file here"
                : "Drag and drop your Excel file"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              .xlsx or .xls — max 10 MB
            </p>
          </div>

          {/* Selected File Info */}
          {selectedFile && !result && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          )}

          {/* Import Button */}
          {selectedFile && !result && (
            <Button
              onClick={handleImport}
              disabled={uploading}
              className="mt-4 w-full gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          )}

          {/* Success Result */}
          {result && (
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-400">
                    Import Successful
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Processed {result.totalParsed} airline
                    {result.totalParsed !== 1 ? "s" : ""} —{" "}
                    {result.airlinesCreated} created, {result.scorecardsUpdated}{" "}
                    updated, {result.serviceLinesMapped} service lines mapped.
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-amber-400">
                        {result.errors.length} warning
                        {result.errors.length !== 1 ? "s" : ""}:
                      </p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {result.errors.map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={reset} className="w-full">
                Import Another File
              </Button>
            </div>
          )}

          {/* Error */}
          {error && !result && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Import Failed</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Audit Log Link */}
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          View import history in the{" "}
          <Link
            href="/admin/audit-log"
            className="font-medium text-primary hover:underline"
          >
            Audit Log
          </Link>
          .
        </div>
      </div>
    </>
  )
}
