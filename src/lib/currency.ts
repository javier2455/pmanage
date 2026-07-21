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
 * Mapeo de moneda entre la forma interna y la que el backend espera en
 * ventas/pagos. Internamente (UI, tasas, recargo) usamos siempre la clave de
 * columna de `MonetaryExchange` `CUP_TRANSFERENCIA` (mayúsculas) y la mostramos
 * como "CUP Transferencia"; pero el backend espera recibir el enum snake_case
 * `cup_transferencia`. Por eso traducimos a `cup_transferencia` SOLO en la
 * frontera de la API al enviar (ver src/lib/api/sale), nunca en la UI. Las demás
 * monedas (USD, EURO, MLC…) pasan sin cambios.
 */
const CURRENCY_WIRE_BY_INTERNAL: Record<string, string> = {
  CUP_TRANSFERENCIA: "cup_transferencia",
};
// Inversa para leer respuestas del backend. El backend devuelve la transferencia
// en CUP TRUNCADA al largo de su columna: en la práctica vuelve como `cup_transf`
// (10 chars), pero podría venir como `cup_transfer` o `cup_transferencia` según el
// dato. Por eso, además del mapeo directo, `fromBackendCurrency` reconoce cualquier
// prefijo `cup_transf…` como esta moneda. Si no se normaliza, la moneda aparece
// cruda/duplicada en los selectores y su conversión se rompe (la tasa se indexa por
// `CUP_TRANSFERENCIA`, así que un alias sin normalizar no la halla).
const CURRENCY_INTERNAL_BY_WIRE: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(CURRENCY_WIRE_BY_INTERNAL).map(([internal, wire]) => [wire, internal]),
  ),
  cup_transf: "CUP_TRANSFERENCIA",
  cup_transfer: "CUP_TRANSFERENCIA",
};

/** Prefijo con el que el backend nombra (posiblemente truncada) la transferencia en CUP. */
const CUP_TRANSFER_WIRE_PREFIX = "cup_transf";

/** Código interno → valor de moneda que espera el backend (ventas/pagos). */
export function toBackendCurrency(currency: string): string {
  return CURRENCY_WIRE_BY_INTERNAL[currency] ?? currency;
}

/**
 * Valor de moneda del backend → código interno canónico (mayúsculas).
 * Tolerante a may/minúsculas y a truncación: los enums del backend son snake_case
 * en minúsculas, y la transferencia en CUP vuelve recortada (`cup_transf`) o entera
 * (`cup_transferencia`). Cualquier prefijo `cup_transf…` colapsa a
 * `CUP_TRANSFERENCIA`.
 *
 * El resto de monedas se pasan a mayúsculas SIEMPRE. No basta con devolverlas tal
 * cual: el cierre diario/mensual las normaliza a minúsculas antes de responder
 * (`normalizeCurrency` en sale.service.ts), así que llegan como `cup`/`usd`/`euro`.
 * Sin este toUpperCase, `getCurrencyRate` compara `"cup" === "CUP"` (falso) e indexa
 * `exchangeRate["usd"]` (las tasas van en mayúsculas), de modo que NINGUNA moneda
 * resultaba convertible: el equivalente en CUP salía 0 y se disparaba el aviso de
 * "sin tasa configurada" aunque las tasas estuvieran bien configuradas.
 */
export function fromBackendCurrency(currency: string): string {
  if (!currency) return currency;
  const lower = currency.toLowerCase();
  const direct = CURRENCY_INTERNAL_BY_WIRE[currency] ?? CURRENCY_INTERNAL_BY_WIRE[lower];
  if (direct) return direct;
  if (lower.startsWith(CUP_TRANSFER_WIRE_PREFIX)) return "CUP_TRANSFERENCIA";
  return currency.toUpperCase();
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
 * Convierte un precio guardado en CUP a la moneda de la venta: `montoCUP / tasa`.
 * Todas las monedas (incluida `CUP_TRANSFERENCIA`) convierten igual, porque la
 * tasa es siempre cuántas CUP vale 1 unidad. Para transferencia la tasa es < 1
 * (p. ej. 0.8333 = +20% de recargo): 100 CUP → 100 / 0.8333 ≈ 120 transferencia.
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
  return montoCUP / rate;
}

/**
 * Convierte un monto en una moneda dada de vuelta a CUP (operación inversa de
 * `convertFromBase`): `monto × tasa`. Igual para toda moneda; transferencia con
 * tasa 0.8333: 120 transferencia → 120 × 0.8333 = 100 CUP.
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
  return monto * rate;
}

/**
 * Convierte un monto de una moneda a otra usando CUP como puente.
 * Útil para previsualizar el `equivalente` de un pago a la moneda base de la venta.
 * Se apoya en `convertToBase`/`convertFromBase`; toda moneda pasa por CUP igual.
 * `null` si falta tasa.
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
 * Etiqueta legible de una moneda para selectores y sufijos de monto. Coincide con
 * el código salvo `CUP_TRANSFERENCIA`, cuyo código (17 caracteres sin espacios)
 * desborda y se solapa en layouts estrechos (carrito, diálogo de pago). Usamos su
 * forma con espacio, que parte en dos líneas y además es más legible. El resto de
 * monedas se muestran con su código (USD, EURO, MLC…).
 */
const CURRENCY_DISPLAY: Record<string, string> = {
  CUP_TRANSFERENCIA: "CUP Transferencia",
};

/**
 * Nombre mostrable de una moneda (selectores, sufijo de `formatMoney`).
 * Normaliza primero cualquier forma del backend a la clave interna, así una venta
 * que vuelva con `cup_transfer`/`cup_transferencia` se muestra igualmente como
 * "CUP Transferencia" aunque el código no se haya normalizado aguas arriba.
 */
export function currencyLabel(currency: string): string {
  const internal = fromBackendCurrency(currency);
  return CURRENCY_DISPLAY[internal] ?? internal;
}

/** Formatea un número a 2 decimales, sin sufijo de moneda. */
export function formatAmount(value: number): string {
  return (Number.isFinite(value) ? value : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatea un monto con la moneda como sufijo (ej. "1,234.50 USD").
 * No usamos `Intl` con `style: "currency"` porque `EURO`/`MLC` no son ISO 4217.
 */
export function formatMoney(value: number, currency: string = BASE_CURRENCY): string {
  return `${formatAmount(value)} ${currencyLabel(currency)}`;
}
