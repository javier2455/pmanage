"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { sileo } from "sileo";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useAddAdminMessageMutation,
  useAssignTicketMutation,
  useGetAdminTicketByIdQuery,
} from "@/hooks/use-support-ticket";
import { TicketStatusBadge } from "@/components/support-tickets/ticket-status-badge";
import { TicketConversation } from "@/components/support-tickets/ticket-conversation";
import { TicketReplyForm } from "@/components/support-tickets/ticket-reply-form";
import { TicketStatusDialog } from "@/components/support-tickets/ticket-status-dialog";
import { formatTicketDate } from "@/components/support-tickets/my-tickets-table-columns";

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

export default function AdminSupportDetailClient() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("id") ?? "";
  const { data: ticket, isLoading, isError, isFetching, refetch } =
    useGetAdminTicketByIdQuery(ticketId);
  const replyMutation = useAddAdminMessageMutation();
  const assignMutation = useAssignTicketMutation();

  async function handleAssign() {
    if (!ticket) return;
    try {
      await assignMutation.mutateAsync(ticket.id);
      sileo.success({
        title: "Ticket asignado",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: "Ahora eres el admin responsable de este ticket",
      });
    } catch (error) {
      const description =
        axios.isAxiosError(error) && error.response?.data?.message
          ? Array.isArray(error.response.data.message)
            ? error.response.data.message.join(", ")
            : error.response.data.message
          : "Intenta de nuevo en unos segundos.";
      sileo.error({
        title: "No se pudo asignar el ticket",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        description,
      });
    }
  }

  const isClosed = ticket?.status === "closed";

  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/support"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestionar ticket
          </h1>
          <p className="text-muted-foreground">
            Responde la conversación y actualiza el estado del ticket
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
            No se encontró el ticket. Vuelve a la bandeja e inténtalo de nuevo.
          </p>
          <Link
            href="/dashboard/admin/support"
            className="text-sm text-primary hover:underline"
          >
            Volver a la bandeja
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-card-foreground">
                  {ticket.subject}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {ticket.userName
                    ? `${ticket.userName} · ${ticket.userEmail}`
                    : ticket.userEmail}
                </CardDescription>
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge variant={ticket.assignedAdminId ? "secondary" : "outline"}>
                    {ticket.assignedAdminId
                      ? `Asignado a ${ticket.assignedAdminName ?? "un agente"}`
                      : "Sin asignar"}
                  </Badge>
                  <CardDescription>
                    Creado el {formatTicketDate(ticket.createdAt)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                {!isClosed && !ticket.assignedAdminId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAssign}
                    disabled={assignMutation.isPending}
                  >
                    {assignMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserCheck className="size-4" />
                    )}
                    Asignarme
                  </Button>
                ) : null}
                {isClosed ? (
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
            <TicketConversation ticket={ticket} viewerType="admin" />

            <Separator />

            <TicketReplyForm
              onSend={(message) =>
                replyMutation.mutateAsync({ ticketId: ticket.id, message })
              }
              isPending={replyMutation.isPending}
              placeholder="Escribe la respuesta del equipo de soporte..."
              hint={
                isClosed
                  ? "Si respondes, el ticket se reabrirá automáticamente."
                  : !ticket.assignedAdminId
                    ? "Asígnate el ticket con «Asignarme» para poder responder."
                    : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
