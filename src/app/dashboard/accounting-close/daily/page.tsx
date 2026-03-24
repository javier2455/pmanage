"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { useBusiness } from "@/context/business-context"
import { useDailyAccountingClose } from "@/hooks/use-accounting-close"
import { useAllProductOfMyBusinesses } from "@/hooks/use-business"
import type { BusinessWithProducts } from "@/lib/types/business"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Package, BarChart3, CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateFilter } from "@/components/accounting-close/date-filter"
import { formatClosingCurrency as formatCurrency } from "@/components/accounting-close/format-closing-currency"
import { DailyCloseSoldTable } from "@/components/accounting-close/daily-close-sold-table"
import { DailyCloseEntryTable } from "@/components/accounting-close/daily-close-entry-table"
import { DailyCloseStockTable } from "@/components/accounting-close/daily-close-stock-table"

function DailyClosePageSkeleton() {
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

export default function DailyPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const { activeBusinessId } = useBusiness()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const dateParams = selectedDate
    ? { startDate: format(selectedDate, "yyyy-MM-dd") }
    : undefined

  const { data, isLoading, isError } = useDailyAccountingClose(activeBusinessId ?? "", dateParams)
  const { data: productsData } = useAllProductOfMyBusinesses(activeBusinessId ?? "")

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
    return <DailyClosePageSkeleton />
  }

  if (isError || !activeBusinessId) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold text-foreground">Cierre Diario</h1>
        <p className="text-muted-foreground">
          {!activeBusinessId
            ? "Selecciona un negocio para ver el cierre diario."
            : "Error al cargar los datos del cierre diario."}
        </p>
      </div>
    )
  }
  const totalStockValue = inventory.reduce(
    (acc: number, i: BusinessWithProducts) => acc + i.stock * Number(i.price),
    0,
  )

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cierre Diario
          </h1>
          <p className="text-muted-foreground">
            Resumen contable del dia &mdash;{" "}
            <span className="capitalize">{selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy") : today}</span>
          </p>
        </div>
        <DateFilter
          startDate={selectedDate}
          onConfirm={(date) => setSelectedDate(date)}
          onClear={() => setSelectedDate(undefined)}
        />
      </div>

      {/* Summary stat cards */}
      {/* <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ventas
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              ${formatCurrency(totalSales)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalUnitsSold} unidades vendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gastos
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              ${formatCurrency(totalExpenses)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {inventoryEntries.length} productos ingresados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                balance >= 0 ? "bg-emerald-500/10" : "bg-destructive/10"
              )}
            >
              {balance >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                balance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}
            >
              {balance >= 0 ? "+" : "-"}${formatCurrency(Math.abs(balance))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ventas - Gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Total
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Warehouse className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {inventory.reduce((acc, i) => acc + i.stock, 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Valorado en ${formatCurrency(totalStockValue)}
            </p>
          </CardContent>
        </Card>
      </div> */}

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
                  Productos vendidos hoy
                </CardTitle>
                <CardDescription>
                  Detalle de todas las ventas realizadas en el día (sin canceladas)
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
                  Productos ingresados hoy
                </CardTitle>
                <CardDescription>
                  Detalle de los productos ingresados en el día
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
                Inventario restante al cierre del día
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
                Resumen financiero del dia
              </CardTitle>
              <CardDescription>
                Balance entre ventas y gastos de productos ingresados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>


          {/* <Separator className="my-6" /> */}

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
                {balance >= 0 ? "Dia con ganancia" : "Dia con perdida"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
