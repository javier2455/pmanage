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
};
