import { useQuery } from "@tanstack/react-query";
import {
  getCurrencyBalance,
  getCurrencyBalances,
} from "@/lib/api/currency-account";

export const CURRENCY_BALANCES_KEY = "currency-balances" as const;

export function useCurrencyBalances(businessId: string) {
  return useQuery({
    queryKey: [CURRENCY_BALANCES_KEY, businessId],
    queryFn: () => getCurrencyBalances(businessId),
    enabled: !!businessId,
  });
}

export function useCurrencyBalance(businessId: string, currency: string) {
  return useQuery({
    queryKey: ["currency-balance", businessId, currency],
    queryFn: () => getCurrencyBalance(businessId, currency),
    enabled: !!businessId && !!currency,
  });
}
