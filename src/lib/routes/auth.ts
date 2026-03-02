import { BASIC_ROUTE } from ".";

export const authRoutes = {
  login: `${BASIC_ROUTE}/auth/login`,
  register: `${BASIC_ROUTE}/auth/register`,
  verify: `${BASIC_ROUTE}/auth/activate`,
  sendConfirmationToken: (email: string) => `${BASIC_ROUTE}/auth/send-confirmation-token/${email}`,
};   