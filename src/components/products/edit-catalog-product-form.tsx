"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { useEditProductMutation, useGetProductByIdQuery } from "@/hooks/use-product"
import {
    useGetAllProductCategoriesQuery,
    useGetProductCategoryByIdQuery,
} from "@/hooks/use-product-categories"
import { useBusiness } from "@/context/business-context"
import { ProductUnit } from "@/lib/types/product"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { X, RefreshCw, ImagePlus, Upload } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EditProductFormData, editProductSchema } from "@/lib/validations/products"
import axios from "axios"
import { sileo } from "sileo"
import Link from "next/link"

const UNITS: ProductUnit[] = ["kg", "lb", "g", "L", "mL", "ud"]
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

type CategoryOption = { id: string; name: string }

export function EditCatalogProductForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const productId = searchParams.get("id") ?? ""

    // Force refetch on every mount: the global staleTime for ["product"] is 10 min,
    // so without this, navigating from the products list serves stale cache that
    // predates the categoryId/category fields and the Select stays empty.
    const { data, isLoading, isError } = useGetProductByIdQuery(productId, {
        refetchOnMount: "always",
    })
    const editProductMutation = useEditProductMutation()
    const { activeBusinessId } = useBusiness()
    const { data: categoriesData, isLoading: isLoadingCategories } =
        useGetAllProductCategoriesQuery({
            page: 1,
            limit: 1000,
            businessId: activeBusinessId ?? undefined,
            enabled: !!activeBusinessId,
        })
    const productCategories = categoriesData?.data ?? []

    const inlineCategory = data?.data?.category ?? null
    const currentCategoryId: string | null =
        data?.data?.categoryId ?? inlineCategory?.id ?? null

    // Fallback: if the by-id endpoint doesn't include the nested `category` object
    // but we have the id, resolve it through its own endpoint so the Combobox can
    // show the name.
    const shouldFetchCategoryById =
        !!currentCategoryId && !inlineCategory
    const { data: fetchedCategory } = useGetProductCategoryByIdQuery(
        shouldFetchCategoryById ? currentCategoryId : "",
    )
    const resolvedCategoryRef = inlineCategory ?? fetchedCategory ?? null

    const selectItems = (() => {
        const items = productCategories.map((c) => ({ id: c.id, name: c.name }))
        if (resolvedCategoryRef && !items.find((i) => i.id === resolvedCategoryRef.id)) {
            items.unshift({
                id: resolvedCategoryRef.id,
                name: resolvedCategoryRef.name,
            })
        }
        return items
    })()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    // Gates the Select render until reset() has populated form state with the
    // product's categoryId. Without this, Radix Select mounts with value=null,
    // its internal matcher locks in "no selection", and later value updates
    // don't always re-evaluate the trigger text.
    const [formReady, setFormReady] = useState(false)

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        setError,
        reset,
        formState: { errors },
    } = useForm<EditProductFormData>({
        resolver: zodResolver(editProductSchema),
        defaultValues: {
            name: "",
            description: "",
            category: null,
            unit: "kg",
            imageUrl: "",
        },
    })

    const selectedUnit = watch("unit")

    useEffect(() => {
        if (!data?.data) return

        const productData = data.data
        reset({
            name: productData.name,
            description: productData.description ?? "",
            category:
                productData.categoryId ?? productData.category?.id ?? null,
            unit: productData.unit,
            imageUrl: productData.imageUrl ?? "",
        })
        setFormReady(true)
    }, [data, reset])

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            if (fileInputRef.current) fileInputRef.current.value = ""
            sileo.error({
                title: "Imagen demasiado grande",
                description: "La imagen no debe superar los 2 MB. Elige un archivo más pequeño.",
                styles: { description: "text-[#dc2626]/90! text-[15px]!" },
            })
            return
        }
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    function clearImage() {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    async function onSubmit(data: EditProductFormData) {
        const normalizedCategoryId =
            data.category && data.category.length > 0 ? data.category : null
        try {
            await editProductMutation.mutateAsync({
                productId: productId,
                credentials: {
                    name: data.name,
                    description: data.description ?? null,
                    categoryId: normalizedCategoryId,
                    unit: data.unit,
                    imageUrl: imageFile ?? data.imageUrl ?? null,
                },
            })
            sileo.success({
                title: "Producto actualizado correctamente",
                fill: "",
                styles: {
                    title: "text-white! text-[16px]! font-bold!",
                    description: "text-white/90! text-[15px]!",
                },
                description: "El producto se ha actualizado correctamente",
            })
            reset()
            router.push("/dashboard/business/products")
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setError("root", { message: error.response.data.message })
                sileo.error({
                    title: error.response?.data?.error,
                    styles: { description: "text-[#dc2626]/90! text-[15px]!" },
                    description: error.response?.data?.message,
                })
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Cargando producto...</p>
            </div>
        )
    }

    if (isError || !data?.data) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
                <p className="text-destructive text-center">
                    No se pudo cargar el producto. Verifica que el ID sea correcto.
                </p>
                <Link
                    href="/dashboard/business/products"
                    className="text-sm text-primary hover:underline"
                >
                    Volver a productos
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
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
                    <p className="text-xs text-muted-foreground">/200 caracteres</p>
                    {errors.description && (
                        <p className="text-xs text-destructive">{errors.description.message}</p>
                    )}
                </div>

                <div className="my-4">
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="product-category" className="text-card-foreground">
                                Categoria
                            </Label>
                            {formReady ? (
                                <Controller
                                    control={control}
                                    name="category"
                                    render={({ field }) => {
                                        const selectedOption: CategoryOption | null =
                                            selectItems.find((i) => i.id === field.value) ?? null
                                        return (
                                            <Combobox<CategoryOption | null>
                                                value={selectedOption}
                                                onValueChange={(opt) =>
                                                    field.onChange(opt?.id ?? null)
                                                }
                                                items={selectItems}
                                                itemToStringLabel={(opt) => opt?.name ?? ""}
                                                isItemEqualToValue={(a, b) =>
                                                    (a?.id ?? null) === (b?.id ?? null)
                                                }
                                            >
                                                <ComboboxInput
                                                    placeholder={
                                                        isLoadingCategories
                                                            ? "Cargando categorías..."
                                                            : selectItems.length === 0
                                                                ? "Aún no hay categorías"
                                                                : "Buscar categoría..."
                                                    }
                                                    className="w-full"
                                                    showClear={!!selectedOption}
                                                    disabled={
                                                        isLoadingCategories || selectItems.length === 0
                                                    }
                                                />
                                                <ComboboxContent>
                                                    <ComboboxList className="max-h-64">
                                                        {selectItems.map((opt) => (
                                                            <ComboboxItem key={opt.id} value={opt}>
                                                                {opt.name}
                                                            </ComboboxItem>
                                                        ))}
                                                        <ComboboxEmpty>
                                                            No se encontró ninguna categoría.
                                                        </ComboboxEmpty>
                                                    </ComboboxList>
                                                </ComboboxContent>
                                            </Combobox>
                                        )
                                    }}
                                />
                            ) : (
                                <div
                                    id="product-category"
                                    className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3"
                                    aria-busy="true"
                                >
                                    <span className="text-sm text-muted-foreground">
                                        Cargando categoría...
                                    </span>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Opcional — administra tus categorías en{" "}
                                <Link
                                    href="/dashboard/business/categories/products"
                                    className="underline-offset-2 hover:underline"
                                >
                                    Categorías
                                </Link>
                                .
                            </p>
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
                                onValueChange={(u) => setValue("unit", u ?? "kg")}
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
                </div>

                <div className="flex flex-col gap-2 mb-6">
                    <Label className="text-card-foreground">Imagen del producto</Label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                        aria-label="Subir imagen del producto"
                    />

                    {imagePreview || data?.data?.imageUrl ? (
                        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border sm:w-64">
                            <Image
                                src={imagePreview ?? data!.data!.imageUrl!}
                                alt="Imagen del producto"
                                fill
                                className="object-cover"
                                sizes="256px"
                                unoptimized={!!imagePreview}
                            />
                            {imagePreview && (
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                                    aria-label="Quitar imagen"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-foreground shadow hover:bg-background"
                            >
                                <Upload className="h-3 w-3" />
                                Cambiar
                            </button>
                        </div>
                    ) : (
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
                    )}
                    <p className="text-xs text-muted-foreground">
                        Formatos aceptados: JPG, PNG o WEBP. Tamaño máximo: 2&nbsp;MB.
                    </p>
                </div>

                <Separator />

                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/business/products">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Link>
                    </Button>
                    <Button type="submit" disabled={editProductMutation.isPending}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {editProductMutation.isPending ? "Actualizando..." : "Actualizar producto"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
