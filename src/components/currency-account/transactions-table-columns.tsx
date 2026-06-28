"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { BASE_CURRENCY, formatMoney } from "@/lib/currency";
import type { FinancialTransaction } from "@/lib/types/financial-transaction";
import { getTransactionTypeMeta } from "./transaction-type-meta";

export type TransactionsColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies TransactionsColumnMeta;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createTransactionsColumns(): ColumnDef<FinancialTransaction>[] {
  return [
    {
      id: "type",
      meta: compactColumnMeta,
      header: () => "Tipo",
      cell: ({ row }) => {
        const meta = getTransactionTypeMeta(row.original.transactionType);
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      id: "originalAmount",
      meta: {
        headerClassName: "text-right",
        cellClassName: "text-right",
      } satisfies TransactionsColumnMeta,
      header: () => "Monto original",
      cell: ({ row }) => (
        <span className="font-medium text-foreground tabular-nums">
          {formatMoney(
            Number(row.original.originalAmount),
            row.original.originalCurrency,
          )}
        </span>
      ),
    },
    {
      id: "convertedAmount",
      meta: {
        headerClassName: "text-right",
        cellClassName: "text-right",
      } satisfies TransactionsColumnMeta,
      header: () => `Equivalente (${BASE_CURRENCY})`,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatMoney(Number(row.original.convertedAmount), BASE_CURRENCY)}
        </span>
      ),
    },
    {
      id: "date",
      meta: {
        headerClassName: "min-w-[180px] whitespace-nowrap",
        cellClassName: "min-w-[180px] whitespace-nowrap",
      } satisfies TransactionsColumnMeta,
      header: () => "Fecha",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {formatDate(row.original.transactionDate)}
        </span>
      ),
    },
  ];
}
