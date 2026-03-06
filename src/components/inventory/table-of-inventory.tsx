"use client";

import { Eye } from "lucide-react";
import { InventoryEntry } from "@/lib/types/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import InventoryDetailsDialog from "./details-dialog";

interface TableOfInventoryProps {
  entries: InventoryEntry[];
}

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

export default function TableOfInventory({ entries }: TableOfInventoryProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground text-center">
            No hay entradas de inventario registradas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Producto
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Cantidad
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Precio unitario
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Stock anterior
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Stock nuevo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Fecha
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-foreground">
                      {entry.product.name}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {entry.quantity}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                      }).format(Number(entry.unitPrice))}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {entry.previousStock}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {entry.newStock}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <InventoryDetailsDialog
                          entry={entry}
                          tooltip="Detalles"
                          trigger={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/20"
                              aria-label="Ver detalles"
                            >
                              <Eye className="size-4" />
                            </Button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
