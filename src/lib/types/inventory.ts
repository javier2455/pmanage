import { Product } from "./product";


export type AddStockToProductProps = {
    businessId: string;
    productId: string;
    quantity: number;
    entryPrice: number;
    description: string;
    providerId?: string | null;
    /**
     * Moneda del costo del lote (`CUP`, `USD`, `EURO`, `MLC`…). Si se omite o es
     * `CUP`, no hay conversión; el backend convierte a CUP antes de persistir y
     * actualiza `entryPrice` con el último costo. Ver docs/multimoneda-productos.md.
     */
    currency?: string;
    /**
     * Tasa CUP por 1 unidad de `currency`. Si se omite, el backend la busca en
     * `MonetaryExchange`. El frontend envía la misma tasa que usó para el preview.
     */
    exchangeRateApplied?: number;
    /**
     * Si es `true`, el backend crea un gasto de "Reposición de stock"
     * (`entryPrice × quantity`, en la moneda original) de forma atómica con la
     * entrada de stock. Por defecto `false`.
     */
    registerAsExpense?: boolean;
}

export interface InventoryMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type InventoryEntry = {
    id: string;
    idbusiness: string;
    idproduct: string;
    actionType: InventoryActionType;
    quantity: string;
    previousStock: string;
    newStock: string;
    unitPrice: string;
    entryPrice: string;
    supplier: string;
    description: string;
    idbusinessProduct: string;
    product: Product;
    createdAt: string;
};

export type CurrentInventoryProduct = {
    id: string;
    name: string;
    description: string | null;
    category: string;
    unit: string;
    imageUrl: string | null;
    userId: string | null;
};

export type CurrentInventoryEntry = {
    id: string;
    businessId: string;
    productId: string;
    price: string;
    stock: number;
    entryPrice: string;
    updatedAt: string;
    product: CurrentInventoryProduct;
    /**
     * Categoría del BusinessProduct (por negocio). Tras el cambio de relación
     * del backend la categoría vive a este nivel, no en `product`. Ver
     * docs/category.md. Puede ser `null`.
     */
    category?: { id: string; name: string } | string | null;
    /**
     * Umbral de alerta de stock bajo del BusinessProduct (null = sin alerta).
     * TODO(backend): incluir este campo en `GET /inventory/business/:id/current`.
     * Mientras no llegue, el frontend resuelve el umbral vía `GET .../stock-alerts`
     * (ver `useStockAlerts`). Spec: docs/extra/análisis-planes/spec-tecnicas.md.
     */
    stockAlertThreshold?: number | null;
};

export interface CurrentInventoryResponse {
    message: string;
    data: CurrentInventoryEntry[];
    meta: InventoryMeta;
}

export interface InventoryHistoryResponse {
    message: string;
    data: InventoryEntry[];
    meta: InventoryMeta;
}

/**
 * Tipo de registros a incluir en el historial por producto.
 * - `increases`: solo entradas (previousStock < newStock). Es el valor por defecto del backend.
 * - `all`: todos los movimientos (ventas, pérdidas, ajustes, etc.).
 */
export type InventoryHistoryInclude = "increases" | "all";

export enum InventoryActionType {
    PURCHASE = "purchase",
    CANCEL_SALE = "cancel_sale",
    INITIAL_STOCK = "initial_stock",
    /** Merma: unidades de una venta cancelada que NO vuelven al stock (dañadas). */
    LOSS = "loss",
}

export type InventoryActionTypeLabels = {
    [key in InventoryActionType]: string;
}

export const inventoryActionTypeLabels: InventoryActionTypeLabels = {
    [InventoryActionType.PURCHASE]: "Compra",
    [InventoryActionType.CANCEL_SALE]: "Cancelación de venta",
    [InventoryActionType.INITIAL_STOCK]: "Stock inicial",
    [InventoryActionType.LOSS]: "Pérdida",
};

/* -------------------------------------------------------------------------- */
/*  Alertas de stock bajo (feature Pro)                                       */
/*  Spec/contrato: docs/extra/análisis-planes/spec-tecnicas.md (Variante A).  */
/* -------------------------------------------------------------------------- */

/**
 * Producto del negocio con alerta de stock configurada.
 * Devuelto por `GET /businesses/:businessId/stock-alerts`.
 */
export interface StockAlert {
    productId: string;
    businessProductId: string;
    name: string;
    category: string;
    unit: string;
    stock: number;
    threshold: number;
    /** `true` cuando `stock <= threshold`. Lo calcula el backend. */
    isLow: boolean;
}

export interface StockAlertsResponse {
    alerts: StockAlert[];
}

/** Payload de `PATCH /businesses/:businessId/products/:businessProductId/stock-alert`. */
export interface SetStockAlertProps {
    businessId: string;
    businessProductId: string;
    /** Umbral mínimo. `null` desactiva la alerta del producto. */
    threshold: number | null;
}

/** Respuesta de configurar/actualizar la alerta de un producto. */
export interface SetStockAlertResponse {
    id: string;
    businessProductId: string;
    threshold: number | null;
    updatedAt: string;
}

/** Estado visual derivado del stock vs. su umbral. */
export type StockAlertStatus = "out" | "low" | "ok";