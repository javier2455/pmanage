import axios from "axios";
import apiClient from "@/lib/axios";
import { businessRoutes } from "../routes/business";
import { CreateBusinessPayload, DashboardSummaryResponse, GetAllProductOfMyBusinessesProps, UpdateBusinessPayload } from "../types/business";

/**
 * Standalone fetch (no apiClient) – usable before BusinessProvider mounts,
 * e.g. right after login to decide where to redirect.
 */
export async function getMyBusinessesList(): Promise<unknown[]> {
    const token = sessionStorage.getItem("token");
    const { data } = await axios.get(businessRoutes.getMyBusinesses, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data?.data) ? data.data : [];
}

export async function getAllProductOfMyBusinesses({ businessId }: GetAllProductOfMyBusinessesProps) {
    const { data } = await apiClient.get(businessRoutes.getAllProductOfMyBusinesses(businessId));
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
    const response = await apiClient.delete(businessRoutes.deleteBusiness(businessId));

    if (response.status >= 200 && response.status < 300) {
        return { success: true, message: "Negocio eliminado correctamente" };
    }

    return { success: false, message: "Error al eliminar el negocio" };
}

export async function getDashboardSummary(businessId: string): Promise<DashboardSummaryResponse> {
    const { data } = await apiClient.get(businessRoutes.getDashboardSummary, { params: { businessId } });
    return data;
}