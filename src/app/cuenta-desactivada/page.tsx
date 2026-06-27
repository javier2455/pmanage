"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, LogOut, RotateCcw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NegoraLogo } from "@/components/brand/negora-logo";
import { useAuthUserData } from "@/hooks/use-auth";
import { useReactivateAccountMutation } from "@/hooks/use-user";
import { clearSession } from "@/lib/session";
import { setDeactivatedCookie } from "@/lib/cookies";
import { toastError, toastSuccess } from "@/lib/toast";

/** Días de gracia antes del borrado definitivo (USER_DEACTIVATION_DAYS). */
const GRACE_DAYS = 15;

function daysRemaining(deactivatedAt: string | null | undefined): number | null {
  if (!deactivatedAt) return null;
  const start = new Date(deactivatedAt).getTime();
  if (Number.isNaN(start)) return null;
  const deadline = start + GRACE_DAYS * 24 * 60 * 60 * 1000;
  const diffMs = deadline - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export default function ReactivationPage() {
  const router = useRouter();
  const { data: user, isLoading } = useAuthUserData();
  const reactivateMutation = useReactivateAccountMutation();
  const [isLeaving, setIsLeaving] = useState(false);

  // Si /auth/me indica que la cuenta ya no está desactivada, no hay nada que
  // reactivar: limpiamos la cookie y volvemos al dashboard.
  useEffect(() => {
    if (!isLoading && user && !user.deactivatedAt) {
      setDeactivatedCookie(null);
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const remaining = useMemo(
    () => daysRemaining(user?.deactivatedAt),
    [user?.deactivatedAt],
  );

  async function handleReactivate() {
    try {
      await reactivateMutation.mutateAsync();
      toastSuccess({
        title: "Cuenta reactivada",
        description: "Tu cuenta y tus negocios vuelven a estar activos.",
      });
      router.replace("/dashboard");
    } catch {
      toastError({
        title: "No se pudo reactivar",
        description: "Inténtalo de nuevo en unos momentos.",
      });
    }
  }

  async function handleLogout() {
    setIsLeaving(true);
    await clearSession();
    router.push("/login");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <NegoraLogo className="h-12 w-12 rounded-xl" />
          <div className="flex flex-col items-center gap-1 text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Tu cuenta está desactivada
            </CardTitle>
            <CardDescription>
              Reactívala para volver a usar Negora con normalidad.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-4">
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                {isLoading
                  ? "Comprobando el estado de tu cuenta…"
                  : remaining !== null && remaining > 0
                    ? `Quedan ${remaining} día${remaining === 1 ? "" : "s"} para que tus datos se borren de forma permanente.`
                    : "El plazo para reactivar tu cuenta ha vencido."}
              </p>
            </div>
            <p className="ml-6 text-sm">
              Mientras esté desactivada no puedes acceder a tus negocios. Pasado
              el plazo de {GRACE_DAYS} días, tu cuenta y todos tus datos se
              eliminarán y no podrás recuperarlos.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleReactivate}
            disabled={reactivateMutation.isPending || isLeaving || isLoading}
            className="w-full cursor-pointer"
          >
            {reactivateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reactivando…
              </>
            ) : (
              <>
                <RotateCcw className="size-4" />
                Reactivar mi cuenta
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={reactivateMutation.isPending || isLeaving}
            className="w-full cursor-pointer"
          >
            {isLeaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Cerrando sesión…
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                Cerrar sesión
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
