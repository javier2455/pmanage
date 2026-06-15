export type SupportTicketStatus = "open" | "in_progress" | "closed";

/**
 * Ticket de soporte. Los campos coinciden con el contrato del backend
 * (ver docs/funtion.md). El `userEmail` lo deduce el backend del JWT del
 * usuario autenticado; el cliente nunca lo envía.
 */
export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  userEmail: string;
  userName: string | null;
  status: SupportTicketStatus;
  response: string | null;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface CloseTicketProps {
  /** Respuesta del equipo de soporte. Opcional (0–5000 chars). */
  response?: string;
}
