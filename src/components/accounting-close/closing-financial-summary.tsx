"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, BarChart3, CalendarCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { BASE_CURRENCY, currencyLabel, formatMoney } from "@/lib/currency"
import {
  consolidateClosing,
  groupClosingByCurrency,
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
}

const PERIOD_COPY = {
  daily: { titleSuffix: "del día", verdictNoun: "Día" },
  monthly: { titleSuffix: "del mes", verdictNoun: "Mes" },
} as const

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
 * Resumen financiero del cierre con desglose por moneda + equivalente
 * consolidado en CUP. Reemplaza el balance plano (que sumaba monedas distintas
 * como si fueran una) por subtotales fieles a cada moneda y un consolidado
 * único calculado con el tipo de cambio del negocio.
 */
export function ClosingFinancialSummary({
  sales,
  expenses,
  businessId,
  period,
}: ClosingFinancialSummaryProps) {
  const copy = PERIOD_COPY[period]
  const { data: exchangeData } = useExchangeRate(businessId)
  const exchangeRate = exchangeData?.data

  const { currencyRows, consolidated } = React.useMemo(() => {
    const rows = groupClosingByCurrency(sales, expenses)
    return { currencyRows: rows, consolidated: consolidateClosing(rows, exchangeRate) }
  }, [sales, expenses, exchangeRate])

  // Con una sola moneda base (CUP), desglose y consolidado coinciden: evitamos
  // duplicar el bloque en CUP y mostramos solo el desglose.
  const showConsolidated =
    currencyRows.length > 1 ||
    (currencyRows.length === 1 && currencyRows[0].currency !== BASE_CURRENCY)

  const consolidatedBalance = consolidated.balanceBase

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
            <div className="flex flex-col gap-5">
              {currencyRows.map((row) => (
                <div key={row.currency} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold">
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
              ))}
            </div>

            {/* Equivalente consolidado en CUP */}
            {showConsolidated ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-card-foreground">
                    Equivalente consolidado ({BASE_CURRENCY})
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <BreakdownRows
                  income={consolidated.incomeBase}
                  expense={consolidated.expenseBase}
                  balance={consolidatedBalance}
                  currency={BASE_CURRENCY}
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
