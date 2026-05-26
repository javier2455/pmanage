import { TEMPORAL_ROUTE, BASIC_ROUTE } from ".";

export const searchRoutes = {
    getAllProvinces: `${BASIC_ROUTE}/search/provinces`,
    getAllMunicipalitiesByProvinceId: (provinceId: string) => `${BASIC_ROUTE}/search/municipalities?province=${provinceId}`,
}