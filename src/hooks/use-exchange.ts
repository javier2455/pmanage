"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExchangeRate, getExchangeRate, updateExchangeRate } from "@/lib/api/exchange-rate";
import { ExchangeRatePayload, UpdateExchangeRatePayload } from "@/lib/types/exchange-rate";
import { readCacheKey } from "@/lib/db/offline-db";
import { withOfflineFallback } from "@/lib/offline-read-cache";

/**
 * Sin tasas no se puede cobrar en divisa, así que es de las lecturas que más
 * falta hacen sin conexión. La copia local se sirve solo si la red falla.
 */
export function useExchangeRate(businessId: string) {
    return useQuery({
        queryKey: ["exchange-rate", businessId],
        queryFn: withOfflineFallback(
            readCacheKey("exchange-rate", businessId),
            businessId,
            () => getExchangeRate({ businessId }),
        ),
    });
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