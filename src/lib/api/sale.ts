import axios from "axios";
import { BusinessWithProducts } from "../types/business";
import { CreateSaleProps, SaleDetailsProps } from "../types/sales";
import { salesRoutes } from "../routes/sales";

interface GetAllSalesByBusinessIdProps {
    businessId: string;
}
export async function getAllSalesByBusinessId({ businessId }: GetAllSalesByBusinessIdProps) {
    const { data } = await axios.get(
        salesRoutes.getAllSalesByBusinessId(businessId),
        {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
        },
    );

    return data;
}

export async function getSaleById(saleId: string): Promise<SaleDetailsProps> {
    const { data } = await axios.get(salesRoutes.getSaleById(saleId), {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function create(credentials: CreateSaleProps): Promise<BusinessWithProducts> {
    console.log('credentials of create', credentials)
    const { data } = await axios.post(salesRoutes.createSale, credentials, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}

export async function cancelSale(saleId: string, cancellationReason: string) {
    const { data } = await axios.post(salesRoutes.cancelSale(saleId), { cancellationReason }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}