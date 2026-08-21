import apiClient from "../axios";
import { AnalyticsRoutes } from "../routes/analytics";
import {
  SalesByWorkerParameters,
  SalesByWorkerResponse,
} from "../types/analytics";

export async function getSalesByWorker(
  businessId: string,
  params?: SalesByWorkerParameters,
): Promise<SalesByWorkerResponse> {
  const baseUrl = AnalyticsRoutes.getSalesByWorker(businessId);

  const url = new URL(baseUrl);
  if (params?.period) url.searchParams.set("period", params.period);
  if (params?.startDate) url.searchParams.set("startDate", params.startDate);
  if (params?.endDate) url.searchParams.set("endDate", params.endDate);

  const { data } = await apiClient.get(url.toString());
  return data;
}
