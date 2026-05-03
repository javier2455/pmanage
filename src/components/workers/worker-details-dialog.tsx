"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGetWorkerByIdQuery } from "@/hooks/use-workers";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string | null) {
  if (!name) return "TR";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface WorkerDetailsDialogProps {
  workerId: string;
  tooltip?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function WorkerDetailsDialog({
  workerId,
  tooltip,
  trigger,
  open,
  onOpenChange,
}: WorkerDetailsDialogProps) {
  const { data, isLoading } = useGetWorkerByIdQuery(
    open === false ? "" : workerId,
  );

  const worker = data?.data;

  const triggerContent = trigger ?? (
    <Button variant="outline">Ver detalles</Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {tooltip ? (
          <span className="inline-flex">
            <Tooltip>
              <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </span>
        ) : (
          triggerContent
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[520px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Detalles del trabajador
          </DialogTitle>
        </DialogHeader>

        {isLoading || !worker ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col mt-4">
            <div className="flex items-center gap-3 border-b border-border py-4">
              <Avatar size="lg">
                {worker.avatar ? (
                  <AvatarImage src={worker.avatar} alt={worker.name ?? ""} />
                ) : null}
                <AvatarFallback>{getInitials(worker.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-card-foreground">
                  {worker.name ?? "Sin nombre"}
                </span>
                {worker.email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {worker.email}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Teléfono
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {worker.phone ?? "--"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Cargo
              </span>
              <Badge variant="secondary" className="text-xs">
                {worker.rol ?? "—"}
              </Badge>
            </div>

            {worker.business?.name ? (
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm font-medium text-card-foreground">
                  Negocio
                </span>
                <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                  {worker.business.name}
                </span>
              </div>
            ) : null}

            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Permisos
              </span>
              <div className="flex max-w-[60%] flex-wrap justify-end gap-1.5">
                {worker.permissions.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Sin acceso
                  </span>
                ) : (
                  worker.permissions.map((permission) => (
                    <Badge
                      key={permission}
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
                    >
                      {permission}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Fecha de creación
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {formatDate(worker.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-medium text-card-foreground">
                Última actualización
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {formatDate(worker.updatedAt)}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
