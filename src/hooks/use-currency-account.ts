import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrencyBalance,
  getCurrencyBalances,
  initializeBudgets,
} from "@/lib/api/currency-account";
import { InitializeBudgetsProps } from "@/lib/types/currency-account";

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

export function useInitializeBudgetsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: InitializeBudgetsProps) => initializeBudgets(props),
    onSuccess: (_, variables) => {
      const bid = variables.businessId;
      queryClient.invalidateQueries({ queryKey: [CURRENCY_BALANCES_KEY, bid] });
      // El saldo también alimenta el resumen del dashboard del negocio.
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary", bid] });
    },
  });
}
