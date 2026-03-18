"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Check } from "lucide-react"
import { cn, getRAGDisplay, formatEISDate } from "@/lib/utils"
import { EngineBadge } from "@/components/eis/engine-badge"
import { CountdownTimer } from "@/components/eis/countdown-timer"
import { CommentPopover } from "@/components/eis/comment-popover"

interface ServiceLineData {
  id: string
  serviceLineId: string
  serviceLineName: string
  ragStatus: string
  statusText: string | null
  comments: string | null
  isDisputed: boolean
}

interface HeatmapRow {
  airlineId: string
  airlineName: string
  engineType: string
  eisDate: string | null
  eisDateTbc: boolean
  eisLeadName: string | null
  region: string
  scorecardId: string
  serviceLines: ServiceLineData[]
}

interface HeatmapTableProps {
  data: HeatmapRow[]
  serviceLineNames: string[]
  canEdit?: boolean
  onStatusChange?: (statusId: string, newStatus: string) => Promise<void>
  onCommentSave?: (statusId: string, statusText: string, comments: string) => Promise<void>
  showEisLead?: boolean
}

function RAGCell({
  data,
  serviceLineName,
  canEdit,
  onStatusChange,
  onCommentSave,
}: {
  data: ServiceLineData | undefined
  serviceLineName: string
  canEdit?: boolean
  onStatusChange?: (statusId: string, newStatus: string) => Promise<void>
  onCommentSave?: (statusId: string, statusText: string, comments: string) => Promise<void>
}) {
  if (!data || data.ragStatus === "NA" || !data.ragStatus) {
    return (
      <div className="flex items-center justify-center">
        <div
          className="w-10 h-[18px] rounded-sm"
          style={{ backgroundColor: getRAGDisplay("NA").color, opacity: 0.3 }}
          title={`${serviceLineName}: N/A`}
        />
      </div>
    )
  }

  const { color } = getRAGDisplay(data.ragStatus)
  const tooltipText = data.statusText
    ? `${serviceLineName}: ${data.statusText}`
    : serviceLineName

  const isComplete = data.ragStatus === "C"

  const bar = (
    <button
      type="button"
      className="relative flex items-center justify-center cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      title={tooltipText}
    >
      {isComplete ? (
        <div
          className="w-10 h-[18px] rounded-sm flex items-center justify-center transition-opacity group-hover:opacity-80"
          style={{ border: `1.5px solid ${color}`, backgroundColor: "transparent" }}
        >
          <Check size={12} strokeWidth={2.5} style={{ color: "#2ed573" }} />
        </div>
      ) : (
        <div
          className="w-10 h-[18px] rounded-sm transition-opacity group-hover:opacity-80"
          style={{ backgroundColor: color }}
        />
      )}
      {data.isDisputed && (
        <AlertTriangle
          className="absolute -top-1 -right-1 text-amber-500"
          size={10}
          strokeWidth={2.5}
        />
      )}
    </button>
  )

  return (
    <div className="flex items-center justify-center">
      <CommentPopover
        statusText={data.statusText}
        comments={data.comments}
        serviceLineName={serviceLineName}
        ragStatus={data.ragStatus}
        canEdit={canEdit}
        onSave={
          onCommentSave
            ? (statusText, comments) => onCommentSave(data.id, statusText, comments)
            : undefined
        }
      >
        {bar}
      </CommentPopover>
    </div>
  )
}

export function HeatmapTable({
  data,
  serviceLineNames,
  canEdit = false,
  onStatusChange,
  onCommentSave,
  showEisLead = false,
}: HeatmapTableProps) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const cmp = a.airlineName.localeCompare(b.airlineName)
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortDir])

  function toggleSort() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No data available for the selected filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <th
              className="sticky left-0 z-10 bg-secondary/50 text-left px-4 py-3 font-semibold cursor-pointer select-none whitespace-nowrap"
              onClick={toggleSort}
            >
              Customer {sortDir === "asc" ? "▲" : "▼"}
            </th>
            <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
              Engine Type
            </th>
            <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
              EIS Date
            </th>
            {showEisLead && (
              <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">
                EIS Lead
              </th>
            )}
            {serviceLineNames.map((name) => (
              <th
                key={name}
                className="text-center px-2 py-3 font-semibold whitespace-nowrap"
                title={name}
              >
                <span className="inline-block max-w-[80px] truncate">{name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedData.map((row) => {
            const ragStatuses = row.serviceLines.map((sl) => sl.ragStatus)
            return (
              <tr
                key={row.scorecardId}
                className="hover:bg-secondary/30 transition-colors"
              >
                <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium whitespace-nowrap">
                  <Link
                    href={`/airlines/${row.airlineId}`}
                    className="text-primary hover:underline"
                  >
                    {row.airlineName}
                  </Link>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <EngineBadge engine={row.engineType} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <CountdownTimer
                    eisDate={row.eisDate}
                    eisDateTbc={row.eisDateTbc}
                    ragStatuses={ragStatuses}
                  />
                </td>
                {showEisLead && (
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {row.eisLeadName || "—"}
                  </td>
                )}
                {serviceLineNames.map((slName) => {
                  const slData = row.serviceLines.find(
                    (sl) => sl.serviceLineName === slName
                  )
                  return (
                    <td key={slName} className="px-2 py-2.5">
                      <RAGCell
                        data={slData}
                        serviceLineName={slName}
                        canEdit={canEdit}
                        onStatusChange={onStatusChange}
                        onCommentSave={onCommentSave}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
