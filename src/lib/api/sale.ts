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
import { fromBackendCurrency, toBackendCurrency } from "../currency";

/** Normaliza la moneda de una venta del backend a la forma interna (mayúsculas). */
function normalizeSaleCurrency<T extends { currency?: string }>(sale: T): T {
  return sale.currency
    ? { ...sale, currency: fromBackendCurrency(sale.currency) }
    : sale;
}

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
  return { ...data, data: data.data.map(normalizeSaleCurrency) };
}

export async function getSaleById(
  saleId: string,
): Promise<SaleWithProductAndBusiness> {
  const { data } = await apiClient.get(salesRoutes.getSaleById(saleId));
  return normalizeSaleCurrency(data);
}

export async function create(
  credentials: CreateSaleProps,
): Promise<BusinessWithProducts> {
  // La moneda viaja con el código que espera el backend (p. ej. CUP_TRANSFERENCIA
  // → cup_transferencia); internamente seguimos usando la forma en mayúsculas.
  const payload = credentials.currency
    ? { ...credentials, currency: toBackendCurrency(credentials.currency) }
    : credentials;
  const { data } = await apiClient.post(salesRoutes.createSale, payload);

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
  // Cada pago viaja con la moneda en el código del backend (cup_transferencia).
  const payload: RegistrarPagoDto = {
    pagos: dto.pagos.map((pago) => ({
      ...pago,
      moneda: toBackendCurrency(pago.moneda),
    })),
  };
  const { data } = await apiClient.post(
    salesRoutes.registerPayments(saleId),
    payload,
  );
  return data;
}

export async function getPaymentsSummary(
  saleId: string,
): Promise<PaymentsSummary> {
  const { data } = await apiClient.get<PaymentsSummary>(
    salesRoutes.paymentsSummary(saleId),
  );
  // Normalizamos a la forma interna para que la UI (tasas, recargo) la reconozca.
  return {
    ...data,
    monedaBase: fromBackendCurrency(data.monedaBase),
    sugerencia: data.sugerencia
      ? { ...data.sugerencia, moneda: fromBackendCurrency(data.sugerencia.moneda) }
      : data.sugerencia,
    pagos: data.pagos.map((pago) => ({
      ...pago,
      moneda: fromBackendCurrency(pago.moneda),
    })),
  };
}

export async function getPaymentsHistory(
  saleId: string,
): Promise<PaymentHistoryItem[]> {
  const { data } = await apiClient.get<PaymentHistoryItem[]>(
    salesRoutes.paymentsHistory(saleId),
  );
  return data.map((item) => ({
    ...item,
    currency: fromBackendCurrency(item.currency),
  }));
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
