import { convertFromBase, type ExchangeRateLike } from "@/lib/currency";
import type {
  LotInvestmentStatus,
  ProductInvestmentStatusData,
} from "@/lib/types/inventory";

/**
 * Lógica pura de la vista de rentabilidad del producto.
 *
 * Vive fuera de los componentes porque es lo único de esta pantalla que puede
 * dar un número equivocado sin que se note: una barra mal repartida se ve
 * plausible. Aquí se puede probar sin montar React.
 */

export type RecoverySegmentKey =
  | "collected"
  | "billed"
  | "stock"
  | "uncovered";

export interface RecoverySegment {
  key: RecoverySegmentKey;
  /** Importe en CUP que ocupa el segmento. */
  amountBase: number;
  /** Ancho del segmento, en porcentaje de lo invertido. */
  pct: number;
}

/**
 * Reparte lo invertido en los cuatro tramos de la barra de recuperación.
 *
 * El reparto es lo que evita la trampa de fondo: si la barra fuera
 * `recuperado / invertido`, cada compra nueva la empujaría hacia atrás y nunca
 * llegaría al 100 % por mucho que el negocio fuese bien. Al contar aparte la
 * mercancía sin vender, reponer stock hace crecer ese tramo tanto como la meta
 * y la barra sigue llena; solo se abre hueco cuando hay una pérdida real.
 *
 * Los tramos se recortan contra lo que queda por repartir, así que su suma
 * nunca pasa del total aunque los datos vengan descuadrados.
 */
export function buildRecoverySegments(
  data: ProductInvestmentStatusData,
): RecoverySegment[] {
  const total = data.investment.totalBase;
  const keys: RecoverySegmentKey[] = [
    "collected",
    "billed",
    "stock",
    "uncovered",
  ];

  if (total <= 0) {
    return keys.map((key) => ({ key, amountBase: 0, pct: 0 }));
  }

  const collected = Math.max(0, Math.min(data.recovery.collectedBase, total));
  let left = total - collected;

  // Vendido pero todavía por cobrar: es recuperación de devengo, no de caja, y
  // por eso va en un tramo propio en vez de sumarse al cobrado.
  const billed = Math.max(
    0,
    Math.min(data.recovery.revenueBase - data.recovery.collectedBase, left),
  );
  left -= billed;

  const stock = Math.max(0, Math.min(data.investment.liveBase, left));
  left -= stock;

  // Lo que no cubre ni el cobro ni la mercancía viva: vendido por debajo del
  // costo, o mermado. Es el único tramo que representa dinero perdido.
  const uncovered = Math.max(0, left);

  const amounts: Record<RecoverySegmentKey, number> = {
    collected,
    billed,
    stock,
    uncovered,
  };

  return keys.map((key) => ({
    key,
    amountBase: amounts[key],
    pct: (amounts[key] / total) * 100,
  }));
}

/**
 * Porcentaje recuperado tal cual, sin capar.
 *
 * `null` cuando nunca se invirtió nada: un producto sin compras no lleva
 * recuperado el 0 %, es que la pregunta no aplica.
 */
export function recoveryPct(
  data: ProductInvestmentStatusData,
): number | null {
  const total = data.investment.totalBase;
  if (total <= 0) return null;
  return (data.recovery.revenueBase / total) * 100;
}

/** Lo recuperado por encima de lo invertido, en porcentaje. 0 si no lo hay. */
export function excessPct(data: ProductInvestmentStatusData): number {
  const pct = recoveryPct(data);
  return pct === null ? 0 : Math.max(0, pct - 100);
}

export type VerdictKey =
  | "sin-compras"
  | "sin-ventas"
  | "recuperado"
  | "en-riesgo"
  | "en-camino";

/**
 * En qué punto está el producto. Devuelve el discriminante y no el texto: la
 * frase se redacta en el componente, que es quien sabe formatear importes.
 */
export function resolveVerdict(
  data: ProductInvestmentStatusData,
): VerdictKey {
  if (data.investment.totalBase <= 0 && data.lots.length === 0) {
    return "sin-compras";
  }
  if (data.recovery.revenueBase <= 0) return "sin-ventas";
  if (data.recovery.pendingBase <= 0) return "recuperado";

  const uncovered = buildRecoverySegments(data).find(
    (s) => s.key === "uncovered",
  );
  if (uncovered && uncovered.amountBase > 0) return "en-riesgo";

  return "en-camino";
}

/**
 * Cuánto subió o bajó el costo de un lote respecto al anterior, en porcentaje.
 *
 * Es la forma de enseñar —en vez de explicar— qué pasa cuando el proveedor
 * sube los precios: el lote nuevo nace más caro y el margen de lo que venga se
 * estrecha, sin que nada de lo ya vendido se mueva.
 */
export function lotCostDelta(
  lots: LotInvestmentStatus[],
  index: number,
): number | null {
  if (index <= 0 || index >= lots.length) return null;
  const previous = lots[index - 1].unitCostBase;
  const current = lots[index].unitCostBase;
  if (!previous || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Los dos costos extremos de los lotes vivos, cuando no coinciden.
 *
 * Sirve para avisar de que las próximas ventas todavía saldrán del lote más
 * antiguo y dejarán su margen, no el del último precio pagado.
 */
export function liveCostSpread(
  lots: LotInvestmentStatus[],
): { min: LotInvestmentStatus; max: LotInvestmentStatus } | null {
  const live = lots.filter((l) => !l.isDepleted && l.unitCostBase > 0);
  if (live.length < 2) return null;

  let min = live[0];
  let max = live[0];
  for (const lot of live) {
    if (lot.unitCostBase < min.unitCostBase) min = lot;
    if (lot.unitCostBase > max.unitCostBase) max = lot;
  }
  return min.unitCostBase === max.unitCostBase ? null : { min, max };
}

/**
 * El lote que surte la próxima venta cuando su costo supera al precio actual.
 *
 * La notificación de margen negativo que ya existe avisa al vender, o sea
 * demasiado tarde; esto permite corregir el precio antes.
 */
export function negativeMarginLot(
  data: ProductInvestmentStatusData,
): LotInvestmentStatus | null {
  if (data.effectivePrice <= 0) return null;
  const next = data.lots.find((l) => !l.isDepleted && l.unitCostBase > 0);
  if (!next) return null;
  return next.unitCostBase > data.effectivePrice ? next : null;
}

/** Cuántos lotes se han pagado ya solos, del total que ha tenido el producto. */
export function recoveredLots(lots: LotInvestmentStatus[]): {
  recovered: number;
  total: number;
} {
  return {
    recovered: lots.filter((l) => l.investmentBase > 0 && l.pendingBase <= 0)
      .length,
    total: lots.length,
  };
}

/**
 * Pasa un importe de CUP a la moneda elegida en la vista.
 *
 * Solo para cifras derivadas. Las cantidades y los porcentajes no se
 * convierten —un margen del 20 % lo es en cualquier moneda— y el costo con el
 * que se compró un lote tampoco: es un hecho histórico en su propia moneda, no
 * una equivalencia de hoy.
 */
export function toDisplayCurrency(
  amountBase: number,
  currency: string,
  exchangeRate: ExchangeRateLike,
): number {
  return convertFromBase(amountBase, currency, exchangeRate);
}
