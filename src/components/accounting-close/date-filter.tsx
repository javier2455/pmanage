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

interface DateFilterProps {
  startDate?: Date
  onConfirm: (date: Date | undefined) => void
  onClear: () => void
}

export function DateFilter({ startDate, onConfirm, onClear }: DateFilterProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Date | undefined>(startDate)

  function handleConfirm() {
    onConfirm(selected)
    setOpen(false)
  }

  function handleClear() {
    setSelected(undefined)
    onClear()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-fit justify-start gap-2 text-left font-normal",
            !startDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {startDate
            ? format(startDate, "dd 'de' MMMM, yyyy", { locale: es })
            : "Filtrar por fecha"}
          {startDate && (
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
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          disabled={{ after: new Date() }}
          initialFocus
        />
        <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Limpiar
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Confirmar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
