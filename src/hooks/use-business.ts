"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProductOfMyBusinesses, createBusiness, updateBusiness, deleteBusiness } from "@/lib/api/business";
import type { CreateBusinessPayload, UpdateBusinessPayload } from "@/lib/types/business";

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

export function useUpdateBusinessMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ businessId, payload }: { businessId: string, payload: UpdateBusinessPayload }) => updateBusiness(businessId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businesses"] });
        },
    });
}

export function useDeleteBusinessMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (businessId: string) => deleteBusiness(businessId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businesses"] });
        },
    });
}