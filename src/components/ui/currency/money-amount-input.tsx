"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { CurrencySelect } from "@/components/ui/currency/currency-select";
import { useCurrency } from "@/context/currency-context";
import {
  DisplayCurrency,
  convertToCUP,
  formatMoney,
  getRate,
} from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface MoneyAmountInputProps {
  id?: string;
  /** Valor inicial en CUP (p. ej. autocompletado). Se interpreta como CUP. */
  initialCUP?: number;
  /** Notifica el valor convertido a CUP en cada cambio. */
  onChangeCUP: (valueCUP: number) => void;
  /** Al cambiar este valor, el input se limpia (idiomático para reset). */
  resetKey?: unknown;
  placeholder?: string;
  min?: number;
  step?: number | string;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * Input de monto con selector de moneda. El usuario escribe en CUP/USD/EUR y el
 * componente reporta SIEMPRE el valor convertido a CUP (que es lo que se guarda).
 * Muestra un preview en vivo de la conversión y la tasa usada.
 * Si no hay tasas definidas, se comporta como un input CUP normal.
 */
export function MoneyAmountInput({
  id,
  initialCUP,
  onChangeCUP,
  resetKey,
  placeholder = "0.00",
  min = 0,
  step = "0.01",
  disabled,
  hasError,
}: MoneyAmountInputProps) {
  const { available, rates } = useCurrency();
  const [currency, setCurrency] = useState<DisplayCurrency>("CUP");
  const [amount, setAmount] = useState<string>(
    initialCUP != null && initialCUP > 0 ? String(initialCUP) : "",
  );

  const onChangeRef = useRef(onChangeCUP);
  const initialRef = useRef(initialCUP);
  useEffect(() => {
    onChangeRef.current = onChangeCUP;
    initialRef.current = initialCUP;
  });

  // Reset / re-seed externo: al cambiar resetKey, rellena con initialCUP (en CUP)
  // si se proporciona —p. ej. autocompletado por proveedor— o limpia el campo.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    const seed = initialRef.current;
    setAmount(seed != null && seed > 0 ? String(seed) : "");
    setCurrency("CUP");
  }, [resetKey]);

  // Si la moneda elegida deja de estar disponible, volver a CUP.
  useEffect(() => {
    if (!available.includes(currency)) setCurrency("CUP");
  }, [available, currency]);

  function emit(nextAmount: string, nextCurrency: DisplayCurrency) {
    const num = Number(nextAmount);
    const cup = Number.isFinite(num) ? convertToCUP(num, rates, nextCurrency) : 0;
    onChangeRef.current(cup);
  }

  function handleAmount(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    emit(e.target.value, currency);
  }

  function handleCurrency(next: DisplayCurrency) {
    setCurrency(next);
    emit(amount, next);
  }

  const numAmount = Number(amount);
  const showPreview =
    currency !== "CUP" && Number.isFinite(numAmount) && numAmount > 0;
  const rate = getRate(rates, currency);
  const cupValue = showPreview ? convertToCUP(numAmount, rates, currency) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          placeholder={placeholder}
          value={amount}
          onChange={handleAmount}
          disabled={disabled}
          aria-invalid={hasError ? "true" : "false"}
          className={cn("flex-1")}
        />
        <CurrencySelect
          value={currency}
          onChange={handleCurrency}
          options={available}
          disabled={disabled}
        />
      </div>

      {showPreview && rate != null && (
        <p className="text-xs text-muted-foreground">
          ≈{" "}
          <span className="font-medium text-card-foreground tabular-nums">
            {formatMoney(cupValue, "CUP")}
          </span>{" "}
          · 1 {currency} = {formatMoney(rate, "CUP", { withSuffix: false })}
        </p>
      )}

      {available.length <= 1 && (
        <p className="text-xs text-muted-foreground">
          ¿Pagaste en USD/EUR?{" "}
          <Link
            href="/dashboard/exchange-rate"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Define las tasas
          </Link>{" "}
          para registrar precios en otras monedas.
        </p>
      )}
    </div>
  );
}
