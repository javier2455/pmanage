import apiClient from "@/lib/axios";
import { inventoryRoutes } from "../routes/inventory";
import {
    AddStockToProductProps,
    CurrentInventoryResponse,
    InventoryHistoryInclude,
    InventoryHistoryResponse,
} from "../types/inventory";

interface PaginatedByBusiness {
    businessId: string;
    page?: number;
    limit?: number;
}

interface ProductInventoryHistoryParams extends PaginatedByBusiness {
    productId: string;
    include?: InventoryHistoryInclude;
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

export async function getProductInventoryHistory({
    businessId,
    productId,
    page,
    limit,
    include,
}: ProductInventoryHistoryParams): Promise<InventoryHistoryResponse> {
    const { data } = await apiClient.get<InventoryHistoryResponse>(
        inventoryRoutes.getProductInventoryHistory(businessId, productId),
        { params: { page, limit, ...(include ? { include } : {}) } },
    );
    return data;
}

export async function addStock(credentials: AddStockToProductProps): Promise<{ message: string }> {
    const { quantity, entryPrice, description, providerId } = credentials;
    const { data } = await apiClient.post(
        inventoryRoutes.addStockToProduct(credentials.businessId, credentials.productId),
        {
            quantity,
            entryPrice,
            description,
            ...(providerId ? { providerId } : {}),
        },
    );
    return data;
}
