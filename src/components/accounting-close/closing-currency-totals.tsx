"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"

import { BASE_CURRENCY, currencyLabel, formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"

export interface ClosingCurrencyAmount {
  currency: string
  amount: number
}

interface ClosingCurrencyTotalsProps {
  title: string
  /** Subtotal por cada moneda con movimiento (en su propia moneda). */
  rows: ClosingCurrencyAmount[]
  /** Equivalente consolidado en CUP de todas las monedas convertibles. */
  consolidatedBase: number
  /** Hay monedas con movimiento sin tasa configurada (excluidas del consolidado). */
  hasUnconvertible: boolean
  /** Colorea el monto según sea ingreso (verde) o gasto (rojo). */
  tone: "income" | "expense"
}

/**
 * Pie de tabla de cierre con desglose por moneda + equivalente consolidado en CUP.
 * Sustituye al total plano de una sola moneda: cada moneda muestra su subtotal y,
 * cuando hay más de una (o una distinta de CUP), se añade la línea consolidada.
 */
export function ClosingCurrencyTotals({
  title,
  rows,
  consolidatedBase,
  hasUnconvertible,
  tone,
}: ClosingCurrencyTotalsProps) {
  const amountClass =
    tone === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-destructive"

  // El consolidado solo aporta información cuando hay mezcla de monedas o una
  // única moneda que no es la base: con "todo CUP" el subtotal ya es el total.
  const showConsolidated =
    rows.length > 1 || (rows.length === 1 && rows[0].currency !== BASE_CURRENCY)

  return (
    <div className="flex flex-col gap-2 border-t border-border px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-card-foreground">{title}</span>
        {rows.length === 0 ? (
          <span className={cn("text-base font-bold tabular-nums", amountClass)}>
            {formatMoney(0, BASE_CURRENCY)}
          </span>
        ) : null}
      </div>

      {rows.map((row) => (
        <div
          key={row.currency}
          className="flex items-center justify-between gap-3 pl-3"
        >
          <span className="text-xs text-muted-foreground">
            {currencyLabel(row.currency)}
          </span>
          <span className={cn("text-sm font-semibold tabular-nums", amountClass)}>
            {formatMoney(row.amount, row.currency)}
          </span>
        </div>
      ))}

      {showConsolidated ? (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            Equivalente en {BASE_CURRENCY}
          </span>
          <span className={cn("text-base font-bold tabular-nums", amountClass)}>
            {formatMoney(consolidatedBase, BASE_CURRENCY)}
          </span>
        </div>
      ) : null}

      {hasUnconvertible ? (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Hay monedas sin tasa configurada; no se incluyen en el equivalente en{" "}
            {BASE_CURRENCY}. Configúralo en{" "}
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
  )
}
