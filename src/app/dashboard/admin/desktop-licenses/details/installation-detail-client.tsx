"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  formatInstallationCode,
  licenseErrorMessage,
} from "@/lib/desktop-licenses";
import {
  useGetDesktopInstallationQuery,
  useUpdateDesktopInstallationMutation,
} from "@/hooks/use-desktop-licenses";
import { InstallationInfoCard } from "@/components/desktop-licenses/installation-info-card";
import { InstallationNotesCard } from "@/components/desktop-licenses/installation-notes-card";
import { LicenseCodeCard } from "@/components/desktop-licenses/license-code-card";
import { RegisterPaymentCard } from "@/components/desktop-licenses/register-payment-card";
import { PaymentsCard } from "@/components/desktop-licenses/payments-card";
import { WhatsappNumbersCard } from "@/components/desktop-licenses/whatsapp-numbers-card";

const LIST_HREF = "/dashboard/admin/desktop-licenses";

export default function InstallationDetailClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const { data: installation, isLoading, isError } =
    useGetDesktopInstallationQuery(code);
  const updateMutation = useUpdateDesktopInstallationMutation();
  const [justRenewed, setJustRenewed] = useState(false);

  async function handleMarkReviewed() {
    try {
      await updateMutation.mutateAsync({ code, duplicateSuspected: false });
      toastSuccess({ title: "Marcada como revisada" });
    } catch (error) {
      toastError({
        title: "Error",
        description: licenseErrorMessage(
          error,
          "No se pudo actualizar la instalación. Intenta de nuevo.",
        ),
      });
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link
          href={LIST_HREF}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Volver a las licencias"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {installation?.businessName ?? "Licencia de escritorio"}
          </h1>
          <p className="font-mono text-muted-foreground">
            {formatInstallationCode(code)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !installation ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-center text-muted-foreground">
            No se encontró la instalación. Vuelve a la lista e inténtalo de
            nuevo.
          </p>
          <Link href={LIST_HREF} className="text-sm text-primary hover:underline">
            Volver a la lista
          </Link>
        </div>
      ) : (
        <>
          {installation.duplicateSuspected ? (
            <div className="flex flex-col gap-3 rounded-lg border border-orange-300 bg-orange-50 p-4 text-orange-900 sm:flex-row sm:items-center sm:justify-between dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">Posible duplicado:</span> este
                  código se ha conectado desde otro PC. Puede ser una copia de la
                  instalación o un cambio de equipo; habla con el cliente.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkReviewed}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Marcar como revisado
              </Button>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-6">
              <InstallationInfoCard installation={installation} />
              <InstallationNotesCard
                key={installation.notes ?? ""}
                code={code}
                notes={installation.notes}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              <LicenseCodeCard
                installation={installation}
                justRenewed={justRenewed}
              />
              <RegisterPaymentCard
                code={code}
                onRegistered={() => setJustRenewed(true)}
              />
            </div>
          </div>

          <PaymentsCard
            code={code}
            payments={installation.payments ?? []}
            onRemoved={() => setJustRenewed(false)}
          />

          <WhatsappNumbersCard
            code={code}
            numbers={installation.whatsappNumbers ?? []}
          />
        </>
      )}
    </section>
  );
}
