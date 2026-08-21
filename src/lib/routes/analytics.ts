import { BASIC_ROUTE } from ".";

/**
 * La sección de Analíticas se retiró; del módulo solo sigue vivo el desglose de
 * ventas por trabajador, que consume la página de Trabajadores. El endpoint
 * conserva el prefijo `/analytics` porque así lo expone el backend.
 */
export const AnalyticsRoutes = {
    getSalesByWorker: (businessId: string) => `${BASIC_ROUTE}/analytics/sales-by-worker/${businessId}`,
};