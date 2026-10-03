"use client";

import { CheckCircle2, Copy, KeyRound, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toastError, toastSuccess } from "@/lib/toast";
import { buildWhatsAppMessage, formatDay } from "@/lib/desktop-licenses";
import type { DesktopInstallation } from "@/lib/types/desktop-licenses";

async function copyText(text: string, successTitle: string) {
  try {
    await navigator.clipboard.writeText(text);
    toastSuccess({ title: successTitle });
  } catch {
    toastError({
      title: "No se pudo copiar",
      description: "Selecciona el texto y cópialo a mano.",
    });
  }
}

/**
 * Código de renovación (la licencia firmada) para el cliente sin internet. Con
 * internet el escritorio la recoge solo; aquí solo se copia para mandarla.
 */
export function LicenseCodeCard({
  installation,
  justRenewed,
}: {
  installation: Pick<
    DesktopInstallation,
    "licenseText" | "expiresOn" | "licenseSeq" | "ownerName"
  >;
  /** Recién registrado un pago: se resalta el vencimiento nuevo. */
  justRenewed: boolean;
}) {
  const { licenseText, expiresOn, licenseSeq, ownerName } = installation;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
            <KeyRound className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">
              Código de licencia
            </CardTitle>
            <CardDescription>
              Si el PC tiene internet, la licencia le llega sola. Sin internet,
              el dueño pega este código en Negora → Licencia.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!licenseText ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay licencia emitida. Registra un pago para generar el
            código.
          </p>
        ) : (
          <>
            {justRenewed && expiresOn ? (
              <div className="flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>
                  Licencia renovada hasta el{" "}
                  <span className="font-semibold">{formatDay(expiresOn)}</span>.
                  Copia el mensaje y mándaselo al cliente por WhatsApp.
                </span>
              </div>
            ) : null}

            <Textarea
              readOnly
              aria-label="Código de licencia"
              value={licenseText}
              rows={4}
              className="resize-none break-all font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />

            <p className="text-xs text-muted-foreground">
              Válida hasta el {formatDay(expiresOn)} · emisión nº {licenseSeq}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => copyText(licenseText, "Código copiado")}
              >
                <Copy className="size-4" />
                Copiar código
              </Button>
              <Button
                type="button"
                disabled={!expiresOn}
                onClick={() =>
                  expiresOn &&
                  copyText(
                    buildWhatsAppMessage({ ownerName, expiresOn, licenseText }),
                    "Mensaje copiado",
                  )
                }
              >
                <MessageCircle className="size-4" />
                Copiar mensaje para WhatsApp
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
