import { BASIC_ROUTE } from ".";

export const searchRoutes = {
  getAllProvinces: `${BASIC_ROUTE}/search/provinces`,
  getAllMunicipalitiesByProvinceId: (provinceId: string) =>
    `${BASIC_ROUTE}/search/municipalities?province=${provinceId}`,
  geocodeAnAddress: `${BASIC_ROUTE}/search/geocode`,
  reverseGeocode: `${BASIC_ROUTE}/search/reverse-geocode`,
};
