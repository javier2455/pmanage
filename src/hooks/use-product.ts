import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create, createInBusiness, deleteProduct, deleteProductInBusiness, edit, getAllProducts, getProductById, updateBusinessProductPrice } from "@/lib/api/product";
import { CreateProductInBusinessProps, CreateProductProps, EditProductProps } from "@/lib/types/product";

interface UseGetAllProductsParams {
    page?: number;
    limit?: number;
}

export function useGetAllProductsQuery(params: UseGetAllProductsParams = {}) {
    return useQuery({
        queryKey: ["all-products", params],
        queryFn: () => getAllProducts(params),
        placeholderData: keepPreviousData,
    });
}

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-products"] });
        },
    });
}

export function useCreateProductInBusinessMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: CreateProductInBusinessProps) => createInBusiness(credentials),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["all-products"] });
        },
    });
}

export function useEditProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, credentials }: { productId: string, credentials: EditProductProps }) => edit(productId, credentials),
        onSuccess: (_, { productId }) => {
            queryClient.invalidateQueries({ queryKey: ["product", productId] });
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses"] });
            queryClient.invalidateQueries({ queryKey: ["all-products"] });
        },
    });
}

export function useUpdateBusinessProductPriceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ businessProductId, price }: { businessProductId: string; price: number }) =>
            updateBusinessProductPrice(businessProductId, price),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses"] });
            queryClient.invalidateQueries({ queryKey: ["all-products"] });
        },
    });
}

export function useDeleteProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (productId: string) => deleteProduct(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses"] });
            queryClient.invalidateQueries({ queryKey: ["all-products"] });
        },
    });
}

export function useDeleteProductInBusinessMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ businessId, productId }: { businessId: string; productId: string }) => deleteProductInBusiness(businessId, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses"] });
            queryClient.invalidateQueries({ queryKey: ["all-products"] });
        },
    });
}