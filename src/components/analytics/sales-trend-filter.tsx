"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AnalyticsSalesTrendGroupBy } from "@/lib/types/analytics"

import { DateRangePicker } from "./date-range-picker"

interface SalesTrendFilterProps {
  startDate: Date | undefined
  endDate: Date | undefined
  groupBy: AnalyticsSalesTrendGroupBy
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  onGroupByChange: (groupBy: AnalyticsSalesTrendGroupBy) => void
}

const GROUP_BY_LABEL: Record<AnalyticsSalesTrendGroupBy, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
}

export function SalesTrendFilter({
  startDate,
  endDate,
  groupBy,
  onStartDateChange,
  onEndDateChange,
  onGroupByChange,
}: SalesTrendFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />

      <Select
        value={groupBy}
        onValueChange={(value) =>
          onGroupByChange(value as AnalyticsSalesTrendGroupBy)
        }
      >
        <SelectTrigger className="h-9 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(
            Object.keys(GROUP_BY_LABEL) as AnalyticsSalesTrendGroupBy[]
          ).map((value) => (
            <SelectItem key={value} value={value} className="text-xs">
              Por {GROUP_BY_LABEL[value].toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
