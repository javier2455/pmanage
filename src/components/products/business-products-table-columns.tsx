"use client";

import Link from "next/link";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ProductToShowInTable } from "@/lib/types/product";
import ProductDetailsDialog from "@/components/products/details-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { ProductImage } from "@/components/products/product-image";

export type BusinessProductsColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies BusinessProductsColumnMeta;

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(Number(value));
}

function BusinessProductsSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<ProductToShowInTable, unknown>;
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

export function createBusinessProductsColumns(
  onDeleteProduct: (productId: string) => void | Promise<void>,
): ColumnDef<ProductToShowInTable>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.product.name,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue) => {
        const q = String(filterValue ?? "").toLowerCase().trim();
        if (!q) return true;
        const name = row.original.product?.name ?? "";
        return name.toLowerCase().includes(q);
      },
      meta: {
        headerClassName:
          "min-w-[240px] max-w-none whitespace-normal align-top sm:max-w-[min(16rem,40vw)]",
        cellClassName:
          "min-w-[240px] max-w-none whitespace-normal break-words align-top sm:max-w-[min(16rem,40vw)]",
      } satisfies BusinessProductsColumnMeta,
      header: ({ column }) => (
        <BusinessProductsSortableHeader
          column={column}
          label="Nombre"
          className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <ProductImage
            src={row.original.product.imageUrl}
            alt={row.original.product.name}
            size="sm"
          />
          <span className="block font-medium text-foreground">
            {row.original.product.name}
          </span>
        </div>
      ),
    },
    {
      id: "price",
      accessorFn: (row) => Number(row.price),
      meta: compactColumnMeta,
      header: ({ column }) => (
        <BusinessProductsSortableHeader column={column} label="Precio" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      id: "stock",
      accessorFn: (row) => row.stock,
      meta: { ...compactColumnMeta, headerClassName: "w-[1%] whitespace-nowrap text-center", cellClassName: "w-[1%] whitespace-nowrap text-center" },
      header: ({ column }) => (
        <BusinessProductsSortableHeader column={column} label="Stock" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">
          {row.original.stock}
        </span>
      ),
    },
    {
      id: "category",
      accessorFn: (row) => row.product.category,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <BusinessProductsSortableHeader column={column} label="Categoría" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.product.category}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies BusinessProductsColumnMeta,
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
              <ProductDetailsDialog
                productId={row.original.product.id}
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
                name={row.original.product.name}
                onConfirm={() => onDeleteProduct(row.original.product.id)}
                trigger={
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-muted"
                  >
                    <Trash2 className="size-4 shrink-0 text-destructive" />
                    Eliminar del negocio
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
