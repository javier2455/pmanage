"use client";

import React from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { SaleWithProductAndBusiness } from "@/lib/types/sales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TableOfSalesProps {
  sales: SaleWithProductAndBusiness[];
  onDelete?: (sale: SaleWithProductAndBusiness) => void;
}

export default function TableOfSales({ sales, onDelete }: TableOfSalesProps) {
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
                    Precio total
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
                    <td className="py-4 px-4 text-foreground">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "CUP",
                      }).format(sale.precio * sale.cantidad)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              asChild
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/20"
                            >
                              <Link
                                href={`/dashboard/business/sales/${sale.id}`}
                                aria-label="Ver detalles"
                              >
                                <Eye className="size-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Detalles</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onDelete?.(sale)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
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
