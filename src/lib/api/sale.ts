import apiClient from "@/lib/axios";
import { BusinessWithProducts } from "../types/business";
import { CreateSaleProps, SaleWithProductAndBusiness } from "../types/sales";
import { salesRoutes } from "../routes/sales";

interface GetAllSalesByBusinessIdProps {
    businessId: string;
}
export async function getAllSalesByBusinessId({ businessId }: GetAllSalesByBusinessIdProps) {
    const { data } = await apiClient.get(
        salesRoutes.getAllSalesByBusinessId(businessId)
    );

    return data;
}

export async function getSaleById(saleId: string): Promise<SaleWithProductAndBusiness> {
    const { data } = await apiClient.get(salesRoutes.getSaleById(saleId));
    return data;
}

export async function create(credentials: CreateSaleProps): Promise<BusinessWithProducts> {
    const { data } = await apiClient.post(salesRoutes.createSale, credentials);

    return data;
}

export async function cancelSale(saleId: string, cancellationReason: string) {
    const { data } = await apiClient.post(salesRoutes.cancelSale(saleId), { cancellationReason });

    return data;
}