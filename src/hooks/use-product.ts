import { create } from "@/lib/api/product";
import { CreateProductProps } from "@/lib/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateProductMutation() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (credentials: CreateProductProps) => create(credentials),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["all-product-of-my-businesses", variables.businessId],
            });
        },
    });
}