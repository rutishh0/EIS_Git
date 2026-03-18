"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { ALL_REGIONS, ALL_ENGINE_TYPES, getRegionDisplay } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X } from "lucide-react"

const RAG_OPTIONS = [
  { value: "R", label: "Red", color: "var(--rag-red)" },
  { value: "A", label: "Amber", color: "var(--rag-amber)" },
  { value: "G", label: "Green", color: "var(--rag-green)" },
  { value: "C", label: "Complete", color: "var(--rag-blue)" },
  { value: "NA", label: "N/A", color: "var(--rag-grey)" },
] as const

export function useFilterParams() {
  const searchParams = useSearchParams()
  return {
    regions: searchParams.get("region")?.split(",").filter(Boolean) ?? [],
    engines: searchParams.get("engine")?.split(",").filter(Boolean) ?? [],
    eisFrom: searchParams.get("eisFrom") ?? null,
    eisTo: searchParams.get("eisTo") ?? null,
    ragStatuses: searchParams.get("rag")?.split(",").filter(Boolean) ?? [],
  }
}

interface FilterBarProps {
  showServiceLineFilter?: boolean
  showRAGFilter?: boolean
}

export function FilterBar({
  showRAGFilter = true,
}: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const regions = searchParams.get("region")?.split(",").filter(Boolean) ?? []
  const engines = searchParams.get("engine")?.split(",").filter(Boolean) ?? []
  const ragStatuses = searchParams.get("rag")?.split(",").filter(Boolean) ?? []

  const hasActiveFilters =
    regions.length > 0 || engines.length > 0 || ragStatuses.length > 0

  const updateParams = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (values.length > 0) {
        params.set(key, values.join(","))
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("region")
    params.delete("engine")
    params.delete("rag")
    params.delete("eisFrom")
    params.delete("eisTo")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  const toggleValue = (
    current: string[],
    value: string,
    paramKey: string
  ) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updateParams(paramKey, next)
  }

  const removeFilter = (key: string, value: string) => {
    const paramVal = searchParams.get(key)
    if (!paramVal) return
    const values = paramVal.split(",").filter((v) => v !== value)
    updateParams(key, values)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs font-medium uppercase tracking-wider">
          Filters
        </span>
      </div>

      {/* Region Filter */}
      <FilterDropdown
        label="Region"
        activeCount={regions.length}
      >
        <div className="space-y-2">
          {ALL_REGIONS.map((region) => (
            <label
              key={region}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <Checkbox
                checked={regions.includes(region)}
                onCheckedChange={() =>
                  toggleValue(regions, region, "region")
                }
              />
              <span className="text-sm text-popover-foreground group-hover:text-foreground transition-colors">
                {getRegionDisplay(region)}
              </span>
            </label>
          ))}
        </div>
      </FilterDropdown>

      {/* Engine Type Filter */}
      <FilterDropdown
        label="Engine Type"
        activeCount={engines.length}
      >
        <div className="space-y-2">
          {ALL_ENGINE_TYPES.map((engine) => (
            <label
              key={engine}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <Checkbox
                checked={engines.includes(engine)}
                onCheckedChange={() =>
                  toggleValue(engines, engine, "engine")
                }
              />
              <span className="text-sm text-popover-foreground group-hover:text-foreground transition-colors">
                {engine}
              </span>
            </label>
          ))}
        </div>
      </FilterDropdown>

      {/* RAG Status Filter */}
      {showRAGFilter && (
        <FilterDropdown
          label="RAG Status"
          activeCount={ragStatuses.length}
        >
          <div className="space-y-2">
            {RAG_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <Checkbox
                  checked={ragStatuses.includes(opt.value)}
                  onCheckedChange={() =>
                    toggleValue(ragStatuses, opt.value, "rag")
                  }
                />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                <span className="text-sm text-popover-foreground group-hover:text-foreground transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FilterDropdown>
      )}

      {/* Active filter badges */}
      {hasActiveFilters && (
        <>
          <div className="w-px h-5 bg-border mx-1" />

          {regions.map((r) => (
            <Badge
              key={`region-${r}`}
              variant="secondary"
              className="gap-1 pl-2 pr-1 cursor-default"
            >
              <span className="text-xs">{getRegionDisplay(r)}</span>
              <button
                onClick={() => removeFilter("region", r)}
                className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {engines.map((e) => (
            <Badge
              key={`engine-${e}`}
              variant="secondary"
              className="gap-1 pl-2 pr-1 cursor-default"
            >
              <span className="text-xs">{e}</span>
              <button
                onClick={() => removeFilter("engine", e)}
                className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {ragStatuses.map((s) => {
            const opt = RAG_OPTIONS.find((o) => o.value === s)
            return (
              <Badge
                key={`rag-${s}`}
                variant="secondary"
                className="gap-1 pl-2 pr-1 cursor-default"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: opt?.color }}
                />
                <span className="text-xs">{opt?.label ?? s}</span>
                <button
                  onClick={() => removeFilter("rag", s)}
                  className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground h-7 text-xs"
          >
            Clear all
          </Button>
        </>
      )}
    </div>
  )
}

function FilterDropdown({
  label,
  activeCount,
  children,
}: {
  label: string
  activeCount: number
  children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 gap-1.5 text-xs",
            activeCount > 0 && "border-primary/40 text-primary"
          )}
        >
          {label}
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">
          {label}
        </p>
        {children}
      </PopoverContent>
    </Popover>
  )
}
