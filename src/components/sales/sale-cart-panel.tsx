"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProductImage } from "@/components/products/product-image"
import { ShoppingCart, Minus, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { isIntegerUnit, parseDecimalInput } from "@/lib/units"

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export interface SaleCartItem {
  productId: string
  productName: string
  unit: string
  imageUrl: string | null
  quantity: number
  price: number
  subtotal: number
  stock: number
}

interface SaleCartPanelProps {
  items: SaleCartItem[]
  total: number
  isPending: boolean
  onSetQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onSubmit: () => void
  onCancel: () => void
  className?: string
}

export function SaleCartPanel({
  items,
  total,
  isPending,
  onSetQuantity,
  onRemove,
  onSubmit,
  onCancel,
  className,
}: SaleCartPanelProps) {
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <Card className={cn("flex h-fit flex-col", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Carrito
          </CardTitle>
          {items.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {items.length} {items.length === 1 ? "producto" : "productos"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Agrega productos para ver el resumen
            </p>
          </div>
        ) : (
          <>
            <div className="flex max-h-[50vh] flex-col divide-y divide-border overflow-y-auto">
              {items.map((item) => {
                const integerUnit = isIntegerUnit(item.unit)
                return (
                  <div key={item.productId} className="flex items-center gap-3 py-3">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.productName}
                      size="sm"
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium text-card-foreground">
                        {item.productName}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ${formatMoney(item.price)} c/u
                      </span>

                      {/* Stepper */}
                      <div className="mt-1 flex items-center gap-2">
                        {integerUnit ? (
                          <div className="flex items-center rounded-md border border-border">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-r-none"
                              onClick={() => onSetQuantity(item.productId, item.quantity - 1)}
                              aria-label="Disminuir"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              key={item.quantity}
                              type="text"
                              inputMode="numeric"
                              defaultValue={String(item.quantity)}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur()
                              }}
                              onBlur={(e) => {
                                const parsed = parseDecimalInput(e.target.value)
                                if (Number.isNaN(parsed)) {
                                  e.target.value = String(item.quantity)
                                  return
                                }
                                onSetQuantity(item.productId, parsed)
                              }}
                              className="h-8 w-12 rounded-none border-0 border-x border-border px-1 text-center text-sm font-medium tabular-nums shadow-none focus-visible:ring-0"
                              aria-label={`Cantidad de ${item.productName}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-l-none"
                              onClick={() => onSetQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              aria-label="Aumentar"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Input
                            type="text"
                            inputMode="decimal"
                            defaultValue={String(item.quantity)}
                            onBlur={(e) => {
                              const parsed = parseDecimalInput(e.target.value)
                              if (Number.isNaN(parsed)) {
                                e.target.value = String(item.quantity)
                                return
                              }
                              onSetQuantity(item.productId, parsed)
                            }}
                            className="h-7 w-20 text-sm"
                            aria-label={`Cantidad de ${item.productName}`}
                          />
                        )}
                        {!integerUnit && (
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums text-card-foreground">
                        ${formatMoney(item.subtotal)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(item.productId)}
                        aria-label={`Eliminar ${item.productName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-card-foreground">Total</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}
                </span>
              </div>
              <span className="text-xl font-bold tabular-nums text-card-foreground">
                ${formatMoney(total)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">MN</span>
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={onSubmit}
                disabled={items.length === 0 || isPending}
                className="w-full bg-emerald-500 font-semibold uppercase tracking-wide text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isPending ? "Registrando..." : "Registrar venta"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="w-full">
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
