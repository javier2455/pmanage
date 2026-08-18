"use client";

import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProductOfMyBusinesses, createBusiness, updateBusiness, deleteBusiness, getDashboardSummary } from "@/lib/api/business";
import type { CreateBusinessPayload, UpdateBusinessPayload } from "@/lib/types/business";
import { readCacheKey } from "@/lib/db/offline-db";
import { withOfflineFallback } from "@/lib/offline-read-cache";

/**
 * Catálogo del negocio. Es la lectura imprescindible para poder vender, así
 * que se respalda en la base local y se sirve si la red falla.
 *
 * Solo se cachea la búsqueda VACÍA: es la lista completa, de la que cualquier
 * búsqueda es un subconjunto. Guardar además cada término tecleado llenaría la
 * base de fragmentos y, al quedarse sin conexión, devolvería el resultado de
 * una búsqueda antigua como si fuera el catálogo entero.
 */
/**
 * La consulta del catálogo completo, aparte del hook.
 *
 * La preparación del dispositivo (plan offline, B4) descarga esto mismo por
 * adelantado. Se comparte la definición en vez de copiarla porque si la clave
 * de una y otra se separaran, la preparación llenaría una entrada que ninguna
 * pantalla lee — y el fallo sería invisible hasta que alguien se quedara sin
 * conexión.
 */
export function businessProductsQueryOptions(businessId: string) {
    return {
        queryKey: ["all-product-of-my-businesses", businessId, ""],
        queryFn: withOfflineFallback(
            readCacheKey("business-products", businessId),
            businessId,
            () => getAllProductOfMyBusinesses({ businessId, search: "" }),
        ),
    };
}

export function useAllProductOfMyBusinesses(businessId: string, search = "") {
    const catalog = businessProductsQueryOptions(businessId);
    return useQuery({
        queryKey: search
            ? ["all-product-of-my-businesses", businessId, search]
            : catalog.queryKey,
        queryFn: search
            ? () => getAllProductOfMyBusinesses({ businessId, search })
            : catalog.queryFn,
        enabled: !!businessId,
        placeholderData: keepPreviousData,
    });
}

export function useCreateBusinessMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateBusinessPayload) => createBusiness(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businesses"] });
        },
    });
}

export function useUpdateBusinessMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ businessId, payload }: { businessId: string, payload: UpdateBusinessPayload }) => updateBusiness(businessId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businesses"] });
        },
    });
}

export function useDeleteBusinessMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (businessId: string) => deleteBusiness(businessId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businesses"] });
        },
    });
}

export function useDashboardSummary(businessId: string) {
    return useQuery({
        queryKey: ["dashboard-summary", businessId],
        queryFn: withOfflineFallback(
            readCacheKey("dashboard-summary", businessId),
            businessId,
            () => getDashboardSummary(businessId),
        ),
        enabled: !!businessId,
    });
}