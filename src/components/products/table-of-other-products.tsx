"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Product } from "@/lib/types/product";
import ProductDetailsDialog from "@/components/products/details-dialog";

interface TableOfOtherProductsProps {
    products: Product[];
}

export default function TableOfOtherProducts({ products }: TableOfOtherProductsProps) {
    if (products.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <p className="text-muted-foreground text-center">
                        No hay otros productos disponibles
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
                                        Nombre del producto
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                                        Categoría
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                                        Unidad
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold text-foreground">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="py-4 px-4 text-foreground">
                                            {product.name}
                                        </td>
                                        <td className="py-4 px-4 text-foreground">
                                            {product.category}
                                        </td>
                                        <td className="py-4 px-4 text-foreground">
                                            {product.unit}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <ProductDetailsDialog
                                                    productId={product.id}
                                                    tooltip="Detalles"
                                                    trigger={
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/20"
                                                            aria-label="Ver detalles"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            asChild
                                                            className="text-primary hover:text-primary/90 hover:bg-primary/10 dark:hover:bg-primary/20"
                                                        >
                                                            <Link
                                                                href={`/dashboard/business/products/${product.id}/edit`}
                                                                aria-label="Editar"
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Editar</TooltipContent>
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
