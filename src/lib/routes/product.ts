import { BASIC_ROUTE } from ".";

export const productRoutes = {
  getAllProducts: `${BASIC_ROUTE}/product`,
  getProductById: (productId: string) => `${BASIC_ROUTE}/product/${productId}`,
  createProduct: `${BASIC_ROUTE}/product`,
  createProductInBusiness: (businessId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/products`,
  editProduct: (productId: string) => `${BASIC_ROUTE}/product/${productId}`,
  deleteProduct: (productId: string) => `${BASIC_ROUTE}/product/${productId}`,
  updateBusinessProductPrice: (businessProductId: string) =>
    `${BASIC_ROUTE}/product/business-product/${businessProductId}/price`,
  // Cambia/quita la categoría de un producto dentro de un negocio. Endpoint
  // granular por campo (mismo patrón que stock-alert). Ver
  // docs/backend-categoria-business-product.md.
  updateBusinessProductCategory: (businessId: string, businessProductId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/products/${businessProductId}/category`,

  // Product Price History
  getPriceHistory: (productId: string) =>
    `${BASIC_ROUTE}/product-price-history/product/${productId}`,
  getLatestPriceHistory: (productId: string) =>
    `${BASIC_ROUTE}/product-price-history/product/${productId}/latest`,
  getPriceHistoryByRange: (productId: string) =>
    `${BASIC_ROUTE}/product-price-history/product/${productId}/range`,

  /* Categories */
  getAllProductCategory: `${BASIC_ROUTE}/category/`,
  getProductCategoryById: (categoryId: string) =>
    `${BASIC_ROUTE}/category/${categoryId}/`,
  createProductCategory: `${BASIC_ROUTE}/category/`,
  updateProductCategory: (categoryId: string) =>
    `${BASIC_ROUTE}/category/${categoryId}/`,
  deleteProductCategory: (categoryId: string) =>
    `${BASIC_ROUTE}/category/${categoryId}/`,
};
