"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useActiveExchangeRates } from "@/hooks/use-exchange";
import {
  DisplayCurrency,
  Rates,
  availableCurrencies,
  convertFromCUP,
  formatFromCUP,
  FormatMoneyOptions,
} from "@/lib/utils/currency";

const STORAGE_KEY = "displayCurrency";

type CurrencyContextType = {
  /** Moneda de visualización elegida globalmente. */
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  /** Tasas del negocio activo (o null). */
  rates: Rates;
  isLoading: boolean;
  /** Monedas disponibles según las tasas (siempre incluye CUP). */
  available: DisplayCurrency[];
  /** Formatea un valor en CUP usando la moneda de visualización global. */
  format: (valueCUP: number, options?: FormatMoneyOptions) => string;
  /** Convierte un valor en CUP a una moneda concreta (null si no hay tasa). */
  convert: (valueCUP: number, currency?: DisplayCurrency) => number | null;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { rates, isLoading } = useActiveExchangeRates();
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>("CUP");

  // Cargar preferencia persistida
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as DisplayCurrency | null;
    if (stored === "CUP" || stored === "USD" || stored === "EUR") {
      setDisplayCurrencyState(stored);
    }
  }, []);

  const available = useMemo(() => availableCurrencies(rates), [rates]);

  // Si la moneda elegida deja de estar disponible (tasa borrada/null), caer a CUP.
  useEffect(() => {
    if (isLoading) return;
    if (!available.includes(displayCurrency)) {
      setDisplayCurrencyState("CUP");
    }
  }, [available, displayCurrency, isLoading]);

  const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
    setDisplayCurrencyState(currency);
    localStorage.setItem(STORAGE_KEY, currency);
  }, []);

  const format = useCallback(
    (valueCUP: number, options?: FormatMoneyOptions) =>
      formatFromCUP(valueCUP, rates, displayCurrency, options),
    [rates, displayCurrency],
  );

  const convert = useCallback(
    (valueCUP: number, currency: DisplayCurrency = displayCurrency) =>
      convertFromCUP(valueCUP, rates, currency),
    [rates, displayCurrency],
  );

  const value = useMemo<CurrencyContextType>(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      rates,
      isLoading,
      available,
      format,
      convert,
    }),
    [displayCurrency, setDisplayCurrency, rates, isLoading, available, format, convert],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return context;
}
