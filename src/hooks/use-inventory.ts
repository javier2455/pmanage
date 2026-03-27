import { addStock, getAllInventoryByBusinessId } from "@/lib/api/inventory";
import { AddStockToProductProps } from "@/lib/types/inventory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAllInventoryByBusinessId(businessId: string) {
    return useQuery({
        queryKey: ["all-inventory-by-business-id", businessId],
        queryFn: () => getAllInventoryByBusinessId(businessId),
        enabled: !!businessId,
    });
}

export function useAddStockToProductMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: AddStockToProductProps) => addStock(credentials),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["all-inventory-by-business-id", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["daily-accounting-close", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["monthly-accounting-close", variables.businessId] });
        },
    });
}

