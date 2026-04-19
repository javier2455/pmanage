"use client"

import { cn } from "@/lib/utils"
import type { AnalyticsPeriod } from "@/lib/types/analytics"

interface PeriodFilterProps {
  value: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
}

const OPTIONS: { label: string; value: AnalyticsPeriod }[] = [
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
  { label: "Trimestre", value: "quarter" },
]

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Seleccionar período"
      className="inline-flex items-center gap-1 rounded-full border border-input bg-muted/40 p-1 shadow-xs"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
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
  )
}
