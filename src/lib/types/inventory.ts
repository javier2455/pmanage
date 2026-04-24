import { Product } from "./product";


export type AddStockToProductProps = {
    businessId: string;
    productId: string;
    quantity: number;
    entryPrice: number;
    description: string;
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

export enum InventoryActionType {
    PURCHASE = "purchase",
    CANCEL_SALE = "cancel_sale",
    INITIAL_STOCK = "initial_stock",
}

export type InventoryActionTypeLabels = {
    [key in InventoryActionType]: string;
}

export const inventoryActionTypeLabels: InventoryActionTypeLabels = {
    [InventoryActionType.PURCHASE]: "Compra",
    [InventoryActionType.CANCEL_SALE]: "Cancelación de venta",
    [InventoryActionType.INITIAL_STOCK]: "Stock inicial",
};