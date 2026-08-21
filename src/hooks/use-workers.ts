import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createBusinessWorker,
  deleteBusinessWorker,
  getAllBusinessWorkers,
  getBusinessWorkerById,
  updateBusinessWorker,
} from "@/lib/api/worker";
import type {
  CreateWorkerInput,
  UpdateWorkerInput,
} from "@/lib/types/worker";
import { getSalesByWorker } from "@/lib/api/analytics";
import type { SalesByWorkerParameters } from "@/lib/types/analytics";

interface UseAllWorkersByBusinessIdParams {
  page?: number;
  limit?: number;
}

export function useAllWorkersByBusinessId(
  businessId: string,
  params: UseAllWorkersByBusinessIdParams = {},
) {
  return useQuery({
    queryKey: ["all-workers-by-business-id", businessId, params],
    queryFn: () => getAllBusinessWorkers({ businessId, ...params }),
    enabled: !!businessId,
    placeholderData: keepPreviousData,
  });
}

export function useGetWorkerByIdQuery(workerId: string) {
  return useQuery({
    queryKey: ["business-worker", workerId],
    queryFn: () => getBusinessWorkerById(workerId),
    enabled: !!workerId,
  });
}

export function useCreateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkerInput) => createBusinessWorker(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-workers-by-business-id"],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-invitations-by-business-id"],
      });
      queryClient.invalidateQueries({
        queryKey: ["invitations-count"],
      });
    },
  });
}

export function useUpdateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      credentials,
    }: {
      workerId: string;
      credentials: UpdateWorkerInput;
    }) => updateBusinessWorker(workerId, credentials),
    onSuccess: (_, { workerId }) => {
      queryClient.invalidateQueries({
        queryKey: ["all-workers-by-business-id"],
      });
      queryClient.invalidateQueries({
        queryKey: ["business-worker", workerId],
      });
    },
  });
}

export function useDeleteWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => deleteBusinessWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-workers-by-business-id"],
      });
    },
  });
}

/**
 * Ventas agrupadas por trabajador en un rango de fechas. Vive aquí, y no en un
 * módulo de analíticas, porque su único consumidor es la página de Trabajadores;
 * el endpoint conserva el prefijo `/analytics` con el que lo expone el backend.
 */
export function useAnalyticsSalesByWorker(
  businessId: string,
  params?: SalesByWorkerParameters,
) {
  return useQuery({
    queryKey: ["analytics-sales-by-worker", businessId, params],
    queryFn: () => getSalesByWorker(businessId, params),
    enabled: !!businessId,
    // El rango de fechas forma parte de la key, así que cada cambio de período
    // es una query nueva. Sin esto la tabla se vacía y vuelve entre filtro y
    // filtro; conservando los datos previos solo se atenúa mientras refresca.
    placeholderData: keepPreviousData,
  });
}
