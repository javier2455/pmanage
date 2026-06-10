import { BASIC_ROUTE } from ".";

export const inventoryRoutes = {
  // getAllEntriesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/entries/business/${businessId}`,
  // createEntry: `${BASIC_ROUTE}/entries`,
  addStockToProduct: (businessId: string, productId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/product/${productId}/add-stock`,
  getCurrentInventoryByBusinessId: (businessId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/current`,
  getInventoryByBusinessId: (businessId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/history`,
  getProductInventoryHistory: (businessId: string, productId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/product/${productId}/history`,
};

/**
 * Endpoints de alertas de stock bajo (feature Pro).
 * Contrato: docs/extra/análisis-planes/spec-tecnicas.md (Variante A).
 * Pendientes de implementar en backend.
 */
export const stockAlertRoutes = {
  /** PATCH — configura/actualiza el umbral de un producto del negocio. */
  setAlert: (businessId: string, businessProductId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/products/${businessProductId}/stock-alert`,
  /** GET — lista los productos del negocio con alerta configurada. */
  getAlerts: (businessId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/stock-alerts`,
};
