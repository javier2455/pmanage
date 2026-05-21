export type PriceHistoryMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PriceHistoryEntry = {
  id: string;
  businessProductId: string;
  price: number;
  stock: number;
  userId: string | null;
  previousPrice: number | null;
  previousStock: number | null;
  createdAt: string;
};

export type GetPriceHistoryResponse = {
  message: string;
  data: PriceHistoryEntry[];
  meta: PriceHistoryMeta;
};

export type GetLatestPriceHistoryResponse = {
  message: string;
  data: PriceHistoryEntry | null;
};

export type PriceHistoryPaginationParams = {
  page?: number;
  limit?: number;
};

export type GetPriceHistoryParams = PriceHistoryPaginationParams;

export type GetPriceHistoryByRangeParams = {
  startDate: string;
  endDate: string;
} & PriceHistoryPaginationParams;
