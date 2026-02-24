import { BASIC_ROUTE } from ".";

export const productRoutes = {
    createProduct: (businessId: string) => `${BASIC_ROUTE}/products/business/${businessId}`,
}