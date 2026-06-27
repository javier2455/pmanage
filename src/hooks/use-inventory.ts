import {
    addStock,
    getCurrentInventoryByBusinessId,
    getInventoryHistoryByBusinessId,
    getProductInventoryHistory,
} from "@/lib/api/inventory";
import {
    AddStockToProductProps,
    InventoryHistoryInclude,
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

interface ProductHistoryParams extends PaginationParams {
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
    params: PaginationParams = {},
) {
    return useQuery({
        queryKey: ["inventory-history-by-business-id", businessId, params],
        queryFn: () => getInventoryHistoryByBusinessId({ businessId, ...params }),
        enabled: !!businessId,
        placeholderData: keepPreviousData,
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
        },
    });
}
