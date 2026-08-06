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
  currencyLabel,
  formatMoney,
  getCurrencyRate,
  type ExchangeRateLike,
} from "@/lib/currency";

interface AmountCurrencyFieldProps {
  /**
   * `id` del selector. Hay que pasarlo cuando conviven dos selectores en el mismo
   * formulario (costo y precio de venta al asignar un producto): con el `id` por
   * defecto repetido, la etiqueta del segundo enfocaría el select del primero.
   */
  id?: string;
  /** Etiqueta visible del selector. */
  label?: string;
  /** Moneda seleccionada del importe (`CUP`, `USD`, `EURO`…). */
  currency: string;
  onCurrencyChange: (currency: string) => void;
  /** Monedas seleccionables, derivadas de `getAvailableCurrencies(exchange)`. */
  availableCurrencies: string[];
  /** Importe ingresado por el usuario, en la moneda seleccionada. */
  amount: number;
  /** Objeto de tasas (`useExchangeRate().data?.data`). */
  exchangeRate: ExchangeRateLike;
}

/**
 * Selector de moneda + preview del importe convertido a CUP. Lo comparten el
 * costo de entrada ("Asignar producto", "Agregar stock") y el precio de venta
 * ("Asignar producto", "Editar producto"), porque en los cuatro casos el importe
 * se ingresa en la moneda que el usuario maneja pero se persiste en CUP.
 *
 * Quién hace la conversión difiere y el formulario debe saberlo: el **costo** lo
 * convierte el backend a partir de `currency` + `exchangeRateApplied`; el
 * **precio de venta** lo convierte el propio formulario antes de enviar, porque
 * el endpoint no acepta moneda (ver docs/moneda-precio-venta.md).
 */
export function AmountCurrencyField({
  id = "entry-currency",
  label = "Moneda del costo",
  currency,
  onCurrencyChange,
  availableCurrencies,
  amount,
  exchangeRate,
}: AmountCurrencyFieldProps) {
  const isBase = currency === BASE_CURRENCY;
  const rate = getCurrencyRate(exchangeRate, currency);
  const hasAmount = Number.isFinite(amount) && amount > 0;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-card-foreground">
        {label}
      </Label>
      <Select value={currency} onValueChange={onCurrencyChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableCurrencies.map((c) => (
            <SelectItem key={c} value={c}>
              {currencyLabel(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Moneda no base sin tasa configurada: avisar y enlazar a Tasas de cambio. */}
      {!isBase && rate == null && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            La moneda {currencyLabel(currency)} no tiene tasa configurada.{" "}
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
              {formatMoney(convertToBase(amount, currency, exchangeRate), BASE_CURRENCY)}
            </span>{" "}
            (tasa {rate})
          </span>
        </p>
      )}
    </div>
  );
}
