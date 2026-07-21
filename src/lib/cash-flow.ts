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
  fromBackendCurrency,
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
 * Agrupa las cuentas por su moneda CANÓNICA, sumando los saldos.
 *
 * El backend puede tener más de una cuenta para la MISMA moneda cuando el código
 * de moneda quedó guardado en variantes distintas (p. ej. la transferencia como
 * `cup_transf` truncada y `cup_transferencia` completa): son la misma moneda pero
 * en filas separadas. Sin agrupar, la UI muestra la moneda duplicada y, al usar la
 * moneda como clave de React, dos filas colisionan en la misma `key`. Aquí las
 * fundimos en una sola entrada canónica con el saldo sumado. Es defensivo: la causa
 * de fondo (que no se unifique el código al escribir) se arregla en el backend.
 */
export function mergeAccountsByCurrency(
  accounts: CurrencyAccount[],
): CurrencyAccount[] {
  const byCurrency = new Map<string, CurrencyAccount>();

  for (const account of accounts) {
    const currency = fromBackendCurrency(account.currency);
    const existing = byCurrency.get(currency);
    if (existing) {
      existing.currentBalance =
        Number(existing.currentBalance) + (Number(account.currentBalance) || 0);
      existing.initialBudget =
        Number(existing.initialBudget) + (Number(account.initialBudget) || 0);
    } else {
      byCurrency.set(currency, {
        ...account,
        currency,
        currentBalance: Number(account.currentBalance) || 0,
        initialBudget: Number(account.initialBudget) || 0,
      });
    }
  }

  return Array.from(byCurrency.values());
}

/**
 * Consolida los saldos por moneda a un total en moneda base (CUP).
 * Primero funde las cuentas duplicadas por moneda canónica (ver
 * `mergeAccountsByCurrency`). Las monedas sin tasa configurada quedan marcadas como
 * no convertibles y se excluyen del total para no reportar cifras incorrectas.
 */
export function consolidateBalances(
  accounts: CurrencyAccount[],
  exchangeRate: ExchangeRateLike,
): ConsolidatedBalances {
  let totalBase = 0;
  let hasUnconvertible = false;

  const rows: ConsolidatedRow[] = mergeAccountsByCurrency(accounts).map(
    (account) => {
      const balance = Number(account.currentBalance) || 0;
      // La moneda ya viene canónica del merge; las tasas se indexan por esa clave
      // (`CUP_TRANSFERENCIA`), no por variantes truncadas/en minúsculas.
      const currency = account.currency;
      const rate = getCurrencyRate(exchangeRate, currency);
      const convertible = rate != null;
      const baseEquivalent = convertible ? balance * rate : null;

      if (convertible && baseEquivalent != null) {
        totalBase += baseEquivalent;
      } else if (balance !== 0) {
        // Solo avisamos si la moneda sin tasa realmente tiene saldo.
        hasUnconvertible = true;
      }

      return { currency, balance, baseEquivalent, rate, convertible };
    },
  );

  return { totalBase, rows, hasUnconvertible };
}

export { BASE_CURRENCY };
