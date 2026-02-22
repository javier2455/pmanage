"use client";

import { useQuery } from "@tanstack/react-query";
import { getExchangeRate } from "@/lib/api/exchange-rate";

export function useExchangeRate(businessId: string) {
    return useQuery({
        queryKey: ["exchange-rate", businessId],
        queryFn: () => getExchangeRate({ businessId }),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
    });
}