export type SupportTicketStatus = "open" | "in_progress" | "closed";

/** Tipo de remitente de un mensaje de la conversación. */
export type TicketSenderType = "user" | "admin";

/**
 * Mensaje de la conversación de un ticket (ver docs/funtion.md → Message fields).
 */
export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderType: TicketSenderType;
  senderUserId: string | null;
  senderName: string | null;
  senderEmail: string | null;
  message: string;
  createdAt: string;
}

/**
 * Ticket de soporte. Los campos coinciden con el contrato del backend
 * (ver docs/funtion.md). El `userEmail`/`userId` los deduce el backend del JWT
 * del usuario autenticado; el cliente nunca los envía.
 */
export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  userEmail: string;
  userId: string | null;
  userName: string | null;
  status: SupportTicketStatus;
  response: string | null;
  closedAt: string | null;
  closedBy: string | null;
  reopenedAt: string | null;
  reopenedBy: string | null;
  lastMessageAt: string | null;
  lastMessageBy: TicketSenderType | null;
  /** Admin asignado (auto por menor carga, o manual vía /assign). Null al cerrar. */
  assignedAdminId: string | null;
  /** Nombre del admin asignado (si el backend lo incluye). */
  assignedAdminName?: string | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Solo presente en el detalle (GET /:id); incluye el hilo de conversación. */
  messages?: SupportTicketMessage[];
}

/**
 * Respuesta de los endpoints de listado. Envuelta en `{ data, meta }` igual que
 * el resto de listados del proyecto (product/expenses).
 */
export interface GetTicketsResponse {
  message?: string;
  data: SupportTicket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateTicketProps {
  subject: string;
  message: string;
  /** Opcional: nombre a mostrar. Si se omite, el backend usa el del usuario. */
  userName?: string;
}

/** Cuerpo para responder un ticket (usuario o admin). */
export interface AddMessageProps {
  message: string;
}

/**
 * Respuesta de los endpoints de responder (POST /:id/messages y
 * /:id/admin-messages): el ticket parcial actualizado + el mensaje creado.
 */
export interface AddMessageResponse {
  ticket: Pick<
    SupportTicket,
    "id" | "status" | "assignedAdminId" | "lastMessageAt" | "lastMessageBy"
  >;
  message: SupportTicketMessage;
}

/** Cuerpo para cerrar/reabrir un ticket vía PATCH /:id/status. */
export interface UpdateTicketStatusProps {
  /** Solo se permite cerrar (`closed`) o reabrir (`open`). */
  status: Extract<SupportTicketStatus, "open" | "closed">;
  /** Mensaje opcional que se guarda como mensaje de la conversación. */
  message?: string;
}
