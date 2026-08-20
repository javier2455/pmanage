import axios from "axios";
import apiClient from "@/lib/axios";
import { businessRoutes } from "../routes/business";
import { Business, CreateBusinessPayload, DashboardSummaryResponse, GetAllProductOfMyBusinessesProps, UpdateBusinessPayload } from "../types/business";

/**
 * Standalone fetch (no apiClient) – usable before BusinessProvider mounts,
 * e.g. right after login to decide where to redirect.
 */
export async function getMyBusinessesList(): Promise<Business[]> {
    const token = sessionStorage.getItem("token");
    const { data } = await axios.get(businessRoutes.getMyBusinesses, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data?.data) ? data.data : [];
}

export async function getAllProductOfMyBusinesses({ businessId, search }: GetAllProductOfMyBusinessesProps) {
    const { data } = await apiClient.get(
        businessRoutes.getAllProductOfMyBusinesses(businessId),
        // Omitimos `search` cuando está vacío para no ensuciar la URL ni la cache.
        { params: { search: search || undefined } },
    );
    return data;
}

export async function createBusiness(payload: CreateBusinessPayload) {
    const { data } = await apiClient.post(businessRoutes.createBusiness, payload);
    return data;
}

export async function updateBusiness(businessId: string, payload: UpdateBusinessPayload) {
    const { data } = await apiClient.put(businessRoutes.updateBusiness(businessId), payload);
    return data;
}

export async function deleteBusiness(businessId: string) {
    // Un status fuera de 2xx ya llega como excepción de axios, así que aquí no
    // hay caso de error que distinguir.
    await apiClient.delete(businessRoutes.deleteBusiness(businessId));
}

export async function getDashboardSummary(businessId: string): Promise<DashboardSummaryResponse> {
    const { data } = await apiClient.get(businessRoutes.getDashboardSummary, { params: { businessId } });
    return data;
}