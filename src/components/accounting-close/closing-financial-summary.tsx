"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, BarChart3, CalendarCheck, LayoutGrid, List } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  BASE_CURRENCY,
  convertFromBase,
  currencyLabel,
  formatMoney,
  getAvailableCurrencies,
} from "@/lib/currency"
import {
  consolidateClosing,
  groupClosingByCurrency,
  resolveConsolidation,
  type ClosingCurrencyRow,
  type ClosingServerTotals,
} from "@/lib/accounting-close-currency"
import { useExchangeRate } from "@/hooks/use-exchange"
import type { SaleWithProductAndBusiness } from "@/lib/types/sales"
import type { ExpenseInAccountingClose } from "@/lib/types/accounting-close"

interface ClosingFinancialSummaryProps {
  sales: SaleWithProductAndBusiness[]
  expenses: ExpenseInAccountingClose[]
  businessId: string
  /** Personaliza título y etiqueta de ganancia/pérdida (día vs mes). */
  period: "daily" | "monthly"
  /** Consolidado en CUP calculado por el backend; se prefiere sobre el cálculo
   * local con tasas vivas. Ausente → se recalcula client-side (fallback). */
  serverTotals?: ClosingServerTotals | null
}

const PERIOD_COPY = {
  daily: { titleSuffix: "del día", verdictNoun: "Día" },
  monthly: { titleSuffix: "del mes", verdictNoun: "Mes" },
} as const

/** Vista del desglose por moneda: una card por fila o grid de dos columnas. */
type CurrencyView = "full" | "grid"
const CURRENCY_VIEW_STORAGE_KEY = "closing-financial-currency-view"

/** Una fila Ventas / Gastos / Balance para una moneda o para el consolidado. */
function BreakdownRows({
  income,
  expense,
  balance,
  currency,
}: {
  income: number
  expense: number
  balance: number
  currency: string
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-card-foreground">Ventas</span>
        </div>
        <span className="ml-auto whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          +{formatMoney(income, currency)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
          <span className="text-sm font-medium text-card-foreground">Gastos</span>
        </div>
        <span className="ml-auto whitespace-nowrap text-sm font-semibold tabular-nums text-destructive">
          -{formatMoney(expense, currency)}
        </span>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              balance >= 0 ? "bg-emerald-500" : "bg-destructive",
            )}
          />
          <span className="text-sm font-bold text-card-foreground">Balance</span>
        </div>
        <span
          className={cn(
            "ml-auto whitespace-nowrap text-base font-bold tabular-nums",
            balance >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {balance >= 0 ? "+" : "-"}
          {formatMoney(Math.abs(balance), currency)}
        </span>
      </div>
    </div>
  )
}

/**
 * Card de una moneda con su desglose (Ventas / Gastos / Balance). El encabezado
 * con la moneda destacada permite identificar de un vistazo a qué moneda
 * corresponden las cifras, incluso apiladas o en grid.
 */
function CurrencyBreakdownCard({ row }: { row: ClosingCurrencyRow }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-semibold">
          {currencyLabel(row.currency)}
        </Badge>
        <span className="h-px flex-1 bg-border" />
      </div>
      <BreakdownRows
        income={row.income}
        expense={row.expense}
        balance={row.balance}
        currency={row.currency}
      />
    </div>
  )
}

/**
 * Resumen financiero del cierre con desglose por moneda + equivalente
 * consolidado. Reemplaza el balance plano (que sumaba monedas distintas como si
 * fueran una) por subtotales fieles a cada moneda y un consolidado único
 * (por defecto en CUP, conmutable a cualquier moneda con tasa configurada).
 */
