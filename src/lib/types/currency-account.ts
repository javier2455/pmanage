/**
 * Tipos del módulo Currency Account (cuentas por moneda).
 *
 * Gestiona el saldo disponible por moneda de cada negocio. El front solo
 * lee saldos y establece presupuestos iniciales; los movimientos (ventas,
 * gastos, compras, cancelaciones) los aplica el backend vía eventos.
 * Ver docs/currency-account-guide.md.
 */

/** Cuenta de una moneda concreta de un negocio. */
export interface CurrencyAccount {
  id: string;
  businessId: string;
  /** Código de moneda (`CUP`, `USD`, `EURO`, `MLC`…). */
  currency: string;
  /**
   * Saldo actual. El backend lo documenta como número, pero algunos
   * endpoints monetarios devuelven strings; coercionar con `Number()` al
   * mostrar para no acoplarnos al tipo exacto.
   */
  currentBalance: number | string;
  /** Presupuesto inicial con el que se creó la cuenta. */
  initialBudget: number | string;
  createdAt: string;
  updatedAt: string;
}

/** Body de POST /currency-accounts/initialize. */
export interface InitializeBudgetsProps {
  businessId: string;
  /** Mapa moneda → presupuesto inicial, p. ej. `{ USD: 1000, CUP: 5000 }`. */
  initialBudgets: Record<string, number>;
}

/** Respuesta de GET /currency-accounts/balance/{businessId}/{currency}. */
export interface CurrencyBalanceResponse {
  balance: number;
}
