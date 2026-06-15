"use client";

import * as React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { Loader2, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  CreateTicketFormData,
  createTicketSchema,
} from "@/lib/validations/support-ticket";
import { useCreateTicketMutation } from "@/hooks/use-support-ticket";

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

/** Lee el nombre del usuario logueado para pre-rellenar `userName` (opcional). */
function readUserName(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = sessionStorage.getItem("user");
    if (!stored) return "";
    const parsed = JSON.parse(stored);
    return typeof parsed?.name === "string" ? parsed.name : "";
  } catch {
    return "";
  }
}

interface CreateTicketDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTicketDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: CreateTicketDialogProps) {
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

  const createMutation = useCreateTicketMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { subject: "", message: "", userName: "" },
  });

  React.useEffect(() => {
    if (open) {
      reset({ subject: "", message: "", userName: readUserName() });
    }
  }, [open, reset]);

  async function onSubmit(formData: CreateTicketFormData) {
    try {
      await createMutation.mutateAsync({
        subject: formData.subject,
        message: formData.message,
        userName: formData.userName?.trim() || undefined,
      });
      sileo.success({
        title: "Ticket enviado",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: "Tu solicitud de soporte se ha registrado correctamente",
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
          message: "Error al enviar el ticket. Intenta de nuevo.",
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[480px] md:max-w-[560px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Nuevo ticket de soporte
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, () => {
            sileo.error({
              title: "Revisa el formulario",
              description: "Completa todos los campos requeridos correctamente",
            });
          })}
          className="flex flex-col gap-5 pt-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-subject" className="text-card-foreground">
              Asunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-subject"
              placeholder="Ej: No puedo agregar productos"
              {...register("subject")}
              aria-invalid={errors.subject ? "true" : "false"}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-message" className="text-card-foreground">
              Mensaje <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ticket-message"
              rows={5}
              className="resize-none"
              placeholder="Describe el problema o la duda con el mayor detalle posible..."
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
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {createMutation.isPending ? "Enviando..." : "Enviar ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
