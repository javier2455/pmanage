import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CancelSaleProps, CreateSaleProps, RegistrarPagoDto } from "@/lib/types/sales";
import {
    cancelSale,
    create,
    downloadFactura,
    getAllSalesByBusinessId,
    getPaymentsHistory,
    getPaymentsSummary,
    getSaleById,
    regenerateFactura,
    registerPayments,
} from "@/lib/api/sale";
import { LIST_KEY as NOTIFICATIONS_KEY, UNREAD_KEY as NOTIFICATIONS_UNREAD_KEY } from "./use-notifications";

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
        onSuccess: (_, variables) => {
            const bid = variables.idbusiness;
            queryClient.invalidateQueries({ queryKey: ["all-sales-by-business-id", bid] });
            queryClient.invalidateQueries({ queryKey: ["current-inventory-by-business-id", bid] });
            queryClient.invalidateQueries({ queryKey: ["inventory-history-by-business-id", bid] });
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses", bid] });
            queryClient.invalidateQueries({ queryKey: ["daily-accounting-close", bid] });
            queryClient.invalidateQueries({ queryKey: ["monthly-accounting-close", bid] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary", bid] });
            // Una venta puede cruzar el umbral mínimo de stock y generar
            // notificaciones en el backend; refrescamos lista y conteo del badge.
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, bid] });
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY, bid] });
        },
    });
}

export function usePaymentsSummary(saleId: string) {
    return useQuery({
        queryKey: ["payments-summary", saleId],
        queryFn: () => getPaymentsSummary(saleId),
        enabled: !!saleId,
    });
}

export function usePaymentsHistory(saleId: string) {
    return useQuery({
        queryKey: ["payments-history", saleId],
        queryFn: () => getPaymentsHistory(saleId),
        enabled: !!saleId,
    });
}

export function useRegisterPaymentsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ saleId, dto }: { saleId: string; dto: RegistrarPagoDto; businessId: string }) =>
            registerPayments(saleId, dto),
        onSuccess: (_, variables) => {
            const bid = variables.businessId;
            queryClient.invalidateQueries({ queryKey: ["payments-summary", variables.saleId] });
            queryClient.invalidateQueries({ queryKey: ["payments-history", variables.saleId] });
            queryClient.invalidateQueries({ queryKey: ["sale-by-id", variables.saleId] });
            queryClient.invalidateQueries({ queryKey: ["all-sales-by-business-id", bid] });
            queryClient.invalidateQueries({ queryKey: ["daily-accounting-close", bid] });
            queryClient.invalidateQueries({ queryKey: ["monthly-accounting-close", bid] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary", bid] });
        },
    });
}

export function useDownloadFacturaMutation() {
    return useMutation({
        mutationFn: (saleId: string) => downloadFactura(saleId),
    });
}

export function useRegenerateFacturaMutation() {
    return useMutation({
        mutationFn: (saleId: string) => regenerateFactura(saleId),
    });
}

export function useCancelSaleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ saleId, body }: { saleId: string; body: CancelSaleProps; businessId: string }) =>
            cancelSale(saleId, body),
        onSuccess: (_, variables) => {
            const bid = variables.businessId;
            queryClient.invalidateQueries({ queryKey: ["all-sales-by-business-id", bid] });
            queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses", bid] });
            queryClient.invalidateQueries({ queryKey: ["sale-by-id", variables.saleId] });
            queryClient.invalidateQueries({ queryKey: ["current-inventory-by-business-id", bid] });
            queryClient.invalidateQueries({ queryKey: ["inventory-history-by-business-id", bid] });
            queryClient.invalidateQueries({ queryKey: ["daily-accounting-close", bid] });
            queryClient.invalidateQueries({ queryKey: ["monthly-accounting-close", bid] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary", bid] });
            // Cancelar repone stock: puede resolver/generar avisos de umbral.
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, bid] });
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY, bid] });
        },
    });
}