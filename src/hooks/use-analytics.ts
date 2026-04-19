import { getKPIS, getSalesTrend } from "@/lib/api/analytics";
import { PeriodParameters, SalesTrendParameters } from "@/lib/types/analytics";
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
