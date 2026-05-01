import { BASIC_ROUTE,LOCAL_ROUTE } from ".";

export const authRoutes = {
  login: `${BASIC_ROUTE}/auth/login`,
  register: `${BASIC_ROUTE}/auth/register`,
  registerLocal: `${LOCAL_ROUTE}/auth/register`,
  verify: `${BASIC_ROUTE}/auth/activate`,
  sendConfirmationToken: (email: string) =>
    `${BASIC_ROUTE}/auth/send-confirmation-token/${email}`,
  google: `${BASIC_ROUTE}/auth/google`,
  me: `${BASIC_ROUTE}/auth/me`,
  invitationInformation: (invitationId: string) =>
    `${BASIC_ROUTE}/business-workers/invitation/${invitationId}`,
  requestPasswordReset: `${BASIC_ROUTE}/auth/request-password-reset`,
  changePassword: `${BASIC_ROUTE}/auth/change-password`,
};
