"use client";

import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, Pencil, Plus } from "lucide-react";

import { useGetAllPlansForAdmin } from "@/hooks/use-plans";
import type { PlanResponse } from "@/lib/types/plans";
import { PLAN_FEATURES } from "@/lib/plan-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Un tope sin valor es "sin límite"; mostrarlo vacío se leería como cero. */
function formatLimit(value: number | null): string {
  return value === null ? "Sin límite" : String(value);
}

function countGrantedFeatures(plan: PlanResponse): number {
  if (!plan.features) return 0;
  return PLAN_FEATURES.filter((f) => plan.features?.[f.key] === true).length;
}

export default function AdminPlansPage() {
  const { data, isPending, isError } = useGetAllPlansForAdmin();
  const plans: PlanResponse[] = data?.data ?? [];

  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/assign-plans"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Planes</h1>
            <p className="text-muted-foreground">
              Define qué ofrece cada plan, sus límites y su precio
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/assign-plans/create">
            <Plus className="mr-2 h-4 w-4" />
            Crear plan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <BadgeDollarSign className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-card-foreground">Catálogo de planes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="py-4 text-sm text-destructive">
              No se pudo cargar el catálogo de planes.
            </p>
          ) : plans.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Aún no hay planes. Crea el primero para poder asignarlo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Negocios</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Incluye</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-card-foreground">{plan.name}</span>
                          <span className="text-xs text-muted-foreground">{plan.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span>
                            {plan.priceMonthly} {plan.currency}/mes
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {plan.priceYearly} {plan.currency}/año
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatLimit(plan.maxProducts)}</TableCell>
                      <TableCell className="text-sm">{formatLimit(plan.maxBusinesses)}</TableCell>
                      <TableCell className="text-sm">{formatLimit(plan.maxWorkers)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {countGrantedFeatures(plan)} de {PLAN_FEATURES.length}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={plan.isActive ? "default" : "secondary"}>
                            {plan.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                          {!plan.isPublic && <Badge variant="outline">Oculto</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/admin/plans/edit?id=${plan.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
