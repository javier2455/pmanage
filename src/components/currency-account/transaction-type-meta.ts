import type { TransactionType } from "@/lib/types/financial-transaction";

/** Variantes de Badge disponibles que usamos para los tipos de transacción. */
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface TransactionTypeMeta {
  label: string;
  variant: BadgeVariant;
}

/** Fuente única de presentación (etiqueta + color) por tipo de transacción. */
export const TRANSACTION_TYPE_META: Record<TransactionType, TransactionTypeMeta> = {
  sale: { label: "Venta", variant: "default" },
  payment: { label: "Pago", variant: "secondary" },
  expense: { label: "Gasto", variant: "destructive" },
  sale_cancellation: { label: "Cancelación de venta", variant: "destructive" },
  inventory_adjustment: { label: "Ajuste de inventario", variant: "outline" },
  inventory_return: { label: "Devolución a inventario", variant: "outline" },
  purchase: { label: "Compra", variant: "secondary" },
  stock_purchase: { label: "Compra de stock", variant: "secondary" },
};

/** Fallback seguro para tipos que el backend agregue en el futuro. */
const FALLBACK_META: TransactionTypeMeta = {
  label: "Transacción",
  variant: "outline",
};

export function getTransactionTypeMeta(type: string): TransactionTypeMeta {
  return TRANSACTION_TYPE_META[type as TransactionType] ?? FALLBACK_META;
}
