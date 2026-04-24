import {
    addStock,
    getCurrentInventoryByBusinessId,
    getInventoryHistoryByBusinessId,
} from "@/lib/api/inventory";
import { AddStockToProductProps } from "@/lib/types/inventory";
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
