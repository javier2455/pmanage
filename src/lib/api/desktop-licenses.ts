import apiClient from "@/lib/axios";
import { desktopLicenseRoutes } from "../routes/desktop-licenses";
import type {
  AddDesktopLicensePaymentProps,
  CreateDesktopInstallationProps,
  DesktopAdminSettings,
  DesktopInstallation,
  DesktopInstallationDetail,
  DesktopLicenseContact,
  DesktopLicenseContactsResponse,
  DesktopWhatsappNumber,
  GetDesktopInstallationsResponse,
  UpdateDesktopInstallationProps,
  UpdateDesktopLicenseContactsProps,
  UpdateDesktopWhatsappNumberProps,
} from "../types/desktop-licenses";

export interface GetDesktopInstallationsParams {
  search?: string;
  page?: number;
  limit?: number;
}

/** (Admin) Lista las instalaciones; busca por código, negocio, dueño o correo. */
export async function getDesktopInstallations({
  search,
  page,
  limit,
}: GetDesktopInstallationsParams = {}): Promise<GetDesktopInstallationsResponse> {
  const { data } = await apiClient.get<GetDesktopInstallationsResponse>(
    desktopLicenseRoutes.installations,
    // Sin búsqueda no mandamos `search` para no ensuciar la URL ni la cache.
    { params: { search: search || undefined, page, limit } },
  );
  return data;
}

/** (Admin) Detalle de una instalación con sus pagos y la licencia vigente. */
export async function getDesktopInstallation(
  code: string,
): Promise<DesktopInstallationDetail> {
  const { data } = await apiClient.get<DesktopInstallationDetail>(
    desktopLicenseRoutes.installation(code),
  );
  return data;
}

/** (Admin) Alta a mano de una instalación que todavía no se ha conectado. */
export async function createDesktopInstallation(
  payload: CreateDesktopInstallationProps,
): Promise<DesktopInstallation> {
  const { data } = await apiClient.post(
    desktopLicenseRoutes.installations,
    payload,
  );
  return data;
}

/** (Admin) Notas, nombre del negocio o "duplicado revisado". */
export async function updateDesktopInstallation(
  code: string,
  payload: UpdateDesktopInstallationProps,
): Promise<DesktopInstallation> {
  const { data } = await apiClient.patch(
    desktopLicenseRoutes.installation(code),
    payload,
  );
  return data;
}

/** (Admin) Registra un pago y emite una licencia nueva. Devuelve el detalle. */
export async function addDesktopLicensePayment(
  code: string,
  payload: AddDesktopLicensePaymentProps,
): Promise<DesktopInstallationDetail> {
  const { data } = await apiClient.post<DesktopInstallationDetail>(
    desktopLicenseRoutes.payments(code),
    payload,
  );
  return data;
}

/** (Admin) Quita un pago, recalcula el vencimiento y emite otra licencia. */
export async function removeDesktopLicensePayment(
  code: string,
  paymentId: string,
): Promise<DesktopInstallationDetail> {
  const { data } = await apiClient.delete<DesktopInstallationDetail>(
    desktopLicenseRoutes.payment(code, paymentId),
  );
  return data;
}

/** (Admin) Números de WhatsApp a los que escriben los clientes para pagar. */
export async function getDesktopLicenseContacts(): Promise<
  DesktopLicenseContact[]
> {
  const { data } = await apiClient.get<DesktopLicenseContactsResponse>(
    desktopLicenseRoutes.contacts,
  );
  return data.data;
}

/** (Admin) Sustituye la lista entera de números. Devuelve la lista guardada. */
export async function updateDesktopLicenseContacts(
  payload: UpdateDesktopLicenseContactsProps,
): Promise<DesktopLicenseContact[]> {
  const { data } = await apiClient.put<DesktopLicenseContactsResponse>(
    desktopLicenseRoutes.contacts,
    payload,
  );
  return data.data;
}

/** (Admin) Ajustes generales: el límite diario de avisos por WhatsApp. */
export async function getDesktopAdminSettings(): Promise<DesktopAdminSettings> {
  const { data } = await apiClient.get<DesktopAdminSettings>(
    desktopLicenseRoutes.settings,
  );
  return data;
}

/** (Admin) Cambia el límite general. Devuelve los ajustes guardados. */
export async function updateDesktopAdminSettings(
  payload: DesktopAdminSettings,
): Promise<DesktopAdminSettings> {
  const { data } = await apiClient.put<DesktopAdminSettings>(
    desktopLicenseRoutes.settings,
    payload,
  );
  return data;
}

/** (Admin) Límite propio o bloqueo de un número. Devuelve el número guardado. */
export async function updateDesktopWhatsappNumber(
  code: string,
  numberId: string,
  payload: UpdateDesktopWhatsappNumberProps,
): Promise<DesktopWhatsappNumber> {
  const { data } = await apiClient.patch<DesktopWhatsappNumber>(
    desktopLicenseRoutes.whatsappNumber(code, numberId),
    payload,
  );
  return data;
}
