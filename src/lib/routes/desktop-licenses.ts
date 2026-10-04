import { BASIC_ROUTE } from ".";

const ADMIN_INSTALLATIONS = `${BASIC_ROUTE}/desktop/admin/installations`;

/** Endpoints de administración de licencias de la app de escritorio. */
export const desktopLicenseRoutes = {
  installations: ADMIN_INSTALLATIONS,
  installation: (code: string) =>
    `${ADMIN_INSTALLATIONS}/${encodeURIComponent(code)}`,
  payments: (code: string) =>
    `${ADMIN_INSTALLATIONS}/${encodeURIComponent(code)}/payments`,
  payment: (code: string, paymentId: string) =>
    `${ADMIN_INSTALLATIONS}/${encodeURIComponent(code)}/payments/${encodeURIComponent(paymentId)}`,
  whatsappNumber: (code: string, numberId: string) =>
    `${ADMIN_INSTALLATIONS}/${encodeURIComponent(code)}/whatsapp-numbers/${encodeURIComponent(numberId)}`,
  contacts: `${BASIC_ROUTE}/desktop/admin/contacts`,
  settings: `${BASIC_ROUTE}/desktop/admin/settings`,
};
