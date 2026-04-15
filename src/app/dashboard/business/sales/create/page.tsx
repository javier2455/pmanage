"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useBusiness } from "@/context/business-context"
import { useAllProductOfMyBusinesses } from "@/hooks/use-business"
import { useCreateSaleMutation } from "@/hooks/use-sales"
import { BusinessWithProducts } from "@/lib/types/business"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { ShoppingCart, Package, Plus, X, DollarSign, ArrowLeft, Trash2, Box } from "lucide-react"
import Link from "next/link"
import { AddToCartFormData, addToCartSchema } from "@/lib/validations/business"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { sileo } from "sileo"

interface CartItem {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  imageUrl: string | null;
  cantidad: number;
  precio: number;
  subtotal: number;
  stock: number;
}

export default function CreateSalesPage() {
  const router = useRouter()
  const { activeBusinessId } = useBusiness()
  const { data } = useAllProductOfMyBusinesses(activeBusinessId ?? "")
  const createSaleMutation = useCreateSaleMutation()

  const [selectedProduct, setSelectedProduct] = useState<BusinessWithProducts | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<AddToCartFormData>({
    resolver: zodResolver(addToCartSchema),
    defaultValues: {
      stock: 0,
      productId: "",
    },
  })

  const stockValue = watch("stock")
  const quantityNum = Number(stockValue) || 0

  const products: BusinessWithProducts[] = data?.data ?? []

  const cartQuantityForSelected = useMemo(() => {
    if (!selectedProduct) return 0
    return cartItems.find(i => i.productId === selectedProduct.product.id)?.cantidad ?? 0
  }, [selectedProduct, cartItems])

  const effectiveStock = useMemo(() => {
    if (!selectedProduct) return 0
    return selectedProduct.stock - cartQuantityForSelected
  }, [selectedProduct, cartQuantityForSelected])

  const stockStatus = useMemo(() => {
    if (!selectedProduct) return null
    if (effectiveStock === 0) return { label: "Sin stock", variant: "destructive" as const }
    if (effectiveStock <= 10) return { label: "Stock bajo", variant: "secondary" as const }
    return { label: "Disponible", variant: "secondary" as const }
  }, [selectedProduct, effectiveStock])

  const unitPrice = selectedProduct?.price ?? 0

  const grandTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0)
  }, [cartItems])

  const isAddValid = selectedProduct && quantityNum > 0 && quantityNum <= effectiveStock

  function handleCancel() {
    setSelectedProduct(null)
    setCartItems([])
    reset({ stock: 0, productId: "" })
    router.push("/dashboard/business/sales")
  }

  function addToCart(data: AddToCartFormData) {
    if (!selectedProduct) return

    const precio = Number(unitPrice)
    const existingIndex = cartItems.findIndex(i => i.productId === data.productId)

    if (existingIndex >= 0) {
      const updated = [...cartItems]
      const existing = updated[existingIndex]
      const newCantidad = existing.cantidad + data.stock
      if (newCantidad > selectedProduct.stock) {
        setError("stock", { message: `La cantidad total (${newCantidad}) excede el stock disponible (${selectedProduct.stock})` })
        return
      }
      updated[existingIndex] = {
        ...existing,
        cantidad: newCantidad,
        subtotal: newCantidad * precio,
      }
      setCartItems(updated)
    } else {
      setCartItems(prev => [...prev, {
        productId: data.productId,
        productName: selectedProduct.product.name,
        category: selectedProduct.product.category,
        unit: selectedProduct.product.unit,
        imageUrl: selectedProduct.product.imageUrl,
        cantidad: data.stock,
        precio,
        subtotal: data.stock * precio,
        stock: selectedProduct.stock,
      }])
    }

    setSelectedProduct(null)
    reset({ stock: 0, productId: "" })
  }

  function removeFromCart(productId: string) {
    setCartItems(prev => prev.filter(i => i.productId !== productId))
  }

  async function submitSale() {
    if (cartItems.length === 0) return

    try {
      const response = await createSaleMutation.mutateAsync({
        idbusiness: activeBusinessId ?? "",
        descripcion: "",
        items: cartItems.map(({ productId, cantidad, precio }) => ({
          idproducto: productId,
          cantidad,
          precio,
        })),
      })

      if (response) {
        sileo.success({
          title: "Venta registrada correctamente", fill: '', styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          }, description: `Se registraron ${cartItems.length} producto(s) en la venta`
        });
        setCartItems([])
        setSelectedProduct(null)
        reset({ stock: 0, productId: "" })
        router.push("/dashboard/business/sales")
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error === "Not Found") {
        setError("root", { message: "Producto no encontrado o negocio no encontrado" });
      } else if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: error.response.data.message });
      } else {
        setError("root", { message: "Error al registrar la venta. Intenta de nuevo." });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/sales"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ventas
          </h1>
          <p className="text-muted-foreground">
            Registra una nueva venta agregando productos al carrito
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form + Cart - left side */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card>
            <form onSubmit={handleSubmit(addToCart)}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-card-foreground">
                      Agregar producto
                    </CardTitle>
                    <CardDescription>
                      Selecciona un producto y la cantidad a vender
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Selector de productos */}
                <div className="flex flex-col gap-2">
                  <Label className="text-card-foreground">Producto</Label>
                  <Combobox<BusinessWithProducts | null>
                    value={selectedProduct}
                    onValueChange={(item) => {
                      setSelectedProduct(item)
                      setValue("stock", 0)
                    }}
                    items={products}
                    itemToStringLabel={(bp) => (bp ? bp.product.name : "")}
                    isItemEqualToValue={(a, b) => a?.id === b?.id}
                  >
                    <ComboboxInput
                      placeholder="Buscar producto..."
                      className="w-full"
                      showClear={!!selectedProduct}
                    />
                    <ComboboxContent>
                      <ComboboxList className="max-h-64">
                        <ComboboxCollection>
                          {(bp: BusinessWithProducts) => (
                            <ComboboxItem value={bp} onClick={() => setValue("productId", bp.product.id)}>
                              <div className="flex flex-1 items-start p-1">
                                <span>{bp.product.name}</span>
                              </div>
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                        <ComboboxEmpty>No se encontró ningún producto.</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {errors.productId && (
                    <p className="text-xs text-destructive">{errors.productId.message}</p>
                  )}
                </div>

                {/* Stock disponible + Cantidad */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="text-card-foreground">
                      Stock disponible
                    </Label>
                    <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm tabular-nums text-card-foreground">
                        {selectedProduct ? effectiveStock : "--"}
                      </span>
                      {stockStatus && (
                        <Badge
                          variant={stockStatus.variant}
                          className={cn(
                            "ml-auto text-xs",
                            stockStatus.label === "Sin stock"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : stockStatus.label === "Stock bajo"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                          )}
                        >
                          {stockStatus.label}
                        </Badge>
                      )}
                    </div>
                    {cartQuantityForSelected > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {cartQuantityForSelected} ya en el carrito
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="stock" className="text-card-foreground">
                      Cantidad a vender
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min={1}
                      max={effectiveStock}
                      {...register("stock", { valueAsNumber: true })}
                      disabled={!selectedProduct || effectiveStock === 0}
                      placeholder="0"
                    />
                    {errors.stock && (
                      <p className="text-xs text-destructive">{errors.stock.message}</p>
                    )}
                    {selectedProduct && quantityNum > effectiveStock && (
                      <p className="text-xs text-destructive">
                        La cantidad excede el stock disponible ({effectiveStock})
                      </p>
                    )}
                  </div>
                </div>

                {/* Precio unitario */}
                <div className="flex flex-col gap-2">
                  <Label className="text-card-foreground">
                    Precio unitario
                  </Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm tabular-nums text-card-foreground">
                      {selectedProduct
                        ? `${Number(unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MN`
                        : "--"}
                    </span>
                  </div>
                </div>

                {errors.root && (
                  <p className="text-sm text-destructive">{errors.root.message}</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={!isAddValid} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4 shrink-0" />
                    Agregar al carrito
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Cart items table */}
          {cartItems.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-card-foreground text-base">
                    Artículos en la venta
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 border-b border-border px-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Producto</span>
                  <span className="w-12 text-center">Cant.</span>
                  <span className="w-20 text-right hidden sm:block">Precio unit.</span>
                  <span className="w-24 text-right">Subtotal</span>
                  <span className="w-8" />
                </div>

                {/* Items */}
                <div className="flex flex-col divide-y divide-border max-h-57 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 px-4 py-3"
                    >
                      {/* Product info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <Box className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-card-foreground truncate">
                            {item.productName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.category} · {item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <span className="w-12 text-center text-sm tabular-nums text-card-foreground">
                        {item.cantidad}
                      </span>

                      {/* Unit price */}
                      <span className="w-20 text-right text-sm tabular-nums text-muted-foreground hidden sm:block">
                        ${item.precio.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {/* Subtotal */}
                      <span className="w-24 text-right text-sm font-semibold tabular-nums text-card-foreground">
                        ${item.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                        aria-label={`Eliminar ${item.productName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Grand total */}
                <div className="flex items-center justify-between border-t border-border px-4 pt-4 mt-1">
                  <span className="text-sm font-semibold text-card-foreground">
                    Total
                  </span>
                  <span className="text-base font-bold tabular-nums text-card-foreground">
                    ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MN
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary - right side */}
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Resumen de venta
            </CardTitle>
            <CardDescription>
              Detalle de productos en el carrito
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Agrega productos para ver el resumen
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex flex-col max-h-48 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div
                      key={item.productId}
                      className={cn(
                        "flex flex-col gap-1 py-4",
                        index < cartItems.length - 1 && "border-b border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-card-foreground min-w-0 wrap-break-word">
                          {item.productName}
                        </span>
                        <span className="text-sm font-medium text-card-foreground tabular-nums shrink-0">
                          ${item.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.cantidad} x ${item.precio.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 mt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-card-foreground">
                      Total
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cartItems.length} {cartItems.length === 1 ? "producto" : "productos"}
                    </span>
                  </div>
                  <span className="text-base font-bold tabular-nums text-card-foreground shrink-0">
                    ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MN
                  </span>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={submitSale}
                    disabled={cartItems.length === 0 || createSaleMutation.isPending}
                    className="w-full bg-emerald-500 text-white font-semibold uppercase tracking-wide hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {createSaleMutation.isPending ? "Registrando..." : "Registrar venta"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full bg-transparent"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
