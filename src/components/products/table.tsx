"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProductToShowInTable } from "@/lib/types/product";
import ProductDetailsDialog from "@/components/products/details-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { useDeleteProductInBusinessMutation } from "@/hooks/use-product";
import { useBusiness } from "@/context/business-context";
import { sileo } from "sileo";
import axios from "axios";

interface TableOfProductsProps {
    products: ProductToShowInTable[];
}

export default function TableOfProducts({ products }: TableOfProductsProps) {
    const { activeBusinessId } = useBusiness();
    const deleteProductInBusinessMutation = useDeleteProductInBusinessMutation();

    async function handleDelete(productId: string) {
        try {
            const response = await deleteProductInBusinessMutation.mutateAsync({
                businessId: activeBusinessId ?? "",
                productId,
            });
            if (response.success) {
                sileo.success({
                    title: "Producto eliminado del negocio correctamente",
                    fill: "",
                    styles: {
                        title: "text-white! text-[16px]! font-bold!",
                        description: "text-white/90! text-[15px]!",
                    },
                    description: "El producto se ha eliminado del negocio correctamente",
                });
            } else {
                sileo.error({
                    title: "Error al eliminar el producto del negocio",
                    styles: { description: "text-[#dc2626]/90! text-[15px]!" },
                    description: response.message,
                });
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                sileo.error({
                    title: error.response?.data?.error,
                    styles: { description: "text-[#dc2626]/90! text-[15px]!" },
                    description: error.response?.data?.message,
                });
            } else {
                sileo.error({
                    title: "Error al eliminar el producto del negocio",
                    fill: "",
                    styles: {
                        title: "text-white! text-[16px]! font-bold!",
                        description: "text-white/90! text-[15px]!",
                    },
                    description: "Error al eliminar el producto. Intenta de nuevo.",
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
                                        <div className="flex items-center justify-end">
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
                                                        productId={product.product.id}
                                                        trigger={
                                                            <button className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer">
                                                                <Eye className="size-4 text-blue-500 dark:text-blue-400" />
                                                                Ver detalles
                                                            </button>
                                                        }
                                                    />
                                                    <Link
                                                        href={`/dashboard/business/products/${product.product.id}/edit`}
                                                        className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                                                    >
                                                        <Pencil className="size-4 text-primary" />
                                                        Editar
                                                    </Link>
                                                    <DeleteDialog
                                                        deleteType="Producto"
                                                        name={product.product.name}
                                                        onConfirm={() => handleDelete(product.product.id)}
                                                        trigger={
                                                            <button className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer whitespace-nowrap">
                                                                <Trash2 className="size-4 shrink-0 text-destructive" />
                                                                Eliminar del negocio
                                                            </button>
                                                        }
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

