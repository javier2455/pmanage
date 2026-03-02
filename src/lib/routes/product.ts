import { BASIC_ROUTE } from ".";

export const productRoutes = {
    getProductById: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
    createProduct: (businessId: string) => `${BASIC_ROUTE}/products/business/${businessId}`,
    editProduct: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
    deleteProduct: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
}