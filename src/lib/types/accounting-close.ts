import { SaleWithProductAndBusiness } from "./sales";

export interface DateRangeParameters {
    startDate?: string;
    endDate?: string;
}

export interface ExpenseInAccountingClose {
    id: string;
    title: string;
    amount: number;
    description: string;
    createdAt: string;
    // Moneda del gasto. Opcional hasta que el backend la incluya en la respuesta
    // del cierre (ver docs/backend/accounting-close-multicurrency.md). Mientras no
    // llegue, la UI usa fallback a CUP. TODO(backend): poblar siempre este campo.
    currency?: string;
}

/**
 * Subtotales de una moneda ya calculados por el backend, en la propia moneda
 * (no convertidos). Claves de `totalsByCurrency` en minúsculas: `cup`, `usd`…
 */
export interface ClosingCurrencyTotals {
    income: number;
    expense: number;
    balance: number;
}

/** Consolidado en CUP de todo el cierre (ventas y gastos), calculado por el backend. */
export interface ClosingConsolidatedBase {
    income: number;
    expense: number;
    balance: number;
}

export type AccountingCloseResponse = {
    date: string;
    sales: SaleWithProductAndBusiness[];
    expenses: ExpenseInAccountingClose[];
    totalIncome: number;
    totalExpense: number;
    total: number;
    /**
     * Subtotales por moneda calculados por el backend (misma lógica que la UI,
     * pero con las tasas del snapshot del cierre). Claves en minúsculas.
     * Opcional: cierres antiguos u otros endpoints pueden no traerlo; la UI cae
     * al cálculo client-side en ese caso.
     */
    totalsByCurrency?: Record<string, ClosingCurrencyTotals>;
    /**
     * Tasas usadas por el backend al consolidar (cuántas CUP vale 1 unidad).
     * Solo incluye monedas con tasa > 0. Claves en minúsculas. Sirve para derivar
     * de forma reproducible qué monedas quedaron sin convertir por tabla.
     */
    exchangeRateSnapshot?: Record<string, number>;
    /**
     * Consolidado en CUP calculado por el backend (fuente de verdad, coincide con
     * PDF/Excel). La UI lo prefiere sobre su propio cálculo con tasas vivas.
     * Opcional por compatibilidad con respuestas que aún no lo incluyan.
     */
    consolidatedBase?: ClosingConsolidatedBase;
    /**
     * Monedas con movimientos en el período que NO tienen tasa configurada y
     * quedaron fuera del consolidado del backend (disponible desde 2026-07-02).
     * Aviso GLOBAL (ventas + gastos): en el resumen es exacto; para una tabla de
     * una sola cara (solo ventas o solo gastos) la UI deriva el aviso por tabla
     * desde `totalsByCurrency` + `exchangeRateSnapshot`.
     */
    unconvertedCurrencies?: string[];
}