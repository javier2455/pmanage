import { BASIC_ROUTE } from ".";

export const exchangeRateRoutes = {
    getExchangeRate: (businessId: string) => `${BASIC_ROUTE}/monetary-exchange/business/${businessId}`,
  };  