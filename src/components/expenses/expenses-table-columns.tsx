"use client";

import Link from "next/link";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteDialog } from "@/components/delete-dialog";
import type { Expense } from "@/lib/types/expenses";
import ExpenseDetailsDialog from "./expense-details-dialog";

export type ExpensesColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies ExpensesColumnMeta;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ExpensesSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<Expense, unknown>;
  label: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "-ml-2 h-8 px-2 lg:-ml-4"}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  );
}

export function createExpensesColumns(
  onDeleteExpense: (expenseId: string) => void | Promise<void>,
): ColumnDef<Expense>[] {
  return [
    {
      id: "title",
      accessorFn: (row) => row.title,
      meta: {
        headerClassName: "min-w-[200px]",
        cellClassName: "min-w-[200px]",
      } satisfies ExpensesColumnMeta,
      header: ({ column }) => (
        <ExpensesSortableHeader column={column} label="Título" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {row.original.title}
        </span>
      ),
    },
    {
      id: "amount",
      accessorFn: (row) => Number(row.amount),
      meta: compactColumnMeta,
      header: ({ column }) => (
        <ExpensesSortableHeader column={column} label="Monto" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-foreground">
          {formatCurrency(Number(row.original.amount))}
        </span>
      ),
    },
    {
      id: "fecha",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      meta: {
        headerClassName: "min-w-[180px] whitespace-nowrap",
        cellClassName: "min-w-[180px] whitespace-nowrap",
      } satisfies ExpensesColumnMeta,
      header: ({ column }) => (
        <ExpensesSortableHeader column={column} label="Fecha" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies ExpensesColumnMeta,
      header: () => (
        <div className="text-right font-medium text-foreground">Acciones</div>
      ),
      cell: ({ row }) => (
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
              <ExpenseDetailsDialog
                expenseId={row.original.id}
                trigger={
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Eye className="size-4 text-blue-500 dark:text-blue-400" />
                    Ver detalles
                  </button>
                }
              />
              <Link
                href={`/dashboard/business/expenses/${row.original.id}/edit`}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Pencil className="size-4 text-amber-500 dark:text-amber-400" />
                Editar
              </Link>
              <DeleteDialog
                deleteType="Gasto"
                name={row.original.title}
                onConfirm={() => onDeleteExpense(row.original.id)}
                trigger={
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-muted"
                  >
                    <Trash2 className="size-4 shrink-0 text-destructive" />
                    Eliminar
                  </button>
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
    },
  ];
}
