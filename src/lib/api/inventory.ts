import apiClient from "@/lib/axios";
import { inventoryRoutes } from "../routes/inventory";
import { AddStockToProductProps, InventoryEntryResponse } from "../types/inventory";

export async function getAllInventoryByBusinessId(businessId: string): Promise<InventoryEntryResponse> {
    const { data } = await apiClient.get(inventoryRoutes.getInventoryByBusinessId(businessId));
    return data;
}

export async function addStock(credentials: AddStockToProductProps): Promise<{ message: string }> {
    const { quantity, entryPrice, description } = credentials
    const { data } = await apiClient.post(inventoryRoutes.addStockToProduct(credentials.businessId, credentials.productId), { quantity, entryPrice, description });
    return data;
}