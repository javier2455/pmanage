"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BellRing } from "lucide-react";
import type { CurrentInventoryEntry } from "@/lib/types/inventory";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StockAlertBadge } from "./stock-alert-badge";

export type CurrentInventoryColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

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

export interface BuildCurrentInventoryColumnsOptions {
  /** Resuelve el umbral configurado de una fila (null = sin alerta). */
  getThreshold: (entry: CurrentInventoryEntry) => number | null;
  /** Abre el diálogo de configuración de alerta. Solo se pasa a usuarios Pro. */
  onConfigureAlert?: (entry: CurrentInventoryEntry) => void;
}

export function buildCurrentInventoryColumns({
  getThreshold,
  onConfigureAlert,
}: BuildCurrentInventoryColumnsOptions): ColumnDef<CurrentInventoryEntry>[] {
  const columns: ColumnDef<CurrentInventoryEntry>[] = [
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
            <ProductImage src={product?.imageUrl} alt={name} size="sm" />
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
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-foreground">
            {row.original.stock}
          </span>
          <StockAlertBadge
            stock={row.original.stock}
            threshold={getThreshold(row.original)}
          />
        </div>
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

  if (onConfigureAlert) {
    columns.push({
      id: "actions",
      meta: compactColumnMeta,
      header: () => (
        <span className="block text-center font-medium text-foreground">
          Alerta de stock
        </span>
      ),
      cell: ({ row }) => {
        const threshold = getThreshold(row.original);
        const label =
          threshold != null
            ? `Editar alerta de stock (umbral: ${threshold})`
            : "Configurar alerta de stock";
        return (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={label}
                  onClick={() => onConfigureAlert(row.original)}
                >
                  <BellRing
                    className={
                      threshold != null
                        ? "h-4 w-4 text-primary"
                        : "h-4 w-4 text-muted-foreground"
                    }
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    });
  }

  return columns;
}
