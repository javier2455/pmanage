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
  /**
   * Capas de costo vivas: cuántas unidades quedan de cada lote y a qué costo
   * entró cada uno. Es lo que `entryPrice` no puede responder, porque solo
   * guarda el último costo pagado.
   */
  getProductCostLayers: (businessId: string, productId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/product/${productId}/cost-layers`,
  /**
   * Rentabilidad lote a lote: qué costó cada compra y qué se cobró por lo que
   * salió de ella. Incluye los lotes agotados, que son los que ya han vendido
   * todo lo que tenían que vender.
   */
  getProductLotProfitability: (businessId: string, productId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/product/${productId}/lot-profitability`,
  /**
   * Exportaciones del historial (plan Pro, validado en el servidor).
   *
   * Un único par de endpoints cubre las dos vistas: el filtro por producto va
   * como query param, no en la ruta.
   */
  exportInventoryHistoryToPdf: (businessId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/history/pdf`,
  exportInventoryHistoryToExcel: (businessId: string) =>
    `${BASIC_ROUTE}/inventory/business/${businessId}/history/excel`,
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
