import apiClient from "@/lib/axios";
import { productRoutes } from "@/lib/routes/product";
import {
  filterByRange,
  generatePriceHistoryMock,
} from "@/lib/mocks/price-history-mock";
import type {
  GetLatestPriceHistoryResponse,
  GetPriceHistoryByRangeParams,
  GetPriceHistoryParams,
  GetPriceHistoryResponse,
  PriceHistoryEntry,
  PriceHistoryMeta,
} from "@/lib/types/price-history";

export const USE_MOCK_PRICE_HISTORY = true;

const MOCK_LATENCY_MS = 350;
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

type Paginated = {
  items: PriceHistoryEntry[];
  meta: PriceHistoryMeta;
};

function paginate(
  items: PriceHistoryEntry[],
  page: number,
  limit: number,
): Paginated {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const start = (safePage - 1) * safeLimit;
  const sliced = items.slice(start, start + safeLimit);
  return {
    items: sliced,
    meta: {
      total: items.length,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
    },
  };
}

export async function getPriceHistory(
  productId: string,
  params: GetPriceHistoryParams = {},
): Promise<GetPriceHistoryResponse> {
  const { page = 1, limit = 10 } = params;

  if (USE_MOCK_PRICE_HISTORY) {
    await delay(MOCK_LATENCY_MS);
    const { items, meta } = paginate(
      generatePriceHistoryMock(productId),
      page,
      limit,
    );
    return {
      message: "Business products retrieved successfully",
      data: items,
      meta,
    };
  }

  const { data } = await apiClient.get<GetPriceHistoryResponse>(
    productRoutes.getPriceHistory(productId),
    { params: { page, limit } },
  );
  return data;
}

export async function getLatestPriceHistory(
  productId: string,
): Promise<GetLatestPriceHistoryResponse> {
  if (USE_MOCK_PRICE_HISTORY) {
    await delay(MOCK_LATENCY_MS);
    const list = generatePriceHistoryMock(productId);
    return {
      message: "Business products retrieved successfully",
      data: list[0] ?? null,
    };
  }
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

  if (USE_MOCK_PRICE_HISTORY) {
    await delay(MOCK_LATENCY_MS);
    const filtered = filterByRange(
      generatePriceHistoryMock(productId),
      startDate,
      endDate,
    );
    const { items, meta } = paginate(filtered, page, limit);
    return {
      message: "Business products retrieved successfully",
      data: items,
      meta,
    };
  }

  const { data } = await apiClient.get<GetPriceHistoryResponse>(
    productRoutes.getPriceHistoryByRange(productId),
    { params: { startDate, endDate, page, limit } },
  );
  return data;
}
