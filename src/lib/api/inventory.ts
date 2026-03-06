import axios from "axios";
import { inventoryRoutes } from "../routes/inventory";
import { AddStockToProductProps, InventoryEntry } from "../types/inventory";

export async function getAllInventoryByBusinessId(businessId: string): Promise<InventoryEntry[]> {
    const { data } = await axios.get(inventoryRoutes.getInventoryByBusinessId(businessId), {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function addStock(credentials: AddStockToProductProps): Promise<{ message: string }> {
    console.log('credentials of create', credentials)
    const { quantity, unitPrice, description } = credentials
    const { data } = await axios.post(inventoryRoutes.addStockToProduct(credentials.businessId, credentials.productId), { quantity, description }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    return data;
}