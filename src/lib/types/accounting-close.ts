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

export type AccountingCloseResponse = {
    date: string;
    sales: SaleWithProductAndBusiness[];
    expenses: ExpenseInAccountingClose[];
    totalIncome: number;
    totalExpense: number;
    total: number;
    /**
     * Monedas con movimientos en el período que NO tienen tasa configurada y
     * quedaron fuera del consolidado del backend (disponible desde 2026-07-02).
     * La UI ya muestra un aviso equivalente calculado client-side
     * (`hasUnconvertible` en accounting-close-currency.ts, con las mismas
     * tasas); este campo queda como fuente de verdad del servidor si en el
     * futuro se elimina la re-consolidación local.
     */
    unconvertedCurrencies?: string[];
}