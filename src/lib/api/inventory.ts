import apiClient from "@/lib/axios";
import { inventoryRoutes } from "../routes/inventory";
import {
    AddStockToProductProps,
    CurrentInventoryResponse,
    InventoryHistoryInclude,
    InventoryHistoryResponse,
    ProductCostLayersResponse,
} from "../types/inventory";

interface PaginatedByBusiness {
    businessId: string;
    page?: number;
    limit?: number;
}

interface InventoryHistoryFilters {
    /** Fecha de inicio en formato `yyyy-MM-dd` (día local completo). */
    startDate?: string;
    /** Fecha de fin en formato `yyyy-MM-dd`, inclusive. */
    endDate?: string;
    /** Uno o varios tipos de movimiento separados por comas. */
    actionType?: string;
}

interface BusinessInventoryHistoryParams
    extends PaginatedByBusiness,
        InventoryHistoryFilters {}

interface ProductInventoryHistoryParams
    extends PaginatedByBusiness,
        InventoryHistoryFilters {
    productId: string;
    include?: InventoryHistoryInclude;
}

/** Omite las claves vacías para no mandar `?startDate=` sin valor. */
function historyFilterParams(filters: InventoryHistoryFilters) {
    return {
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
        ...(filters.actionType ? { actionType: filters.actionType } : {}),
    };
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
    ...filters
}: BusinessInventoryHistoryParams): Promise<InventoryHistoryResponse> {
    // Antes esta llamada mandaba `stockIncrease: true` fijo, así que la vista de
    // negocio solo podía enseñar entradas: las ventas, mermas y ajustes existían
    // en la base de datos pero eran inalcanzables sin elegir un producto.
    const { data } = await apiClient.get<InventoryHistoryResponse>(
        inventoryRoutes.getInventoryByBusinessId(businessId),
        { params: { page, limit, ...historyFilterParams(filters) } },
    );
    return data;
}

export async function getProductInventoryHistory({
    businessId,
    productId,
    page,
    limit,
    include,
    ...filters
}: ProductInventoryHistoryParams): Promise<InventoryHistoryResponse> {
    const { data } = await apiClient.get<InventoryHistoryResponse>(
        inventoryRoutes.getProductInventoryHistory(businessId, productId),
        {
            params: {
                page,
                limit,
                ...(include ? { include } : {}),
                ...historyFilterParams(filters),
            },
        },
    );
    return data;
}

interface InventoryHistoryExportParams extends InventoryHistoryFilters {
    businessId: string;
    /** Acota la exportación a un producto; se omite para todo el negocio. */
    productId?: string;
}

/** Params comunes a las dos exportaciones. */
function exportParams({ productId, ...filters }: Omit<InventoryHistoryExportParams, "businessId">) {
    return {
        ...(productId ? { productId } : {}),
        ...historyFilterParams(filters),
    };
}

/**
 * PDF del historial generado por el backend.
 *
 * Devuelve el binario tal cual: el servidor es quien decide el formato y quien
 * comprueba el plan Pro, así que un usuario Free recibe un 403 aquí en vez de
 * un archivo.
 */
export async function exportInventoryHistoryToPdf({
    businessId,
    ...rest
}: InventoryHistoryExportParams): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
        inventoryRoutes.exportInventoryHistoryToPdf(businessId),
        { params: exportParams(rest), responseType: "blob" },
    );
    return data;
}

/** Excel (.xlsx) del historial generado por el backend. Mismas condiciones. */
export async function exportInventoryHistoryToExcel({
    businessId,
    ...rest
}: InventoryHistoryExportParams): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
        inventoryRoutes.exportInventoryHistoryToExcel(businessId),
        { params: exportParams(rest), responseType: "blob" },
    );
    return data;
}

/**
 * Capas de costo vivas de un producto, de la más antigua a la más reciente.
 *
 * Responde cuántas unidades quedan de cada compra y a qué costo entró cada una
 * — lo que `entryPrice` no puede decir, porque cada compra lo sobrescribe con el
 * último precio pagado.
 */
export async function getProductCostLayers({
    businessId,
    productId,
}: {
    businessId: string;
    productId: string;
}): Promise<ProductCostLayersResponse> {
    const { data } = await apiClient.get<ProductCostLayersResponse>(
        inventoryRoutes.getProductCostLayers(businessId, productId),
    );
    return data;
}

export async function addStock(credentials: AddStockToProductProps): Promise<{ message: string }> {
    const { quantity, entryPrice, description, providerId, currency, exchangeRateApplied, registerAsExpense } =
        credentials;
    const { data } = await apiClient.post(
        inventoryRoutes.addStockToProduct(credentials.businessId, credentials.productId),
        {
            quantity,
            entryPrice,
            description,
            ...(providerId ? { providerId } : {}),
            // Auto-registro del gasto de reposición de stock. Solo se envía si el
            // usuario lo marcó; el backend valida `entryPrice` y `quantity` > 0.
            ...(registerAsExpense ? { registerAsExpense: true } : {}),
            // Multimoneda: solo si el costo del lote se ingresó en moneda distinta a CUP.
            // El backend convierte `entryPrice × exchangeRateApplied` a CUP.
            ...(currency && currency !== "CUP"
                ? {
                      currency,
                      ...(exchangeRateApplied ? { exchangeRateApplied } : {}),
                  }
                : {}),
        },
    );
    return data;
}
