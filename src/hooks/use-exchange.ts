"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExchangeRate, getExchangeRate, updateExchangeRate } from "@/lib/api/exchange-rate";
import { ExchangeRatePayload, ExchangeRateTypeOne, UpdateExchangeRatePayload } from "@/lib/types/exchange-rate";
import { useBusiness } from "@/context/business-context";

export function useExchangeRate(businessId: string) {
    return useQuery({
        queryKey: ["exchange-rate", businessId],
        queryFn: () => getExchangeRate({ businessId }),
        enabled: !!businessId,
    });
}

/**
 * Helper de conveniencia: lee las tasas del negocio activo desde la caché de
 * React Query y las devuelve ya desempaquetadas. Única fuente de las tasas.
 */
export function useActiveExchangeRates(): {
    rates: ExchangeRateTypeOne | null;
    isLoading: boolean;
} {
    const { activeBusinessId } = useBusiness();
    const { data, isLoading } = useExchangeRate(activeBusinessId ?? "");
    return { rates: data?.data ?? null, isLoading };
}

export function useCreateExchangeRateMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ExchangeRatePayload) => createExchangeRate(payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["exchange-rate", variables.idbusiness] });
        },
    });
}

export function useUpdateExchangeRateMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ businessId, payload }: { businessId: string; payload: UpdateExchangeRatePayload }) =>
            updateExchangeRate(businessId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["exchange-rate", variables.businessId] });
        },
    });
}