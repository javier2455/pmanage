"use client";

import { getStockAlerts, setStockAlert } from "@/lib/api/stock-alerts";
import type { SetStockAlertProps } from "@/lib/types/inventory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hooks de alertas de stock bajo (feature Pro).
 * Contrato backend: docs/backend-alertas-stock.md.
 */

export function useStockAlerts(businessId: string) {
    return useQuery({
        queryKey: ["stock-alerts", businessId],
        queryFn: () => getStockAlerts(businessId),
        enabled: !!businessId,
    });
}

export function useSetStockAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (props: SetStockAlertProps) => setStockAlert(props),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["stock-alerts", variables.businessId],
            });
            // El stock actual embebe el umbral; refrescamos para reflejar el cambio.
            queryClient.invalidateQueries({
                queryKey: ["current-inventory-by-business-id", variables.businessId],
            });
        },
    });
}
