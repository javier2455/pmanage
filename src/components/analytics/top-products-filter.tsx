"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type {
  TopProductsLimit,
  TopProductsSortBy,
} from "@/lib/types/analytics"

interface TopProductsFilterProps {
  sortBy: TopProductsSortBy
  limit: TopProductsLimit
  onSortByChange: (sortBy: TopProductsSortBy) => void
  onLimitChange: (limit: TopProductsLimit) => void
}

const SORT_OPTIONS: { label: string; value: TopProductsSortBy }[] = [
  { label: "Ingresos", value: "revenue" },
  { label: "Unidades", value: "quantity" },
]

const LIMIT_OPTIONS: TopProductsLimit[] = [5, 10]

export function TopProductsFilter({
  sortBy,
  limit,
  onSortByChange,
  onLimitChange,
}: TopProductsFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="tablist"
        aria-label="Ordenar por"
        className="inline-flex items-center gap-1 rounded-full border border-input bg-muted/40 p-1 shadow-xs"
      >
        {SORT_OPTIONS.map((option) => {
          const isActive = sortBy === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSortByChange(option.value)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <Select
        value={String(limit)}
        onValueChange={(value) =>
          onLimitChange(Number(value) as TopProductsLimit)
        }
      >
        <SelectTrigger className="h-9 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LIMIT_OPTIONS.map((value) => (
            <SelectItem
              key={value}
              value={String(value)}
              className="text-xs"
            >
              Top {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
