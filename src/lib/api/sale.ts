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
import { getDeviceId } from "@/lib/offline/device-id";

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

/**
 * Tiempo máximo que se espera al registrar una venta.
 *
 * Sin límite, una red que se cae a mitad de la petición deja el botón
 * «Registrando…» girando para siempre: el navegador no siempre falla al
 * instante —sin conexión puede tardar decenas de segundos en rendirse— y quien
 * está cobrando se queda mirando la pantalla sin saber si la venta entró.
 *
 * Cortar es seguro precisamente porque la petición lleva `Idempotency-Key`: si
 * el servidor llegó a registrarla, la venta encolada con esa misma clave se
 * reconoce al subirla y no se duplica.
 */
export const SALE_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Cuerpo exacto que espera `POST /sales`.
 *
 * Se extrae de `create` para que la cola sin conexión guarde EL MISMO cuerpo
 * que se manda en línea: el servidor compara una huella del cuerpo con la
 * clave de idempotencia, así que dos formas distintas del mismo pedido se
 * leerían como reutilización de la clave y la venta encolada se rechazaría.
 */
export function buildCreateSalePayload(
  credentials: CreateSaleProps,
): Record<string, unknown> {
  // La moneda viaja con el código que espera el backend (p. ej. CUP_TRANSFERENCIA
  // → cup_transferencia); internamente seguimos usando la forma en mayúsculas.
  return credentials.currency
    ? { ...credentials, currency: toBackendCurrency(credentials.currency) }
    : { ...credentials };
}

export async function create(
  credentials: CreateSaleProps,
  options: { operationId?: string } = {},
): Promise<BusinessWithProducts> {
  return postCreateSale(buildCreateSalePayload(credentials), options.operationId);
}

/**
 * Manda un cuerpo ya normalizado.
 *
 * Con `operationId` la petición lleva `Idempotency-Key`: un reintento —doble
 * clic, o una respuesta que se perdió por el camino— devuelve la venta ya
 * creada en vez de crear una segunda. Es la misma clave con la que la
 * operación viajaría por la cola, de modo que ambas vías comparten la entrada
 * del registro del servidor y no pueden duplicar el efecto.
 */
export async function postCreateSale(
  payload: Record<string, unknown>,
  operationId?: string,
): Promise<BusinessWithProducts> {
  const headers: Record<string, string> = {};
  if (operationId) headers["Idempotency-Key"] = operationId;
  const deviceId = getDeviceId();
  if (deviceId) headers["X-Device-Id"] = deviceId;

  const { data } = await apiClient.post(salesRoutes.createSale, payload, {
    headers,
    timeout: SALE_REQUEST_TIMEOUT_MS,
  });
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
  // El vuelto lleva la suya propia: puede devolverse en una moneda distinta a
  // la del pago, así que también hay que traducirla.
  const payload: RegistrarPagoDto = {
    pagos: dto.pagos.map((pago) => ({
      ...pago,
      moneda: toBackendCurrency(pago.moneda),
      ...(pago.excedente
        ? {
            excedente: pago.excedente.vuelto
              ? {
                  vuelto: {
                    ...pago.excedente.vuelto,
                    moneda: toBackendCurrency(pago.excedente.vuelto.moneda),
                  },
                }
              : {},
          }
        : {}),
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
      vuelto: pago.vuelto
        ? { ...pago.vuelto, moneda: fromBackendCurrency(pago.vuelto.moneda) }
        : pago.vuelto,
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
