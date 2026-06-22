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
}

// --- Pagos (Fase 1) ---

export interface RegistrarPagoItem {
  moneda: string;
  monto: number;
  metodo: PaymentMethod;
  referencia?: string;
}

export interface RegistrarPagoDto {
  pagos: RegistrarPagoItem[];
}

export interface PagoResumenItem {
  id: string;
  moneda: string;
  monto: number;
  tasa: number;
  equivalente: number;
  metodo: PaymentMethod;
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