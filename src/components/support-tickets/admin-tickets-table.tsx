"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import type {
  SupportTicket,
  SupportTicketStatus,
} from "@/lib/types/support-ticket";
import {
  createAdminTicketsColumns,
} from "./admin-tickets-table-columns";
import { type TicketsColumnMeta } from "./my-tickets-table-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): TicketsColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as TicketsColumnMeta;
  }
  return {};
}

/** Valor para "todos" en el filtro de estado (Tabs no admite value vacío). */
const ALL_STATUS = "all" as const;

const STATUS_TABS: { value: SupportTicketStatus | typeof ALL_STATUS; label: string }[] = [
  { value: ALL_STATUS, label: "Todos" },
  { value: "open", label: "Abiertos" },
  { value: "in_progress", label: "En progreso" },
  { value: "closed", label: "Cerrados" },
];

interface AdminTicketsTableProps {
  tickets: SupportTicket[];
  total: number;
  page: number;
  limit: number;
  status?: SupportTicketStatus;
  isFetching?: boolean;
  onStatusChange: (status?: SupportTicketStatus) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function AdminTicketsTable({
  tickets,
  total,
  page,
  limit,
  status,
  isFetching = false,
  onStatusChange,
  onPageChange,
  onLimitChange,
}: AdminTicketsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const columns = React.useMemo(() => createAdminTicketsColumns(), []);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: tickets,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    onSortingChange: setSorting,
    state: { sorting },
  });

  const isEmpty = total === 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="border-b border-border px-4 py-3">
          <Tabs
            value={status ?? ALL_STATUS}
            onValueChange={(value) =>
              onStatusChange(
                value === ALL_STATUS
                  ? undefined
                  : (value as SupportTicketStatus),
              )
            }
          >
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isEmpty ? (
          <div className="px-4 py-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LifeBuoy />
                </EmptyMedia>
                <EmptyTitle>Sin tickets</EmptyTitle>
                <EmptyDescription>
                  No hay tickets que coincidan con el filtro seleccionado.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="relative">
            {isFetching ? (
              <div
                className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando…</span>
                </div>
              </div>
            ) : null}
            <div
              className={cn(
                "transition-opacity",
                isFetching && "pointer-events-none opacity-60 select-none",
              )}
              aria-busy={isFetching}
            >
              <Table id="admin-tickets-table" className="min-w-[820px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "px-4 py-3 text-foreground",
                            columnMeta(header.column).headerClassName,
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "px-4 py-3 text-foreground",
                            columnMeta(cell.column).cellClassName,
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!isEmpty ? (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {tickets.length}
              </span>{" "}
              de <span className="font-medium text-foreground">{total}</span>
              {totalPages > 1 ? (
                <>
                  {" "}
                  — Página{" "}
                  <span className="font-medium text-foreground">{page}</span> de{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </>
              ) : null}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <PageSizeSelect
                value={limit}
                onChange={onLimitChange}
                disabled={isFetching}
              />
              {totalPages > 1 ? (
                <DataTablePaginationNav
                  pageIndex={page - 1}
                  pageCount={totalPages}
                  onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                  navLabel="Paginación de tickets"
                  disabled={isFetching}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
