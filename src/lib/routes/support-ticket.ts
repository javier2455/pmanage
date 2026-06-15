import { BASIC_ROUTE } from ".";

export const supportTicketRoutes = {
  // Usuario
  create: `${BASIC_ROUTE}/support-tickets`,
  myTickets: `${BASIC_ROUTE}/support-tickets/my-tickets`,
  myTicketById: (id: string) =>
    `${BASIC_ROUTE}/support-tickets/my-tickets/${id}`,

  // Admin
  all: `${BASIC_ROUTE}/support-tickets`,
  close: (id: string) => `${BASIC_ROUTE}/support-tickets/${id}/close`,
};
