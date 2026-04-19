"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SingleDatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder: string
  minDate?: Date
  maxDate?: Date
}

function SingleDatePicker({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
}: SingleDatePickerProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(date: Date | undefined) {
    onChange(date)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    onChange(undefined)
    setOpen(false)
  }

  const disabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 justify-start gap-2 text-xs font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {value
            ? format(value, "dd MMM yyyy", { locale: es })
            : placeholder}
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Limpiar fecha"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleClear(e)
              }}
              className="ml-1 rounded-sm p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={disabled.length > 0 ? disabled : undefined}
          defaultMonth={value ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SingleDatePicker
        value={startDate}
        onChange={onStartDateChange}
        placeholder="Fecha inicio"
        maxDate={endDate ?? new Date()}
      />
      <span className="text-xs text-muted-foreground">—</span>
      <SingleDatePicker
        value={endDate}
        onChange={onEndDateChange}
        placeholder="Fecha fin"
        minDate={startDate}
        maxDate={new Date()}
      />
    </div>
  )
}
