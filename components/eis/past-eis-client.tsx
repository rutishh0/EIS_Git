"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Archive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/eis/page-header"
import { DataTable } from "@/components/eis/data-table"
import { RAGBadge } from "@/components/eis/rag-badge"
import { EngineBadge } from "@/components/eis/engine-badge"
import { computeOverallRAG, formatDate } from "@/lib/utils"

interface PastEISServiceLine {
  serviceLineName: string
  ragStatus: string
}

interface PastEISProgram {
  airlineId: string
  airlineName: string
  engineType: string
  eisDate: string | null
  eisLeadName: string | null
  status: string
  scorecardId: string
  serviceLines: PastEISServiceLine[]
}

interface PastEISClientProps {
  programs: PastEISProgram[]
}

type ProgramRow = PastEISProgram & Record<string, unknown>

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  CLOSED: {
    label: "Closed",
    className: "bg-[rgba(0,212,170,0.15)] text-[#00d4aa] border-[#00d4aa]/30",
  },
  ACTIVE: {
    label: "Past EIS",
    className: "bg-[rgba(255,165,2,0.15)] text-[#ffa502] border-[#ffa502]/30",
  },
  ON_HOLD: {
    label: "On Hold",
    className: "bg-[rgba(87,96,111,0.15)] text-[#57606f] border-[#57606f]/30",
  },
}

export function PastEISClient({ programs }: PastEISClientProps) {
  const router = useRouter()

  const rows: ProgramRow[] = programs.map((p) => ({ ...p }))

  const columns = [
    {
      key: "airlineName",
      header: "Customer",
      sortable: true,
      render: (item: ProgramRow) => (
        <Link
          href={`/airlines/${item.airlineId}`}
          className="text-sm font-medium text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {item.airlineName}
        </Link>
      ),
    },
    {
      key: "engineType",
      header: "Engine Type",
      sortable: true,
      render: (item: ProgramRow) => (
        <EngineBadge engine={item.engineType as string} />
      ),
    },
    {
      key: "eisDate",
      header: "EIS Date",
      sortable: true,
      render: (item: ProgramRow) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(item.eisDate as string | null)}
        </span>
      ),
    },
    {
      key: "eisLeadName",
      header: "EIS Lead",
      sortable: true,
      render: (item: ProgramRow) => (
        <span className="text-sm text-muted-foreground">
          {(item.eisLeadName as string | null) || "TBC"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: ProgramRow) => {
        const style = STATUS_STYLES[item.status as string] ?? STATUS_STYLES.ON_HOLD
        return (
          <Badge variant="outline" className={`text-xs ${style.className}`}>
            {style.label}
          </Badge>
        )
      },
    },
    {
      key: "overallRag",
      header: "Overall RAG",
      render: (item: ProgramRow) => {
        const ragStatuses = (item.serviceLines as PastEISServiceLine[]).map(
          (sl) => sl.ragStatus
        )
        const overall = computeOverallRAG(ragStatuses)
        return <RAGBadge status={overall} showLabel size="sm" />
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Past EIS Archive"
        description="Completed and past-EIS programs"
      />

      {programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Archive className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No past programs</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Completed and past-EIS programs will appear here.
          </p>
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchable
          searchPlaceholder="Search by airline name..."
          searchKeys={["airlineName"]}
          pageSize={20}
          emptyMessage="No matching programs found."
          onRowClick={(item) => router.push(`/airlines/${item.airlineId}`)}
        />
      )}
    </>
  )
}
