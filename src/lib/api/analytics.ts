import apiClient from "../axios";
import { AnalyticsRoutes } from "../routes/analytics";
import {
  KPIsResponse,
  PeriodParameters,
  SalesTrendParameters,
  SalesTrendResponse,
  TopProductsParameters,
  TopProductsResponse,
} from "../types/analytics";

export async function getKPIS(
  businessId: string,
  params?: PeriodParameters,
): Promise<KPIsResponse> {
  const baseUrl = AnalyticsRoutes.getKPIS(businessId);

  const url = new URL(baseUrl);
  if (params?.period) url.searchParams.set("period", params.period);

  const { data } = await apiClient.get(url.toString());
  return data;
}

export async function getSalesTrend(
  businessId: string,
  params?: SalesTrendParameters,
): Promise<SalesTrendResponse> {
  const baseUrl = AnalyticsRoutes.getSalesTrend(businessId);

  const url = new URL(baseUrl);
  if (params?.startDate) url.searchParams.set("startDate", params.startDate);
  if (params?.endDate) url.searchParams.set("endDate", params.endDate);
  if (params?.groupBy) url.searchParams.set("groupBy", params.groupBy);

  const { data } = await apiClient.get(url.toString());
  return data;
}

export async function getTopProducts(
  businessId: string,
  params?: TopProductsParameters,
): Promise<TopProductsResponse> {
  const baseUrl = AnalyticsRoutes.getTopProducts(businessId);

  const url = new URL(baseUrl);
  if (params?.period) url.searchParams.set("period", params.period);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.sortBy) url.searchParams.set("sortBy", params.sortBy);

  const { data } = await apiClient.get(url.toString());
  return data;
}
