export const businessRoutes = {
    getMyBusinesses: "https://psearch.dveloxsoft.com/businesses/my-businesses",
    getAllProductOfMyBusinesses: (businessId: string) => `https://psearch.dveloxsoft.com/businesses/${businessId}/products`,
    createSale: "https://psearch.dveloxsoft.com/sales",
  };  