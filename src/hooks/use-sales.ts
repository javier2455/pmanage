import { useMutation, useQuery } from "@tanstack/react-query";
import { CreateSaleProps } from "@/lib/types/sales";
import { create, getAllSalesByBusinessId } from "@/lib/api/sale";

export function useAllSalesByBusinessId(businessId: string) {
    return useQuery({
        queryKey: ["all-sales-by-business-id", businessId],
        queryFn: () => getAllSalesByBusinessId({ businessId }),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
    });
}

export function useCreateSaleMutation() {
    return useMutation({
        mutationFn: (credentials: CreateSaleProps) => create(credentials),
    });
}