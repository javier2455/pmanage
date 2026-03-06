import { Product } from "./product";

export type AddStockToProductProps = {
    businessId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    description: string;
}

export type InventoryEntry = {
    id: string;
    idbusiness: string;
    idproduct: string;
    actionType: string;
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
