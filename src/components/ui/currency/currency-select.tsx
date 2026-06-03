"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/context/currency-context";
import { CURRENCY_SUFFIX, DisplayCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  /**
   * Modo global: lee y escribe la moneda de visualización del contexto.
   * Cambia todos los precios de la app que usen `format()`.
   */
  global?: boolean;
  /** Modo controlado: valor actual. Ignorado si `global`. */
  value?: DisplayCurrency;
  /** Modo controlado: callback de cambio. Ignorado si `global`. */
  onChange?: (currency: DisplayCurrency) => void;
  /**
   * Monedas a ofrecer. Por defecto las disponibles según las tasas.
   * Siempre incluye al menos CUP.
   */
  options?: DisplayCurrency[];
  className?: string;
  size?: "sm" | "default";
  disabled?: boolean;
}

/**
 * Selector compacto de moneda (CUP/USD/EUR). Solo muestra las monedas con tasa
 * disponible. Si solo está CUP, se renderiza deshabilitado.
 */
export function CurrencySelect({
  global = false,
  value,
  onChange,
  options,
  className,
  size = "sm",
  disabled,
}: CurrencySelectProps) {
  const { displayCurrency, setDisplayCurrency, available } = useCurrency();

  const list = options ?? available;
  const current = global ? displayCurrency : value ?? list[0] ?? "CUP";

  const handleChange = (next: string) => {
    const currency = next as DisplayCurrency;
    if (global) setDisplayCurrency(currency);
    else onChange?.(currency);
  };

  const isDisabled = disabled || list.length <= 1;

  return (
    <Select value={current} onValueChange={handleChange} disabled={isDisabled}>
      <SelectTrigger
        size={size}
        className={cn("min-w-[5.5rem]", className)}
        aria-label="Seleccionar moneda"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {list.map((c) => (
          <SelectItem key={c} value={c}>
            {CURRENCY_SUFFIX[c]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
