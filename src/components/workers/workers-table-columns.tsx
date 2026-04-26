"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  PERMISSION_MODULE_LABELS,
  ROLE_PRESET_LABELS,
  countModulesWithAccess,
  listModulesWithAccess,
  type Worker,
} from "@/lib/types/worker";

export type WorkersColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies WorkersColumnMeta;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function WorkerSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<Worker, unknown>;
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

export function createWorkersColumns(
  onDelete: (worker: Worker) => void | Promise<void>,
): ColumnDef<Worker>[] {
  return [
    {
      id: "trabajador",
      accessorFn: (row) => row.fullName ?? row.email ?? row.phone ?? "",
      meta: {
        headerClassName: "min-w-[220px]",
        cellClassName: "min-w-[220px]",
      } satisfies WorkersColumnMeta,
      header: ({ column }) => (
        <WorkerSortableHeader column={column} label="Trabajador" />
      ),
      cell: ({ row }) => {
        const worker = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {worker.avatar ? (
                <AvatarImage src={worker.avatar} alt={worker.fullName ?? ""} />
              ) : null}
              <AvatarFallback>{getInitials(worker.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {worker.fullName ?? "Sin nombre"}
              </span>
              {worker.email ? (
                <span className="truncate text-xs text-muted-foreground">
                  {worker.email}
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "phone",
      accessorFn: (row) => row.phone ?? "",
      meta: compactColumnMeta,
      header: () => (
        <span className="font-medium text-foreground">Teléfono</span>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {row.original.phone ?? "--"}
        </span>
      ),
    },
    {
      id: "rol",
      accessorFn: (row) => row.rolePreset,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <WorkerSortableHeader column={column} label="Rol" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {ROLE_PRESET_LABELS[row.original.rolePreset]}
        </Badge>
      ),
    },
    {
      id: "modulos",
      accessorFn: (row) => countModulesWithAccess(row.permissions),
      meta: {
        headerClassName: "min-w-[200px]",
        cellClassName: "min-w-[200px]",
      } satisfies WorkersColumnMeta,
      header: () => (
        <span className="font-medium text-foreground">Módulos con acceso</span>
      ),
      cell: ({ row }) => {
        const modules = listModulesWithAccess(row.original.permissions);
        if (modules.length === 0) {
          return <span className="text-xs text-muted-foreground">Sin acceso</span>;
        }
        const visible = modules.slice(0, 2);
        const remaining = modules.length - visible.length;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {visible.map((module) => (
              <Badge
                key={module}
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
              >
                {PERMISSION_MODULE_LABELS[module]}
              </Badge>
            ))}
            {remaining > 0 ? (
              <Badge variant="secondary" className="text-xs">
                +{remaining}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "creado",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      meta: compactColumnMeta,
      header: ({ column }) => (
        <WorkerSortableHeader column={column} label="Creado" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies WorkersColumnMeta,
      header: () => (
        <div className="text-right font-medium text-foreground">Acciones</div>
      ),
      cell: ({ row }) => {
        const worker = row.original;
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
                <Link
                  href={`/dashboard/business/workers/${worker.id}`}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <Eye className="size-4 text-blue-500 dark:text-blue-400" />
                  Ver detalles
                </Link>
                <Link
                  href={`/dashboard/business/workers/${worker.id}/edit`}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <Pencil className="size-4 text-amber-500 dark:text-amber-400" />
                  Editar
                </Link>
                <DeleteDialog
                  deleteType="Trabajador"
                  name={worker.fullName ?? "Sin nombre"}
                  onConfirm={() => onDelete(worker)}
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
