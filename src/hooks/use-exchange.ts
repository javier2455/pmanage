"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExchangeRate, getExchangeRate, updateExchangeRate } from "@/lib/api/exchange-rate";
import { ExchangeRatePayload, UpdateExchangeRatePayload } from "@/lib/types/exchange-rate";

export function useExchangeRate(businessId: string) {
    return useQuery({
        queryKey: ["exchange-rate", businessId],
        queryFn: () => getExchangeRate({ businessId }),
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