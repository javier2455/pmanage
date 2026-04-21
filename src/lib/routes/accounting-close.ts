import { BASIC_ROUTE } from ".";

export const accountingCloseRoutes = {
    getDailyAccountingClose: (businessId: string) => `${BASIC_ROUTE}/sales/closing/daily/${businessId}`,
    getMonthlyAccountingClose: (businessId: string) => `${BASIC_ROUTE}/sales/closing/monthly/${businessId}`,
    getDailyAccountingCloseByRange: (businessId: string) => `${BASIC_ROUTE}/sales/closing/range/${businessId}`,
    exportToPdf: (businessId: string) => `${BASIC_ROUTE}/sales/closing/range/${businessId}/pdf`,
    exportToExcel: (businessId: string) => `${BASIC_ROUTE}/sales/closing/range/${businessId}/excel`,
}; 