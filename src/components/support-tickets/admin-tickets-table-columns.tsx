"use client";

import Link from "next/link";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SupportTicket } from "@/lib/types/support-ticket";
import { TicketStatusBadge } from "./ticket-status-badge";
import {
  formatTicketDate,
  type TicketsColumnMeta,
} from "./my-tickets-table-columns";

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies TicketsColumnMeta;

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

export function createAdminTicketsColumns(): ColumnDef<SupportTicket>[] {
  return [
    {
      id: "subject",
      accessorFn: (row) => row.subject,
      header: ({ column }) => (
        <TicketsSortableHeader column={column} label="Asunto" />
      ),
      meta: {
        headerClassName: "min-w-[220px]",
        cellClassName: "min-w-[220px] max-w-[340px]",
      } satisfies TicketsColumnMeta,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.subject}
        </span>
      ),
    },
    {
      id: "user",
      accessorFn: (row) => row.userEmail,
      header: ({ column }) => (
        <TicketsSortableHeader column={column} label="Usuario" />
      ),
      meta: {
        headerClassName: "min-w-[180px]",
        cellClassName: "min-w-[180px]",
      } satisfies TicketsColumnMeta,
      cell: ({ row }) => (
        <div className="flex flex-col">
          {row.original.userName ? (
            <span className="text-foreground">{row.original.userName}</span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {row.original.userEmail}
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
      id: "assignment",
      accessorFn: (row) => row.assignedAdminName ?? (row.assignedAdminId ? "" : "~"),
      meta: compactColumnMeta,
      header: ({ column }) => (
        <TicketsSortableHeader column={column} label="Asignado a" />
      ),
      cell: ({ row }) =>
        row.original.assignedAdminId ? (
          <span className="text-foreground">
            {row.original.assignedAdminName ?? "Asignado"}
          </span>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Sin asignar
          </Badge>
        ),
    },
    {
      id: "lastMessage",
      accessorFn: (row) => row.lastMessageAt ?? row.createdAt,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <TicketsSortableHeader column={column} label="Últ. actividad" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatTicketDate(row.original.lastMessageAt ?? row.original.createdAt)}
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
            <Link href={`/dashboard/admin/support/details?id=${row.original.id}`}>
              <MessageSquareReply className="size-4" />
              Ver / responder
            </Link>
          </Button>
        </div>
      ),
    },
  ];
}
