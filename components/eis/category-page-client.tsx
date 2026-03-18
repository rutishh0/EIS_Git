"use client"

import { PageHeader } from "@/components/eis/page-header"
import { FilterBar } from "@/components/eis/filter-bar"
import { HeatmapTable } from "@/components/eis/heatmap-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Download } from "lucide-react"

interface ServiceLineData {
  id: string
  serviceLineId: string
  serviceLineName: string
  ragStatus: string
  statusText: string | null
  comments: string | null
  isDisputed: boolean
}

interface CategoryRow {
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

interface CategoryPageClientProps {
  title: string
  description: string
  data: CategoryRow[]
  serviceLineNames: string[]
}

export function CategoryPageClient({ title, description, data, serviceLineNames }: CategoryPageClientProps) {
  return (
    <div>
      <PageHeader title={title} description={description}>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/reports`}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Link>
        </Button>
      </PageHeader>
      <FilterBar showRAGFilter />
      <HeatmapTable
        data={data}
        serviceLineNames={serviceLineNames}
        showEisLead
      />
    </div>
  )
}
