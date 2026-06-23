"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, UserX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useDeactivateAccountMutation } from "@/hooks/use-user";
import {
  deactivateAccountSchema,
  type DeactivateAccountFormData,
} from "@/lib/validations/user";
import { toastError } from "@/lib/toast";

const GRACE_DAYS = 15;

/**
 * "Zona de peligro" del perfil: permite al usuario darse de baja. Tras
 * confirmar, el backend marca la cuenta como desactivada (15 días de gracia) y
 * redirigimos a la pantalla de reactivación, que será la única accesible.
 */
export function DeactivateAccountCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const deactivateMutation = useDeactivateAccountMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DeactivateAccountFormData>({
    resolver: zodResolver(deactivateAccountSchema),
    defaultValues: { reason: "", confirm: false },
  });

  function handleOpenChange(next: boolean) {
    if (deactivateMutation.isPending) return;
    if (!next) reset();
    setOpen(next);
  }

  async function onSubmit(values: DeactivateAccountFormData) {
    try {
      await deactivateMutation.mutateAsync({
        deletionReason: values.reason?.trim() || undefined,
      });
      // El middleware/guard bloquearán el resto; vamos directo a reactivación.
      router.replace("/cuenta-desactivada");
    } catch {
      toastError({
        title: "No se pudo desactivar la cuenta",
        description: "Inténtalo de nuevo en unos momentos.",
      });
    }
  }

  return (
    <Card className="lg:col-span-2 border-destructive/30">
      <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <UserX className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-card-foreground">
              Desactivar cuenta
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tendrás {GRACE_DAYS} días para reactivarla. Pasado ese plazo, tu
              cuenta y todos tus datos se eliminarán de forma permanente.
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="shrink-0 cursor-pointer">
              Desactivar cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-120 shadow-lg shadow-destructive/30">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <DialogHeader className="gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="size-5 text-destructive" />
                  </div>
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Desactivar tu cuenta
                  </DialogTitle>
                </div>
                <DialogDescription asChild>
                  <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
                    <p>
                      Tus negocios quedarán inactivos y no podrás operar mientras
                      la cuenta esté desactivada.
                    </p>
                    <p>
                      Tienes{" "}
                      <span className="font-semibold">{GRACE_DAYS} días</span>{" "}
                      para reactivarla. Después de ese plazo,{" "}
                      <span className="font-semibold">
                        todos tus datos se borrarán de forma permanente
                      </span>{" "}
                      y no podrás recuperarlos.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Cuéntanos por qué te das de baja…"
                  rows={3}
                  {...register("reason")}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <Controller
                  control={control}
                  name="confirm"
                  render={({ field }) => (
                    <Checkbox
                      id="confirm"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-invalid={!!errors.confirm}
                      className="mt-0.5"
                    />
                  )}
                />
                <Label
                  htmlFor="confirm"
                  className="text-sm font-normal leading-snug text-foreground"
                >
                  Entiendo que mis datos se eliminarán de forma permanente si no
                  reactivo mi cuenta en {GRACE_DAYS} días.
                </Label>
              </div>
              {errors.confirm && (
                <p className="-mt-2 text-sm text-destructive">
                  {errors.confirm.message}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deactivateMutation.isPending}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deactivateMutation.isPending}
                  className="cursor-pointer"
                >
                  {deactivateMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Desactivando…
                    </>
                  ) : (
                    "Desactivar cuenta"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
