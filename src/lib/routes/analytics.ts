import { BASIC_ROUTE } from ".";

export const AnalyticsRoutes = {
    getKPIS: (businessId: string) => `${BASIC_ROUTE}/analytics/kpis/${businessId}`,
    getSalesTrend: (businessId: string) => `${BASIC_ROUTE}/analytics/sales-trend/${businessId}`,
}; 