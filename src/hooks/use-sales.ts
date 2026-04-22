import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateSaleProps } from "@/lib/types/sales";
import { cancelSale, create, getAllSalesByBusinessId, getSaleById } from "@/lib/api/sale";

interface UseAllSalesByBusinessIdParams {
    page?: number;
    limit?: number;
}

export function useAllSalesByBusinessId(
    businessId: string,
    params: UseAllSalesByBusinessIdParams = {},
) {
    return useQuery({
        queryKey: ["all-sales-by-business-id", businessId, params],
        queryFn: () => getAllSalesByBusinessId({ businessId, ...params }),
        enabled: !!businessId,
        placeholderData: keepPreviousData,
    });
}

export function useGetSaleById(saleId: string) {
    return useQuery({
        queryKey: ["sale-by-id", saleId],
        queryFn: () => getSaleById(saleId),
        enabled: !!saleId,
    });
}

export function useCreateSaleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (credentials: CreateSaleProps) => create(credentials),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-sales-by-business-id"] });
            queryClient.invalidateQueries({ queryKey: ["daily-accounting-close"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-accounting-close"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        },
    });
}

export function useCancelSaleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ saleId, cancellationReason }: { saleId: string; cancellationReason: string }) =>
            cancelSale(saleId, cancellationReason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-sales-by-business-id"] });
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses"] });
            queryClient.invalidateQueries({ queryKey: ["sale-by-id"] });
        },
    });
}