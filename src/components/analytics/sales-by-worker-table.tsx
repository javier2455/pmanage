"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { cn } from "@/lib/utils";
import type { WorkerSalesItem } from "@/lib/types/analytics";
import {
  createSalesByWorkerColumns,
  type SalesByWorkerColumnMeta,
} from "./sales-by-worker-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): SalesByWorkerColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as SalesByWorkerColumnMeta;
  }
  return {};
}

interface SalesByWorkerTableProps {
  data: WorkerSalesItem[];
  isLoading?: boolean;
  isFetching?: boolean;
}

export function SalesByWorkerTable({
  data,
  isLoading = false,
  isFetching = false,
}: SalesByWorkerTableProps) {
  const columns = React.useMemo(() => createSalesByWorkerColumns(), []);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "totalSales", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.workerId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  if (isLoading) {
    return <SimpleTableSkeleton />;
  }

  const isEmpty = data.length === 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        {isEmpty ? (
          <div className="px-4 py-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>Sin trabajadores registrados</EmptyTitle>
                <EmptyDescription>
                  Aún no hay ventas registradas por trabajadores en este
                  período. Cambia el período o registra ventas para ver el
                  desempeño aquí.
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
              <Table id="sales-by-worker-table" className="min-w-[760px]">
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
      </CardContent>
    </Card>
  );
}
