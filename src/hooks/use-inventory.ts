import {
    addStock,
    getCurrentInventoryByBusinessId,
    getInventoryHistoryByBusinessId,
    getProductCostLayers,
    getProductInventoryHistory,
} from "@/lib/api/inventory";
import {
    AddStockToProductProps,
    InventoryHistoryInclude,
    InventoryHistoryParameters,
} from "@/lib/types/inventory";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

interface PaginationParams {
    page?: number;
    limit?: number;
}

interface ProductHistoryParams extends InventoryHistoryParameters {
    include?: InventoryHistoryInclude;
}

export function useCurrentInventoryByBusinessId(
    businessId: string,
    params: PaginationParams = {},
) {
    return useQuery({
        queryKey: ["current-inventory-by-business-id", businessId, params],
        queryFn: () => getCurrentInventoryByBusinessId({ businessId, ...params }),
        enabled: !!businessId,
        placeholderData: keepPreviousData,
    });
}

export function useInventoryHistoryByBusinessId(
    businessId: string,
    params: InventoryHistoryParameters = {},
) {
    return useQuery({
        queryKey: ["inventory-history-by-business-id", businessId, params],
        queryFn: () => getInventoryHistoryByBusinessId({ businessId, ...params }),
        enabled: !!businessId,
        placeholderData: keepPreviousData,
    });
}

/**
 * Capas de costo vivas de un producto: cuántas unidades quedan de cada lote y a
 * qué costo entró cada uno.
 */
export function useProductCostLayers(businessId: string, productId: string) {
    return useQuery({
        queryKey: ["product-cost-layers", businessId, productId],
        queryFn: () => getProductCostLayers({ businessId, productId }),
        enabled: !!businessId && !!productId,
    });
}

export function useProductInventoryHistory(
    businessId: string,
    productId: string,
    params: ProductHistoryParams = {},
) {
    return useQuery({
        queryKey: ["product-inventory-history", businessId, productId, params],
        queryFn: () =>
            getProductInventoryHistory({ businessId, productId, ...params }),
        enabled: !!businessId && !!productId,
        placeholderData: keepPreviousData,
    });
}

export function useAddStockToProductMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: AddStockToProductProps) => addStock(credentials),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["current-inventory-by-business-id", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["inventory-history-by-business-id", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["daily-accounting-close", variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ["monthly-accounting-close", variables.businessId] });
            // La compra abre una capa nueva, así que la vista de lotes cambia.
            queryClient.invalidateQueries({
                queryKey: ["product-cost-layers", variables.businessId, variables.productId],
            });
        },
    });
}
