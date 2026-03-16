import axios from "axios";
import { businessRoutes } from "../routes/business";
import { CreateBusinessPayload, GetAllProductOfMyBusinessesProps, UpdateBusinessPayload } from "../types/business";

export async function getAllProductOfMyBusinesses({ businessId }: GetAllProductOfMyBusinessesProps) {
    const { data } = await axios.get(businessRoutes.getAllProductOfMyBusinesses(businessId), {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}

export async function createBusiness(payload: CreateBusinessPayload) {
    const { data } = await axios.post(businessRoutes.createBusiness, payload, {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
    });

    return data;
}

export async function updateBusiness(businessId: string, payload: UpdateBusinessPayload) {
    const { data } = await axios.put(businessRoutes.updateBusiness(businessId), payload, {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
    });

    return data;
}

