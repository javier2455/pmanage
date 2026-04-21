import { BASIC_ROUTE } from ".";

export const salesRoutes = {
    getAllSales: `${BASIC_ROUTE}/sales`,
    getAllSalesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/sales/business/${businessId}`,
    getSaleById: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}`,
    createSale: `${BASIC_ROUTE}/sales`,
    deleteSale: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}`,
    cancelSale: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}/cancel`,

}; 