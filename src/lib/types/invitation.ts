export interface InvitationPermission {
  all: boolean;
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
  download: boolean;
  menuId?: string;
  subMenuId?: string;
}

export interface InvitationBusinessSummary {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  lat?: string | null;
  lng?: string | null;
  userId?: string | null;
  geocoded?: boolean;
  active?: boolean;
}

export interface Invitation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  job: string;
  permissions: InvitationPermission[];
  businessId: string;
  expirationDate: string;
  used: boolean;
  usedAt: string | null;
  userId: string | null;
  /**
   * Invitación cancelada por un downgrade de plan del propietario (el enlace de
   * aceptar deja de funcionar; el registro se conserva).
   * TODO(backend): incluir `canceled`/`canceledAt` en las respuestas de invitaciones.
   * Contrato: docs/análisis-planes/backend-cambios.md.
   */
  canceled?: boolean;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: InvitationBusinessSummary;
}

export interface InvitationsResponseInterface {
  message?: string;
  data: Invitation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetInvitationByIdResponse {
  message?: string;
  data: Invitation;
}

export interface DeleteInvitationResponse {
  message: string;
}

export interface AcceptInvitationResponse {
  message: string;
  data?: unknown;
}
