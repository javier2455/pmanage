import { BASIC_ROUTE } from ".";

export const providerRoutes = {
  getAllProviders: `${BASIC_ROUTE}/providers/`,
  getProviderById: (providerId: string) =>
    `${BASIC_ROUTE}/providers/${providerId}`,
  createProvider: `${BASIC_ROUTE}/providers/`,
  updateProvider: (providerId: string) =>
    `${BASIC_ROUTE}/providers/${providerId}`,
  deleteProvider: (providerId: string) =>
    `${BASIC_ROUTE}/providers/${providerId}`,
};
