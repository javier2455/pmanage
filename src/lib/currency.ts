/**
 * Utilidades de moneda para ventas/pagos multimoneda.
 *
 * Riesgo de naming (ver docs/guia-implementacion-multimoneda.md §6): la pantalla
 * de tasas (`MonetaryExchange`) tipa columnas fijas (`USD`, `EURO`,
 * `CUP_TRANSFERENCIA`, `CLASICA`, `MLC`), mientras los pagos usan códigos de
 * moneda genéricos (`USD`, `CUP`, `EURO`, `MLC`…). Centralizamos aquí la
 * derivación de monedas disponibles para no acoplar la UI a una lista fija.
 */

export const BASE_CURRENCY = "CUP";

/**
 * Monedas que en realidad son CUP con recargo: el precio sigue denominado en CUP
 * y su "tasa" es un multiplicador (p. ej. transferencia 1.1 = +10%), NO cuántos
 * CUP vale 1 unidad. Por eso convierten al revés que una moneda extranjera:
 * base → moneda multiplica (montoCUP × tasa) en vez de dividir.
 * `CLASICA` NO entra aquí: se trata como moneda normal (divide). Decisión de
 * producto, ver issue de cálculo de CUP transferencia.
 */
export const CUP_DENOMINATED_CURRENCIES = ["CUP_TRANSFERENCIA"] as const;

/** ¿La moneda es CUP con recargo (multiplica) en vez de extranjera (divide)? */
export function isCupDenominated(currency: string): boolean {
  return (CUP_DENOMINATED_CURRENCIES as readonly string[]).includes(currency);
}

/**
 * Mapeo de moneda entre la forma interna y la que el backend espera en
 * ventas/pagos. Internamente usamos la clave de columna de `MonetaryExchange`
 * (`CUP_TRANSFERENCIA`, en mayúsculas) para buscar tasas; pero el backend modela
 * la transferencia en CUP como el enum snake_case `cup_transferencia` (igual que
 * el resto de enums: `cash`, `transfer`, `in_store`…). Para no acoplar la UI a
 * esa diferencia traducimos solo en la frontera de la API (ver src/lib/api/sale).
 * Las demás monedas (USD, EURO, MLC…) pasan sin cambios.
 */
const CURRENCY_WIRE_BY_INTERNAL: Record<string, string> = {
  CUP_TRANSFERENCIA: "cup_transferencia",
};
const CURRENCY_INTERNAL_BY_WIRE: Record<string, string> = Object.fromEntries(
  Object.entries(CURRENCY_WIRE_BY_INTERNAL).map(([internal, wire]) => [wire, internal]),
);

/** Código interno → valor de moneda que espera el backend (ventas/pagos). */
export function toBackendCurrency(currency: string): string {
  return CURRENCY_WIRE_BY_INTERNAL[currency] ?? currency;
}

/** Valor de moneda del backend → código interno canónico (mayúsculas). */
export function fromBackendCurrency(currency: string): string {
  return CURRENCY_INTERNAL_BY_WIRE[currency] ?? currency;
}

/**
 * Códigos de moneda que pueden venir como columnas en MonetaryExchange.
 * El usuario activa las que use dándoles una tasa > 0; las que queden en 0 no se
 * consideran operables. `CUP_TRANSFERENCIA` y `CLASICA` se tratan como monedas
 * más (decisión de producto), no como variantes ocultas de CUP.
 */
export const KNOWN_CURRENCY_CODES = [
  "USD",
  "EURO",
  "CUP_TRANSFERENCIA",
  "CLASICA",
  "MLC",
  "CAD",
  "GBP",
  "CHF",
  "MXN",
  "JPY",
] as const;

export type ExchangeCurrencyCode = (typeof KNOWN_CURRENCY_CODES)[number];

/** Metadata de presentación de cada moneda configurable en MonetaryExchange. */
export const EXCHANGE_CURRENCIES: { code: ExchangeCurrencyCode; label: string }[] = [
  { code: "USD", label: "Dólar estadounidense" },
  { code: "EURO", label: "Euro" },
  { code: "CUP_TRANSFERENCIA", label: "CUP Transferencia" },
  { code: "CLASICA", label: "Tarjeta Clásica" },
  { code: "MLC", label: "MLC" },
  { code: "CAD", label: "Dólar canadiense" },
  { code: "GBP", label: "Libra esterlina" },
  { code: "CHF", label: "Franco suizo" },
  { code: "MXN", label: "Peso mexicano" },
  { code: "JPY", label: "Yen japonés" },
];

