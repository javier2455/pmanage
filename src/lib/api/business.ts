import axios from "axios";
import { businessRoutes } from "../routes/business";
import { CreateBusinessPayload, GetAllProductOfMyBusinessesProps } from "../types/business";

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

