import { BASIC_ROUTE } from ".";

export const businessRoutes = {
    getMyBusinesses: `${BASIC_ROUTE}/businesses/my-businesses`,
    getAllProductOfMyBusinesses: (businessId: string) => `${BASIC_ROUTE}/businesses/${businessId}/products`,
    createBusiness: `${BASIC_ROUTE}/businesses`,
    updateBusiness: (businessId: string) => `${BASIC_ROUTE}/businesses/${businessId}`,
    deleteProductOfMyBusiness: (businessId: string, productId: string) => `${BASIC_ROUTE}/businesses/${businessId}/products/${productId}`,
  };  