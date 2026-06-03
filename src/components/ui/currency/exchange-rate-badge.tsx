"use client";

import Link from "next/link";
import { useCurrency } from "@/context/currency-context";
import { getRate } from "@/lib/utils/currency";

/**
 * Badge compacto en la barra superior con las tasas vigentes (USD/EUR).
 * Solo muestra las monedas con tasa definida; oculto si no hay ninguna.
 */
export function ExchangeRateBadge() {
  const { rates } = useCurrency();

  const usd = getRate(rates, "USD");
  const eur = getRate(rates, "EUR");

  if (usd == null && eur == null) return null;

  return (
    <Link
      href="/dashboard/exchange-rate"
      className="hidden items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
      title="Ver y actualizar tasas de cambio"
    >
      {usd != null && (
        <span className="tabular-nums">
          USD <span className="font-semibold text-foreground">{usd}</span>
        </span>
      )}
      {usd != null && eur != null && <span className="text-border">·</span>}
      {eur != null && (
        <span className="tabular-nums">
          EUR <span className="font-semibold text-foreground">{eur}</span>
        </span>
      )}
    </Link>
  );
}
