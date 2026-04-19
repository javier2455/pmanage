import { getKPIS, getSalesTrend, getTopProducts } from "@/lib/api/analytics";
import {
  PeriodParameters,
  SalesTrendParameters,
  TopProductsParameters,
} from "@/lib/types/analytics";
import { useQuery } from "@tanstack/react-query";

export function useAnalyticsKPIs(
  businessId: string,
  params?: PeriodParameters,
) {
  return useQuery({
    queryKey: ["analytics-kpis", businessId, params],
    queryFn: () => getKPIS(businessId, params),
    enabled: !!businessId,
  });
}

export function useAnalyticsSalesTrend(
  businessId: string,
  params?: SalesTrendParameters,
) {
  return useQuery({
    queryKey: ["analytics-sales-trend", businessId, params],
    queryFn: () => getSalesTrend(businessId, params),
    enabled: !!businessId,
  });
}

export function useAnalyticsTopProducts(
  businessId: string,
  params?: TopProductsParameters,
) {
  return useQuery({
    queryKey: ["analytics-top-products", businessId, params],
    queryFn: () => getTopProducts(businessId, params),
    enabled: !!businessId,
  });
}
