"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ReplyMessageFormData,
  replyMessageSchema,
} from "@/lib/validations/support-ticket";

interface TicketReplyFormProps {
  /** Envía el mensaje; debe resolver/rechazar como la mutación. */
  onSend: (message: string) => Promise<unknown>;
  isPending: boolean;
  placeholder?: string;
  /** Texto de aviso opcional (ej. "responder reabrirá el ticket"). */
  hint?: string;
}

export function TicketReplyForm({
  onSend,
  isPending,
  placeholder = "Escribe tu respuesta...",
  hint,
}: TicketReplyFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyMessageFormData>({
    resolver: zodResolver(replyMessageSchema),
    defaultValues: { message: "" },
  });

  async function onSubmit(data: ReplyMessageFormData) {
    try {
      await onSend(data.message);
      reset({ message: "" });
      toastSuccess({
        title: "Mensaje enviado",
        description: "Tu respuesta se ha añadido a la conversación",
      });
    } catch (error) {
      toastApiError(error, "No se pudo enviar el mensaje. Intenta de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Controller
        control={control}
        name="message"
        render={({ field }) => (
          <Textarea
            rows={3}
            className="resize-none"
            placeholder={placeholder}
            aria-invalid={errors.message ? "true" : "false"}
            {...field}
          />
        )}
      />
      {errors.message && (
        <p className="text-xs text-destructive">{errors.message.message}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isPending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </form>
  );
}
