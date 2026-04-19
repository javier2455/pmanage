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
