"use client";

import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ReplyMessageFormData,
  replyMessageSchema,
} from "@/lib/validations/support-ticket";

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

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
    register,
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
      sileo.success({
        title: "Mensaje enviado",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: "Tu respuesta se ha añadido a la conversación",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        const message = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(", ")
          : error.response.data.message;
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: message,
        });
      } else {
        sileo.error({
          title: "Error al enviar el mensaje",
          description: "Intenta de nuevo en unos segundos.",
        });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Textarea
        rows={3}
        className="resize-none"
        placeholder={placeholder}
        {...register("message")}
        aria-invalid={errors.message ? "true" : "false"}
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
