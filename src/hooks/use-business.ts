"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProductOfMyBusinesses, createBusiness } from "@/lib/api/business";
import type { CreateBusinessPayload } from "@/lib/types/business";

export function useAllProductOfMyBusinesses(businessId: string) {
    return useQuery({
        queryKey: ["all-product-of-my-businesses", businessId],
        queryFn: () => getAllProductOfMyBusinesses({ businessId }),
    });
}

export function useCreateBusinessMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateBusinessPayload) => createBusiness(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businesses"] });
        },
    });
}
