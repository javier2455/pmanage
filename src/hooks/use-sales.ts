import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateSaleProps } from "@/lib/types/sales";
import { cancelSale, create, getAllSalesByBusinessId, getSaleById } from "@/lib/api/sale";

export function useAllSalesByBusinessId(businessId: string) {
    return useQuery({
        queryKey: ["all-sales-by-business-id", businessId],
        queryFn: () => getAllSalesByBusinessId({ businessId }),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
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