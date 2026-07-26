import {
  getKPIS,
  getSalesByWorker,
  getSalesTrend,
  getTopProducts,
} from "@/lib/api/analytics";
import {
  PeriodParameters,
  SalesByWorkerParameters,
  SalesTrendParameters,
  TopProductsParameters,
} from "@/lib/types/analytics";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

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

export function useAnalyticsSalesByWorker(
  businessId: string,
  params?: SalesByWorkerParameters,
) {
  return useQuery({
    queryKey: ["analytics-sales-by-worker", businessId, params],
    queryFn: () => getSalesByWorker(businessId, params),
    enabled: !!businessId,
    // El rango de fechas forma parte de la key, así que cada cambio de período
    // es una query nueva. Sin esto la tabla se vacía y vuelve entre filtro y
    // filtro; conservando los datos previos solo se atenúa mientras refresca.
    placeholderData: keepPreviousData,
  });
}
