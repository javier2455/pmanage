import { BASIC_ROUTE } from ".";

export const authRoutes = {
  login: `${BASIC_ROUTE}/auth/login`,
  register: `${BASIC_ROUTE}/auth/register`,
  verify: `${BASIC_ROUTE}/auth/verify-email`,
  resend: `${BASIC_ROUTE}/auth/resend-verification`,
};   