import { BASIC_ROUTE } from ".";

export const exchangeRateRoutes = {
    getExchangeRate: (businessId: string) => `${BASIC_ROUTE}/monetary-exchange/business/${businessId}`,
    createExchangeRate: `${BASIC_ROUTE}/monetary-exchange`,
    updateExchangeRate: (businessId: string) => `${BASIC_ROUTE}/monetary-exchange/${businessId}`,
    deleteExchangeRate: (businessId: string) => `${BASIC_ROUTE}/monetary-exchange/${businessId}`,
};