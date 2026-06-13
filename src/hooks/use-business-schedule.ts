"use client";

import {
  getBusinessSchedule,
  upsertBusinessSchedule,
} from "@/lib/api/business-schedule";
import type { CreateBusinessScheduleDto } from "@/lib/types/business-schedule";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hooks del horario de atención del negocio.
 * Contrato backend: docs/funcionalidad.md.
 */

export function useBusinessSchedule(businessId: string | undefined) {
  return useQuery({
    queryKey: ["business-schedule", businessId],
    queryFn: () => getBusinessSchedule(businessId!),
    enabled: !!businessId,
  });
}

export function useUpsertBusinessSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      schedules,
    }: {
      businessId: string;
      schedules: CreateBusinessScheduleDto[];
    }) => upsertBusinessSchedule(businessId, schedules),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-schedule", variables.businessId],
      });
    },
  });
}
