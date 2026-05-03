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
