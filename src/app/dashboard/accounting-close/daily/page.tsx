"use client"

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
import {
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Warehouse,
  CalendarCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"


function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function DailyPage() {
  const { activeBusinessId } = useBusiness()
  const { data, isLoading, isError } = useDailyAccountingClose(activeBusinessId ?? "")
  const { data: productsData } = useAllProductOfMyBusinesses(activeBusinessId ?? "")

  console.log('look here for data', data)

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const sales = data?.sales ?? []
  const inventoryEntries = data?.inventoryEntries ?? []
  const totalSales = data?.totalIncome ?? 0
  const totalExpenses = data?.totalExpense ?? 0
  const balance = data?.total ?? totalSales - totalExpenses
  const totalUnitsSold = sales.reduce((acc, s) => acc + Number(s.cantidad), 0)

  const inventory: BusinessWithProducts[] = productsData?.data ?? []

  if (isLoading) {
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

  if (isError || !activeBusinessId) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-foreground">Cierre Diario</h1>
        <p className="text-muted-foreground">
          {!activeBusinessId
            ? "Selecciona un negocio para ver el cierre diario."
            : "Error al cargar los datos del cierre diario."}
        </p>
      </div>
    )
  }
  const totalStockUnits = inventory.reduce((acc: number, i: BusinessWithProducts) => acc + i.stock, 0)
  const totalStockValue = inventory.reduce(
    (acc: number, i: BusinessWithProducts) => acc + i.stock * Number(i.price),
    0
  )

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Cierre Diario
        </h1>
        <p className="text-muted-foreground">
          Resumen contable del dia &mdash;{" "}
          <span className="capitalize">{today}</span>
        </p>
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
              {totalStockUnits}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Valorado en ${formatCurrency(totalStockValue)}
            </p>
          </CardContent>
        </Card>
      </div> */}

      {/* Products sold today */}
      <Card>
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
                Detalle de todas las ventas realizadas en el dia
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden sm:grid sm:grid-cols-5 gap-4 border-b border-border pb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider col-span-2">
              Producto
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Cantidad
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Precio Unit.
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Total
            </span>
          </div>
          <div className="flex flex-col">
            {sales
              .filter((s) => !s.isCancelled)
              .map((sale) => {
                const total = sale.cantidad * sale.precio
                return (
                  <div
                    key={sale.id}
                    className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 border-b border-border py-3 last:border-0"
                  >
                    <span className="text-sm font-medium text-card-foreground col-span-2 sm:col-span-2">
                      {sale.product?.name}
                    </span>
                    <div className="flex sm:justify-end items-center gap-1.5">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        Cant:
                      </span>
                      <span className="text-sm tabular-nums text-card-foreground">
                        {sale.cantidad}
                      </span>
                    </div>
                    <div className="flex sm:justify-end items-center gap-1.5">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        P.U.:
                      </span>
                      <span className="text-sm tabular-nums text-card-foreground">
                        ${formatCurrency(sale.precio)}
                      </span>
                    </div>
                    <div className="flex sm:justify-end items-center col-span-2 sm:col-span-1">
                      <span className="text-sm font-semibold tabular-nums text-card-foreground">
                        ${formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm font-semibold text-card-foreground">
              Total ventas del dia
            </span>
            <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              ${formatCurrency(totalSales)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Inventory entries today */}
      <Card>
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
                Detalle de todos los productos ingresados en el dia
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden sm:grid sm:grid-cols-4 gap-4 border-b border-border pb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider col-span-1">
              Producto
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Cantidad
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Costo Unit.
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Total
            </span>
          </div>
          <div className="flex flex-col">
            {inventoryEntries.map((entry) => {
              const qty = Number(entry.quantity)
              const unitCost = Number(entry.entryPrice)
              const total = qty * unitCost
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 border-b border-border py-3 last:border-0"
                >
                  <span className="text-sm font-medium text-card-foreground col-span-2 sm:col-span-1">
                    {entry.product?.name ?? "-"}
                  </span>
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      Cant:
                    </span>
                    <span className="text-sm tabular-nums text-card-foreground">
                      {qty}
                    </span>
                  </div>
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      C.U.:
                    </span>
                    <span className="text-sm tabular-nums text-card-foreground">
                      ${formatCurrency(unitCost)}
                    </span>
                  </div>
                  <div className="flex sm:justify-end items-center col-span-2 sm:col-span-1">
                    <span className="text-sm font-semibold tabular-nums text-card-foreground">
                      ${formatCurrency(total)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm font-semibold text-card-foreground">
              Total gastos del dia
            </span>
            <span className="text-base font-bold tabular-nums text-destructive">
              ${formatCurrency(totalExpenses)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Current inventory */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Stock en almacen
              </CardTitle>
              <CardDescription>
                Inventario restante al cierre del dia
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden sm:grid sm:grid-cols-4 gap-4 border-b border-border pb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider col-span-1">
              Producto
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Stock
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Precio Unit.
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Valor Total
            </span>
          </div>
          <div className="flex flex-col">
            {inventory.map((item: BusinessWithProducts) => {
              const price = Number(item.price)
              const totalValue = item.stock * price
              const isLowStock = item.stock <= 10
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 border-b border-border py-3 last:border-0"
                >
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <span className="text-sm font-medium text-card-foreground">
                      {item.product?.name ?? "-"}
                    </span>
                    {isLowStock && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      >
                        Bajo
                      </Badge>
                    )}
                  </div>
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      Stock:
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        isLowStock
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-card-foreground"
                      )}
                    >
                      {item.stock} uds
                    </span>
                  </div>
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <span className="text-xs text-muted-foreground sm:hidden">
                      P.U.:
                    </span>
                    <span className="text-sm tabular-nums text-card-foreground">
                      ${formatCurrency(price)}
                    </span>
                  </div>
                  <div className="flex sm:justify-end items-center">
                    <span className="text-sm font-semibold tabular-nums text-card-foreground">
                      ${formatCurrency(totalValue)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm font-semibold text-card-foreground">
              Valor total del inventario
            </span>
            <span className="text-base font-bold tabular-nums text-card-foreground">
              ${formatCurrency(totalStockValue)}
            </span>
          </div>
        </CardContent>
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
