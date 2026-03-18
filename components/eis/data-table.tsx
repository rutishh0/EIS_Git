"use client"

import { useMemo, useState } from "react"
import { Search, ChevronUp, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/eis/empty-state"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  pageSize?: number
  emptyMessage?: string
  onRowClick?: (item: T) => void
}

function getNestedValue(obj: unknown, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
  return value != null ? String(value) : ""
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search...",
  searchKeys = [],
  pageSize = 20,
  emptyMessage = "No results found.",
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    const keys = searchKeys.length > 0 ? searchKeys : columns.map((c) => c.key)

    return data.filter((item) =>
      keys.some((key) => getNestedValue(item, key).toLowerCase().includes(query))
    )
  }, [data, searchQuery, searchable, searchKeys, columns])

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData

    return [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey)
      const bVal = getNestedValue(b, sortKey)

      const numA = Number(aVal)
      const numB = Number(bVal)
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === "asc" ? numA - numB : numB - numA
      }

      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: "base" })
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [filteredData, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, safeCurrentPage, pageSize])

  const rangeStart = sortedData.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(safeCurrentPage * pageSize, sortedData.length)

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  function handleSearch(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              className="pl-9"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left px-4 py-3 font-semibold whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDirection === "asc"
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((item, idx) => (
              <tr
                key={idx}
                className={cn(
                  "hover:bg-secondary/30 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render
                      ? col.render(item)
                      : getNestedValue(item, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 ? (
        <EmptyState
          title={emptyMessage}
          description={searchQuery ? "Try adjusting your search terms." : undefined}
        />
      ) : (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <span>
            Showing {rangeStart}–{rangeEnd} of {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs tabular-nums">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
