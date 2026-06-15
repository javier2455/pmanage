import apiClient from "@/lib/axios";
import { supportTicketRoutes } from "../routes/support-ticket";
import {
  CreateTicketProps,
  GetTicketsResponse,
  SupportTicket,
  SupportTicketStatus,
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

/** Obtiene un ticket propio por id. */
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

/** (Admin) Cierra un ticket, con una respuesta opcional para el usuario. */
export async function closeTicket(
  id: string,
  response?: string,
): Promise<SupportTicket> {
  const { data } = await apiClient.patch(supportTicketRoutes.close(id), {
    response,
  });
  return data;
}
