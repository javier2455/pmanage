import apiClient from "@/lib/axios";
import { stockAlertRoutes } from "../routes/inventory";
import type {
    SetStockAlertProps,
    SetStockAlertResponse,
    StockAlertsResponse,
} from "../types/inventory";

/**
 * Capa API de alertas de stock bajo (feature Pro).
 *
 * ⚠️ Endpoints pendientes en backend. El contrato (rutas, payload y response)
 * está documentado en docs/extra/análisis-planes/spec-tecnicas.md (Variante A)
 * y resumido en docs/backend-alertas-stock.md.
 */

/**
 * Configura, actualiza o desactiva el umbral de alerta de un producto.
 * `threshold = null` desactiva la alerta del producto.
 */
export async function setStockAlert({
    businessId,
    businessProductId,
    threshold,
}: SetStockAlertProps): Promise<SetStockAlertResponse> {
    const { data } = await apiClient.patch<SetStockAlertResponse>(
        stockAlertRoutes.setAlert(businessId, businessProductId),
        { threshold },
    );
    return data;
}

/** Lista los productos del negocio que tienen alerta de stock configurada. */
export async function getStockAlerts(
    businessId: string,
): Promise<StockAlertsResponse> {
    const { data } = await apiClient.get<StockAlertsResponse>(
        stockAlertRoutes.getAlerts(businessId),
    );
    return data;
}
