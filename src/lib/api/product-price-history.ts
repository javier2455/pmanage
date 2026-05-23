import apiClient from "@/lib/axios";
import { productRoutes } from "@/lib/routes/product";
import type {
  GetLatestPriceHistoryResponse,
  GetPriceHistoryByRangeParams,
  GetPriceHistoryParams,
  GetPriceHistoryResponse,
} from "@/lib/types/price-history";

export async function getPriceHistory(
  productId: string,
  params: GetPriceHistoryParams = {},
): Promise<GetPriceHistoryResponse> {
  const { page = 1, limit = 10 } = params;
  const { data } = await apiClient.get<GetPriceHistoryResponse>(
    productRoutes.getPriceHistory(productId),
    { params: { page, limit } },
  );
  return data;
}

export async function getLatestPriceHistory(
  productId: string,
): Promise<GetLatestPriceHistoryResponse> {
  const { data } = await apiClient.get<GetLatestPriceHistoryResponse>(
    productRoutes.getLatestPriceHistory(productId),
  );
  return data;
}

export async function getPriceHistoryByRange(
  productId: string,
  params: GetPriceHistoryByRangeParams,
): Promise<GetPriceHistoryResponse> {
  const { page = 1, limit = 10, startDate, endDate } = params;
  const { data } = await apiClient.get<GetPriceHistoryResponse>(
    productRoutes.getPriceHistoryByRange(productId),
    { params: { startDate, endDate, page, limit } },
  );
  return data;
}
