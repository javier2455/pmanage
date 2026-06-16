"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useAddUserMessageMutation,
  useGetMyTicketByIdQuery,
} from "@/hooks/use-support-ticket";
import { TicketStatusBadge } from "@/components/support-tickets/ticket-status-badge";
import { TicketConversation } from "@/components/support-tickets/ticket-conversation";
import { TicketReplyForm } from "@/components/support-tickets/ticket-reply-form";
import { TicketStatusDialog } from "@/components/support-tickets/ticket-status-dialog";
import { formatTicketDate } from "@/components/support-tickets/my-tickets-table-columns";

export default function SupportDetailClient() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("id") ?? "";
  const { data: ticket, isLoading, isError, isFetching, refetch } =
    useGetMyTicketByIdQuery(ticketId);
  const replyMutation = useAddUserMessageMutation();

  return (
    <section className="flex flex-col gap-6 p-4">
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
            Consulta y responde la conversación de tu solicitud
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
              <div className="flex items-center gap-2">
                <TicketStatusBadge status={ticket.status} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  title="Actualizar conversación"
                  aria-label="Actualizar conversación"
                >
                  <RefreshCw
                    className={`size-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
                {ticket.status === "closed" ? (
                  <TicketStatusDialog
                    ticketId={ticket.id}
                    ticketSubject={ticket.subject}
                    action="reopen"
                    trigger={
                      <Button variant="outline" size="sm">
                        <RotateCcw className="size-4" />
                        Reabrir
                      </Button>
                    }
                  />
                ) : (
                  <TicketStatusDialog
                    ticketId={ticket.id}
                    ticketSubject={ticket.subject}
                    action="close"
                    trigger={
                      <Button variant="outline" size="sm">
                        <CheckCircle2 className="size-4" />
                        Cerrar
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <TicketConversation ticket={ticket} viewerType="user" />

            <Separator />

            <TicketReplyForm
              onSend={(message) =>
                replyMutation.mutateAsync({ ticketId: ticket.id, message })
              }
              isPending={replyMutation.isPending}
              hint={
                ticket.status === "closed"
                  ? "Si respondes, el ticket se reabrirá automáticamente."
                  : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
