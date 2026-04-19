"use client"

import { Button } from "@/components/ui/button"
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
    <div className="inline-flex rounded-md border border-input bg-background p-0.5">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 px-3 text-xs font-medium",
            value === option.value
              ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
