import apiClient from "@/lib/axios";
import { currencyAccountRoutes } from "../routes/currency-account";
import {
  CurrencyAccount,
  CurrencyBalanceResponse,
  InitializeBudgetsProps,
} from "../types/currency-account";

export async function getCurrencyBalances(
  businessId: string,
): Promise<CurrencyAccount[]> {
  const { data } = await apiClient.get<CurrencyAccount[]>(
    currencyAccountRoutes.balances(businessId),
  );
  return data;
}

export async function getCurrencyBalance(
  businessId: string,
  currency: string,
): Promise<CurrencyBalanceResponse> {
  const { data } = await apiClient.get<CurrencyBalanceResponse>(
    currencyAccountRoutes.balance(businessId, currency),
  );
  return data;
}

export async function initializeBudgets(
  props: InitializeBudgetsProps,
): Promise<CurrencyAccount[]> {
  const { data } = await apiClient.post<CurrencyAccount[]>(
    currencyAccountRoutes.initialize,
    props,
  );
  return data;
}
