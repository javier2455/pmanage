"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useBusiness } from "@/context/business-context"
import { useCreateProductMutation } from "@/hooks/use-product"
import { ProductUnit } from "@/lib/types/product"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { X, PackagePlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreateProductFormData, createProductSchema } from "@/lib/validations/products"
import axios from "axios"
import { sileo } from "sileo"
import Link from "next/link"


const UNITS: ProductUnit[] = ["kg", "lb", "g", "L", "mL ", "ud"]

export function NewProductForm() {
    const pathname = usePathname()
    const { activeBusinessId } = useBusiness()
    const createProductMutation = useCreateProductMutation();

    const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null)
    console.log('pathname', pathname)
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        setError,
        reset,
        formState: { errors },
    } = useForm<CreateProductFormData>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            name: "",
            description: "",
            category: "",
            unit: "kg",
            imageUrl: "",
            price: 0,
            stock: 0,
        },
    })

    const stockValue = watch("stock")
    const stockNum = Number(stockValue) || 0

    async function onSubmit(data: CreateProductFormData) {
        try {
            console.log('data of onSubmit', data)
            const response = await createProductMutation.mutateAsync({
                businessId: activeBusinessId ?? "",
                name: data.name,
                description: data.description,
                category: data.category,
                unit: data.unit,
                imageUrl: data.imageUrl,
                price: data.price,
                stock: data.stock,
            })
            if (response) {
                sileo.success({
                    title: "Producto registrado correctamente", fill: '', styles: {
                        title: "text-white! text-[16px]! font-bold!",
                        description: "text-white/90! text-[15px]!",
                    }, description: "El producto se ha registrado correctamente"
                });
            }
            reset()
            //   setSelectedProduct(null)
            // handleCancel()
        } catch (error) {
            console.log('error of onSubmit', error)
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setError("root", { message: error.response.data.message });
                sileo.error({
                    title: error.response?.data?.error, styles: { description: "text-[#dc2626]/90! text-[15px]!" }, description: error.response?.data?.message
                });
            }
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Name */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-2 mb-6">
                    <Label htmlFor="product-name" className="text-card-foreground">
                        Nombre del producto <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="product-name"
                        placeholder="Ej: Laptop HP Pavilion 15"
                        {...register("name")}
                        aria-invalid={errors.name ? "true" : "false"}
                    />
                    {errors.name && (
                        <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="product-desc" className="text-card-foreground">
                        Descripcion
                    </Label>
                    <Textarea
                        id="product-desc"
                        placeholder="Descripcion breve del producto..."
                        rows={3}
                        className="resize-none"
                        {...register("description")}
                        aria-invalid={errors.description ? "true" : "false"}
                    />
                    <p className="text-xs text-muted-foreground">
                        {/* {description.length} */}/200 caracteres
                    </p>
                    {errors.description && (
                        <p className="text-xs text-destructive">{errors.description.message}</p>
                    )}
                </div>
                <div className="my-4">
                    {/* Category + Unit */}
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="product-category" className="text-card-foreground">
                                Categoria <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="product-category"
                                placeholder="Ej: Electrónica, Ropa..."
                                {...register("category")}
                                aria-invalid={errors.category ? "true" : "false"}
                            />
                            {errors.category && (
                                <p className="text-xs text-destructive">{errors.category.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-card-foreground">
                                Unidad de medida <span className="text-destructive">*</span>
                            </Label>
                            <Combobox<ProductUnit>
                                value={selectedUnit}
                                onValueChange={(u) => setSelectedUnit(u)}
                                items={UNITS}
                                itemToStringLabel={(u) => u ?? ""}
                                isItemEqualToValue={(a, b) => a === b}
                                {...register("unit")}
                                aria-invalid={errors.unit ? "true" : "false"}
                            >
                                <ComboboxInput
                                    placeholder="Buscar unidad..."
                                    className="w-full"
                                    showClear={!!selectedUnit}
                                />
                                <ComboboxContent>
                                    <ComboboxList className="max-h-64">
                                        {UNITS.map((u) => (
                                            <ComboboxItem key={u} value={u}>
                                                {u}
                                            </ComboboxItem>
                                        ))}
                                        <ComboboxEmpty>No se encontró ninguna unidad.</ComboboxEmpty>
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            {errors.unit && (
                                <p className="text-xs text-destructive">{errors.unit.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Price + Stock */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="product-price" className="text-card-foreground">
                                Precio <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="product-price"
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="0.00"
                                {...register("price", { valueAsNumber: true })}
                                aria-invalid={errors.price ? "true" : "false"}
                            />
                            {errors.price && (
                                <p className="text-xs text-destructive">{errors.price.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="product-stock" className="text-card-foreground">
                                Stock <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="product-stock"
                                type="number"
                                min={0}
                                step={1}
                                placeholder="0"
                                {...register("stock", { valueAsNumber: true })}
                                aria-invalid={errors.stock ? "true" : "false"}
                            />
                            {errors.stock && (
                                <p className="text-xs text-destructive">{errors.stock.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Image upload */}
                {/* <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">Imagen del producto</Label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    aria-label="Subir imagen del producto"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-32 w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50 sm:w-64"
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Upload className="h-3 w-3" />
                            <span>Subir imagen</span>
                        </div>
                    </div>
                </button>
            </div> */}

                {/* Active toggle */}
                {/* <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <Checkbox
                    id="active"
                    className="mt-0.5 data-[state=unchecked]:border-primary data-[state=unchecked]:bg-muted/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                />
                <div className="flex flex-col gap-0.5">
                    <Label
                        htmlFor="active"
                        className="cursor-pointer text-sm font-medium text-card-foreground"
                    >
                        Activar producto
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Si esta activado, el producto sera visible y estara disponible para
                        la venta
                    </p>
                </div>
            </div> */}

                <Separator />

                {/* Buttons */}
                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link
                        href={pathname === '/dashboard/business/entries/create' ? '/dashboard/business/entries' : '/dashboard/business/products'}
                        className="bg-transparent border border-white rounded-lg px-3 py-1 text-white flex items-center text-[14px]"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Link>
                    <Button type="submit" disabled={false}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Registrar producto
                    </Button>
                </div>
            </form>
        </div>
    )
}
