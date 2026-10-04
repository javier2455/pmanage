"use client";

import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toastError, toastSuccess } from "@/lib/toast";
import {
  formatContactPhone,
  formatDay,
  formatWhatsappUsage,
  getWhatsappNumberStatus,
  parseWhatsappDailyLimit,
  WHATSAPP_LIMIT_ERROR,
  whatsappErrorMessage,
  type WhatsappNumberStatusKind,
} from "@/lib/desktop-licenses";
import {
  useGetDesktopAdminSettingsQuery,
  useUpdateDesktopWhatsappNumberMutation,
} from "@/hooks/use-desktop-licenses";
import type { DesktopWhatsappNumber } from "@/lib/types/desktop-licenses";

const STATUS_BADGE: Record<
  WhatsappNumberStatusKind,
  { label: string; className: string }
> = {
  verified: {
    label: "Verificado",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  unverified: {
    label: "Sin verificar",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  blocked: {
    label: "Bloqueado",
    className: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
};

/** Bloquear pide confirmación; desbloquear se hace al momento. */
function BlockToggle({
  code,
  number,
}: {
  code: string;
  number: DesktopWhatsappNumber;
}) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdateDesktopWhatsappNumberMutation();
  const isPending = updateMutation.isPending;

  async function setBlocked(blocked: boolean) {
    try {
      await updateMutation.mutateAsync({ code, numberId: number.id, blocked });
      toastSuccess({
        title: blocked ? "Número bloqueado" : "Número desbloqueado",
        description: blocked
          ? `${number.businessName} ya no recibe avisos por WhatsApp.`
          : `${number.businessName} vuelve a recibir avisos por WhatsApp.`,
      });
      setOpen(false);
    } catch (error) {
      toastError({
        title: "Error",
        description: whatsappErrorMessage(
          error,
          blocked
            ? "No se pudo bloquear el número. Intenta de nuevo."
            : "No se pudo desbloquear el número. Intenta de nuevo.",
        ),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {number.blocked ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setBlocked(false)}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Desbloquear
        </Button>
      ) : (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Ban className="size-4" />
            Bloquear
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] md:max-w-[520px] shadow-lg shadow-destructive/30">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Bloquear número
            </DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
              <p>
                ¿Bloquear el número{" "}
                <span className="font-bold">
                  {formatContactPhone(number.phone)}
                </span>{" "}
                de <span className="font-bold">{number.businessName}</span>?
              </p>
              <p className="text-muted-foreground">
                Este negocio dejará de recibir avisos por WhatsApp hasta que lo
                desbloquees.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => setBlocked(true)}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Bloqueando...
              </>
            ) : (
              "Bloquear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Un número con su uso y su límite propio. El padre la monta con `key` = límite
 * guardado, así el borrador se reinicia cuando llega el del servidor.
 */
function WhatsappNumberRow({
  code,
  number,
  generalLimit,
}: {
  code: string;
  number: DesktopWhatsappNumber;
  /** Sin cargar (o servidor antiguo): no se muestra la cifra. */
  generalLimit: number | undefined;
}) {
  const [draft, setDraft] = useState(String(number.dailyLimit ?? ""));
  /** El error se pinta desde el primer intento de guardar. */
  const [showError, setShowError] = useState(false);
  const updateMutation = useUpdateDesktopWhatsappNumberMutation();
  const isPending = updateMutation.isPending;
  const limit = parseWhatsappDailyLimit(draft);
  const isDirty = limit !== number.dailyLimit;
  const hasError = showError && limit === undefined;
  const status = getWhatsappNumberStatus(number);
  const badge = STATUS_BADGE[status];
  const inputId = `whatsapp-limit-${number.id}`;

  async function handleSave() {
    if (limit === undefined) {
      setShowError(true);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        code,
        numberId: number.id,
        dailyLimit: limit,
      });
      toastSuccess({
        title: "Límite guardado",
        description:
          limit === null
            ? `${number.businessName} usa el límite general.`
            : `${number.businessName} puede recibir hasta ${limit} avisos al día.`,
      });
    } catch (error) {
      toastError({
        title: "Error",
        description: whatsappErrorMessage(
          error,
          "No se pudo guardar el límite. Intenta de nuevo.",
        ),
      });
    }
  }

  return (
    <li className="flex flex-col gap-4 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-sm font-medium text-card-foreground">
            {number.businessName}
          </span>
          <Badge variant="secondary" className={badge.className}>
            {status === "verified"
              ? `${badge.label} el ${formatDay(number.verifiedAt)}`
              : badge.label}
          </Badge>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatContactPhone(number.phone)}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatWhatsappUsage(number)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 lg:shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <Label htmlFor={inputId} className="text-card-foreground">
              Límite propio
            </Label>
            <Input
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="General"
              className="h-8 w-24"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-invalid={hasError ? "true" : "false"}
            />
            <Button type="submit" size="sm" disabled={!isDirty || isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar
            </Button>
          </form>
          <BlockToggle code={code} number={number} />
        </div>
        {hasError ? (
          <p className="text-xs text-destructive">{WHATSAPP_LIMIT_ERROR}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {generalLimit === undefined
            ? "Vacío: usa el general."
            : `Vacío: usa el general (${generalLimit}).`}
        </p>
      </div>
    </li>
  );
}

/**
 * Números de WhatsApp de los negocios de la instalación: uso, límite propio de
 * avisos al día y bloqueo.
 */
export function WhatsappNumbersCard({
  code,
  numbers,
}: {
  code: string;
  numbers: DesktopWhatsappNumber[];
}) {
  const { data: settings } = useGetDesktopAdminSettingsQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">WhatsApp</CardTitle>
        <CardDescription>
          Avisos que recibe cada negocio de esta instalación y su límite al día
        </CardDescription>
      </CardHeader>
      <CardContent>
        {numbers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este cliente todavía no ha activado los avisos por WhatsApp.
          </p>
        ) : (
          <ul className="flex flex-col">
            {numbers.map((number) => (
              <WhatsappNumberRow
                key={`${number.id}:${number.dailyLimit}`}
                code={code}
                number={number}
                generalLimit={settings?.whatsappDailyLimit}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
