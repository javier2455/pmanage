"use client";

import Link from "next/link";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SupportTicket } from "@/lib/types/support-ticket";
import { TicketStatusBadge } from "./ticket-status-badge";

export type TicketsColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies TicketsColumnMeta;

export function formatTicketDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function TicketsSortableHeader({
  column,
  label,
}: {
  column: Column<SupportTicket, unknown>;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-2 h-8 px-2 lg:-ml-4"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  );
}

export function createMyTicketsColumns(): ColumnDef<SupportTicket>[] {
  return [
    {
      id: "subject",
      accessorFn: (row) => row.subject,
      header: ({ column }) => (
        <TicketsSortableHeader column={column} label="Asunto" />
      ),
      meta: {
        headerClassName: "min-w-[240px]",
        cellClassName: "min-w-[240px] max-w-[360px]",
      } satisfies TicketsColumnMeta,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {row.original.subject}
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.message}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <TicketsSortableHeader column={column} label="Estado" />
      ),
      cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      accessorFn: (row) => row.createdAt,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <TicketsSortableHeader column={column} label="Creado" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatTicketDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies TicketsColumnMeta,
      header: () => (
        <div className="text-right font-medium text-foreground">Acciones</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/support/details?id=${row.original.id}`}>
              <Eye className="size-4" />
              Ver
            </Link>
          </Button>
        </div>
      ),
    },
  ];
}
