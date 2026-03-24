"use client";

import Link from "next/link";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Product } from "@/lib/types/product";
import ProductDetailsDialog from "@/components/products/details-dialog";
import { DeleteDialog } from "@/components/delete-dialog";

export type CatalogProductsColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies CatalogProductsColumnMeta;

function CatalogProductsSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<Product, unknown>;
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

export function createCatalogProductsColumns(
  onDeleteProduct: (productId: string) => void | Promise<void>,
): ColumnDef<Product>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.name,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue) => {
        const q = String(filterValue ?? "").toLowerCase().trim();
        if (!q) return true;
        return row.original.name.toLowerCase().includes(q);
      },
      meta: {
        headerClassName:
          "min-w-[240px] max-w-none whitespace-normal align-top sm:max-w-[min(16rem,40vw)]",
        cellClassName:
          "min-w-[240px] max-w-none whitespace-normal break-words align-top sm:max-w-[min(16rem,40vw)]",
      } satisfies CatalogProductsColumnMeta,
      header: ({ column }) => (
        <CatalogProductsSortableHeader
          column={column}
          label="Nombre"
          className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
        />
      ),
      cell: ({ row }) => (
        <span className="block font-medium text-foreground">
          {row.original.name}
        </span>
      ),
    },
    {
      id: "category",
      accessorFn: (row) => row.category,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <CatalogProductsSortableHeader column={column} label="Categoría" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.category}</span>
      ),
    },
    {
      id: "unit",
      accessorFn: (row) => row.unit,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <CatalogProductsSortableHeader column={column} label="Unidad" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.unit}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies CatalogProductsColumnMeta,
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
            <PopoverContent align="end" className="w-48 p-1">
              <ProductDetailsDialog
                productId={row.original.id}
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
                href={`/dashboard/business/products/${row.original.id}/edit`}
                className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Pencil className="size-4 text-primary" />
                Editar
              </Link>
              <DeleteDialog
                deleteType="Producto"
                name={row.original.name}
                onConfirm={() => onDeleteProduct(row.original.id)}
                trigger={
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Trash2 className="size-4 text-destructive" />
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
