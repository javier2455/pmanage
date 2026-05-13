import apiClient from "@/lib/axios";
import { invitationRoutes } from "@/lib/routes/invitations";
import type {
  AcceptInvitationResponse,
  DeleteInvitationResponse,
  GetInvitationByIdResponse,
  InvitationsResponseInterface,
} from "@/lib/types/invitation";

interface GetAllInvitationsParams {
  businessId: string;
  page?: number;
  limit?: number;
}

export async function getAllInvitations({
  businessId,
  page,
  limit,
}: GetAllInvitationsParams): Promise<InvitationsResponseInterface> {
  const { data } = await apiClient.get<InvitationsResponseInterface>(
    invitationRoutes.getAllInvitations(businessId),
    { params: { page, limit } },
  );
  return data;
}

export async function getInvitationById(
  invitationId: string,
): Promise<GetInvitationByIdResponse> {
  const { data } = await apiClient.get<GetInvitationByIdResponse>(
    invitationRoutes.getInvitationByID(invitationId),
  );
  return data;
}

export async function deleteInvitation(
  invitationId: string,
): Promise<DeleteInvitationResponse> {
  const { data } = await apiClient.delete<DeleteInvitationResponse>(
    invitationRoutes.deleteInvitation(invitationId),
  );
  return data;
}

export async function acceptInvitation(
  invitationId: string,
): Promise<AcceptInvitationResponse> {
  const { data } = await apiClient.post<AcceptInvitationResponse>(
    invitationRoutes.acceptInvitation(invitationId),
  );
  return data;
}
