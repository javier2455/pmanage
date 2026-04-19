export interface KPIsResponse {
  revenue: SimpleValuesResponse;
  profit: SimpleValuesResponse;
  avgTicket: SimpleValuesResponse;
  cancellationRate: SimpleValuesResponse;
  inventoryValue: SimpleValuesResponse;
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

export type PeriodParameters = {
  period: AnalyticsPeriod;
};

export type SalesTrendParameters = {
  startDate?: string; // ISO format date string
  endDate?: string;   // ISO format date string
  groupBy?: AnalyticsSalesTrendGroupBy;
};
