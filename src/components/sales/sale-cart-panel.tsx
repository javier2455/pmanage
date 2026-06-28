"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductImage } from "@/components/products/product-image"
import { ShoppingCart, Minus, Plus, Trash2, X, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { isIntegerUnit, parseDecimalInput } from "@/lib/units"
import { formatMoney, isCupDenominated } from "@/lib/currency"
import type { SaleType } from "@/lib/types/sales"

/** Datos de contacto/entrega de la venta (solo se usan en `delivery`). */
export interface SaleDeliveryInfo {
  address: string
  contactPhone: string
  contactName: string
  /** Precio de la mensajería, en la moneda de la venta. Cadena cruda del input (se parsea al enviar). */
  fee: string
}

const SALE_TYPE_OPTIONS: { value: SaleType; label: string }[] = [
  { value: "in_store", label: "En tienda" },
  { value: "delivery", label: "A domicilio" },
  { value: "pickup", label: "Para recoger" },
]

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
  /** Moneda de la venta seleccionada (default "CUP"). */
  currency: string
  /** CUP por 1 unidad de la moneda elegida (1 para CUP). Los precios se guardan en CUP. */
  rate: number
  availableCurrencies: string[]
  onCurrencyChange: (currency: string) => void
  /** Tipo de venta (en tienda / domicilio / recoger). */
  saleType: SaleType
  onSaleTypeChange: (saleType: SaleType) => void
  /** El negocio tiene delivery habilitado (`acceptsMessaging`). Si es `false`, la opción "A domicilio" se deshabilita. */
  acceptsDelivery: boolean
  /** Datos de entrega; solo relevantes cuando `saleType === "delivery"`. */
  delivery: SaleDeliveryInfo
  onDeliveryChange: (patch: Partial<SaleDeliveryInfo>) => void
  onSetQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  /** Registrar venta sin cobrar. */
  onSubmit: () => void
  /** Registrar venta y abrir el cobro de inmediato. */
  onSubmitAndPay: () => void
  onCancel: () => void
  className?: string
}

export function SaleCartPanel({
  items,
  total,
  isPending,
  currency,
  rate,
  availableCurrencies,
  onCurrencyChange,
  saleType,
  onSaleTypeChange,
  acceptsDelivery,
  delivery,
  onDeliveryChange,
  onSetQuantity,
  onRemove,
  onSubmit,
  onSubmitAndPay,
  onCancel,
  className,
}: SaleCartPanelProps) {
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)
  // Los precios viven en CUP; los mostramos en la moneda elegida. Extranjera:
  // precioCUP / tasa. CUP con recargo (transferencia): precioCUP × tasa.
  const toCurrency = (cupValue: number) =>
    isCupDenominated(currency) ? cupValue * (rate || 1) : cupValue / (rate || 1)
  // La tarifa se ingresa directamente en la moneda de la venta (no en CUP).
  const parsedFee = parseDecimalInput(delivery.fee)
  const deliveryFee =
    saleType === "delivery" && !Number.isNaN(parsedFee) ? parsedFee : 0
  // Subtotal de productos en la moneda elegida; el total suma la mensajería.
  const productsTotal = toCurrency(total)
  const grandTotal = productsTotal + deliveryFee

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
                        {formatMoney(toCurrency(item.price), currency)} c/u
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
                        {formatMoney(toCurrency(item.subtotal), currency)}
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

            {/* Tipo de venta */}
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">
                  Tipo de venta
                </span>
                <Select
                  value={saleType}
                  onValueChange={(v) => onSaleTypeChange(v as SaleType)}
                  disabled={isPending}
                >
                  <SelectTrigger size="sm" className="min-w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.value === "delivery" && !acceptsDelivery}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aviso cuando el negocio no ofrece delivery */}
              {!acceptsDelivery && (
                <p className="text-xs text-muted-foreground">
                  Este negocio no acepta delivery. Habilítalo en los datos del
                  negocio para vender a domicilio.
                </p>
              )}

              {/* Datos de entrega — solo para ventas a domicilio */}
              {saleType === "delivery" && acceptsDelivery && (
                <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="delivery-address"
                      className="text-xs text-card-foreground"
                    >
                      Dirección de entrega{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="delivery-address"
                      value={delivery.address}
                      onChange={(e) =>
                        onDeliveryChange({ address: e.target.value })
                      }
                      placeholder="Calle, número, referencia..."
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="delivery-name"
                      className="text-xs text-card-foreground"
                    >
                      Nombre de contacto{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="delivery-name"
                      value={delivery.contactName}
                      onChange={(e) =>
                        onDeliveryChange({ contactName: e.target.value })
                      }
                      placeholder="A quién se entrega"
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="delivery-phone"
                      className="text-xs text-card-foreground"
                    >
                      Teléfono de contacto{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <PhoneInput
                      value={delivery.contactPhone}
                      onChange={(value) =>
                        onDeliveryChange({ contactPhone: value })
                      }
                      defaultCountry="cu"
                      placeholder="5555 5555"
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="delivery-fee"
                      className="text-xs text-card-foreground"
                    >
                      Precio de la mensajería{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({currency})
                      </span>
                    </Label>
                    <Input
                      id="delivery-fee"
                      type="text"
                      inputMode="decimal"
                      value={delivery.fee}
                      onChange={(e) => {
                        const parsed = parseDecimalInput(e.target.value)
                        if (e.target.value === "" || !Number.isNaN(parsed)) {
                          onDeliveryChange({ fee: e.target.value })
                        }
                      }}
                      placeholder="0"
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Moneda de la venta */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-medium text-card-foreground">Moneda</span>
              <Select value={currency} onValueChange={onCurrencyChange} disabled={isPending}>
                <SelectTrigger size="sm" className="min-w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desglose: productos + mensajería (solo cuando hay tarifa) */}
            {deliveryFee > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Productos</span>
                  <span className="tabular-nums text-card-foreground">
                    {formatMoney(productsTotal, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mensajería</span>
                  <span className="tabular-nums text-card-foreground">
                    {formatMoney(deliveryFee, currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-card-foreground">Total</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}
                </span>
              </div>
              <span className="text-xl font-bold tabular-nums text-card-foreground">
                {formatMoney(grandTotal, currency)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={onSubmitAndPay}
                disabled={items.length === 0 || isPending}
                className="w-full bg-emerald-500 font-semibold uppercase tracking-wide text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isPending ? "Registrando..." : "Registrar venta y cobrar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSubmit}
                disabled={items.length === 0 || isPending}
                className="w-full font-semibold"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Registrar venta
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel} className="w-full">
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
