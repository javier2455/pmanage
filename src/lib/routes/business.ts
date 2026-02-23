import { BASIC_ROUTE } from ".";

export const businessRoutes = {
    getMyBusinesses: `${BASIC_ROUTE}/businesses/my-businesses`,
    getAllProductOfMyBusinesses: (businessId: string) => `${BASIC_ROUTE}/businesses/${businessId}/products`,
    createSale: `${BASIC_ROUTE}/sales`,
  };  