"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeftRight, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { currencyLabel } from "@/lib/currency";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";

import type {
  FinancialTransaction,
  FinancialTransactionsResponse,
} from "@/lib/types/financial-transaction";
import {
  createTransactionsColumns,
  type TransactionsColumnMeta,
} from "./transactions-table-columns";

/** Valor del selector para "sin filtro de moneda" (Radix no admite value=""). */
const ALL_CURRENCIES = "all";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): TransactionsColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as TransactionsColumnMeta;
  }
  return {};
}

interface TransactionsTableProps {
  transactions: FinancialTransaction[];
  meta: FinancialTransactionsResponse["meta"];
  /** Monedas operables del negocio (CUP + las que tienen tasa). */
  availableCurrencies: string[];
  /** Moneda filtrada; `""` = todas. */
  currency: string;
  onCurrencyChange: (currency: string) => void;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function TransactionsTable({
  transactions,
  meta,
  availableCurrencies,
  currency,
  onCurrencyChange,
  isFetching = false,
  onPageChange,
  onLimitChange,
}: TransactionsTableProps) {
  const columns = React.useMemo(() => createTransactionsColumns(), []);

  const table = useReactTable({
    data: transactions,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
  });

  const isEmpty = meta.total === 0;
  const hasFilter = currency !== "";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Label htmlFor="tx-currency" className="text-sm text-muted-foreground">
            Moneda
          </Label>
          <Select
            value={currency || ALL_CURRENCIES}
            onValueChange={(v) =>
              onCurrencyChange(v === ALL_CURRENCIES ? "" : v)
            }
            disabled={isFetching}
          >
            <SelectTrigger id="tx-currency" size="sm" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CURRENCIES}>Todas</SelectItem>
              {availableCurrencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {currencyLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEmpty ? (
          <div className="px-4 pb-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ArrowLeftRight />
                </EmptyMedia>
                <EmptyTitle>Sin transacciones</EmptyTitle>
                <EmptyDescription>
                  {hasFilter
                    ? `No hay transacciones en ${currencyLabel(currency)}. Prueba con otra moneda.`
                    : "Aún no se han registrado transacciones para este negocio."}
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
              <Table id="transactions-table" className="min-w-[600px]">
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
              {transactions.length}
            </span>{" "}
            de <span className="font-medium text-foreground">{meta.total}</span>{" "}
            transacci{meta.total === 1 ? "ón" : "ones"}
            {meta.totalPages > 1 ? (
              <>
                {" "}— Página{" "}
                <span className="font-medium text-foreground">{meta.page}</span>{" "}
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
                navLabel="Paginación de transacciones"
                disabled={isFetching}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
