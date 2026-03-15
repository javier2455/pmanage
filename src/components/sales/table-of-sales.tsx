"use client";

import { Eye, XCircle } from "lucide-react";
import { SaleWithProductAndBusiness } from "@/lib/types/sales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import DetailsDialog from "./details-dialog";
import { CancelSaleDialog } from "./cancel-sale-dialog";
import axios from "axios";
import { sileo } from "sileo";
import { useCancelSaleMutation } from "@/hooks/use-sales";
import { StatusBadge } from "../generic/status-badge";

interface TableOfSalesProps {
  sales: SaleWithProductAndBusiness[];
}

export default function TableOfSales({ sales }: TableOfSalesProps) {
  const cancelSaleMutation = useCancelSaleMutation();

  async function handleCancel(saleId: string, cancellationReason: string) {
    try {
      await cancelSaleMutation.mutateAsync({ saleId, cancellationReason });
      sileo.success({
        title: "Venta cancelada correctamente",
        fill: "",
        styles: {
          title: "text-white! text-[16px]! font-bold!",
          description: "text-white/90! text-[15px]!",
        },
        description: "La venta se ha cancelado correctamente",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        sileo.error({
          title: error.response?.data?.error,
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: error.response?.data?.message,
        });
      } else {
        sileo.error({
          title: "Error al cancelar la venta",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: "Error al cancelar la venta. Intenta de nuevo.",
        });
      }
    }
  }

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground text-center">
            No hay ventas registradas
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
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Nombre del producto vendido
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Precio
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Cantidad
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-foreground">
                      {sale.product.name}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                      }).format(sale.precio)}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {sale.cantidad}
                    </td>
                    <td className="py-4 px-4">
                      {sale.isCancelled ? <StatusBadge text="Cancelada" /> : <StatusBadge text="Activa" />}

                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <DetailsDialog
                          saleId={sale.id}
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

                        <CancelSaleDialog
                          productName={sale.product.name}
                          onConfirm={(cancellationReason) => handleCancel(sale.id, cancellationReason)}
                          tooltip="Cancelar venta"
                          trigger={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20"
                              aria-label="Cancelar venta"
                              disabled={sale.isCancelled}
                            >
                              <XCircle className="size-4" />
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
