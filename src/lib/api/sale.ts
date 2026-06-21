import apiClient from "@/lib/axios";
import { BusinessWithProducts } from "../types/business";
import {
  CancelSaleProps,
  CreateSaleProps,
  PaymentHistoryItem,
  PaymentsSummary,
  RegistrarPagoDto,
  SalesResponseInterface,
  SaleWithProductAndBusiness,
} from "../types/sales";
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

export async function cancelSale(saleId: string, body: CancelSaleProps) {
  const { data } = await apiClient.post(salesRoutes.cancelSale(saleId), body);

  return data;
}

export async function registerPayments(
  saleId: string,
  dto: RegistrarPagoDto,
): Promise<{ resumen: PaymentsSummary }> {
  const { data } = await apiClient.post(
    salesRoutes.registerPayments(saleId),
    dto,
  );
  return data;
}

export async function getPaymentsSummary(
  saleId: string,
): Promise<PaymentsSummary> {
  const { data } = await apiClient.get(salesRoutes.paymentsSummary(saleId));
  return data;
}

export async function getPaymentsHistory(
  saleId: string,
): Promise<PaymentHistoryItem[]> {
  const { data } = await apiClient.get(salesRoutes.paymentsHistory(saleId));
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Facturación PDF (Fase 2). El PDF llega como binario (responseType: blob).  */
/* -------------------------------------------------------------------------- */

export async function downloadFactura(saleId: string): Promise<Blob> {
  const { data } = await apiClient.get(salesRoutes.factura(saleId), {
    responseType: "blob",
  });
  return data;
}

export async function regenerateFactura(saleId: string): Promise<Blob> {
  const { data } = await apiClient.post(
    salesRoutes.regenerateFactura(saleId),
    null,
    { responseType: "blob" },
  );
  return data;
}
