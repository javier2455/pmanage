/**
 * La sección de Analíticas se retiró; de todo el módulo solo sigue vivo el
 * desglose de ventas por trabajador, que consume la página de Trabajadores.
 * Los tipos de KPIs, tendencia de ventas y top de productos se eliminaron con
 * ella.
 */

export type AnalyticsPeriod = "week" | "month" | "quarter";

export type WorkerCurrencyTotal = {
  /** Clave normalizada de moneda (`cup`, `usd`, `cup_transferencia`…). */
  currency: string;
  total: number;
  transactionCount: number;
};

export interface WorkerSalesItem {
  workerId: string;
  workerName: string;
  workerEmail: string;
  /**
   * Total consolidado en CUP con las tasas del negocio. Las monedas sin tasa
   * quedan fuera y se listan en `unconvertedCurrencies` de la respuesta.
   * Antes era la suma cruda de todas las monedas (CUP + USD + MLC en una sola
   * cifra), así que el número no era comparable entre trabajadores.
   */
  totalSales: number;
  /** Desglose por moneda de las ventas completadas. */
  totalsByCurrency: WorkerCurrencyTotal[];
  transactionCount: number;
  /** Ticket promedio consolidado en CUP. */
  avgTicket: number;
  cancellationCount: number;
  cancellationRate: number;
}

export interface SalesByWorkerResponse {
  period: { startDate: string; endDate: string };
  /** Monedas con ventas en el período pero sin tasa configurada. */
  unconvertedCurrencies: string[];
  data: WorkerSalesItem[];
}

export type SalesByWorkerParameters = {
  period?: AnalyticsPeriod;
  /** Fecha de inicio en formato `yyyy-MM-dd` (día local completo). */
  startDate?: string;
  /** Fecha de fin en formato `yyyy-MM-dd`, inclusive. */
  endDate?: string;
};
