"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquareReply } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGetMyTicketByIdQuery } from "@/hooks/use-support-ticket";
import { TicketStatusBadge } from "@/components/support-tickets/ticket-status-badge";
import { formatTicketDate } from "@/components/support-tickets/my-tickets-table-columns";

export default function SupportDetailClient() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("id") ?? "";
  const { data: ticket, isLoading, isError } =
    useGetMyTicketByIdQuery(ticketId);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/support"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Detalle del ticket
          </h1>
          <p className="text-muted-foreground">
            Consulta el estado y la respuesta de tu solicitud
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !ticket ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-center text-muted-foreground">
            No se encontró el ticket. Vuelve a la lista e inténtalo de nuevo.
          </p>
          <Link
            href="/dashboard/support"
            className="text-sm text-primary hover:underline"
          >
            Volver a soporte
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-card-foreground">
                  {ticket.subject}
                </CardTitle>
                <CardDescription>
                  Creado el {formatTicketDate(ticket.createdAt)}
                </CardDescription>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-card-foreground">
                Mensaje
              </span>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {ticket.message}
              </p>
            </div>

            {ticket.status === "closed" || ticket.response ? (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                    <MessageSquareReply className="size-4 text-primary" />
                    Respuesta del equipo
                  </span>
                  {ticket.response ? (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {ticket.response}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      El ticket se cerró sin una respuesta escrita.
                    </p>
                  )}
                  {ticket.closedAt ? (
                    <span className="text-xs text-muted-foreground">
                      Cerrado el {formatTicketDate(ticket.closedAt)}
                    </span>
                  ) : null}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