/** Objeto de tasas tolerante: valores pueden venir como número o string. */
export type ExchangeRateLike = Record<string, unknown> | null | undefined;

/** Coerciona a número; las tasas pueden venir como string desde el backend. */
function toNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Monedas seleccionables: `CUP` siempre + las monedas reales con tasa > 0.
 * `exchangeRate` es el objeto interno de tasas (p. ej. `useExchangeRate().data?.data`).
 */
export function getAvailableCurrencies(exchangeRate: ExchangeRateLike): string[] {
  const currencies: string[] = [BASE_CURRENCY];
  if (exchangeRate) {
    for (const code of KNOWN_CURRENCY_CODES) {
      if (toNumber(exchangeRate[code]) > 0) currencies.push(code);
    }
  }
  return currencies;
}

/**
 * Tasa de una moneda: cuántas CUP vale 1 unidad de esa moneda.
 * `CUP` → 1. Devuelve `null` si la moneda no está configurada (tasa <= 0).
 */
export function getCurrencyRate(
  exchangeRate: ExchangeRateLike,
  currency: string,
): number | null {
  if (currency === BASE_CURRENCY) return 1;
  if (!exchangeRate) return null;
  const rate = toNumber(exchangeRate[currency]);
  return rate > 0 ? rate : null;
}

/**
 * Convierte un precio guardado en CUP a la moneda de la venta.
 * Moneda extranjera: `montoCUP / tasa`. Moneda CUP con recargo (transferencia):
 * `montoCUP × tasa`, porque la tasa es un multiplicador, no CUP/unidad.
 * Si la moneda es CUP o no hay tasa, devuelve el monto sin convertir (defensivo).
 */
export function convertFromBase(
  montoCUP: number,
  currency: string,
  exchangeRate: ExchangeRateLike,
): number {
  if (currency === BASE_CURRENCY) return montoCUP;
  const rate = getCurrencyRate(exchangeRate, currency);
  if (!rate) return montoCUP;
  return isCupDenominated(currency) ? montoCUP * rate : montoCUP / rate;
}

/**
 * Convierte un monto en una moneda dada de vuelta a CUP (operación inversa de
 * `convertFromBase`). Extranjera: `monto × tasa`. CUP con recargo: `monto / tasa`.
 * Defensivo: CUP o sin tasa → devuelve el monto sin convertir.
 */
export function convertToBase(
  monto: number,
  currency: string,
  exchangeRate: ExchangeRateLike,
): number {
  if (currency === BASE_CURRENCY) return monto;
  const rate = getCurrencyRate(exchangeRate, currency);
  if (!rate) return monto;
  return isCupDenominated(currency) ? monto / rate : monto * rate;
}

/**
 * Convierte un monto de una moneda a otra usando CUP como puente.
 * Útil para previsualizar el `equivalente` de un pago a la moneda base de la venta.
 * Se apoya en `convertToBase`/`convertFromBase` para respetar la dirección de cada
 * moneda (extranjera divide, CUP con recargo multiplica). `null` si falta tasa.
 */
export function convertBetween(
  monto: number,
  from: string,
  to: string,
  exchangeRate: ExchangeRateLike,
): number | null {
  const fromRate = getCurrencyRate(exchangeRate, from);
  const toRate = getCurrencyRate(exchangeRate, to);
  if (fromRate == null || toRate == null) return null;
  return convertFromBase(convertToBase(monto, from, exchangeRate), to, exchangeRate);
}

/**
 * Formatea un monto con el código de moneda como sufijo (ej. "1,234.50 USD").
 * No usamos `Intl` con `style: "currency"` porque `EURO`/`MLC` no son ISO 4217.
 */
export function formatMoney(value: number, currency: string = BASE_CURRENCY): string {
  const formatted = (Number.isFinite(value) ? value : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}
