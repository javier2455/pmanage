"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useBusiness } from "@/context/business-context"
import { useMonthlyAccountingClose, useExportToExcel, useExportToPdf } from "@/hooks/use-accounting-close"
import { useAllProductOfMyBusinesses } from "@/hooks/use-business"
import type { BusinessWithProducts } from "@/lib/types/business"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Package, BarChart3, CalendarCheck, Download, FileSpreadsheet, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MonthFilter, type SelectedMonth } from "@/components/accounting-close/month-filter"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { ProBadge } from "@/components/ui/pro-badge"
import { formatClosingCurrency as formatCurrency } from "@/components/accounting-close/format-closing-currency"
import { DailyCloseSoldTable } from "@/components/accounting-close/daily-close-sold-table"
import { DailyCloseEntryTable } from "@/components/accounting-close/daily-close-entry-table"
import { DailyCloseStockTable } from "@/components/accounting-close/daily-close-stock-table"

function MonthlyClosePageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}

export default function MonthlyPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const { activeBusinessId } = useBusiness()
  const { isProPlan } = useUserRoleAndPlan()
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth | undefined>(undefined)

  const dateParams = selectedMonth
    ? {
        startDate: format(startOfMonth(new Date(selectedMonth.year, selectedMonth.month, 1)), "yyyy-MM-dd"),
        endDate: format(endOfMonth(new Date(selectedMonth.year, selectedMonth.month, 1)), "yyyy-MM-dd"),
      }
    : undefined

  const { data, isLoading, isError } = useMonthlyAccountingClose(activeBusinessId ?? "", dateParams)
  const { data: productsData } = useAllProductOfMyBusinesses(activeBusinessId ?? "")
  const { mutate: exportPdf, isPending: isExportingPdf } = useExportToPdf(activeBusinessId ?? "")
  const { mutate: exportExcel, isPending: isExportingExcel } = useExportToExcel(activeBusinessId ?? "")

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function getMonthRange() {
    const now = new Date()
    const month = selectedMonth ?? { year: now.getFullYear(), month: now.getMonth() }
    const base = new Date(month.year, month.month, 1)
    return {
      base,
      startDate: format(startOfMonth(base), "yyyy-MM-dd"),
      endDate: format(endOfMonth(base), "yyyy-MM-dd"),
    }
  }

  function handleExportPdf() {
    const { base, startDate, endDate } = getMonthRange()
    exportPdf(
      { startDate, endDate },
      {
        onSuccess: (blob) => downloadBlob(blob, `cierre-mensual-${format(base, "MMMM-yyyy")}.pdf`),
      },
    )
  }

  function handleExportExcel() {
    const { base, startDate, endDate } = getMonthRange()
    exportExcel(
      { startDate, endDate },
      {
        onSuccess: (blob) => downloadBlob(blob, `cierre-mensual-${format(base, "MMMM-yyyy")}.xlsx`),
      },
    )
  }

  const currentMonth = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  })

  const inventoryEntries = data?.inventoryEntries ?? []
  const activeSales = useMemo(
    () => (data?.sales ?? []).filter((s) => !s.isCancelled),
    [data?.sales],
  )
  const totalSales = data?.totalIncome ?? 0
  const totalExpenses = data?.totalExpense ?? 0
  const balance = data?.total ?? totalSales - totalExpenses

  const inventory: BusinessWithProducts[] = productsData?.data ?? []

  if (!mounted || isLoading) {
    return <MonthlyClosePageSkeleton />
  }

  if (isError || !activeBusinessId) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold text-foreground">Cierre Mensual</h1>
        <p className="text-muted-foreground">
          {!activeBusinessId
            ? "Selecciona un negocio para ver el cierre mensual."
            : "Error al cargar los datos del cierre mensual."}
        </p>
      </div>
    )
  }

  const totalStockValue = inventory.reduce(
    (acc: number, i: BusinessWithProducts) => acc + i.stock * Number(i.price),
    0,
  )

  const selectedMonthLabel = selectedMonth
    ? format(new Date(selectedMonth.year, selectedMonth.month, 1), "MMMM yyyy")
    : currentMonth

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cierre Mensual
          </h1>
          <p className="text-muted-foreground">
            Resumen contable del mes &mdash;{" "}
            <span className="capitalize">{selectedMonthLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthFilter
            value={selectedMonth}
            onConfirm={(month) => setSelectedMonth(month)}
            onClear={() => setSelectedMonth(undefined)}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!isProPlan}
                title={!isProPlan ? "Requiere plan Pro para exportar" : undefined}
              >
                <Download className="h-4 w-4" />
                Exportar
                <ProBadge className="ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1">
              <button
                type="button"
                disabled={isExportingExcel}
                onClick={handleExportExcel}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-emerald-400"
              >
                <FileSpreadsheet className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                {isExportingExcel ? "Generando Excel…" : "Exportar a Excel"}
              </button>
              <button
                type="button"
                disabled={isExportingPdf}
                onClick={handleExportPdf}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-red-400"
              >
                <FileText className="size-4 shrink-0 text-red-600 dark:text-red-500" />
                {isExportingPdf ? "Generando PDF…" : "Exportar a PDF"}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Productos vendidos + ingresos de inventario */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="gap-4 py-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Productos vendidos en el mes
                </CardTitle>
                <CardDescription>
                  Detalle de todas las ventas realizadas en el mes (sin canceladas)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <DailyCloseSoldTable
            sales={activeSales}
            totalIncome={totalSales}
          />
        </Card>

        <Card className="gap-4 py-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Productos ingresados en el mes
                </CardTitle>
                <CardDescription>
                  Detalle de los productos ingresados en el mes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <DailyCloseEntryTable
            entries={inventoryEntries}
            totalExpense={totalExpenses}
          />
        </Card>
      </div>

      <Card className="gap-4 py-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Stock en almacén
              </CardTitle>
              <CardDescription>
                Inventario restante al cierre del mes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <DailyCloseStockTable
          lines={inventory}
          totalStockValue={totalStockValue}
        />
      </Card>

      {/* Financial summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Resumen financiero del mes
              </CardTitle>
              <CardDescription>
                Balance entre ventas y gastos de productos ingresados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-card-foreground">
                  Ventas
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                +${formatCurrency(totalSales)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                <span className="text-sm font-medium text-card-foreground">
                  Gastos
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-destructive">
                -${formatCurrency(totalExpenses)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    balance >= 0 ? "bg-emerald-500" : "bg-destructive"
                  )}
                />
                <span className="text-base font-bold text-card-foreground">
                  Balance
                </span>
              </div>
              <span
                className={cn(
                  "text-xl font-bold tabular-nums",
                  balance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {balance >= 0 ? "+" : "-"}${formatCurrency(Math.abs(balance))}
              </span>
            </div>

            <div className="flex justify-end">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  balance >= 0
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                )}
              >
                <CalendarCheck className="mr-1 h-3 w-3" />
                {balance >= 0 ? "Mes con ganancia" : "Mes con pérdida"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
