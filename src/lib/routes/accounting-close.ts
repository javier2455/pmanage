import { BASIC_ROUTE } from ".";

export const accountingCloseRoutes = {
    getDailyAccountingClose: (businessId: string) => `${BASIC_ROUTE}/sales/closing/daily/${businessId}`,
}; 