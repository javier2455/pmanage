import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTransactionsByBusiness } from "@/lib/api/financial-transaction";

export const FINANCIAL_TRANSACTIONS_KEY = "financial-transactions" as const;

interface UseTransactionsParams {
  businessId: string;
  currency?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useTransactionsByBusiness({
  businessId,
  currency,
  page,
  limit,
  enabled = true,
}: UseTransactionsParams) {
  return useQuery({
    queryKey: [
      FINANCIAL_TRANSACTIONS_KEY,
      businessId,
      currency ?? null,
      page,
      limit,
    ],
    queryFn: () =>
      getTransactionsByBusiness({ businessId, currency, page, limit }),
    placeholderData: keepPreviousData,
    enabled: enabled && !!businessId,
  });
}
