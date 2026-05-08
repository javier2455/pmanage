import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteInvitation,
  getAllInvitations,
  getInvitationById,
} from "@/lib/api/invitation";

interface UseAllInvitationsByBusinessIdParams {
  page?: number;
  limit?: number;
}

export function useAllInvitationsByBusinessId(
  businessId: string,
  params: UseAllInvitationsByBusinessIdParams = {},
) {
  return useQuery({
    queryKey: ["all-invitations-by-business-id", businessId, params],
    queryFn: () => getAllInvitations({ businessId, ...params }),
    enabled: !!businessId,
    placeholderData: keepPreviousData,
  });
}

export function useInvitationsCount(businessId: string) {
  return useQuery({
    queryKey: ["invitations-count", businessId],
    queryFn: () => getAllInvitations({ businessId, page: 1, limit: 1 }),
    enabled: !!businessId,
    select: (data) => data.meta.total,
  });
}

export function useGetInvitationByIdQuery(invitationId: string) {
  return useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: () => getInvitationById(invitationId),
    enabled: !!invitationId,
  });
}

export function useDeleteInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => deleteInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-invitations-by-business-id"],
      });
      queryClient.invalidateQueries({
        queryKey: ["invitations-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-workers-by-business-id"],
      });
    },
  });
}
