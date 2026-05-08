import { BASIC_ROUTE } from ".";

export const invitationRoutes = {
  getAllInvitations: (businessId: string) =>
    `${BASIC_ROUTE}/invitations/business/${businessId}`,
  getInvitationByID: (invitationId: string) =>
    `${BASIC_ROUTE}/invitations/${invitationId}`,
  deleteInvitation: (invitationId: string) =>
    `${BASIC_ROUTE}/invitations/${invitationId}`,

  // Only for users with a previus account created
  acceptInvitation: (invitationId: string) =>
    `${BASIC_ROUTE}/invitations/${invitationId}/accept`,
};
