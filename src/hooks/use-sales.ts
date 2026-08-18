import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { CancelSaleProps, CreateSaleProps, RegistrarPagoDto } from "@/lib/types/sales";
import {
    cancelSale,
    downloadFactura,
    getAllSalesByBusinessId,
    getPaymentsHistory,
    getPaymentsSummary,
    getSaleById,
    registerPayments,
} from "@/lib/api/sale";
import { createSaleOrQueue } from "@/lib/offline/sale-sync";
import { readCacheKey } from "@/lib/db/offline-db";
import { withOfflineFallback } from "@/lib/offline-read-cache";
import { LIST_KEY as NOTIFICATIONS_KEY, UNREAD_KEY as NOTIFICATIONS_UNREAD_KEY } from "./use-notifications";

interface UseAllSalesByBusinessIdParams {
    page?: number;
    limit?: number;
}

/**
 * Listado de ventas. Se respalda en la base local para que sin conexión se vea
 * lo último conocido en vez de «Error al cargar las ventas».
 *
 * La página y el tamaño entran en la clave: servir la página 1 cuando se pidió
 * la 3 sería mentir sobre qué se está mirando.
 */
export function useAllSalesByBusinessId(
    businessId: string,
    params: UseAllSalesByBusinessIdParams = {},
) {
    return useQuery({
        queryKey: ["all-sales-by-business-id", businessId, params],
        queryFn: withOfflineFallback(
            readCacheKey("sales", businessId, `p${params.page ?? 1}-l${params.limit ?? 0}`),
            businessId,
            () => getAllSalesByBusinessId({ businessId, ...params }),
        ),
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

/**
 * Consultas que quedan obsoletas cuando entra una venta nueva.
 *
 * Se extrae porque la venta ya no llega solo por la mutación: al subir la cola
 * de operaciones sin conexión entran varias de golpe, y esa vía tiene que
 * refrescar exactamente lo mismo. Dos listas que se copian acaban divergiendo
 * y el síntoma sería una pantalla que no se actualiza sin motivo aparente.
 */
export function invalidateAfterSale(queryClient: QueryClient, bid: string) {
    queryClient.invalidateQueries({ queryKey: ["all-sales-by-business-id", bid] });
    queryClient.invalidateQueries({ queryKey: ["current-inventory-by-business-id", bid] });
    queryClient.invalidateQueries({ queryKey: ["inventory-history-by-business-id", bid] });
    queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses", bid] });
    queryClient.invalidateQueries({ queryKey: ["daily-accounting-close", bid] });
    queryClient.invalidateQueries({ queryKey: ["monthly-accounting-close", bid] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary", bid] });
    // La venta consume capas por FIFO: cambian tanto los lotes vivos
    // como lo vendido de cada uno.
    queryClient.invalidateQueries({ queryKey: ["product-cost-layers", bid] });
    queryClient.invalidateQueries({ queryKey: ["product-lot-profitability", bid] });
    // Una venta puede cruzar el umbral mínimo de stock y generar
    // notificaciones en el backend; refrescamos lista y conteo del badge.
    queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, bid] });
    queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY, bid] });
}

export function useCreateSaleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (credentials: CreateSaleProps) => createSaleOrQueue(credentials),
        onSuccess: (result, variables) => {
            // Encolada sin conexión: no hay nada nuevo en el servidor que
            // recargar, y cada invalidación sería una petición condenada a
            // fallar. La lista se actualizará al subir la cola.
            if (result.queued) return;

            invalidateAfterSale(queryClient, variables.idbusiness);
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
            // Cancelar devuelve las unidades a sus capas y descuenta lo vendido
            // de cada lote, así que las dos vistas de costeo quedan obsoletas.
            // Se invalidan por prefijo de negocio porque la cancelación puede
            // tocar varios productos y aquí solo se conoce la venta.
            queryClient.invalidateQueries({ queryKey: ["product-cost-layers", bid] });
            queryClient.invalidateQueries({ queryKey: ["product-lot-profitability", bid] });
            // Cancelar repone stock: puede resolver/generar avisos de umbral.
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, bid] });
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY, bid] });
        },
    });
}