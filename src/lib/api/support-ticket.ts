import apiClient from "@/lib/axios";
import { supportTicketRoutes } from "../routes/support-ticket";
import {
  CreateTicketProps,
  GetTicketsResponse,
  SupportTicket,
  SupportTicketStatus,
  UpdateTicketStatusProps,
} from "../types/support-ticket";

interface GetTicketsParams {
  page?: number;
  limit?: number;
}

interface GetAllTicketsParams extends GetTicketsParams {
  /** Filtra por estado en el backend. Omitido = todos. */
  status?: SupportTicketStatus;
}

/** Crea un ticket. El backend deduce el `userEmail` del usuario autenticado. */
export async function createTicket(
  credentials: CreateTicketProps,
): Promise<SupportTicket> {
  const { data } = await apiClient.post(supportTicketRoutes.create, credentials);
  return data;
}

/** Lista los tickets del usuario autenticado, más nuevos primero. */
export async function getMyTickets({
  page,
  limit,
}: GetTicketsParams = {}): Promise<GetTicketsResponse> {
  const { data } = await apiClient.get<GetTicketsResponse>(
    supportTicketRoutes.myTickets,
    { params: { page, limit } },
  );
  return data;
}

/** Obtiene un ticket propio por id, incluyendo el hilo `messages`. */
export async function getMyTicketById(id: string): Promise<SupportTicket> {
  const { data } = await apiClient.get(supportTicketRoutes.myTicketById(id));
  return data;
}

/** (Admin) Lista todos los tickets, opcionalmente filtrados por estado. */
export async function getAllTickets({
  status,
  page,
  limit,
}: GetAllTicketsParams = {}): Promise<GetTicketsResponse> {
  const { data } = await apiClient.get<GetTicketsResponse>(
    supportTicketRoutes.all,
    // Omitimos `status` cuando no hay filtro para no ensuciar la URL ni la cache.
    { params: { status: status || undefined, page, limit } },
  );
  return data;
}

/** Respuesta del usuario (dueño del ticket). Reabre el ticket si estaba cerrado. */
export async function addUserMessage(
  id: string,
  message: string,
): Promise<SupportTicket> {
  const { data } = await apiClient.post(supportTicketRoutes.userReply(id), {
    message,
  });
  return data;
}

/** (Admin) Respuesta del equipo. Reabre el ticket si estaba cerrado. */
export async function addAdminMessage(
  id: string,
  message: string,
): Promise<SupportTicket> {
  const { data } = await apiClient.post(supportTicketRoutes.adminReply(id), {
    message,
  });
  return data;
}

/**
 * Cierra o reabre un ticket (endpoint canónico). El usuario solo puede actuar
 * sobre sus propios tickets; el admin sobre cualquiera. Si se envía `message`,
 * se guarda como mensaje de la conversación.
 */
export async function updateTicketStatus(
  id: string,
  payload: UpdateTicketStatusProps,
): Promise<SupportTicket> {
  const { data } = await apiClient.patch(
    supportTicketRoutes.updateStatus(id),
    payload,
  );
  return data;
}
