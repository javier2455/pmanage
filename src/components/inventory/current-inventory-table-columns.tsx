"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CurrentInventoryEntry } from "@/lib/types/inventory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type CurrentInventoryColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

function productInitials(name: string | undefined) {
  if (!name) return "·";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies CurrentInventoryColumnMeta;

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export const currentInventoryColumns: ColumnDef<CurrentInventoryEntry>[] = [
  {
    id: "product",
    accessorFn: (row) => row.product?.name ?? "",
    meta: {
      headerClassName:
        "min-w-[280px] max-w-none whitespace-normal align-top sm:max-w-[min(18rem,40vw)]",
      cellClassName:
        "min-w-[280px] max-w-none whitespace-normal break-words align-top sm:max-w-[min(18rem,40vw)]",
    } satisfies CurrentInventoryColumnMeta,
    header: () => (
      <span className="block px-2 py-2 text-left font-medium text-foreground">
        Producto
      </span>
    ),
    cell: ({ row }) => {
      const product = row.original.product;
      const name = product?.name ?? "—";
      return (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="sm" className="shrink-0">
            {product?.imageUrl ? (
              <AvatarImage src={product.imageUrl} alt={name} />
            ) : null}
            <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
              {productInitials(product?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-foreground">{name}</span>
        </div>
      );
    },
  },
  {
    id: "stock",
    accessorFn: (row) => row.stock,
    meta: compactColumnMeta,
    header: () => (
      <span className="block font-medium text-foreground">Stock</span>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {row.original.stock}
      </span>
    ),
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    meta: compactColumnMeta,
    header: () => (
      <span className="block font-medium text-foreground">
        Última actualización
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-foreground">
        {formatDate(row.original.updatedAt)}
      </span>
    ),
  },
];
