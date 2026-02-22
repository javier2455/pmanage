"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllProductOfMyBusinesses } from "@/lib/api/business";

export function useAllProductOfMyBusinesses(businessId: string) {
    return useQuery({
        queryKey: ["all-product-of-my-businesses", businessId],
        queryFn: () => getAllProductOfMyBusinesses({ businessId }),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
    });
}
