"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Worker } from "@/lib/types/worker";

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

export function createWorkersColumns(): ColumnDef<Worker>[] {
  return [
    {
      id: "trabajador",
      accessorFn: (row) => row.name ?? row.email ?? row.phone ?? "",
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
                <AvatarImage src={worker.avatar} alt={worker.name ?? ""} />
              ) : null}
              <AvatarFallback>{getInitials(worker.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {worker.name ?? "Sin nombre"}
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
      accessorFn: (row) => row.rol ?? "",
      meta: compactColumnMeta,
      header: ({ column }) => (
        <WorkerSortableHeader column={column} label="Rol" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.rol ?? "—"}
        </Badge>
      ),
    },
    {
      id: "permisos",
      accessorFn: (row) => row.permissions.length,
      meta: compactColumnMeta,
      header: () => (
        <span className="font-medium text-foreground">Permisos</span>
      ),
      cell: ({ row }) => {
        const count = row.original.permissions.length;
        if (count === 0) {
          return <span className="text-xs text-muted-foreground">Sin acceso</span>;
        }
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
          >
            {count} {count === 1 ? "permiso" : "permisos"}
          </Badge>
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
  ];
}
