import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  closeTicket,
  createTicket,
  getAllTickets,
  getMyTickets,
  getMyTicketById,
} from "@/lib/api/support-ticket";
import {
  CreateTicketProps,
  SupportTicketStatus,
} from "@/lib/types/support-ticket";

interface UseGetMyTicketsParams {
  page?: number;
  limit?: number;
}

interface UseGetAllTicketsParams extends UseGetMyTicketsParams {
  status?: SupportTicketStatus;
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

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: CreateTicketProps) => createTicket(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
  });
}

export function useCloseTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, response }: { ticketId: string; response?: string }) =>
      closeTicket(ticketId, response),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ["all-support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
    },
  });
}
