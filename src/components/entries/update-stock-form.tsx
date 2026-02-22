"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Package,
  DollarSign,
//   Check,
  X,
  RefreshCw,
  ArrowUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PRODUCTS = [
  { id: "1", name: "Laptop HP Pavilion 15", stock: 24, price: 899.99 },
  { id: "2", name: 'Monitor Samsung 27"', stock: 18, price: 349.5 },
  {
    id: "3",
    name: "Teclado Mecanico Logitech G Pro",
    stock: 45,
    price: 129.99,
  },
  { id: "4", name: "Mouse Inalambrico Razer", stock: 32, price: 79.99 },
  { id: "5", name: "Auriculares Sony WH-1000XM5", stock: 12, price: 349.0 },
  { id: "6", name: "Webcam Logitech C920", stock: 50, price: 69.99 },
  { id: "7", name: "SSD Samsung 1TB", stock: 38, price: 109.99 },
  { id: "8", name: "Memoria RAM Corsair 16GB", stock: 60, price: 54.99 },
  { id: "9", name: "Tablet iPad Air", stock: 8, price: 599.0 },
  { id: "10", name: "Impresora Epson EcoTank", stock: 15, price: 249.99 },
]

type Product = (typeof PRODUCTS)[number]

export function UpdateStockForm() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [newStock, setNewStock] = useState("")
  const newStockNum = Number.parseInt(newStock) || 0

  return (
    <div className="flex flex-col gap-6">
      {/* Product select */}
      <div className="flex flex-col gap-2">
        <Label className="text-card-foreground">Producto</Label>
        <Combobox<Product | null>
          value={selectedProduct}
          onValueChange={(item) => {
            setSelectedProduct(item)
            setNewStock("")
          }}
          items={PRODUCTS}
          itemToStringLabel={(p) => (p ? p.name : "")}
          isItemEqualToValue={(a, b) => a?.id === b?.id}
        >
          <ComboboxInput
            placeholder="Buscar producto..."
            className="w-full"
            showClear={!!selectedProduct}
          />
          <ComboboxContent>
            <ComboboxList className="max-h-64">
              {PRODUCTS.map((product) => (
                <ComboboxItem key={product.id} value={product}>
                  {product.name}
                </ComboboxItem>
              ))}
              <ComboboxEmpty>No se encontró ningún producto.</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* Product info - shown when product is selected */}
      {selectedProduct && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Current stock */}
          <div className="flex flex-col gap-2">
            <Label className="text-card-foreground">Stock actual</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium tabular-nums text-card-foreground">
                {selectedProduct.stock} unidades
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "ml-auto text-xs",
                  selectedProduct.stock <= 10
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                )}
              >
                {selectedProduct.stock <= 10 ? "Stock bajo" : "Disponible"}
              </Badge>
            </div>
          </div>

          {/* Current price */}
          <div className="flex flex-col gap-2">
            <Label className="text-card-foreground">
              Precio unitario actual
            </Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium tabular-nums text-card-foreground">
                $
                {selectedProduct.price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New stock input */}
      {selectedProduct && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-stock" className="text-card-foreground">
            Cantidad a ingresar
          </Label>
          <Input
            id="new-stock"
            type="number"
            min="1"
            placeholder="Ej: 50"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
          />
          {newStockNum > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3 text-primary" />
              <span>
                El nuevo stock total sera de{" "}
                <span className="font-semibold text-card-foreground">
                  {selectedProduct.stock + newStockNum}
                </span>{" "}
                unidades
              </span>
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* Buttons */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="bg-transparent"
          onClick={() => {
            setSelectedProduct(null)
            setNewStock("")
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button disabled={!selectedProduct || newStockNum <= 0}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar stock
        </Button>
      </div>
    </div>
  )
}
