import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addDesktopLicensePayment,
  createDesktopInstallation,
  getDesktopInstallation,
  getDesktopInstallations,
  removeDesktopLicensePayment,
  updateDesktopInstallation,
  type GetDesktopInstallationsParams,
} from "@/lib/api/desktop-licenses";
import type {
  AddDesktopLicensePaymentProps,
  CreateDesktopInstallationProps,
  DesktopInstallationDetail,
  UpdateDesktopInstallationProps,
} from "@/lib/types/desktop-licenses";

const LIST_KEY = "desktop-installations";
const DETAIL_KEY = "desktop-installation";

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
