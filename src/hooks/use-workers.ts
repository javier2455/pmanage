import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createBusinessWorker,
  getAllBusinessWorkers,
} from "@/lib/api/worker";
import type { CreateWorkerInput } from "@/lib/types/worker";

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
