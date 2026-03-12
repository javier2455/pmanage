import axios from "axios";
import { searchRoutes } from "../routes/search";
import { GetAllMunicipalitiesByProvinceIdResponse, GetAllProvincesResponse } from "../types/search";

export async function getAllProvinces(): Promise<GetAllProvincesResponse> {
    const { data } = await axios.get(searchRoutes.getAllProvinces, {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}

export async function getAllMunicipalitiesByProvinceId(provinceId: string): Promise<GetAllMunicipalitiesByProvinceIdResponse> {
    const { data } = await axios.get(searchRoutes.getAllMunicipalitiesByProvinceId(provinceId), {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}