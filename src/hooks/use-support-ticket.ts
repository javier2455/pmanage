import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import {
  addAdminMessage,
  addUserMessage,
  createTicket,
  getAllTickets,
  getMyTickets,
  getMyTicketById,
  updateTicketStatus,
} from "@/lib/api/support-ticket";
import { supportTicketRoutes } from "@/lib/routes/support-ticket";
import {
  CreateTicketProps,
  SupportTicket,
  SupportTicketStatus,
  UpdateTicketStatusProps,
} from "@/lib/types/support-ticket";

interface UseGetMyTicketsParams {
  page?: number;
  limit?: number;
}

interface UseGetAllTicketsParams extends UseGetMyTicketsParams {
  status?: SupportTicketStatus;
}

/**
 * Detalle de un ticket para el admin. funtion.md solo documenta
 * `GET /my-tickets/:id` (scope del dueño); aquí asumimos el endpoint REST
 * `GET /support-tickets/:id` para que el admin lea el hilo de cualquier ticket.
 * TODO(backend): confirmar que este endpoint existe.
 */
async function getTicketByIdAdmin(id: string): Promise<SupportTicket> {
  const { data } = await apiClient.get(`${supportTicketRoutes.all}/${id}`);
  return data;
}

export function useGetMyTicketsQuery(params: UseGetMyTicketsParams = {}) {
  return useQuery({
    queryKey: ["my-support-tickets", params],
    queryFn: () => getMyTickets(params),
    placeholderData: keepPreviousData,
  });
}

export function useGetMyTicketByIdQuery(ticketId: string) {
  return useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: () => getMyTicketById(ticketId),
    enabled: !!ticketId,
  });
}

export function useGetAllTicketsQuery(params: UseGetAllTicketsParams = {}) {
  return useQuery({
    queryKey: ["all-support-tickets", params],
    queryFn: () => getAllTickets(params),
    placeholderData: keepPreviousData,
  });
}

export function useGetAdminTicketByIdQuery(ticketId: string) {
  return useQuery({
    queryKey: ["admin-support-ticket", ticketId],
    queryFn: () => getTicketByIdAdmin(ticketId),
    enabled: !!ticketId,
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: CreateTicketProps) => createTicket(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
  });
}

/**
 * Invalida todas las queries dependientes de un ticket tras una mutación
 * (respuesta o cambio de estado): detalle usuario, detalle admin, ambas listas
 * y las notificaciones de soporte.
 */
function invalidateTicket(
  queryClient: ReturnType<typeof useQueryClient>,
  ticketId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
  queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", ticketId] });
  queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
  queryClient.invalidateQueries({ queryKey: ["all-support-tickets"] });
  queryClient.invalidateQueries({ queryKey: ["support-notifications"] });
  queryClient.invalidateQueries({ queryKey: ["support-notifications-unread"] });
}

export function useAddUserMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      addUserMessage(ticketId, message),
    onSuccess: (_, { ticketId }) => invalidateTicket(queryClient, ticketId),
  });
}

export function useAddAdminMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      addAdminMessage(ticketId, message),
    onSuccess: (_, { ticketId }) => invalidateTicket(queryClient, ticketId),
  });
}

export function useUpdateTicketStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      ...payload
    }: { ticketId: string } & UpdateTicketStatusProps) =>
      updateTicketStatus(ticketId, payload),
    onSuccess: (_, { ticketId }) => invalidateTicket(queryClient, ticketId),
  });
}
