import { BASIC_ROUTE } from ".";

export const salesRoutes = {
    getAllSalesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/sales/business/${businessId}`,
    getSaleById: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}`,
    createSale: `${BASIC_ROUTE}/sales`,
    deleteSale: (saleId: string) => `${BASIC_ROUTE}/sales/${saleId}`,

}; 