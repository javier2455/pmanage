/**
 * Tipos del módulo Currency Account (cuentas por moneda).
 *
 * Gestiona el saldo disponible por moneda de cada negocio. El front solo lee
 * saldos; los movimientos (ventas, gastos, compras, cancelaciones) los aplica el
 * backend vía eventos, que además crea la cuenta de cada moneda en su primer
 * movimiento. Ver docs/currency-account-guide.md.
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
  /**
   * Presupuesto inicial con el que se creó la cuenta. Ya no se muestra en la UI
   * ni se puede fijar desde el front, pero sigue llegando en la respuesta y el
   * backend lo usa como base de su reconciliación de saldos.
   */
  initialBudget: number | string;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta de GET /currency-accounts/balance/{businessId}/{currency}. */
export interface CurrencyBalanceResponse {
  balance: number;
}
