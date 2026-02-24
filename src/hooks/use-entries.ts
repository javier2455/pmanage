import { addStock } from "@/lib/api/entries";
import { AddStockToProductProps } from "@/lib/types/entries";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAddStockToProductMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: AddStockToProductProps) => addStock(credentials),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["all-product-of-my-businesses", variables.businessId],
            });
        },
    });
}