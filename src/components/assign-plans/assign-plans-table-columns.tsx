"use client"

import type { CSSProperties } from "react"
import type { Column, ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Check, MoreHorizontal, X } from "lucide-react"
import { differenceInDays, format, parseISO, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"
import { PlanBadge } from "./plan-badge"
import { getPlanLabel, getPlanStyle } from "./utils"

export type AssignPlansColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies AssignPlansColumnMeta

function AssignPlansSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<UserDataResponse, unknown>
  label: string
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "-ml-2 h-8 px-2 lg:-ml-4"}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  )
}

export function createAssignPlansColumns(
  plans: PlanResponse[],
  onPlanSelect: (user: UserDataResponse, plan: PlanResponse | null) => void,
): ColumnDef<UserDataResponse>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue) => {
        const q = String(filterValue ?? "").toLowerCase().trim()
        if (!q) return true
        const name = row.original.name.toLowerCase()
        const email = row.original.email.toLowerCase()
        return name.includes(q) || email.includes(q)
      },
      meta: {
        headerClassName:
          "min-w-[140px] max-w-none whitespace-normal align-top sm:max-w-[min(14rem,36vw)]",
        cellClassName:
          "min-w-[140px] max-w-none whitespace-normal break-words align-top font-medium text-foreground sm:max-w-[min(14rem,36vw)]",
      } satisfies AssignPlansColumnMeta,
      header: ({ column }) => (
        <AssignPlansSortableHeader
          column={column}
          label="Nombre"
          className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
        />
      ),
      cell: ({ row }) => <span>{row.original.name}</span>,
    },
    {
      id: "email",
      accessorKey: "email",
      meta: {
        headerClassName:
          "min-w-[180px] max-w-none whitespace-normal align-top sm:max-w-[min(18rem,45vw)]",
        cellClassName:
          "min-w-[180px] max-w-none whitespace-normal break-words align-top text-muted-foreground sm:max-w-[min(18rem,45vw)]",
      } satisfies AssignPlansColumnMeta,
      header: ({ column }) => (
        <AssignPlansSortableHeader
          column={column}
          label="Correo"
          className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
        />
      ),
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
    {
      id: "planActive",
      accessorFn: (row) => row.plan?.name ?? "",
      meta: {
        headerClassName: "min-w-[8rem] whitespace-normal",
        cellClassName: "min-w-[8rem] align-top",
      } satisfies AssignPlansColumnMeta,
      header: ({ column }) => (
        <AssignPlansSortableHeader
          column={column}
          label="Plan activo"
          className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
        />
      ),
      cell: ({ row }) => (
        <PlanBadge plan={row.original.plan ?? null} plans={plans} />
      ),
    },
    {
      id: "expiresAt",
      accessorFn: (row) => row.plan?.expiresAt ?? "",
      meta: {
        headerClassName: "min-w-[9rem] whitespace-normal",
        cellClassName: "min-w-[9rem] align-top",
      } satisfies AssignPlansColumnMeta,
      header: ({ column }) => (
        <AssignPlansSortableHeader
          column={column}
          label="Vence"
          className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
        />
      ),
      cell: ({ row }) => {
        const expiresAt = row.original.plan?.expiresAt
        if (!expiresAt) return <span className="text-muted-foreground/50">—</span>

        const expiry = startOfDay(parseISO(expiresAt))
        const today = startOfDay(new Date())
        const days = differenceInDays(expiry, today)
        const label = format(expiry, "dd MMM yyyy", { locale: es })

        const colorClass =
          days < 0
            ? "text-destructive"
            : days <= 3
              ? "text-amber-600 dark:text-amber-400"
              : days <= 15
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-muted-foreground"

        return (
          <span className={cn("text-sm tabular-nums", colorClass)}>
            {label}
          </span>
        )
      },
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        ...compactColumnMeta,
        headerClassName: `${compactColumnMeta.headerClassName} text-right`,
        cellClassName: `${compactColumnMeta.cellClassName} text-right`,
      } satisfies AssignPlansColumnMeta,
      header: () => (
        <span className="pr-2 text-sm font-medium text-foreground">Acciones</span>
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Abrir menú de planes"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1">
              <div className="px-2 py-1.5 text-sm font-medium">Asignar plan</div>
              <div className="my-1 h-px bg-border" />
              {plans.map((plan) => {
                const planStyle = getPlanStyle(plan)
                const Icon = planStyle.icon
                const s = planStyle.style
                const isActive = user.plan?.id === plan.id
                const hasHoverStyle =
                  !isActive && s.color && s.backgroundColor && s.borderColor
                const hasIconTextColor = s.color
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => onPlanSelect(user, plan)}
                    disabled={isActive}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-sm border-l-4 border-transparent px-2 py-1.5 text-left text-sm transition-colors",
                      isActive
                        ? "cursor-default opacity-60"
                        : "cursor-pointer hover:bg-muted",
                    )}
                    style={
                      hasHoverStyle
                        ? ({
                            "--plan-border": s.borderColor,
                            "--plan-bg": s.backgroundColor,
                          } as CSSProperties)
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (!hasHoverStyle || isActive) return
                      e.currentTarget.style.borderLeftColor = `var(--plan-border)`
                      e.currentTarget.style.backgroundColor = `var(--plan-bg)`
                    }}
                    onMouseLeave={(e) => {
                      if (!hasHoverStyle || isActive) return
                      e.currentTarget.style.borderLeftColor = "transparent"
                      e.currentTarget.style.backgroundColor = ""
                    }}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      style={hasIconTextColor ? { color: s.color } : undefined}
                    />
                    <span
                      style={hasIconTextColor ? { color: s.color } : undefined}
                    >
                      {getPlanLabel(plan)}
                    </span>
                    {isActive ? (
                      <Check className="ml-auto size-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                )
              })}
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => onPlanSelect(user, null)}
                disabled={!user.plan}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors text-destructive",
                  user.plan
                    ? "cursor-pointer hover:bg-muted"
                    : "cursor-default opacity-50",
                )}
              >
                <X className="size-4 shrink-0" />
                <span>Quitar plan</span>
              </button>
            </PopoverContent>
          </Popover>
        )
      },
    },
  ]
}
