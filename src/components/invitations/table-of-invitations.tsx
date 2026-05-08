"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import { sileo } from "sileo";
import { Loader2, MailX } from "lucide-react";

import { useDeleteInvitationMutation } from "@/hooks/use-invitations";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  Invitation,
  InvitationsResponseInterface,
} from "@/lib/types/invitation";
import {
  createInvitationsColumns,
  type InvitationsColumnMeta,
} from "./invitations-table-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): InvitationsColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as InvitationsColumnMeta;
  }
  return {};
}

interface TableOfInvitationsProps {
  invitations: Invitation[];
  meta: InvitationsResponseInterface["meta"];
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function TableOfInvitations({
  invitations,
  meta,
  isFetching = false,
  onPageChange,
  onLimitChange,
}: TableOfInvitationsProps) {
  const deleteInvitationMutation = useDeleteInvitationMutation();

  const handleDeleteInvitation = React.useCallback(
    async (invitationId: string) => {
      try {
        await deleteInvitationMutation.mutateAsync(invitationId);
        sileo.success({
          title: "Invitación eliminada",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: "La invitación se ha eliminado correctamente",
        });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          sileo.error({
            title: error.response?.data?.error ?? "Error",
            styles: { description: "text-[#dc2626]/90! text-[15px]!" },
            description: error.response.data.message,
          });
        } else {
          sileo.error({
            title: "Error al eliminar la invitación",
            fill: "",
            styles: {
              title: "text-white! text-[16px]! font-bold!",
              description: "text-white/90! text-[15px]!",
            },
            description: "Error al eliminar la invitación. Intenta de nuevo.",
          });
        }
      }
    },
    [deleteInvitationMutation],
  );

  const [now] = React.useState(() => Date.now());

  const columns = React.useMemo(
    () => createInvitationsColumns(handleDeleteInvitation, now),
    [handleDeleteInvitation, now],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: invitations,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
    onSortingChange: setSorting,
    state: { sorting },
  });

  const isEmpty = meta.total === 0;

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="flex flex-col gap-4 p-0">
          {isEmpty ? (
            <div className="px-4 pt-6 pb-6">
              <Empty className="border-border border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MailX />
                  </EmptyMedia>
                  <EmptyTitle>Sin invitaciones pendientes</EmptyTitle>
                  <EmptyDescription>
                    Aquí aparecerán las invitaciones que envíes al agregar
                    trabajadores a este negocio.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="relative pt-4">
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
                <Table id="invitations-table" className="min-w-[600px]">
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

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {invitations.length}
              </span>{" "}
              de{" "}
              <span className="font-medium text-foreground">{meta.total}</span>{" "}
              invitaci{meta.total === 1 ? "ón" : "ones"}
              {meta.totalPages > 1 ? (
                <>
                  {" "}— Página{" "}
                  <span className="font-medium text-foreground">
                    {meta.page}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {meta.totalPages}
                  </span>
                </>
              ) : null}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <PageSizeSelect
                value={meta.limit}
                onChange={onLimitChange}
                disabled={isFetching}
              />
              {meta.totalPages > 1 ? (
                <DataTablePaginationNav
                  pageIndex={meta.page - 1}
                  pageCount={meta.totalPages}
                  onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                  navLabel="Paginación de invitaciones"
                  disabled={isFetching}
                />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
