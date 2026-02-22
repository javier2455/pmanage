"use client"

import { useState, useRef } from "react"
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
import { ImagePlus, X, PackagePlus, Upload } from "lucide-react"

const CATEGORIES = [
    "Electronica",
    "Computacion",
    "Perifericos",
    "Almacenamiento",
    "Audio",
    "Accesorios",
    "Impresion",
    "Redes",
]

const UNITS = [
    "Unidad",
    "Par",
    "Caja",
    "Paquete",
    "Kit",
    "Metro",
    "Kilogramo",
    "Litro",
]

export function NewProductForm() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleImageChange() {
        // TODO: implementar subida de imagen
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Name */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="product-name" className="text-card-foreground">
                    Nombre del producto <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="product-name"
                    placeholder="Ej: Laptop HP Pavilion 15"
                />
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
                />
                <p className="text-xs text-muted-foreground">
                    {/* {description.length} */}/200 caracteres
                </p>
            </div>

            {/* Category + Unit */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label className="text-card-foreground">
                        Categoria <span className="text-destructive">*</span>
                    </Label>
                    <Combobox<string | null>
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                        items={CATEGORIES}
                        itemToStringLabel={(cat) => cat ?? ""}
                        isItemEqualToValue={(a, b) => a === b}
                    >
                        <ComboboxInput
                            placeholder="Buscar categoria..."
                            className="w-full"
                            showClear={!!selectedCategory}
                        />
                        <ComboboxContent>
                            <ComboboxList className="max-h-64">
                                {CATEGORIES.map((cat) => (
                                    <ComboboxItem key={cat} value={cat}>
                                        {cat}
                                    </ComboboxItem>
                                ))}
                                <ComboboxEmpty>No se encontró ninguna categoría.</ComboboxEmpty>
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-card-foreground">
                        Unidad de medida <span className="text-destructive">*</span>
                    </Label>
                    <Combobox<string | null>
                        value={selectedUnit}
                        onValueChange={setSelectedUnit}
                        items={UNITS}
                        itemToStringLabel={(u) => u ?? ""}
                        isItemEqualToValue={(a, b) => a === b}
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
                </div>
            </div>

            {/* Image upload */}
            <div className="flex flex-col gap-2">
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
            </div>

            {/* Active toggle */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
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
            </div>

            <Separator />

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                    variant="outline"
                    className="bg-transparent">
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button disabled={false}>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Registrar producto
                </Button>
            </div>
        </div>
    )
}
