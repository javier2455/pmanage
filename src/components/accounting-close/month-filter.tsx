"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

export interface SelectedMonth {
  year: number
  /** 0-indexed (0 = enero, 11 = diciembre) */
  month: number
}

interface MonthFilterProps {
  value?: SelectedMonth
  onConfirm: (value: SelectedMonth) => void
  onClear: () => void
}

export function MonthFilter({ value, onConfirm, onClear }: MonthFilterProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(value?.year ?? currentYear)
  const [selected, setSelected] = useState<SelectedMonth | undefined>(value)

  function isDisabled(month: number) {
    return year > currentYear || (year === currentYear && month > currentMonth)
  }

  function handleConfirm() {
    if (!selected) return
    onConfirm(selected)
    setOpen(false)
  }

  function handleClear() {
    setSelected(undefined)
    setYear(currentYear)
    onClear()
    setOpen(false)
  }

  const label = value
    ? format(new Date(value.year, value.month, 1), "MMMM yyyy", { locale: es })
    : "Filtrar por mes"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-fit justify-start gap-2 text-left font-normal capitalize",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {label}
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), handleClear())}
              className="ml-1 rounded-sm p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        {/* Year navigation */}
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{year}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={year >= currentYear}
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((name, i) => {
            const disabled = isDisabled(i)
            const isSelected = selected?.year === year && selected?.month === i
            return (
              <Button
                key={name}
                type="button"
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className="h-8"
                disabled={disabled}
                onClick={() => setSelected({ year, month: i })}
              >
                {name}
              </Button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Limpiar
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!selected}>
            Confirmar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
