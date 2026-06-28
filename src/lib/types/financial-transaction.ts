/**
 * Historial de transacciones financieras de un negocio (solo lectura).
 * Contrato backend: Financial Transactions Frontend Guide (v2),
 * `GET /financial-transactions/business/:businessId`.
 */

/** Tipos de evento que puede registrar el backend. */
export type TransactionType =
  | "sale"
  | "payment"
  | "expense"
  | "sale_cancellation"
  | "inventory_adjustment"
  | "inventory_return"
  | "purchase"
  | "stock_purchase";

export interface FinancialTransaction {
  id: string;
  business: { id: string } & Record<string, unknown>;
  transactionType: TransactionType;
  /** Id del registro origen (venta, gasto, etc.). */
  sourceId: string;
  /** Monto en la moneda original del evento. */
  originalAmount: number;
  /** Código de moneda original (CUP, USD, EURO, CUP_TRANSFERENCIA…). */
  originalCurrency: string;
  /** Monto convertido a la moneda base (CUP). */
  convertedAmount: number;
  /** Tasas aplicadas al momento de la transacción (snapshot). */
  exchangeRateUsd: number | null;
  exchangeRateEur: number | null;
  exchangeRateCupTransfer: number | null;
  exchangeRateClassic: number | null;
  exchangeRateMlc: number | null;
  exchangeRateCad: number | null;
  exchangeRateGbp: number | null;
  exchangeRateChf: number | null;
  exchangeRateMxn: number | null;
  exchangeRateJpy: number | null;
  transactionDate: string;
  createdAt: string;
}

export interface FinancialTransactionsResponse {
  data: FinancialTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
