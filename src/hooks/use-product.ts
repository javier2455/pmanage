import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create, deleteProduct, edit, getProductById } from "@/lib/api/product";
import { CreateProductProps, EditProductProps } from "@/lib/types/product";



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

export function useEditProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, credentials }: { productId: string, credentials: EditProductProps }) => edit(productId, credentials),
        onSuccess: (_, productId) => {
            queryClient.invalidateQueries({
                queryKey: ["product", productId],
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