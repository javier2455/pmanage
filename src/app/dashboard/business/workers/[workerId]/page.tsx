"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Mail, Pencil, Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetWorkerById } from "@/hooks/use-workers";
import {
  PERMISSION_MODULES,
  PERMISSION_MODULE_LABELS,
  ROLE_PRESET_LABELS,
  isModuleEnabled,
} from "@/lib/types/worker";

interface WorkerDetailsPageProps {
  params: Promise<{ workerId: string }>;
}

function getInitials(fullName: string | null) {
  if (!fullName) return "TR";
  return fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function WorkerDetailsPage({ params }: WorkerDetailsPageProps) {
  const { workerId } = use(params);
  const { data: worker, isLoading, isError } = useGetWorkerById(workerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !worker) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/business/workers"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <p className="text-sm text-destructive">
          No se encontró el trabajador solicitado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/business/workers"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Detalles del trabajador
            </h1>
            <p className="text-muted-foreground">
              Información y permisos asignados
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/business/workers/${worker.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Información personal
            </CardTitle>
            <CardDescription>Datos del trabajador</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Avatar size="lg" className="h-24 w-24">
              {worker.avatar ? (
                <AvatarImage
                  src={worker.avatar}
                  alt={worker.fullName ?? ""}
                />
              ) : null}
              <AvatarFallback className="text-2xl">
                {getInitials(worker.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-foreground">
                {worker.fullName ?? "Sin nombre"}
              </span>
              <Badge variant="secondary" className="self-center text-xs">
                {ROLE_PRESET_LABELS[worker.rolePreset]}
              </Badge>
            </div>
            <div className="flex w-full flex-col gap-2 border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate text-foreground">
                  {worker.email ?? "Sin correo"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate text-foreground">
                  {worker.phone ?? "Sin teléfono"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-card-foreground">Permisos</CardTitle>
            <CardDescription>
              Módulos a los que tiene acceso este trabajador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <ul className="divide-y divide-border">
                {PERMISSION_MODULES.map((module) => {
                  const enabled = isModuleEnabled(worker.permissions, module);
                  return (
                    <li
                      key={module}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-card-foreground">
                        {PERMISSION_MODULE_LABELS[module]}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        {enabled ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="text-foreground">Habilitado</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Deshabilitado
                            </span>
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
