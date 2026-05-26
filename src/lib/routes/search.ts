import { TEMPORAL_ROUTE } from ".";

export const searchRoutes = {
    getAllProvinces: `${TEMPORAL_ROUTE}/provinces`,
    getAllMunicipalitiesByProvinceId: (provinceId: string) => `${TEMPORAL_ROUTE}/municipalities?province=${provinceId}`,
}