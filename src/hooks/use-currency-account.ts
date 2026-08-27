import { QueryClient, useQuery } from "@tanstack/react-query";
import {
  getCurrencyBalance,
  getCurrencyBalances,
} from "@/lib/api/currency-account";
import { FINANCIAL_TRANSACTIONS_KEY } from "@/hooks/use-financial-transactions";

export const CURRENCY_BALANCES_KEY = "currency-balances" as const;

/**
 * Refresca la caja tras una operación que mueve dinero.
 *
 * El backend la mueve con el evento "financial-transaction.created", que toca a
 * la vez el saldo por moneda y el libro de transacciones; las dos vistas quedan
 * obsoletas juntas, así que se invalidan juntas. Sin esto, la card de Caja del
 * dashboard y la vista de flujo de caja seguían mostrando el valor anterior
 * hasta recargar la página.
 */
export function invalidateCashQueries(
  queryClient: QueryClient,
  businessId: string,
) {
  queryClient.invalidateQueries({
    queryKey: [CURRENCY_BALANCES_KEY, businessId],
  });
  queryClient.invalidateQueries({
    queryKey: [FINANCIAL_TRANSACTIONS_KEY, businessId],
  });
}

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
