"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toastError, toastSuccess } from "@/lib/toast";
import {
  formatInstallationCode,
  isDuplicateCodeError,
  licenseErrorMessage,
} from "@/lib/desktop-licenses";
import {
  type CreateInstallationFormData,
  createInstallationSchema,
} from "@/lib/validations/desktop-licenses";
import { useCreateDesktopInstallationMutation } from "@/hooks/use-desktop-licenses";
import { installationDetailHref } from "./installations-table-columns";

const EMPTY_FORM: CreateInstallationFormData = {
  installationCode: "",
  businessName: "",
  ownerName: "",
  ownerPhone: "",
  notes: "",
};

/**
 * Alta a mano de una instalación: el cliente paga al instalar y el PC no tiene
 * internet, así que nunca se ha registrado sola. Tras el alta se abre su
 * detalle para registrar el pago.
 */
export function CreateInstallationDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const createMutation = useCreateDesktopInstallationMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateInstallationFormData>({
    resolver: zodResolver(createInstallationSchema),
    defaultValues: EMPTY_FORM,
  });

  React.useEffect(() => {
    if (open) reset(EMPTY_FORM);
  }, [open, reset]);

  async function onSubmit(formData: CreateInstallationFormData) {
    const installationCode = formatInstallationCode(formData.installationCode);
    try {
      await createMutation.mutateAsync({
        installationCode,
        businessName: formData.businessName,
        ownerName: formData.ownerName || undefined,
        ownerPhone: formData.ownerPhone || undefined,
        notes: formData.notes || undefined,
      });
      toastSuccess({
        title: "Instalación dada de alta",
        description: "Ahora registra el pago para emitir su licencia.",
      });
      setOpen(false);
      router.push(installationDetailHref(installationCode));
    } catch (error) {
      const message = licenseErrorMessage(
        error,
        "No se pudo dar de alta la instalación. Intenta de nuevo.",
      );
      toastError({ title: "Error", description: message });
      if (isDuplicateCodeError(error)) {
        setError("installationCode", { message });
      } else {
        setError("root", { message });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] md:max-w-[560px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Alta manual de instalación
          </DialogTitle>
          <DialogDescription>
            Para clientes que pagan al instalar y no tienen internet en el PC.
            El código está en Negora → Licencia.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 pt-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="installation-code" className="text-card-foreground">
              Código de instalación <span className="text-destructive">*</span>
            </Label>
            <Input
              id="installation-code"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              className="font-mono uppercase"
              {...register("installationCode")}
              aria-invalid={errors.installationCode ? "true" : "false"}
            />
            {errors.installationCode ? (
              <p className="text-xs text-destructive">
                {errors.installationCode.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Los guiones y los espacios son opcionales.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="installation-business" className="text-card-foreground">
              Negocio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="installation-business"
              placeholder="Ej: Cafetería El Rincón"
              {...register("businessName")}
              aria-invalid={errors.businessName ? "true" : "false"}
            />
            {errors.businessName && (
              <p className="text-xs text-destructive">
                {errors.businessName.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="installation-owner" className="text-card-foreground">
                Dueño
              </Label>
              <Input
                id="installation-owner"
                placeholder="Nombre del dueño"
                {...register("ownerName")}
                aria-invalid={errors.ownerName ? "true" : "false"}
              />
              {errors.ownerName && (
                <p className="text-xs text-destructive">
                  {errors.ownerName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="installation-phone" className="text-card-foreground">
                Teléfono
              </Label>
              <Input
                id="installation-phone"
                type="tel"
                placeholder="+53 5555 5555"
                {...register("ownerPhone")}
                aria-invalid={errors.ownerPhone ? "true" : "false"}
              />
              {errors.ownerPhone && (
                <p className="text-xs text-destructive">
                  {errors.ownerPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="installation-notes" className="text-card-foreground">
              Notas
            </Label>
            <Textarea
              id="installation-notes"
              rows={3}
              className="resize-none"
              placeholder="Ej: Pagó 6 meses por transferencia al instalar"
              {...register("notes")}
              aria-invalid={errors.notes ? "true" : "false"}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
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
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              {createMutation.isPending ? "Guardando..." : "Dar de alta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
