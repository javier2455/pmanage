export interface KPIsResponse {
  revenue: SimpleValuesResponse;
  /**
   * Utilidad bruta: ingresos menos el costo de lo vendido.
   *
   * Hasta el costeo por capas este valor era una copia de `revenue`, así que la
   * tarjeta "Ganancia" mostraba las ventas brutas.
   */
  profit: SimpleValuesResponse;
  avgTicket: SimpleValuesResponse;
  cancellationRate: SimpleValuesResponse;
  inventoryValue: SimpleValuesResponse;
  /** Costo de la mercancía vendida en el período, en CUP. */
  costOfGoodsSold: SimpleValuesResponse;
  /**
   * Cuántas líneas del período tienen costo conocido y cuántas no.
   *
   * Las ventas anteriores al costeo por capas no lo tienen y se excluyen del
   * cálculo; si `uncostedItems` es > 0 la ganancia mostrada no cubre todo el
   * período y conviene advertirlo en vez de darla por exacta.
   */
  costCoverage: {
    costedItems: number;
    uncostedItems: number;
  };
}

export interface SalesTrendResponse {
  data: SalesTrendValuesResponse[];
}

export interface TopProductsResponse {
  data: TopProductValueResponse[];
}

export type TopProductValueResponse = {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
};

export type TopProductsSortBy = "quantity" | "revenue";
export type TopProductsLimit = 5 | 10;

export type TopProductsParameters = {
  period?: AnalyticsPeriod;
  limit?: TopProductsLimit;
  sortBy?: TopProductsSortBy;
};

type SimpleValuesResponse = {
  value: number;
  change: number;
};

export type SalesTrendValuesResponse = {
  date: string;
  revenue: number;
  transactions: number;
};

export type AnalyticsPeriod = "week" | "month" | "quarter";
export type AnalyticsSalesTrendGroupBy = "day" | "week" | "month";

// Ventas por trabajador
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

export type PeriodParameters = {
  period: AnalyticsPeriod;
};

export type SalesTrendParameters = {
  startDate?: string; // ISO format date string
  endDate?: string;   // ISO format date string
  groupBy?: AnalyticsSalesTrendGroupBy;
};
