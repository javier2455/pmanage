"use client";

import * as React from "react";

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
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Invitation } from "@/lib/types/invitation";

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
  if (!name) return "IN";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface InvitationDetailsDialogProps {
  invitation: Invitation;
  tooltip?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function InvitationDetailsDialog({
  invitation,
  tooltip,
  trigger,
  open,
  onOpenChange,
}: InvitationDetailsDialogProps) {
  const triggerContent = trigger ?? (
    <Button variant="outline">Ver detalles</Button>
  );

  const [renderedAt] = React.useState(() => Date.now());
  const isExpired =
    new Date(invitation.expirationDate).getTime() < renderedAt;

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
            Detalles de la invitación
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col mt-4">
          <div className="flex items-center gap-3 border-b border-border py-4">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(invitation.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-card-foreground">
                {invitation.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {invitation.email}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm font-medium text-card-foreground">
              Teléfono
            </span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {invitation.phone ?? "--"}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm font-medium text-card-foreground">
              Cargo
            </span>
            <Badge variant="secondary" className="text-xs">
              {invitation.job}
            </Badge>
          </div>

          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm font-medium text-card-foreground">
              Estado
            </span>
            {isExpired ? (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground border-border text-xs"
              >
                Expirada
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs"
              >
                Pendiente
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm font-medium text-card-foreground">
              Expira
            </span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {formatDate(invitation.expirationDate)}
            </span>
          </div>

          {invitation.business?.name ? (
            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Negocio
              </span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                {invitation.business.name}
              </span>
            </div>
          ) : null}

          <div className="flex items-start justify-between border-b border-border py-4">
            <span className="text-sm font-medium text-card-foreground">
              Permisos
            </span>
            <div className="flex max-w-[60%] flex-wrap justify-end gap-1.5">
              {invitation.permissions.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Sin acceso
                </span>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
                >
                  {invitation.permissions.length}{" "}
                  {invitation.permissions.length === 1
                    ? "permiso"
                    : "permisos"}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <span className="text-sm font-medium text-card-foreground">
              Fecha de envío
            </span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {formatDate(invitation.createdAt)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
