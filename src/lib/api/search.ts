import apiClient from "@/lib/axios";
import { searchRoutes } from "../routes/search";
import { GetAllMunicipalitiesByProvinceIdResponse, GetAllProvincesResponse } from "../types/search";

export async function getAllProvinces(): Promise<GetAllProvincesResponse> {
    const { data } = await apiClient.get(searchRoutes.getAllProvinces);

    return data;
}

export async function getAllMunicipalitiesByProvinceId(provinceId: string): Promise<GetAllMunicipalitiesByProvinceIdResponse> {
    const { data } = await apiClient.get(searchRoutes.getAllMunicipalitiesByProvinceId(provinceId));

    return data;
}