import { ExchangeRateTypeOne } from "@/lib/types/exchange-rate";

/**
 * Monedas que el usuario puede elegir para ingresar o visualizar precios.
 * CUP es la moneda nacional y la base en la que el sistema almacena todos los valores.
 */
export type DisplayCurrency = "CUP" | "USD" | "EUR";

export const DISPLAY_CURRENCIES: DisplayCurrency[] = ["CUP", "USD", "EUR"];

/**
 * Tasas de cambio del negocio activo. Puede ser null/undefined mientras carga
 * o cuando el usuario aún no ha definido ninguna tasa.
 */
export type Rates = ExchangeRateTypeOne | null | undefined;

export const CURRENCY_LABEL: Record<DisplayCurrency, string> = {
  CUP: "CUP (MN)",
  USD: "Dólares (USD)",
  EUR: "Euros (EUR)",
};

/** Etiqueta corta para mostrar junto al valor. */
export const CURRENCY_SUFFIX: Record<DisplayCurrency, string> = {
  CUP: "CUP",
  USD: "USD",
  EUR: "EUR",
};

/**
 * Convención de la tasa (ver pantalla "Tasa de cambio": "USD a MN"):
 * el valor guardado es cuántos CUP vale 1 unidad de la moneda extranjera.
 * Ej: USD = 400  =>  1 USD = 400 CUP.
 *
 *   CUP -> moneda:  valorCUP / tasa
 *   moneda -> CUP:  monto * tasa
 */
function rawRate(rates: Rates, currency: DisplayCurrency): number | null {
  if (currency === "CUP") return 1;
  if (!rates) return null;
  // El API puede devolver las tasas como string; coercionamos a número.
  const raw = currency === "USD" ? rates.USD : rates.EURO;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Tasa válida (CUP por 1 unidad) o null si no está disponible. */
export function getRate(rates: Rates, currency: DisplayCurrency): number | null {
  return rawRate(rates, currency);
}

/** ¿Hay tasa válida para esta moneda? CUP siempre disponible. */
export function isCurrencyAvailable(rates: Rates, currency: DisplayCurrency): boolean {
  return rawRate(rates, currency) !== null;
}

/**
 * Lista de monedas disponibles. Siempre incluye CUP; añade USD/EUR solo si su
 * tasa existe y es válida (> 0). Cubre el caso de usuarios sin tasas definidas.
 */
export function availableCurrencies(rates: Rates): DisplayCurrency[] {
  return DISPLAY_CURRENCIES.filter((c) => isCurrencyAvailable(rates, c));
}

/** Convierte un valor en CUP a la moneda indicada. null si no hay tasa. */
export function convertFromCUP(
  valueCUP: number,
  rates: Rates,
  currency: DisplayCurrency,
): number | null {
  const rate = rawRate(rates, currency);
  if (rate === null) return null;
  return valueCUP / rate;
}

/**
 * Convierte un monto ingresado en `currency` a CUP, para guardar en el backend.
 * Si la moneda no tiene tasa válida, devuelve el monto tal cual (fallback CUP).
 */
export function convertToCUP(
  amount: number,
  rates: Rates,
  currency: DisplayCurrency,
): number {
  const rate = rawRate(rates, currency);
  if (rate === null) return amount;
  return amount * rate;
}

export interface FormatMoneyOptions {
  /** Mostrar el sufijo de moneda (CUP/USD/EUR). Default: true. */
  withSuffix?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formatea un número ya expresado en `currency`. No realiza conversión.
 * CUP -> "$1.234,56 CUP", USD -> "US$1,234.56 USD", EUR -> "€1.234,56 EUR".
 */
export function formatMoney(
  value: number,
  currency: DisplayCurrency = "CUP",
  options: FormatMoneyOptions = {},
): string {
  const {
    withSuffix = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (!Number.isFinite(value)) value = 0;

  const symbol = currency === "EUR" ? "€" : "$";
  const locale = currency === "USD" ? "en-US" : "es-CO";

  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const base = `${symbol}${formatted}`;
  return withSuffix ? `${base} ${CURRENCY_SUFFIX[currency]}` : base;
}

/**
 * Convierte un valor en CUP a `currency` y lo formatea. Si no hay tasa para la
 * moneda pedida, cae a CUP (formatea el valor original).
 */
export function formatFromCUP(
  valueCUP: number,
  rates: Rates,
  currency: DisplayCurrency,
  options: FormatMoneyOptions = {},
): string {
  const converted = convertFromCUP(valueCUP, rates, currency);
  if (converted === null) return formatMoney(valueCUP, "CUP", options);
  return formatMoney(converted, currency, options);
}
