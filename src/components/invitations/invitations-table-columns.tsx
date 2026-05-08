"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteDialog } from "@/components/delete-dialog";
import type { Invitation } from "@/lib/types/invitation";
import InvitationDetailsDialog from "./invitation-details-dialog";

export type InvitationsColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies InvitationsColumnMeta;

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

function InvitationSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<Invitation, unknown>;
  label: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "-ml-2 h-8 px-2 lg:-ml-4"}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  );
}

export function createInvitationsColumns(
  onDeleteInvitation: (invitationId: string) => void | Promise<void>,
  now: number,
): ColumnDef<Invitation>[] {
  return [
    {
      id: "invitado",
      accessorFn: (row) => row.name ?? row.email ?? "",
      meta: {
        headerClassName: "min-w-[220px]",
        cellClassName: "min-w-[220px]",
      } satisfies InvitationsColumnMeta,
      header: ({ column }) => (
        <InvitationSortableHeader column={column} label="Invitado" />
      ),
      cell: ({ row }) => {
        const invitation = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(invitation.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {invitation.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {invitation.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "cargo",
      accessorFn: (row) => row.job ?? "",
      meta: compactColumnMeta,
      header: ({ column }) => (
        <InvitationSortableHeader column={column} label="Cargo" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.job}
        </Badge>
      ),
    },
    {
      id: "estado",
      accessorFn: (row) =>
        new Date(row.expirationDate).getTime() < now ? "expirada" : "pendiente",
      meta: compactColumnMeta,
      header: ({ column }) => (
        <InvitationSortableHeader column={column} label="Estado" />
      ),
      cell: ({ row }) => {
        const isExpired =
          new Date(row.original.expirationDate).getTime() < now;
        if (isExpired) {
          return (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground border-border text-xs"
            >
              Expirada
            </Badge>
          );
        }
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs"
          >
            Pendiente
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies InvitationsColumnMeta,
      header: () => (
        <div className="text-right font-medium text-foreground">Acciones</div>
      ),
      cell: ({ row }) => {
        const invitation = row.original;
        const displayName = invitation.name ?? invitation.email ?? "Invitación";
        return (
          <div className="flex justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Abrir acciones"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-1">
                <InvitationDetailsDialog
                  invitation={invitation}
                  trigger={
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <Eye className="size-4 text-blue-500 dark:text-blue-400" />
                      Ver detalles
                    </button>
                  }
                />
                <DeleteDialog
                  deleteType="Invitación"
                  name={displayName}
                  onConfirm={() => onDeleteInvitation(invitation.id)}
                  trigger={
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-muted"
                    >
                      <Trash2 className="size-4 shrink-0 text-destructive" />
                      Eliminar
                    </button>
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      },
    },
  ];
}
