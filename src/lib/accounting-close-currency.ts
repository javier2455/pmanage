/**
 * Agregación por moneda del cierre diario / mensual.
 *
 * El backend devuelve ventas y gastos por transacción, cada una con su moneda,
 * pero los totales (`totalIncome`/`totalExpense`/`total`) vienen como números
 * únicos ciegos a la moneda: sumar 1200 USD + 40000 CUP como si fueran la misma
 * unidad produce un balance sin sentido. Aquí agrupamos las transacciones por
 * moneda (subtotales fieles a lo que ocurrió) y, por separado, consolidamos a la
 * moneda base (CUP) con el tipo de cambio del negocio para un balance único.
 *
 * Lógica pura (sin React) para poder testearla. Reutiliza `convertToBase` de
 * currency.ts, que respeta la dirección de cada moneda (extranjera multiplica,
 * CUP con recargo divide). Ver docs/backend/accounting-close-multicurrency.md.
 */

import {
  BASE_CURRENCY,
  convertToBase,
  fromBackendCurrency,
  getCurrencyRate,
  type ExchangeRateLike,
} from "@/lib/currency";
import type { SaleWithProductAndBusiness } from "@/lib/types/sales";
import type { ExpenseInAccountingClose } from "@/lib/types/accounting-close";

/** Fila de subtotales de un cierre para una moneda concreta. */
export interface ClosingCurrencyRow {
  currency: string;
  /** Suma de ventas en esa moneda (unidades de la propia moneda). */
  income: number;
  /** Suma de gastos en esa moneda. */
  expense: number;
  /** Balance en esa moneda: `income - expense`. */
  balance: number;
}

/** Resultado de consolidar todas las monedas a la base (CUP). */
export interface ClosingConsolidation {
  /** Ventas totales convertidas a CUP (solo monedas convertibles). */
  incomeBase: number;
  /** Gastos totales convertidos a CUP. */
  expenseBase: number;
  /** Balance consolidado en CUP: `incomeBase - expenseBase`. */
  balanceBase: number;
  /** Filas por moneda enriquecidas con su equivalente en CUP y su tasa. */
  rows: ClosingConsolidatedRow[];
  /** Hay al menos una moneda con movimiento que no se pudo convertir (sin tasa). */
  hasUnconvertible: boolean;
}

export interface ClosingConsolidatedRow extends ClosingCurrencyRow {
  /** Equivalente del balance en CUP. `null` si la moneda no es convertible. */
  balanceBase: number | null;
  /** Tasa aplicada (CUP por 1 unidad). `null` si no hay tasa configurada. */
  rate: number | null;
  /** `false` cuando falta la tasa: se excluye del consolidado. */
  convertible: boolean;
}

/**
 * Normaliza la moneda de una transacción a la clave interna canónica.
 * Fallback a CUP (base) cuando el backend no envía la moneda todavía, para no
 * romper la vista ni descartar transacciones.
 */
export function normalizeCurrency(raw?: string | null): string {
  if (!raw) return BASE_CURRENCY;
  return fromBackendCurrency(raw);
}

/** Coerciona a número tolerando strings del backend (`total`, `amount`). */
function toNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Agrupa ventas y gastos por moneda y devuelve una fila de subtotales por cada
 * moneda con movimiento, ordenadas con CUP primero y el resto alfabéticamente
 * para una presentación estable.
 *
 * Asume que `sale.total` está expresado en `sale.currency` y `expense.amount` en
 * `expense.currency` (contrato del backend, ver doc). Ventas canceladas deben
 * filtrarse antes de llamar (las páginas ya pasan `activeSales`).
 */
export function groupClosingByCurrency(
  sales: SaleWithProductAndBusiness[],
  expenses: ExpenseInAccountingClose[],
): ClosingCurrencyRow[] {
  const byCurrency = new Map<string, ClosingCurrencyRow>();

  const ensure = (currency: string): ClosingCurrencyRow => {
    let row = byCurrency.get(currency);
    if (!row) {
      row = { currency, income: 0, expense: 0, balance: 0 };
      byCurrency.set(currency, row);
    }
    return row;
  };

  for (const sale of sales) {
    const row = ensure(normalizeCurrency(sale.currency));
    row.income += toNumber(sale.total);
  }

  for (const expense of expenses) {
    const row = ensure(normalizeCurrency(expense.currency));
    row.expense += toNumber(expense.amount);
  }

  for (const row of byCurrency.values()) {
    row.balance = row.income - row.expense;
  }

  return Array.from(byCurrency.values()).sort((a, b) => {
    if (a.currency === BASE_CURRENCY) return -1;
    if (b.currency === BASE_CURRENCY) return 1;
    return a.currency.localeCompare(b.currency);
  });
}

/**
 * Consolida las filas por moneda a un balance único en CUP usando el tipo de
 * cambio. Las monedas sin tasa configurada quedan marcadas como no convertibles
 * y se excluyen del consolidado para no reportar cifras incorrectas (mismo
 * criterio que `consolidateBalances` en cash-flow.ts).
 */
export function consolidateClosing(
  rows: ClosingCurrencyRow[],
  exchangeRate: ExchangeRateLike,
): ClosingConsolidation {
  let incomeBase = 0;
  let expenseBase = 0;
  let hasUnconvertible = false;

  const consolidatedRows: ClosingConsolidatedRow[] = rows.map((row) => {
    const rate = getCurrencyRate(exchangeRate, row.currency);
    const convertible = rate != null;

    if (convertible) {
      incomeBase += convertToBase(row.income, row.currency, exchangeRate);
      expenseBase += convertToBase(row.expense, row.currency, exchangeRate);
    } else if (row.income !== 0 || row.expense !== 0) {
      // Solo avisamos si la moneda sin tasa realmente tuvo movimiento.
      hasUnconvertible = true;
    }

    return {
      ...row,
      rate,
      convertible,
      balanceBase: convertible
        ? convertToBase(row.balance, row.currency, exchangeRate)
        : null,
    };
  });

  return {
    incomeBase,
    expenseBase,
    balanceBase: incomeBase - expenseBase,
    rows: consolidatedRows,
    hasUnconvertible,
  };
}

export { BASE_CURRENCY };
