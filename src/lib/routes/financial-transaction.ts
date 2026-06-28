import { BASIC_ROUTE } from ".";

export const financialTransactionRoutes = {
    /** Todas las transacciones (admin / global). */
    getAll: `${BASIC_ROUTE}/financial-transactions`,
    /** Transacciones de un negocio (acepta ?currency=&page=&limit=). */
    getByBusiness: (businessId: string) =>
        `${BASIC_ROUTE}/financial-transactions/business/${businessId}`,
};
