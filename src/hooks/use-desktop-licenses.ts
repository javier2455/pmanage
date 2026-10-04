import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addDesktopLicensePayment,
  createDesktopInstallation,
  getDesktopAdminSettings,
  getDesktopInstallation,
  getDesktopInstallations,
  getDesktopLicenseContacts,
  removeDesktopLicensePayment,
  updateDesktopAdminSettings,
  updateDesktopInstallation,
  updateDesktopLicenseContacts,
  updateDesktopWhatsappNumber,
  type GetDesktopInstallationsParams,
} from "@/lib/api/desktop-licenses";
import type {
  AddDesktopLicensePaymentProps,
  CreateDesktopInstallationProps,
  DesktopAdminSettings,
  DesktopInstallationDetail,
  UpdateDesktopInstallationProps,
  UpdateDesktopLicenseContactsProps,
  UpdateDesktopWhatsappNumberProps,
} from "@/lib/types/desktop-licenses";

const LIST_KEY = "desktop-installations";
const DETAIL_KEY = "desktop-installation";
const CONTACTS_KEY = "desktop-license-contacts";
const SETTINGS_KEY = "desktop-admin-settings";

export function useGetDesktopInstallationsQuery(
  params: GetDesktopInstallationsParams = {},
) {
  return useQuery({
    queryKey: [LIST_KEY, params],
    queryFn: () => getDesktopInstallations(params),
    placeholderData: keepPreviousData,
  });
}

export function useGetDesktopInstallationQuery(code: string) {
  return useQuery({
    queryKey: [DETAIL_KEY, code],
    queryFn: () => getDesktopInstallation(code),
    enabled: !!code,
  });
}

export function useCreateDesktopInstallationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDesktopInstallationProps) =>
      createDesktopInstallation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
    },
  });
}

export function useUpdateDesktopInstallationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      ...payload
    }: { code: string } & UpdateDesktopInstallationProps) =>
      updateDesktopInstallation(code, payload),
    onSuccess: (_, { code }) => {
      queryClient.invalidateQueries({ queryKey: [DETAIL_KEY, code] });
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
    },
  });
}

/**
 * Pagos: el backend responde con el detalle ya recalculado (vencimiento y
 * licencia nuevos), así que se pinta tal cual sin esperar otra petición.
 */
function applyDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  code: string,
  detail: DesktopInstallationDetail,
) {
  queryClient.setQueryData([DETAIL_KEY, code], detail);
  queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
}

export function useAddDesktopLicensePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      ...payload
    }: { code: string } & AddDesktopLicensePaymentProps) =>
      addDesktopLicensePayment(code, payload),
    onSuccess: (detail, { code }) => applyDetail(queryClient, code, detail),
  });
}

export function useRemoveDesktopLicensePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, paymentId }: { code: string; paymentId: string }) =>
      removeDesktopLicensePayment(code, paymentId),
    onSuccess: (detail, { code }) => applyDetail(queryClient, code, detail),
  });
}

export function useGetDesktopLicenseContactsQuery() {
  return useQuery({
    queryKey: [CONTACTS_KEY],
    queryFn: getDesktopLicenseContacts,
  });
}

/** El backend responde con la lista ya guardada: se pinta tal cual. */
export function useUpdateDesktopLicenseContactsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDesktopLicenseContactsProps) =>
      updateDesktopLicenseContacts(payload),
    onSuccess: (contacts) => {
      queryClient.setQueryData([CONTACTS_KEY], contacts);
    },
  });
}

export function useGetDesktopAdminSettingsQuery() {
  return useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: getDesktopAdminSettings,
  });
}

/**
 * El backend responde con los ajustes guardados. Los detalles en caché se
 * vuelven a pedir: el límite efectivo de los números sin límite propio es el
 * general.
 */
export function useUpdateDesktopAdminSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DesktopAdminSettings) =>
      updateDesktopAdminSettings(payload),
    onSuccess: (settings) => {
      queryClient.setQueryData([SETTINGS_KEY], settings);
      queryClient.invalidateQueries({ queryKey: [DETAIL_KEY] });
    },
  });
}

/**
 * El backend responde con el número ya actualizado: se cambia dentro del
 * detalle en caché, sin volver a pedirlo.
 */
export function useUpdateDesktopWhatsappNumberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      numberId,
      ...payload
    }: { code: string; numberId: string } & UpdateDesktopWhatsappNumberProps) =>
      updateDesktopWhatsappNumber(code, numberId, payload),
    onSuccess: (updated, { code }) => {
      queryClient.setQueryData<DesktopInstallationDetail>(
        [DETAIL_KEY, code],
        (detail) =>
          detail && {
            ...detail,
            whatsappNumbers: detail.whatsappNumbers?.map((number) =>
              number.id === updated.id ? updated : number,
            ),
          },
      );
    },
  });
}
