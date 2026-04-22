import apiClient from "@/lib/axios";
import { BusinessWithProducts } from "../types/business";
import { CreateSaleProps, SalesResponseInterface, SaleWithProductAndBusiness } from "../types/sales";
import { salesRoutes } from "../routes/sales";

interface GetAllSalesByBusinessIdProps {
  businessId: string;
  page?: number;
  limit?: number;
}
export async function getAllSalesByBusinessId({
  businessId,
  page,
  limit,
}: GetAllSalesByBusinessIdProps): Promise<SalesResponseInterface> {
  const { data } = await apiClient.get<SalesResponseInterface>(
    salesRoutes.getAllSalesByBusinessId(businessId),
    { params: { page, limit } },
  );
  return data;
}

export async function getSaleById(
  saleId: string,
): Promise<SaleWithProductAndBusiness> {
  const { data } = await apiClient.get(salesRoutes.getSaleById(saleId));
  return data;
}

export async function create(
  credentials: CreateSaleProps,
): Promise<BusinessWithProducts> {
  const { data } = await apiClient.post(salesRoutes.createSale, credentials);

  return data;
}

export async function cancelSale(saleId: string, cancellationReason: string) {
  const { data } = await apiClient.post(salesRoutes.cancelSale(saleId), {
    cancellationReason,
  });

  return data;
}
