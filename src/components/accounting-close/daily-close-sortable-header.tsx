"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DailyCloseSortableHeader<TData>({
  column,
  label,
  className,
}: {
  column: Column<TData, unknown>
  label: string
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={
        className ??
        "-ml-2 h-8 px-2 text-left lg:-ml-4"
      }
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" className="size-4 shrink-0" />
    </Button>
  )
}
