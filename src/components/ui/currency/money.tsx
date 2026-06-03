"use client";

import { useCurrency } from "@/context/currency-context";
import { DisplayCurrency, FormatMoneyOptions, formatFromCUP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface MoneyProps {
  /** Valor en CUP (moneda base de almacenamiento). */
  valueCUP: number;
  /**
   * Moneda en la que mostrar. Si se omite, usa la moneda global del contexto.
   * Útil en diálogos con toggle local.
   */
  currency?: DisplayCurrency;
  className?: string;
  options?: FormatMoneyOptions;
}

/**
 * Muestra un valor (almacenado en CUP) en la moneda de visualización elegida.
 * Pensado para usarse dentro de celdas de tabla y vistas que deben reaccionar
 * al selector de moneda.
 */
export function Money({ valueCUP, currency, className, options }: MoneyProps) {
  const { displayCurrency, rates } = useCurrency();
  const target = currency ?? displayCurrency;
  return (
    <span className={cn("tabular-nums", className)}>
      {formatFromCUP(Number(valueCUP) || 0, rates, target, options)}
    </span>
  );
}
