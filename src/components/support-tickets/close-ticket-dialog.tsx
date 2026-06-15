"use client";

import * as React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  CloseTicketFormData,
  closeTicketSchema,
} from "@/lib/validations/support-ticket";
import { useCloseTicketMutation } from "@/hooks/use-support-ticket";

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

interface CloseTicketDialogProps {
  ticketId: string;
  ticketSubject: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CloseTicketDialog({
  ticketId,
  ticketSubject,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: CloseTicketDialogProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChangeProp?.(next);
    },
    [isControlled, onOpenChangeProp],
  );

  const closeMutation = useCloseTicketMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CloseTicketFormData>({
    resolver: zodResolver(closeTicketSchema),
    defaultValues: { response: "" },
  });

  React.useEffect(() => {
    if (open) reset({ response: "" });
  }, [open, reset]);

  async function onSubmit(formData: CloseTicketFormData) {
    try {
      await closeMutation.mutateAsync({
        ticketId,
        response: formData.response?.trim() || undefined,
      });
      sileo.success({
        title: "Ticket cerrado",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: "El ticket se ha cerrado correctamente",
      });
      setOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        const message = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(", ")
          : error.response.data.message;
        setError("root", { message });
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: message,
        });
      } else {
        setError("root", {
          message: "Error al cerrar el ticket. Intenta de nuevo.",
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[480px] md:max-w-[560px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Cerrar ticket</DialogTitle>
          <DialogDescription>
            Vas a cerrar el ticket «{ticketSubject}». Puedes añadir una respuesta
            para el usuario (opcional).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 pt-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-response" className="text-card-foreground">
              Respuesta
            </Label>
            <Textarea
              id="ticket-response"
              rows={5}
              className="resize-none"
              placeholder="Ej: El problema fue corregido."
              {...register("response")}
              aria-invalid={errors.response ? "true" : "false"}
            />
            {errors.response && (
              <p className="text-xs text-destructive">{errors.response.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <Separator />

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={closeMutation.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={closeMutation.isPending}>
              {closeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {closeMutation.isPending ? "Cerrando..." : "Cerrar ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
