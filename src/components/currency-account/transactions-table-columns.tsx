"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { BASE_CURRENCY, formatMoney } from "@/lib/currency";
import type { FinancialTransaction } from "@/lib/types/financial-transaction";
import { getTransactionTypeMeta } from "./transaction-type-meta";
import { formatDateTimeShort } from "@/lib/dates";
import type { ColumnMeta } from "@/components/data-table/column-meta";

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies ColumnMeta;

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
      } satisfies ColumnMeta,
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
      } satisfies ColumnMeta,
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
      } satisfies ColumnMeta,
      header: () => "Fecha",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {formatDateTimeShort(row.original.transactionDate)}
        </span>
      ),
    },
  ];
}
