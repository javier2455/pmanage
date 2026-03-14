// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Referencia en rutas comentadas
import { BASIC_ROUTE } from ".";

export const productRoutes = {
    /** Proxy local: evita CORS (el backend redirige OPTIONS y falla el preflight) */
    // getAllProducts: "apiv1/product",
    // getProductById: (productId: string) => `/apiv1/products/${productId}`,
    // createProduct: "apiv1/product",
    // createProductInBusiness: (businessId: string) => `apiv1/business/${businessId}/products/`,
    // editProduct: (productId: string) => `apiv1/products/${productId}`,
    // deleteProduct: (productId: string) => `apiv1/product/${productId}`,
    /** Proxy local: evita CORS (el backend redirige OPTIONS y falla el preflight) */
    
    getAllProducts: `${BASIC_ROUTE}/product`,
    getProductById: (productId: string) => `${BASIC_ROUTE}/product/${productId}`,
    createProduct: `${BASIC_ROUTE}/product`,
    createProductInBusiness: (businessId: string) => `${BASIC_ROUTE}/businesses/${businessId}/products`,
    editProduct: (productId: string) => `${BASIC_ROUTE}/product/${productId}`,
    deleteProduct: (productId: string) => `${BASIC_ROUTE}/product/${productId}`,
}