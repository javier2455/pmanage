"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductToShowInTable } from "@/lib/types/product";
import { DeleteDialog } from "@/components/delete-dialog";
import { useDeleteProductMutation } from "@/hooks/use-product";
import { sileo } from "sileo";
import axios from "axios";

interface TableOfProductsProps {
    products: ProductToShowInTable[];
}

export default function TableOfProducts({ products }: TableOfProductsProps) {
    const deleteProductMutation = useDeleteProductMutation();
    async function handleDelete(productId: string) {
        try {
            const response = await deleteProductMutation.mutateAsync(productId);
            console.log('response of handleDelete', response)
            if (response) {
                sileo.success({
                    title: "Producto eliminado correctamente", fill: '', styles: {
                        title: "text-white! text-[16px]! font-bold!",
                        description: "text-white/90! text-[15px]!",
                    }, description: "El producto se ha eliminado correctamente"
                });
            }

        } catch (error) {
            console.log('error of handleDelete', error)
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                sileo.error({
                    title: error.response?.data?.error, styles: { description: "text-[#dc2626]/90! text-[15px]!" }, description: error.response?.data?.message
                });
            } else {
                sileo.error({
                    title: "Error al eliminar el producto", fill: '', styles: {
                        title: "text-white! text-[16px]! font-bold!",
                        description: "text-white/90! text-[15px]!",
                    }, description: "Error al eliminar el producto. Intenta de nuevo."
                });
            }
        }
    }

    if (products.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <p className="text-muted-foreground text-center">
                        No hay productos registrados
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
                                        Precio
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                                        Cantidad/(Stock)
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                                        Categoría
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
                                            {product.product.name}
                                        </td>
                                        <td className="py-4 px-4 text-foreground">
                                            {new Intl.NumberFormat("es-CO", {
                                                style: "currency",
                                                currency: "COP",
                                            }).format(Number(product.price))}
                                        </td>
                                        <td className="py-4 px-4 text-foreground text-center">
                                            {product.stock.toString()}
                                        </td>
                                        <td className="py-4 px-4 text-foreground">
                                            {product.product.category}
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
                                                                href={`/dashboard/business/products/${product.id}`}
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
                                                            asChild
                                                            className="text-primary hover:text-primary/90 hover:bg-primary/10 dark:hover:bg-primary/20"
                                                        >
                                                            <Link
                                                                href={`/dashboard/business/products/${product.product.id}/edit`}
                                                                aria-label="Editar"
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Editar</TooltipContent>
                                                </Tooltip>

                                                <DeleteDialog
                                                    deleteType="Producto"
                                                    name={product.product.name}
                                                    onConfirm={() => handleDelete(product.product.id)}
                                                    tooltip="Eliminar"
                                                    trigger={
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20"
                                                            aria-label="Eliminar"
                                                        >
                                                            <Trash2 className="size-4" />
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

