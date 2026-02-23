import { BASIC_ROUTE } from ".";

export const salesRoutes = {
    getAllSalesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/sales/business/${businessId}`,
    createSale: `${BASIC_ROUTE}/sales`,
}; 