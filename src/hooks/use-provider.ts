import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProvider,
  deleteProvider,
  getAllProviders,
  getProviderById,
  getProviderProducts,
  updateProvider,
} from "@/lib/api/provider";
import {
  CreateProviderProps,
  GetAllProvidersParams,
  GetProviderProductsParams,
  UpdateProviderProps,
} from "@/lib/types/provider";

export function useGetAllProvidersQuery(params: GetAllProvidersParams = {}) {
  return useQuery({
    queryKey: ["all-providers", params],
    queryFn: () => getAllProviders(params),
    placeholderData: keepPreviousData,
    enabled: params.businessId === undefined || !!params.businessId,
  });
}

interface UseGetProviderByIdOptions {
  refetchOnMount?: boolean | "always";
}

export function useGetProviderByIdQuery(
  providerId: string,
  options: UseGetProviderByIdOptions = {},
) {
  return useQuery({
    queryKey: ["provider", providerId],
    queryFn: () => getProviderById(providerId),
    enabled: !!providerId,
    refetchOnMount: options.refetchOnMount,
  });
}

export function useGetProviderProductsQuery(
  providerId: string,
  params: GetProviderProductsParams = {},
) {
  return useQuery({
    queryKey: ["provider-products", providerId, params],
    queryFn: () => getProviderProducts(providerId, params),
    enabled: !!providerId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProviderProps) => createProvider(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-providers"] });
    },
  });
}

export function useUpdateProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      providerId,
      payload,
    }: {
      providerId: string;
      payload: UpdateProviderProps;
    }) => updateProvider(providerId, payload),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: ["all-providers"] });
      queryClient.invalidateQueries({ queryKey: ["provider", providerId] });
      queryClient.invalidateQueries({
        queryKey: ["provider-products", providerId],
      });
    },
  });
}

export function useDeleteProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => deleteProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-providers"] });
    },
  });
}
