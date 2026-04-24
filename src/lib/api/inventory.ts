import apiClient from "@/lib/axios";
import { inventoryRoutes } from "../routes/inventory";
import {
    AddStockToProductProps,
    CurrentInventoryResponse,
    InventoryHistoryResponse,
} from "../types/inventory";

interface PaginatedByBusiness {
    businessId: string;
    page?: number;
    limit?: number;
}

export async function getCurrentInventoryByBusinessId({
    businessId,
    page,
    limit,
}: PaginatedByBusiness): Promise<CurrentInventoryResponse> {
    const { data } = await apiClient.get<CurrentInventoryResponse>(
        inventoryRoutes.getCurrentInventoryByBusinessId(businessId),
        { params: { page, limit } },
    );
    return data;
}

export async function getInventoryHistoryByBusinessId({
    businessId,
    page,
    limit,
}: PaginatedByBusiness): Promise<InventoryHistoryResponse> {
    const { data } = await apiClient.get<InventoryHistoryResponse>(
        inventoryRoutes.getInventoryByBusinessId(businessId),
        { params: { page, limit, stockIncrease: true } },
    );
    return data;
}

export async function addStock(credentials: AddStockToProductProps): Promise<{ message: string }> {
    const { quantity, entryPrice, description } = credentials;
    const { data } = await apiClient.post(
        inventoryRoutes.addStockToProduct(credentials.businessId, credentials.productId),
        { quantity, entryPrice, description },
    );
    return data;
}
