import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create, deleteProduct, getProductById } from "@/lib/api/product";
import { CreateProductProps } from "@/lib/types/product";



export function useGetProductByIdQuery(productId: string) {
    return useQuery({
        queryKey: ["product", productId],
        queryFn: () => getProductById(productId),
        enabled: !!productId,
    });
}

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

export function useDeleteProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (productId: string,) => deleteProduct(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["all-product-of-my-businesses"],
            });
        },
    });
}