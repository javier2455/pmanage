import { BASIC_ROUTE } from ".";

export const salesRoutes = {
    getAllSales: `${BASIC_ROUTE}/sales`,
    getAllSalesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/sales/business/${businessId}`,
    getSaleById: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}`,
    createSale: `${BASIC_ROUTE}/sales`,
    deleteSale: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}`,
    cancelSale: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}/cancel`,
    registerPayments: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}/payments`,
    paymentsSummary: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}/payments/summary`,
    paymentsHistory: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}/payments`,
    // Facturación PDF (Fase 2). Ver docs/guia-implementacion-multimoneda.md §3.
    factura: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}/factura`,
};