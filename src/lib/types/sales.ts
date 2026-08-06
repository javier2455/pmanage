import { SalesProductInfoResponse } from "./product";

export interface SalesResponseInterface {
  data: SaleWithProductAndBusiness[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export type PaymentStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "cancelled";
export type PaymentMethod = "cash" | "transfer" | "card" | "crypto";
export type SaleType = "in_store" | "delivery" | "pickup";

export interface SaleWithProductAndBusiness {
  id: string;
  idbusiness: string;
  total: string;
  descripcion: string;
  isCancelled: boolean;
  cancelledReason: string | null;
  createdAt: Date;
  createdBy: string;
  userName: string;
  items: SalesProductInfoResponse[];
  // Campos multimoneda (Fase 1). Opcionales: TODO(backend) confirmar que la lista
  // y GET /sales/:id ya los devuelven; mientras tanto se usan fallbacks en la UI.
  currency?: string;
  paymentStatus?: PaymentStatus;
  totalPaid?: string | number;
  saleType?: SaleType;
  // Datos de entrega / mensajería (ventas `delivery`). El backend los devuelve
  // en el detalle de la venta; mismo contrato que `CreateSaleProps`.
  deliveryAddress?: string | null;
  deliveryContactPhone?: string | null;
  deliveryContactName?: string | null;
  /**
   * Precio de la mensajería. `null` cuando la venta no es a domicilio; `>= 0` en
   * ventas `delivery`. El backend puede enviarlo como string (igual que `total`),
   * así que conviene coercer con `Number()` antes de formatear.
   */
  deliveryFee?: number | string | null;
}

export interface CreateSaleItemProps {
  idproducto: string;
  quantity: number;
  price: number;
}

// --- Cancelación de venta (total o parcial con merma) ---

export interface CancelSaleItemInput {
  /** ID del item de venta (`SalesProductInfoResponse.id`). */
  itemId: string;
  /**
   * Cantidad a cancelar de la línea. Si se omite, se cancela toda la cantidad
   * del ítem. El resto de la línea sigue activo (cancelación parcial).
   */
  quantity?: number;
  /**
   * Unidades (de las canceladas) que vuelven al stock. Si se omite, vuelven
   * todas (`= quantity`). La diferencia `quantity - returnToStock` la registra
   * el backend como pérdida (`LOSS`); `0` = todo dañado.
   */
  returnToStock?: number;
  cancellationReason?: string;
}

export interface CancelSaleProps {
  cancellationReason: string;
  /** Ausente/vacío = cancelación total. Con items = cancelación parcial. */
  items?: CancelSaleItemInput[];
}

export interface CreateSaleProps {
  idbusiness: string;
  descripcion: string;
  items: CreateSaleItemProps[];
  currency?: string;
  saleType?: SaleType;
  deliveryAddress?: string;
  deliveryContactPhone?: string;
  deliveryContactName?: string;
  /** Precio de la mensajería. `null` si no es venta a domicilio; `>= 0` en ventas `delivery`. */
  deliveryFee?: number | null;
}

// --- Pagos (Fase 1) ---

/** Vuelto entregado al cliente. Su moneda puede diferir de la del pago. */
export interface VueltoItem {
  moneda: string;
  monto: number;
}

/**
 * Qué hacer con lo que sobra cuando el cliente entrega de más.
 *
 * Es obligatorio en cuanto el pago supera lo pendiente: su presencia le dice al
 * backend que el cajero vio el excedente, y sin ella el cobro se rechaza con
 * `EXCEDENTE_NO_DECLARADO`. Lo que no se devuelva como `vuelto` queda a favor
 * del negocio; ese importe no se envía, lo calcula el backend.
 */
export interface ExcedentePago {
  vuelto?: VueltoItem;
}

export interface RegistrarPagoItem {
  moneda: string;
  /** Lo que el cliente ENTREGA, no lo que cubre la venta. */
  monto: number;
  metodo: PaymentMethod;
  referencia?: string;
  excedente?: ExcedentePago;
}

export interface RegistrarPagoDto {
  pagos: RegistrarPagoItem[];
}

export interface PagoResumenItem {
  id: string;
  moneda: string;
  /** Importe entregado, en `moneda`. */
  monto: number;
  tasa: number;
  /** Importe aplicado a la venta, en la moneda de la venta. */
  equivalente: number;
  metodo: PaymentMethod;
  /** Vuelto devuelto, con su moneda y tasa propias. `null` si no hubo. */
  vuelto?: { moneda: string; monto: number; tasa: number } | null;
  /** Excedente no devuelto, en la moneda de la VENTA. */
  propina?: number;
  referencia?: string | null;
  fecha: string;
}

export interface PagoSugerencia {
  moneda: string;
  monto: number;
  tasa: number;
}

export interface PaymentsSummary {
  totalVenta: number;
  totalPagado: number;
  pendiente: number;
  monedaBase: string;
  estado: PaymentStatus;
  /** Suma de los excedentes no devueltos, en la moneda de la venta. */
  totalPropinas?: number;
  pagos: PagoResumenItem[];
  sugerencia: PagoSugerencia | null;
}

export interface PaymentHistoryItem {
  id: string;
  sale: { id: string };
  currency: string;
  amount: number;
  exchangeRateApplied: number;
  amountInBaseCurrency: number;
  method: PaymentMethod;
  reference: string | null;
  createdById: string | null;
  createdAt: string;
}