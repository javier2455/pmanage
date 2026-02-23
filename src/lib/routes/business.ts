export const businessRoutes = {
    getMyBusinesses: "https://psearch.dveloxsoft.com/api/businesses/my-businesses",
    getAllProductOfMyBusinesses: (businessId: string) => `https://psearch.dveloxsoft.com/api/businesses/${businessId}/products`,
    createSale: "https://psearch.dveloxsoft.com/api/sales",
  };  