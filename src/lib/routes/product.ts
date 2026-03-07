// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Referencia en rutas comentadas
import { BASIC_ROUTE } from ".";

export const productRoutes = {
    /** Proxy local: evita CORS (el backend redirige OPTIONS y falla el preflight) */
    getAllProducts: "/api/products",
    getProductById: (productId: string) => `/api/products/${productId}`,
    createProduct: "/api/products",
    createProductInBusiness: (businessId: string) => `/api/products/business/${businessId}`,
    editProduct: (productId: string) => `/api/products/${productId}`,
    deleteProduct: (productId: string) => `/api/products/${productId}`,
    /** Proxy local: evita CORS (el backend redirige OPTIONS y falla el preflight) */
    
    // getAllProducts: `${BASIC_ROUTE}/products`,
    // getProductById: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
    // createProduct: `${BASIC_ROUTE}/products`,
    // createProductInBusiness: (businessId: string) => `${BASIC_ROUTE}/products/business/${businessId}`,
    // editProduct: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
    // deleteProduct: (productId: string) => `${BASIC_ROUTE}/products/${productId}`,
}