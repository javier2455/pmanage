import axios from "axios";
import { businessRoutes } from "../routes/business";
import { GetAllProductOfMyBusinessesProps } from "../types/business";



export async function getAllProductOfMyBusinesses({ businessId }: GetAllProductOfMyBusinessesProps) {
    const { data } = await axios.get(businessRoutes.getAllProductOfMyBusinesses(businessId), {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    return data;
}

