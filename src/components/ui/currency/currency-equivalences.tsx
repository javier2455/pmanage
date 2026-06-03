"use client";

import { useCurrency } from "@/context/currency-context";
import { DisplayCurrency, formatFromCUP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface CurrencyEquivalencesProps {
  valueCUP: number;
  /** Moneda a excluir de la lista (la que ya se muestra como principal). */
  exclude?: DisplayCurrency;
  className?: string;
}

/**
 * Muestra el mismo valor en las demás monedas disponibles, separadas por "·".
 * No renderiza nada si no hay otras monedas con tasa.
 */
export function CurrencyEquivalences({
  valueCUP,
  exclude,
  className,
}: CurrencyEquivalencesProps) {
  const { available, rates } = useCurrency();
  const others = available.filter((c) => c !== exclude);

  if (others.length === 0) return null;

  return (
    <span className={cn("text-xs text-muted-foreground tabular-nums", className)}>
      {others
        .map((c) => formatFromCUP(Number(valueCUP) || 0, rates, c))
        .join(" · ")}
    </span>
  );
}
