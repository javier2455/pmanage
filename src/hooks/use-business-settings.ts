"use client";

import {
  getBusinessSettings,
  updateBusinessSettings,
} from "@/lib/api/business-settings";
import type { UpdateBusinessSettingsPayload } from "@/lib/types/business-settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hooks de configuración de alertas del negocio.
 * Contrato backend: docs/API.md.
 */

export function useBusinessSettings(businessId: string | undefined) {
  return useQuery({
    queryKey: ["business-settings", businessId],
    queryFn: () => getBusinessSettings(businessId!),
    enabled: !!businessId,
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      payload,
    }: {
      businessId: string;
      payload: UpdateBusinessSettingsPayload;
    }) => updateBusinessSettings(businessId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-settings", variables.businessId],
      });
    },
  });
}
