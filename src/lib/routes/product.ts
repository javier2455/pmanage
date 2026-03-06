import { BASIC_ROUTE } from ".";

export const productRoutes = {
    /** Proxy local: evita CORS (el backend redirige OPTIONS y falla el preflight) */
    // getAllProducts: "/api/products",
    getAllProducts: `${BASIC_ROUTE}/products`,
    getProductById: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
    createProduct: `${BASIC_ROUTE}/products`,
    createProductInBusiness: (businessId: string) => `${BASIC_ROUTE}/products/business/${businessId}`,
    editProduct: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
    deleteProduct: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
}