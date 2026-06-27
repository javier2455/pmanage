/**
 * Lógica de consolidación de caja (flujo de caja — Fase 1).
 *
 * Los saldos de `currency-account` vienen sueltos por moneda. Aquí los
 * convertimos a la moneda base (CUP) usando el tipo de cambio del negocio para
 * obtener un total único de caja. Lógica pura (sin React) para poder testearla.
 * Ver docs/flujo-de-caja.md.
 */

import {
  BASE_CURRENCY,
  ExchangeRateLike,
  getCurrencyRate,
} from "@/lib/currency";
import type { CurrencyAccount } from "@/lib/types/currency-account";

export interface ConsolidatedRow {
  currency: string;
  /** Saldo en la moneda original. */
  balance: number;
  /** Equivalente en moneda base (CUP). `null` si la moneda no es convertible. */
  baseEquivalent: number | null;
  /** Tasa aplicada (CUP por 1 unidad). `null` si no hay tasa configurada. */
  rate: number | null;
  /** `false` cuando falta la tasa: se excluye del total. */
  convertible: boolean;
}

export interface ConsolidatedBalances {
  /** Total de caja en moneda base (CUP), solo monedas convertibles. */
  totalBase: number;
  rows: ConsolidatedRow[];
  /** Hay al menos una moneda con saldo que no se pudo convertir (sin tasa). */
  hasUnconvertible: boolean;
}

/**
 * Consolida los saldos por moneda a un total en moneda base (CUP).
 * Las monedas sin tasa configurada quedan marcadas como no convertibles y se
 * excluyen del total para no reportar cifras incorrectas.
 */
export function consolidateBalances(
  accounts: CurrencyAccount[],
  exchangeRate: ExchangeRateLike,
): ConsolidatedBalances {
  let totalBase = 0;
  let hasUnconvertible = false;

  const rows: ConsolidatedRow[] = accounts.map((account) => {
    const balance = Number(account.currentBalance) || 0;
    const rate = getCurrencyRate(exchangeRate, account.currency);
    const convertible = rate != null;
    const baseEquivalent = convertible ? balance * rate : null;

    if (convertible && baseEquivalent != null) {
      totalBase += baseEquivalent;
    } else if (balance !== 0) {
      // Solo avisamos si la moneda sin tasa realmente tiene saldo.
      hasUnconvertible = true;
    }

    return { currency: account.currency, balance, baseEquivalent, rate, convertible };
  });

  return { totalBase, rows, hasUnconvertible };
}

export { BASE_CURRENCY };
