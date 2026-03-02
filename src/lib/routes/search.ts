import { BASIC_ROUTE } from ".";

export const searchRoutes = {
    getAllProvinces: `${BASIC_ROUTE}/provinces`,
    getAllMunicipalitiesByProvinceId: (provinceId: string) => `${BASIC_ROUTE}/municipalities?province=${provinceId}`,
}