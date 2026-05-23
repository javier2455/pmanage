import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getLatestPriceHistory,
  getPriceHistory,
  getPriceHistoryByRange,
} from "@/lib/api/product-price-history";
import type {
  GetPriceHistoryByRangeParams,
  GetPriceHistoryParams,
} from "@/lib/types/price-history";

export function useProductPriceHistory(
  productId: string,
  params: GetPriceHistoryParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["product-price-history", productId, "list", params],
    queryFn: () => getPriceHistory(productId, params),
    enabled: enabled && !!productId,
    placeholderData: keepPreviousData,
  });
}

export function useLatestProductPrice(productId: string, enabled = true) {
  return useQuery({
    queryKey: ["product-price-history", productId, "latest"],
    queryFn: () => getLatestPriceHistory(productId),
    enabled: enabled && !!productId,
  });
}

export function useProductPriceHistoryByRange(
  productId: string,
  params: GetPriceHistoryByRangeParams | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["product-price-history", productId, "range", params],
    queryFn: () =>
      getPriceHistoryByRange(productId, params as GetPriceHistoryByRangeParams),
    enabled: enabled && !!productId && !!params,
    placeholderData: keepPreviousData,
  });
}
