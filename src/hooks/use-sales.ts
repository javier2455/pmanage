import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateSaleProps } from "@/lib/types/sales";
import { create, deleteSale, getAllSalesByBusinessId, getSaleById } from "@/lib/api/sale";

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
    return useMutation({
        mutationFn: (credentials: CreateSaleProps) => create(credentials),
    });
}

export function useDeleteSaleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (saleId: string,) => deleteSale(saleId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["all-sales-by-business-id"],
            });
        },
    });
}