export function ClosingFinancialSummary({
  sales,
  expenses,
  businessId,
  period,
  serverTotals,
}: ClosingFinancialSummaryProps) {
  const copy = PERIOD_COPY[period]
  const { data: exchangeData } = useExchangeRate(businessId)
  const exchangeRate = exchangeData?.data

  // El resumen abarca ventas + gastos, así que el aviso GLOBAL del backend
  // (`unconvertedCurrencies`, dentro de resolveConsolidation) es exacto aquí.
  const { currencyRows, consolidated } = React.useMemo(() => {
    const rows = groupClosingByCurrency(sales, expenses)
    const clientConsolidation = consolidateClosing(rows, exchangeRate)
    return {
      currencyRows: rows,
      consolidated: resolveConsolidation(clientConsolidation, serverTotals),
    }
  }, [sales, expenses, exchangeRate, serverTotals])

  // Vista del desglose por moneda (una card por fila vs. grid de dos columnas),
  // recordada entre visitas. Mismo patrón que el catálogo de productos. El
  // primer render usa "full" para no desajustar la hidratación (SSR).
  const [currencyView, setCurrencyView] = React.useState<CurrencyView>("full")
  React.useEffect(() => {
    const stored = window.localStorage.getItem(CURRENCY_VIEW_STORAGE_KEY)
    if (stored === "full" || stored === "grid") setCurrencyView(stored)
  }, [])
  React.useEffect(() => {
    window.localStorage.setItem(CURRENCY_VIEW_STORAGE_KEY, currencyView)
  }, [currencyView])

  // Moneda en la que se muestra el consolidado. Solo ofrecemos monedas con tasa
  // configurada (las convertibles); CUP siempre está y es la primera.
  const availableCurrencies = React.useMemo(
    () => getAvailableCurrencies(exchangeRate),
    [exchangeRate],
  )
  const [consolidatedCurrency, setConsolidatedCurrency] =
    React.useState<string>(BASE_CURRENCY)
  // Si la moneda elegida deja de estar disponible (cambió el negocio o sus
  // tasas), volvemos a CUP para no mostrar un consolidado sin convertir.
  React.useEffect(() => {
    if (!availableCurrencies.includes(consolidatedCurrency)) {
      setConsolidatedCurrency(BASE_CURRENCY)
    }
  }, [availableCurrencies, consolidatedCurrency])

  // Con una sola moneda base (CUP), desglose y consolidado coinciden: evitamos
  // duplicar el bloque en CUP y mostramos solo el desglose.
  const showConsolidated =
    currencyRows.length > 1 ||
    (currencyRows.length === 1 && currencyRows[0].currency !== BASE_CURRENCY)

  // El veredicto (ganancia/pérdida) usa el balance en CUP: convertir a otra
  // moneda con tasa positiva no cambia el signo, así que es indiferente.
  const consolidatedBalance = consolidated.balanceBase
  // Montos del consolidado en la moneda elegida (el consolidado se calcula en
  // CUP; `convertFromBase` lo pasa a la moneda seleccionada, identidad si es CUP).
  const consolidatedIncome = convertFromBase(
    consolidated.incomeBase,
    consolidatedCurrency,
    exchangeRate,
  )
  const consolidatedExpense = convertFromBase(
    consolidated.expenseBase,
    consolidatedCurrency,
    exchangeRate,
  )
  const consolidatedBalanceInCurrency = convertFromBase(
    consolidated.balanceBase,
    consolidatedCurrency,
    exchangeRate,
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">
              Resumen financiero {copy.titleSuffix}
            </CardTitle>
            <CardDescription>
              Balance entre ventas y gastos, desglosado por moneda
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currencyRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay ventas ni gastos registrados en este período.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Desglose por moneda */}
            <div className="flex flex-col gap-4">
              {/* Barra con el conmutador de vista: solo aporta con >1 moneda. */}
              {currencyRows.length > 1 ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-card-foreground">
                    Desglose por moneda
                  </span>
                  <div className="inline-flex items-center rounded-md border border-border p-0.5">
                    <Button
                      type="button"
                      variant={currencyView === "full" ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => setCurrencyView("full")}
                      aria-label="Vista de una columna"
                      aria-pressed={currencyView === "full"}
                    >
                      <List className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={currencyView === "grid" ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => setCurrencyView("grid")}
                      aria-label="Vista de dos columnas"
                      aria-pressed={currencyView === "grid"}
                    >
                      <LayoutGrid className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              <div
                className={cn(
                  "grid gap-4",
                  // Solo dividimos en dos columnas si hay más de una moneda; con
                  // una sola, la card ocupa el ancho completo aunque quede "grid"
                  // recordado de una sesión previa.
                  currencyView === "grid" && currencyRows.length > 1
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1",
                )}
              >
                {currencyRows.map((row) => (
                  <CurrencyBreakdownCard key={row.currency} row={row} />
                ))}
              </div>
            </div>

            {/* Equivalente consolidado (CUP por defecto, conmutable) */}
            {showConsolidated ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-card-foreground">
                    Equivalente consolidado
                  </span>
                  <Select
                    value={consolidatedCurrency}
                    onValueChange={setConsolidatedCurrency}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-auto min-w-32"
                      aria-label="Moneda del consolidado"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCurrencies.map((code) => (
                        <SelectItem key={code} value={code}>
                          {currencyLabel(code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <BreakdownRows
                  income={consolidatedIncome}
                  expense={consolidatedExpense}
                  balance={consolidatedBalanceInCurrency}
                  currency={consolidatedCurrency}
                />
                {consolidated.hasUnconvertible ? (
                  <div className="flex items-start gap-2 rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Hay monedas con movimiento sin tipo de cambio configurado,
                      por lo que no se incluyen en el consolidado. Configúralo en{" "}
                      <Link
                        href="/dashboard/exchange-rate"
                        className="underline-offset-2 hover:underline"
                      >
                        Tipo de cambio
                      </Link>
                      .
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Veredicto del período (usa el balance consolidado en CUP) */}
            <div className="flex justify-end">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  consolidatedBalance >= 0
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-destructive/20 bg-destructive/10 text-destructive",
                )}
              >
                <CalendarCheck className="mr-1 h-3 w-3" />
                {consolidatedBalance >= 0
                  ? `${copy.verdictNoun} con ganancia`
                  : `${copy.verdictNoun} con pérdida`}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
