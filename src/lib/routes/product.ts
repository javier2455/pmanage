import { BASIC_ROUTE } from ".";

export const productRoutes = {
    getProductById: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
    createProduct: (businessId: string) => `${BASIC_ROUTE}/products/business/${businessId}`,
    deleteProduct: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
}