"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteDialog } from "@/components/delete-dialog";
import type { ExpenseCategory } from "@/lib/types/expense-category";
import { CategoryDetailsDialog } from "./category-details-dialog";

export type CategoriesColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CategoriesSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<ExpenseCategory, unknown>;
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

interface CreateColumnsParams {
  onEditCategory: (category: ExpenseCategory) => void;
  onDeleteCategory: (categoryId: string) => void | Promise<void>;
}

export function createCategoriesColumns({
  onEditCategory,
  onDeleteCategory,
}: CreateColumnsParams): ColumnDef<ExpenseCategory>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.name,
      meta: {
        headerClassName: "min-w-[180px]",
        cellClassName: "min-w-[180px]",
      } satisfies CategoriesColumnMeta,
      header: ({ column }) => (
        <CategoriesSortableHeader column={column} label="Nombre" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {row.original.name}
        </span>
      ),
    },
    {
      id: "description",
      accessorFn: (row) => row.description,
      meta: {
        headerClassName: "min-w-[260px]",
        cellClassName: "min-w-[260px]",
      } satisfies CategoriesColumnMeta,
      header: () => (
        <span className="font-medium text-foreground">Descripción</span>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      meta: {
        headerClassName: "min-w-[160px] whitespace-nowrap",
        cellClassName: "min-w-[160px] whitespace-nowrap",
      } satisfies CategoriesColumnMeta,
      header: ({ column }) => (
        <CategoriesSortableHeader column={column} label="Creada" />
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
      } satisfies CategoriesColumnMeta,
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
              <CategoryDetailsDialog
                categoryId={row.original.id}
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
              <button
                type="button"
                onClick={() => onEditCategory(row.original)}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Pencil className="size-4 text-amber-500 dark:text-amber-400" />
                Editar
              </button>
              <DeleteDialog
                deleteType="Categoría"
                name={row.original.name}
                onConfirm={() => onDeleteCategory(row.original.id)}
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
