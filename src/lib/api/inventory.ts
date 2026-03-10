import axios from "axios";
import { inventoryRoutes } from "../routes/inventory";
import { AddStockToProductProps, InventoryEntryResponse } from "../types/inventory";

export async function getAllInventoryByBusinessId(businessId: string): Promise<InventoryEntryResponse> {
    const { data } = await axios.get(inventoryRoutes.getInventoryByBusinessId(businessId), {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function addStock(credentials: AddStockToProductProps): Promise<{ message: string }> {
    console.log('credentials of create', credentials)
    const { quantity, entryPrice, description } = credentials
    const { data } = await axios.post(inventoryRoutes.addStockToProduct(credentials.businessId, credentials.productId), { quantity, entryPrice, description }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    return data;
}