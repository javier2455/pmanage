import apiClient from "@/lib/axios";
import { financialTransactionRoutes } from "../routes/financial-transaction";
import { FinancialTransactionsResponse } from "../types/financial-transaction";

interface GetTransactionsByBusinessParams {
  businessId: string;
  /** Filtra por moneda original (código exacto). Se omite si no se pasa. */
  currency?: string;
  page?: number;
  limit?: number;
}

export async function getTransactionsByBusiness({
  businessId,
  currency,
  page,
  limit,
}: GetTransactionsByBusinessParams): Promise<FinancialTransactionsResponse> {
  const { data } = await apiClient.get<FinancialTransactionsResponse>(
    financialTransactionRoutes.getByBusiness(businessId),
    { params: { currency: currency || undefined, page, limit } },
  );
  return data;
}
