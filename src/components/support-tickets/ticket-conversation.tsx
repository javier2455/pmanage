"use client";

import { cn } from "@/lib/utils";
import type {
  SupportTicket,
  SupportTicketMessage,
  TicketSenderType,
} from "@/lib/types/support-ticket";
import { formatTicketDate } from "./my-tickets-table-columns";

const SENDER_LABEL: Record<TicketSenderType, string> = {
  user: "Usuario",
  admin: "Soporte",
};

/**
 * Hilo de conversación de un ticket. Usa `ticket.messages` como fuente de
 * verdad; si el backend aún no lo devuelve, hace fallback al `message` inicial.
 * `viewerType` alinea a la derecha (color primario) los mensajes del rol que
 * está viendo el hilo.
 */
export function TicketConversation({
  ticket,
  viewerType,
}: {
  ticket: SupportTicket;
  viewerType: TicketSenderType;
}) {
  const messages: SupportTicketMessage[] =
    ticket.messages && ticket.messages.length > 0
      ? ticket.messages
      : [
          {
            id: "initial",
            ticketId: ticket.id,
            senderType: "user",
            senderUserId: ticket.userId,
            senderName: ticket.userName,
            senderEmail: ticket.userEmail,
            message: ticket.message,
            createdAt: ticket.createdAt,
          },
        ];

  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isOwn = msg.senderType === viewerType;
        return (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col gap-1",
              isOwn ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap sm:max-w-[75%]",
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {msg.message}
            </div>
            <span className="px-1 text-xs text-muted-foreground">
              {msg.senderName ?? SENDER_LABEL[msg.senderType]} ·{" "}
              {formatTicketDate(msg.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
