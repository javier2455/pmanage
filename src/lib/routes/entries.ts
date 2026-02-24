import { BASIC_ROUTE } from ".";

export const entriesRoutes = {
    // getAllEntriesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/entries/business/${businessId}`,
    // createEntry: `${BASIC_ROUTE}/entries`,
    addStockToProduct: (businessId: string, productId: string) => `${BASIC_ROUTE}/inventory/business/${businessId}/product/${productId}/add-stock`,
}