import { BASIC_ROUTE } from ".";

export const userRoutes = {
  getUserData: `${BASIC_ROUTE}/users/get-all`,
  updateUser: (userId: string) => `${BASIC_ROUTE}/users/update/${userId}`,

  /* Business-workers */
  getAllBusinessWorkers: (businessId: string) =>
    `${BASIC_ROUTE}/business-workers/business/${businessId}`,
  createBusinessWorker: `${BASIC_ROUTE}/business-workers`,
  updateBusinessWorker: (id: string) =>
    `${BASIC_ROUTE}/business-workers/business/${id}`,
  deleteBusinessWorker: (id: string) =>
    `${BASIC_ROUTE}/business-workers/business/${id}`,
};
