"use client";

import { useState } from "react";
import { BellRing, Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  parseWhatsappDailyLimit,
  WHATSAPP_LIMIT_ERROR,
  whatsappErrorMessage,
} from "@/lib/desktop-licenses";
import {
  useGetDesktopAdminSettingsQuery,
  useUpdateDesktopAdminSettingsMutation,
} from "@/hooks/use-desktop-licenses";

const SAVE_ERROR_FALLBACK = "No se pudo guardar el límite. Intenta de nuevo.";

/**
 * Formulario del diálogo. Se monta al abrirlo, así el borrador arranca siempre
 * del límite guardado.
 */
function LimitForm({
  limit,
  onSaved,
}: {
  limit: number;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(String(limit));
  /** El error se pinta desde el primer intento de guardar. */
  const [showError, setShowError] = useState(false);
  const updateMutation = useUpdateDesktopAdminSettingsMutation();
  const isPending = updateMutation.isPending;
  const parsed = parseWhatsappDailyLimit(draft);
  /** El límite general no puede quedar vacío. */
  const hasError = showError && typeof parsed !== "number";

  async function handleSave() {
    if (typeof parsed !== "number") {
      setShowError(true);
      return;
    }
    try {
      await updateMutation.mutateAsync({ whatsappDailyLimit: parsed });
      toastSuccess({
        title: "Límite guardado",
        description: "Se aplica a los negocios que no tienen un límite propio.",
      });
      onSaved();
    } catch (error) {
      toastError({
        title: "Error",
        description: whatsappErrorMessage(error, SAVE_ERROR_FALLBACK),
      });
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="flex flex-col gap-5 pt-2"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="whatsapp-daily-limit" className="text-card-foreground">
          Mensajes al día por negocio
        </Label>
        <Input
          id="whatsapp-daily-limit"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="w-28"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={hasError ? "true" : "false"}
        />
        {hasError ? (
          <p className="text-xs text-destructive">{WHATSAPP_LIMIT_ERROR}</p>
        ) : null}
      </div>

      {updateMutation.isError && (
        <p className="text-sm text-destructive">
          {whatsappErrorMessage(updateMutation.error, SAVE_ERROR_FALLBACK)}
        </p>
      )}

      <Separator />

      <DialogFooter className="gap-2 sm:gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Límite general de avisos por WhatsApp al día, el mismo para todos los
 * negocios que no tienen uno propio. Compacta, como la de los números de pago:
 * lo principal de la pantalla es la tabla de instalaciones.
 */
export function WhatsappLimitCard() {
  const [open, setOpen] = useState(false);
  const { data: settings, isError } = useGetDesktopAdminSettingsQuery();

  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <BellRing className="size-4 text-primary" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="text-card-foreground">
              Avisos por WhatsApp
            </CardTitle>
            {!settings ? (
              isError ? (
                <p className="text-sm text-destructive">
                  Error al cargar el límite.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cargando límite…
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Límite general:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {settings.whatsappDailyLimit}
                </span>{" "}
                {settings.whatsappDailyLimit === 1 ? "mensaje" : "mensajes"} al
                día por negocio
              </p>
            )}
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start sm:self-auto"
              disabled={!settings}
            >
              <Pencil className="size-4" />
              Cambiar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-[480px] shadow-lg shadow-cyan-300/30">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                Límite general de avisos
              </DialogTitle>
              <DialogDescription>
                Cada negocio puede recibir como máximo esta cantidad de avisos
                por WhatsApp al día. Al llegar al límite, los mensajes esperan
                al día siguiente. Puedes poner un límite distinto a un negocio
                concreto desde su ficha.
              </DialogDescription>
            </DialogHeader>
            {settings ? (
              <LimitForm
                limit={settings.whatsappDailyLimit}
                onSaved={() => setOpen(false)}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
