"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Loader2, Store } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NegoraLogo } from "@/components/brand/negora-logo";
import { getMyBusinessesList } from "@/lib/api/business";
import { getAllBusinessWorkers } from "@/lib/api/worker";
import { getAllInvitations } from "@/lib/api/invitation";
import { getAllPlans } from "@/lib/api/plans";
import { useSelectPlanMutation } from "@/hooks/use-plans";
import type { BillingPeriod, PlanResponse } from "@/lib/types/plans";
import { planToCatalogEntry } from "@/lib/plan-catalog";
import { applySelectedPlanToSession } from "@/lib/plan-session";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Tope asumido si no se puede consultar el plan destino: el del plan Básico. */
const FALLBACK_MAX_BUSINESSES = 1;

function ReconcileInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billingPeriod = (searchParams.get("billing") as BillingPeriod) || "monthly";
  const planId = searchParams.get("planId");

  const selectPlan = useSelectPlanMutation();
  const [chosenIds, setChosenIds] = useState<string[] | null>(null);

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => getMyBusinessesList(),
  });

  const { data: plansData } = useQuery({
    queryKey: ["all-plans"],
    queryFn: () => getAllPlans(),
  });

  // El plan destino dice cuántos negocios caben. Antes esta pantalla daba por
  // hecho que siempre era uno, porque el único downgrade posible era a Básico.
  const targetPlan = useMemo(() => {
    const plans: PlanResponse[] = plansData?.data ?? [];
    const match = planId ? plans.find((p) => p.id === planId) : undefined;
    return match ? planToCatalogEntry(match) : null;
  }, [plansData, planId]);

  const maxBusinesses = targetPlan?.maxBusinesses ?? FALLBACK_MAX_BUSINESSES;
  const planName = targetPlan?.name ?? "Básico";
  // Si el plan destino conserva la gestión de equipo, el aviso no debe anunciar
  // suspensiones que no van a ocurrir.
  const keepsTeam = targetPlan?.grantedFeatures.team === true;

  const activeBusinesses = useMemo(
    () => businesses.filter((b) => b.status !== "archived"),
    [businesses],
  );

  // Si no hay excedente, no hay nada que reconciliar: volver al paywall.
  useEffect(() => {
    if (!isLoading && activeBusinesses.length <= maxBusinesses) {
      router.replace("/seleccionar-plan");
    }
  }, [isLoading, activeBusinesses.length, maxBusinesses, router]);

  // Selección por defecto: los primeros que caben, como sugerencia.
  // TODO(backend): exponer una métrica de actividad para preseleccionar los más usados.
  const keepBusinessIds = useMemo(
    () =>
      chosenIds ?? activeBusinesses.slice(0, maxBusinesses).map((b) => b.id),
    [chosenIds, activeBusinesses, maxBusinesses],
  );

  /**
   * Al marcar un negocio por encima del tope se descarta el más antiguo de la
   * selección, en lugar de bloquear el clic sin explicación.
   */
  function toggleBusiness(businessId: string) {
    const current = keepBusinessIds;
    if (current.includes(businessId)) {
      // Con un solo hueco, desmarcar dejaría la selección vacía: se trata como
      // un cambio de elección, no como un descarte.
      if (maxBusinesses === 1) return;
      setChosenIds(current.filter((id) => id !== businessId));
      return;
    }
    const next = [...current, businessId];
    setChosenIds(next.slice(Math.max(0, next.length - maxBusinesses)));
  }

  // Conteo de trabajadores e invitaciones pendientes a través de los negocios
  // activos, para mostrar el impacto exacto del downgrade.
  const { data: impact } = useQuery({
    queryKey: ["downgrade-impact", activeBusinesses.map((b) => b.id).join(",")],
    enabled: activeBusinesses.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        activeBusinesses.map(async (b) => {
          const [workers, invitations] = await Promise.all([
            getAllBusinessWorkers({ businessId: b.id, limit: 1 }).catch(() => null),
            getAllInvitations({ businessId: b.id, limit: 100 }).catch(() => null),
          ]);
          const workerCount = workers?.meta?.total ?? 0;
          const pendingInvites =
            invitations?.data?.filter((i) => !i.used && !i.canceled).length ?? 0;
          return { workerCount, pendingInvites };
        }),
      );
      return results.reduce(
        (acc, r) => ({
          workers: acc.workers + r.workerCount,
          invites: acc.invites + r.pendingInvites,
        }),
        { workers: 0, invites: 0 },
      );
    },
  });

  const archivedCount = Math.max(
    0,
    activeBusinesses.length - keepBusinessIds.length,
  );

  async function handleConfirm() {
    if (keepBusinessIds.length === 0) return;
    try {
      const res = await selectPlan.mutateAsync({
        ...(planId ? { planId } : { planType: "basic" as const }),
        billingPeriod,
        keepBusinessIds,
      });
      applySelectedPlanToSession({
        type: res.data?.type,
        name: res.data?.name,
        expireDate: res.data?.expireDate,
      });
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }
      toastSuccess({
        title: `Plan ${planName} activado`,
        description:
          archivedCount === 1
            ? "Conservamos los negocios que elegiste; el otro quedó archivado."
            : "Conservamos los negocios que elegiste; el resto quedó archivado.",
      });
      router.replace("/dashboard");
    } catch {
      toastError({
        title: "No se pudo aplicar el cambio",
        description: "Inténtalo de nuevo en unos momentos.",
      });
    }
  }

  const isSingleChoice = maxBusinesses === 1;

  return (
    <div className="flex min-h-svh flex-col items-center bg-background px-4 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <button
          type="button"
          onClick={() => router.push("/seleccionar-plan")}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a los planes
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <NegoraLogo className="h-12 w-12 rounded-xl" />
          <h1 className="text-2xl font-bold text-foreground">
            {isSingleChoice
              ? "Elige el negocio que seguirás gestionando"
              : "Elige los negocios que seguirás gestionando"}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            El plan {planName} incluye {maxBusinesses}{" "}
            {maxBusinesses === 1 ? "negocio" : "negocios"}. Selecciona{" "}
            {isSingleChoice ? "cuál quieres mantener activo" : "cuáles quieres mantener activos"}.
            Los demás quedarán archivados (no se borran) y los recuperas al
            instante si vuelves a un plan superior.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tus negocios</CardTitle>
            <CardDescription>
              {isSingleChoice
                ? `Solo uno puede quedar activo en ${planName}.`
                : `Hasta ${maxBusinesses} pueden quedar activos en ${planName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activeBusinesses.map((business) => {
              const selected = keepBusinessIds.includes(business.id);
              return (
                <button
                  type="button"
                  key={business.id}
                  onClick={() => toggleBusiness(business.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Store className="size-4" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {business.name}
                    </span>
                    {business.address && (
                      <span className="text-xs text-muted-foreground">
                        {business.address}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-primary" : "border-muted-foreground/40",
                    )}
                  >
                    {selected && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium">Esto ocurrirá al confirmar:</p>
          </div>
          <ul className="ml-6 list-disc text-sm">
            <li>
              {archivedCount} {archivedCount === 1 ? "negocio quedará" : "negocios quedarán"}{" "}
              archivado{archivedCount === 1 ? "" : "s"} en solo lectura (datos intactos).
            </li>
            {!keepsTeam && (
              <>
                <li>
                  Se suspenderá el acceso de {impact?.workers ?? "…"}{" "}
                  {impact?.workers === 1 ? "trabajador" : "trabajadores"} (sus cuentas se conservan).
                </li>
                <li>
                  Se cancelarán {impact?.invites ?? "…"}{" "}
                  {impact?.invites === 1 ? "invitación pendiente" : "invitaciones pendientes"}.
                </li>
              </>
            )}
          </ul>
          <p className="ml-6 text-sm">
            Todo se restaura automáticamente si vuelves a un plan que lo incluya.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleConfirm}
          disabled={keepBusinessIds.length === 0 || selectPlan.isPending}
          className="w-full cursor-pointer"
        >
          {selectPlan.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Aplicando…
            </>
          ) : (
            `Confirmar y pasar a ${planName}`
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ReconcilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ReconcileInner />
    </Suspense>
  );
}
