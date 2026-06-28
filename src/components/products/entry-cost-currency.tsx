"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BASE_CURRENCY,
  convertToBase,
  formatMoney,
  getCurrencyRate,
  type ExchangeRateLike,
} from "@/lib/currency";

interface EntryCostCurrencyProps {
  /** Moneda seleccionada del costo (`CUP`, `USD`, `EURO`…). */
  currency: string;
  onCurrencyChange: (currency: string) => void;
  /** Monedas seleccionables, derivadas de `getAvailableCurrencies(exchange)`. */
  availableCurrencies: string[];
  /** Costo ingresado por el usuario, en la moneda seleccionada. */
  entryPrice: number;
  /** Objeto de tasas (`useExchangeRate().data?.data`). */
  exchangeRate: ExchangeRateLike;
}

/**
 * Selector de moneda + preview del costo convertido a CUP, compartido entre
 * "Asignar producto" y "Agregar stock". La conversión usa la tasa de
 * `MonetaryExchange`; esa misma tasa se envía al backend como
 * `exchangeRateApplied` desde el formulario. Ver docs/multimoneda-productos.md.
 */
export function EntryCostCurrency({
  currency,
  onCurrencyChange,
  availableCurrencies,
  entryPrice,
  exchangeRate,
}: EntryCostCurrencyProps) {
  const isBase = currency === BASE_CURRENCY;
  const rate = getCurrencyRate(exchangeRate, currency);
  const hasAmount = Number.isFinite(entryPrice) && entryPrice > 0;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="entry-currency" className="text-card-foreground">
        Moneda del costo
      </Label>
      <Select value={currency} onValueChange={onCurrencyChange}>
        <SelectTrigger id="entry-currency" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableCurrencies.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Moneda no base sin tasa configurada: avisar y enlazar a Tasas de cambio. */}
      {!isBase && rate == null && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            La moneda {currency} no tiene tasa configurada.{" "}
            <Link
              href="/dashboard/exchange-rate"
              className="font-medium underline-offset-2 hover:underline"
            >
              Configúrala en Tasas de cambio →
            </Link>
          </span>
        </p>
      )}

      {/* Preview de conversión a CUP cuando hay tasa y monto. */}
      {!isBase && rate != null && hasAmount && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowRight className="h-3 w-3 text-primary" />
          <span>
            Se guardará como{" "}
            <span className="font-semibold text-card-foreground">
              {formatMoney(convertToBase(entryPrice, currency, exchangeRate), BASE_CURRENCY)}
            </span>{" "}
            (tasa {rate})
          </span>
        </p>
      )}
    </div>
  );
}
