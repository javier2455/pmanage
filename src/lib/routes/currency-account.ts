import { BASIC_ROUTE } from ".";

export const currencyAccountRoutes = {
  // Saldos de todas las monedas de un negocio.
  balances: (businessId: string) =>
    `${BASIC_ROUTE}/currency-accounts/balances/${businessId}`,
  // Saldo de una moneda concreta.
  balance: (businessId: string, currency: string) =>
    `${BASIC_ROUTE}/currency-accounts/balance/${businessId}/${currency}`,
};
