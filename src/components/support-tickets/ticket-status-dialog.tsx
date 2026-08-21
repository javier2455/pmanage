"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiMessage, toastApiError, toastSuccess } from "@/lib/toast";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

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
  StatusMessageFormData,
  statusMessageSchema,
} from "@/lib/validations/support-ticket";
import { useUpdateTicketStatusMutation } from "@/hooks/use-support-ticket";

type TicketStatusAction = "close" | "reopen";

const ACTION_CONFIG: Record<
  TicketStatusAction,
  {
    status: "closed" | "open";
    title: string;
    description: string;
    placeholder: string;
    submitLabel: string;
    pendingLabel: string;
    successTitle: string;
    Icon: typeof CheckCircle2;
  }
> = {
  close: {
    status: "closed",
    title: "Cerrar ticket",
    description:
      "Puedes añadir un mensaje de cierre para el usuario (opcional).",
    placeholder: "Ej: El problema fue corregido.",
    submitLabel: "Cerrar ticket",
    pendingLabel: "Cerrando...",
    successTitle: "Ticket cerrado",
    Icon: CheckCircle2,
  },
  reopen: {
    status: "open",
    title: "Reabrir ticket",
    description: "Puedes añadir un mensaje al reabrir (opcional).",
    placeholder: "Ej: Necesito más información.",
    submitLabel: "Reabrir ticket",
    pendingLabel: "Reabriendo...",
    successTitle: "Ticket reabierto",
    Icon: RotateCcw,
  },
};

interface TicketStatusDialogProps {
  ticketId: string;
  ticketSubject: string;
  action: TicketStatusAction;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TicketStatusDialog({
  ticketId,
  ticketSubject,
  action,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: TicketStatusDialogProps) {
  const config = ACTION_CONFIG[action];
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

  const statusMutation = useUpdateTicketStatusMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StatusMessageFormData>({
    resolver: zodResolver(statusMessageSchema),
    defaultValues: { message: "" },
  });

  React.useEffect(() => {
    if (open) reset({ message: "" });
  }, [open, reset]);

  async function onSubmit(formData: StatusMessageFormData) {
    try {
      await statusMutation.mutateAsync({
        ticketId,
        status: config.status,
        message: formData.message?.trim() || undefined,
      });
      toastSuccess({
        title: config.successTitle,
        description: `El ticket «${ticketSubject}» se ha actualizado correctamente`,
      });
      setOpen(false);
    } catch (error) {
      const fallback = "Error al actualizar el ticket. Intenta de nuevo.";
      toastApiError(error, fallback);
      setError("root", { message: apiMessage(error) ?? fallback });
    }
  }

  const { Icon } = config;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[480px] md:max-w-[560px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 pt-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="status-message" className="text-card-foreground">
              Mensaje
            </Label>
            <Textarea
              id="status-message"
              rows={4}
              className="resize-none"
              placeholder={config.placeholder}
              {...register("message")}
              aria-invalid={errors.message ? "true" : "false"}
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message.message}</p>
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
                disabled={statusMutation.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={statusMutation.isPending}>
              {statusMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon className="mr-2 h-4 w-4" />
              )}
              {statusMutation.isPending
                ? config.pendingLabel
                : config.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
