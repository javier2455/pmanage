import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  mockCreateWorker,
  mockDeleteWorker,
  mockGetWorkerById,
  mockListWorkers,
  mockUpdateWorker,
} from "@/lib/workers/mock-workers";
import type { CreateWorkerInput, UpdateWorkerInput } from "@/lib/types/worker";

// TODO BACKEND: cuando existan endpoints reales, reemplazar las llamadas mock
// por funciones en src/lib/api/worker.ts y mantener las firmas de los hooks.

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
    queryFn: () => mockListWorkers({ businessId, ...params }),
    enabled: !!businessId,
    placeholderData: keepPreviousData,
  });
}

export function useGetWorkerById(workerId: string) {
  return useQuery({
    queryKey: ["worker-by-id", workerId],
    queryFn: () => mockGetWorkerById(workerId),
    enabled: !!workerId,
  });
}

export function useCreateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkerInput) => mockCreateWorker(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-workers-by-business-id"],
      });
    },
  });
}

export function useUpdateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWorkerInput) => mockUpdateWorker(input),
    onSuccess: (worker) => {
      queryClient.invalidateQueries({
        queryKey: ["all-workers-by-business-id"],
      });
      queryClient.invalidateQueries({ queryKey: ["worker-by-id", worker.id] });
    },
  });
}

export function useDeleteWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => mockDeleteWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-workers-by-business-id"],
      });
    },
  });
}
