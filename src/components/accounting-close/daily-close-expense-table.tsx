"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { HandCoins, Search } from "lucide-react";
import type { ExpenseInAccountingClose } from "@/lib/types/accounting-close";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
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
import { cn } from "@/lib/utils";
import {
  consolidateClosing,
  groupClosingByCurrency,
  hasUnconvertibleFor,
  resolveConsolidation,
  type ClosingServerTotals,
} from "@/lib/accounting-close-currency";
import type { ExchangeRateLike } from "@/lib/currency";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import {
  dailyCloseExpenseColumns,
  type DailyCloseExpenseColumnMeta,
} from "./daily-close-expense-columns";
import { ClosingCurrencyTotals } from "./closing-currency-totals";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): DailyCloseExpenseColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as DailyCloseExpenseColumnMeta;
  }
  return {};
}

interface DailyCloseExpenseTableProps {
  expenses: ExpenseInAccountingClose[];
  exchangeRate: ExchangeRateLike;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Consolidado en CUP calculado por el backend; se prefiere sobre el cálculo
   * local con tasas vivas. Ausente → se recalcula client-side (fallback). */
  serverTotals?: ClosingServerTotals | null;
}

export function DailyCloseExpenseTable({
  expenses,
  exchangeRate,
  emptyTitle = "Sin gastos en este período",
  emptyDescription = "No hay gastos registrados para el rango seleccionado.",
  serverTotals,
}: DailyCloseExpenseTableProps) {
  // Subtotales de gastos por moneda + equivalente consolidado en CUP. El
  // consolidado se prefiere del backend y cae al cálculo local si no llega.
  const { currencyRows, expenseBase, hasUnconvertible } = React.useMemo(() => {
    const rows = groupClosingByCurrency([], expenses);
    const clientConsolidation = consolidateClosing(rows, exchangeRate);
    const resolved = resolveConsolidation(clientConsolidation, serverTotals);
    return {
      currencyRows: rows.map((r) => ({ currency: r.currency, amount: r.expense })),
      expenseBase: resolved.expenseBase,
      // Aviso por tabla (solo gastos): backend si aporta datos, si no el client.
      hasUnconvertible:
        hasUnconvertibleFor("expense", serverTotals) ??
        clientConsolidation.hasUnconvertible,
    };
  }, [expenses, exchangeRate, serverTotals]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [expenses]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters]);

  const table = useReactTable({
    data: expenses,
    columns: dailyCloseExpenseColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const pageCount = table.getPageCount();
  const maxPageIndex = Math.max(0, pageCount - 1);
  React.useEffect(() => {
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((p) => ({ ...p, pageIndex: maxPageIndex }));
    }
  }, [maxPageIndex, pagination.pageIndex]);

  const titleColumn = table.getColumn("title");
  const titleFilterValue = String(titleColumn?.getFilterValue() ?? "");
  const filteredTotal = table.getFilteredRowModel().rows.length;
  const hasTitleFilter = titleFilterValue.trim().length > 0;

  function clearTitleFilter() {
    titleColumn?.setFilterValue(undefined);
  }

  return (
    <CardContent className="flex min-h-0 flex-col gap-0 p-0">
      <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-md flex-col gap-1.5">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="daily-close-expense-search"
          >
            Buscar gasto
          </label>
          <Input
            id="daily-close-expense-search"
            type="search"
            placeholder="Título del gasto…"
            value={titleFilterValue}
            onChange={(e) =>
              titleColumn?.setFilterValue(
                e.target.value.length ? e.target.value : undefined,
              )
            }
            aria-controls="daily-close-expense-table"
            disabled={expenses.length === 0}
          />
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="px-4 pb-4 pt-4">
          <Empty className="flex-none border-border border bg-muted/30 py-8 md:p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HandCoins />
              </EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : filteredTotal === 0 ? (
        <div className="px-4 pb-4 pt-4">
          <Empty className="flex-none border-border border bg-muted/30 py-8 md:p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Sin resultados</EmptyTitle>
              <EmptyDescription>
                No hay gastos que coincidan con «{titleFilterValue.trim()}».
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearTitleFilter}
              >
                Limpiar búsqueda
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table
            id="daily-close-expense-table"
            className="w-full min-w-xl table-fixed"
          >
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
      )}

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {hasTitleFilter ? (
            <>
              <span className="font-medium text-foreground">
                {filteredTotal}
              </span>{" "}
              gasto{filteredTotal === 1 ? "" : "s"} de{" "}
              <span className="font-medium text-foreground">
                {expenses.length}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {expenses.length}
              </span>{" "}
              gasto{expenses.length === 1 ? "" : "s"} en la tabla
            </>
          )}
        </p>
        {expenses.length > 0 && filteredTotal > 0 ? (
          <DataTablePaginationNav
            pageIndex={pagination.pageIndex}
            pageCount={pageCount}
            onPageIndexChange={(nextIndex) =>
              setPagination((p) => ({ ...p, pageIndex: nextIndex }))
            }
            navLabel="Paginación de gastos"
          />
        ) : null}
      </div>

      <ClosingCurrencyTotals
        title="Total gastos"
        rows={currencyRows}
        consolidatedBase={expenseBase}
        hasUnconvertible={hasUnconvertible}
        tone="expense"
      />
    </CardContent>
  );
}
