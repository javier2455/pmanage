"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ExpenseInAccountingClose } from "@/lib/types/accounting-close";
import { formatClosingCurrency } from "./format-closing-currency";
import { DailyCloseSortableHeader } from "./daily-close-sortable-header";

export type DailyCloseExpenseColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const titleCol = {
  headerClassName:
    "min-w-0 w-[40%] max-w-[40%] whitespace-normal align-top [word-break:break-word]",
  cellClassName:
    "min-w-0 w-[40%] max-w-[40%] whitespace-normal break-words align-top [overflow-wrap:anywhere]",
} as const;

const numHeaderRight =
  "whitespace-nowrap text-right [&_button]:justify-end [&_button]:w-full [&_button]:lg:pr-4";
const numCellRight = "whitespace-nowrap text-right tabular-nums";

const amountCol = {
  headerClassName: `min-w-[7rem] w-[30%] ${numHeaderRight}`,
  cellClassName: `min-w-[7rem] w-[30%] ${numCellRight}`,
} as const;

const dateCol = {
  headerClassName: `min-w-[8rem] w-[30%] ${numHeaderRight}`,
  cellClassName: `min-w-[8rem] w-[30%] ${numCellRight}`,
} as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const dailyCloseExpenseColumns: ColumnDef<ExpenseInAccountingClose>[] = [
  {
    id: "title",
    accessorFn: (row) => row.title?.trim() || "-",
    enableColumnFilter: true,
    filterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").toLowerCase().trim();
      if (!q) return true;
      const title = (row.original.title || "").toLowerCase();
      return title.includes(q);
    },
    meta: {
      headerClassName: titleCol.headerClassName,
      cellClassName: `${titleCol.cellClassName} font-medium`,
    } satisfies DailyCloseExpenseColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Título"
        className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
      />
    ),
    cell: ({ row }) => (
      <span className="block font-medium text-foreground">
        {row.original.title?.trim() || "-"}
      </span>
    ),
  },
  {
    id: "amount",
    accessorFn: (row) => Number(row.amount),
    meta: {
      headerClassName: amountCol.headerClassName,
      cellClassName: `${amountCol.cellClassName} font-semibold`,
    } satisfies DailyCloseExpenseColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Monto"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>${formatClosingCurrency(Number(row.original.amount))}</span>
    ),
  },
  {
    id: "createdAt",
    accessorFn: (row) => new Date(row.createdAt).getTime(),
    meta: {
      headerClassName: dateCol.headerClassName,
      cellClassName: dateCol.cellClassName,
    } satisfies DailyCloseExpenseColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Fecha"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
  },
];
