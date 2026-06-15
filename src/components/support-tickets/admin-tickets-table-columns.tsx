"use client";

import { useState } from "react";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SupportTicket } from "@/lib/types/support-ticket";
import { TicketStatusBadge } from "./ticket-status-badge";
import { CloseTicketDialog } from "./close-ticket-dialog";
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
      cell: ({ row }) => <AdminTicketActionsCell ticket={row.original} />,
    },
  ];
}

function AdminTicketActionsCell({ ticket }: { ticket: SupportTicket }) {
  const [closeOpen, setCloseOpen] = useState(false);
  const isClosed = ticket.status === "closed";

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
          <button
            type="button"
            disabled={isClosed}
            onClick={() => setCloseOpen(true)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="size-4 text-emerald-600" />
            {isClosed ? "Ticket cerrado" : "Cerrar ticket"}
          </button>
        </PopoverContent>
      </Popover>
      <CloseTicketDialog
        ticketId={ticket.id}
        ticketSubject={ticket.subject}
        open={closeOpen}
        onOpenChange={setCloseOpen}
      />
    </div>
  );
}
