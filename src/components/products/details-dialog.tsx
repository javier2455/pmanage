import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGetProductByIdQuery } from "@/hooks/use-product"
import { useGetProductCategoryByIdQuery } from "@/hooks/use-product-categories"
import { Badge } from "@/components/ui/badge"
import { ProductImage } from "@/components/products/product-image"

interface ProductDetailsDialogProps {
    productId: string
    /**
     * Nombre de la categoría del BusinessProduct (por negocio). Cuando se abre
     * desde la lista de productos de un negocio, pásalo para mostrar la categoría
     * correcta, ya que el catálogo (`Product`) ya no lleva categoría. Ver
     * docs/category.md.
     */
    categoryName?: string | null
    /**
     * Fecha de última actualización del BusinessProduct (por negocio). El
     * catálogo (`Product`) no la trae, así que se pasa desde la lista para
     * mostrarla en los detalles. Ver docs/category.md.
     */
    updatedAt?: string | Date | null
    tooltip?: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export default function ProductDetailsDialog({ productId, categoryName: categoryNameProp, updatedAt: updatedAtProp, tooltip, trigger, open, onOpenChange }: ProductDetailsDialogProps) {
    const isControlled = open !== undefined
    const { data, isLoading } = useGetProductByIdQuery(productId, {
        refetchOnMount: "always",
    })

    const product = data?.data
    const business = product?.businesses?.[0]

    const inlineCategoryName = product?.category?.name ?? null
    const productCategoryId: string | null =
        product?.categoryId ?? product?.category?.id ?? null
    // Solo resolvemos por id si no nos pasaron la categoría del BusinessProduct ni
    // viene embebida en el producto (compatibilidad durante la migración).
    const shouldFetchCategoryById =
        !categoryNameProp && !!productCategoryId && !inlineCategoryName
    const { data: fetchedCategory } = useGetProductCategoryByIdQuery(
        shouldFetchCategoryById ? productCategoryId : "",
    )
    const categoryName =
        categoryNameProp ?? inlineCategoryName ?? fetchedCategory?.name ?? null
    // El catálogo no trae `businesses`, así que preferimos la fecha que nos pasa
    // el llamador (BusinessProduct del negocio activo) y caemos al del producto.
    const lastUpdatedAt = updatedAtProp ?? business?.updatedAt ?? null

    const triggerContent = trigger ?? <Button variant="outline">Ver detalles</Button>

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {isControlled ? null : (
                <DialogTrigger asChild>
                    {tooltip ? (
                        <span className="inline-flex">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {triggerContent}
                                </TooltipTrigger>
                                <TooltipContent>{tooltip}</TooltipContent>
                            </Tooltip>
                        </span>
                    ) : triggerContent}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] md:max-w-[520px] shadow-lg shadow-cyan-300/30">
                <DialogHeader>
                    <DialogTitle className="text-card-foreground">
                        Detalles del producto
                    </DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                    </div>
                ) : (
                    <div className="flex flex-col mt-4">
                        <div className="flex justify-center pb-4">
                            <ProductImage
                                src={product?.imageUrl}
                                alt={product?.name ?? "Producto"}
                                size="lg"
                            />
                        </div>
                        <div className="flex items-start justify-between border-b border-border py-4 first:pt-0">
                            <span className="text-sm text-muted-foreground">Nombre</span>
                            <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
                                {product?.name ?? "--"}
                            </span>
                        </div>
                        <div className="flex items-start justify-between border-b border-border py-4">
                            <span className="text-sm text-muted-foreground">Descripción</span>
                            <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
                                {product?.description || "--"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border py-4">
                            <span className="text-sm text-muted-foreground">Categoría</span>
                            <span className="text-sm font-medium text-card-foreground">
                                {categoryName ?? (
                                    <span className="text-muted-foreground italic">Sin categoría</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border py-4">
                            <span className="text-sm text-muted-foreground">Unidad</span>
                            <span className="text-sm font-medium text-card-foreground">
                                {product?.unit ?? "--"}
                            </span>
                        </div>
                        {business && (
                            <>
                                <div className="flex items-center justify-between border-b border-border py-4">
                                    <span className="text-sm text-muted-foreground">Precio</span>
                                    <span className="text-sm font-medium text-card-foreground tabular-nums">
                                        {new Intl.NumberFormat("es-CO", {
                                            style: "currency",
                                            currency: "COP",
                                        }).format(business.price)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border py-4">
                                    <span className="text-sm text-muted-foreground">Stock</span>
                                    <Badge
                                        variant="secondary"
                                        className={
                                            business.stock === 0
                                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                                : business.stock <= 10
                                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        }
                                    >
                                        {business.stock} {product?.unit}
                                    </Badge>
                                </div>
                            </>
                        )}
                        <div className="flex items-center justify-between py-4">
                            <span className="text-sm text-muted-foreground">Última actualización</span>
                            <span className="text-sm font-medium text-card-foreground tabular-nums">
                                {lastUpdatedAt
                                    ? new Date(lastUpdatedAt).toLocaleDateString("es-CO", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })
                                    : "--"}
                            </span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
