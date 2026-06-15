"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useBusiness } from "@/context/business-context"
import { useAllProductOfMyBusinesses } from "@/hooks/use-business"
import { useCreateSaleMutation } from "@/hooks/use-sales"
import { BusinessWithProducts } from "@/lib/types/business"
import { isIntegerUnit } from "@/lib/units"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { ProductGridCard } from "@/components/sales/product-grid-card"
import { SaleCartPanel } from "@/components/sales/sale-cart-panel"
import { Search, ArrowLeft, PackageSearch } from "lucide-react"
import { sileo } from "sileo"
import axios from "axios"

interface CartItem {
  productId: string
  productName: string
  category: string | null
  unit: string
  imageUrl: string | null
  quantity: number
  price: number
  subtotal: number
  stock: number
}

export default function CreateSalesPage() {
  const router = useRouter()
  const { activeBusinessId } = useBusiness()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useAllProductOfMyBusinesses(
    activeBusinessId ?? "",
    debouncedSearch,
  )
  const createSaleMutation = useCreateSaleMutation()

  const products: BusinessWithProducts[] = data?.data ?? []

  const quantityByProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of cartItems) map.set(item.productId, item.quantity)
    return map
  }, [cartItems])

  const grandTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.subtotal, 0),
    [cartItems],
  )

  function buildCartItem(bp: BusinessWithProducts, quantity: number): CartItem {
    const price = Number(bp.price)
    return {
      productId: bp.product.id,
      productName: bp.product.name,
      // La categoría vive en el BusinessProduct (raíz); fallback a product.category
      // por compatibilidad durante la migración. Ver docs/category.md.
      category: bp.category?.name ?? bp.product.category?.name ?? null,
      unit: bp.product.unit,
      imageUrl: bp.product.imageUrl,
      quantity,
      price,
      subtotal: quantity * price,
      stock: bp.stock,
    }
  }

  /** Suma +1 (unidades enteras). Tope: el stock del producto. */
  function addOne(bp: BusinessWithProducts) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === bp.product.id)
      if (existing) {
        if (existing.quantity + 1 > bp.stock) return prev
        return prev.map((i) =>
          i.productId === bp.product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i,
        )
      }
      if (bp.stock < 1) return prev
      return [...prev, buildCartItem(bp, 1)]
    })
  }

  /** Fija una cantidad absoluta (unidades de peso/volumen). */
  function addQuantity(bp: BusinessWithProducts, quantity: number) {
    const capped = Math.min(quantity, bp.stock)
    if (capped <= 0) return
    setCartItems((prev) => {
      const exists = prev.some((i) => i.productId === bp.product.id)
      if (exists) {
        return prev.map((i) =>
          i.productId === bp.product.id
            ? { ...i, quantity: capped, subtotal: capped * i.price }
            : i,
        )
      }
      return [...prev, buildCartItem(bp, capped)]
    })
  }

  /** Stepper / input del carrito: fija la cantidad; <= 0 elimina el item. */
  function setItemQuantity(productId: string, quantity: number) {
    setCartItems((prev) => {
      const item = prev.find((i) => i.productId === productId)
      if (!item) return prev
      let next = isIntegerUnit(item.unit) ? Math.round(quantity) : quantity
      if (next <= 0) return prev.filter((i) => i.productId !== productId)
      next = Math.min(next, item.stock)
      return prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: next, subtotal: next * i.price }
          : i,
      )
    })
  }

  function removeFromCart(productId: string) {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function handleCancel() {
    setCartItems([])
    router.push("/dashboard/business/sales")
  }

  async function submitSale() {
    if (cartItems.length === 0) return

    try {
      const response = await createSaleMutation.mutateAsync({
        idbusiness: activeBusinessId ?? "",
        descripcion: "",
        items: cartItems.map(({ productId, quantity, price }) => ({
          idproducto: productId,
          quantity,
          price,
        })),
      })

      if (response) {
        sileo.success({
          title: "Venta registrada correctamente",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: `Se registraron ${cartItems.length} producto(s) en la venta`,
        })
        setCartItems([])
        router.push("/dashboard/business/sales")
      }
    } catch (error) {
      let message = "Error al registrar la venta. Intenta de nuevo."
      if (axios.isAxiosError(error) && error.response?.data?.error === "Not Found") {
        message = "Producto no encontrado o negocio no encontrado"
      } else if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message
      }
      sileo.error({ title: "No se pudo registrar la venta", description: message })
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ventas</h1>
          <p className="text-muted-foreground">
            Toca un producto para agregarlo al carrito
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Catálogo */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageSearch />
                </EmptyMedia>
                <EmptyTitle>Sin productos</EmptyTitle>
                <EmptyDescription>
                  {debouncedSearch
                    ? "No se encontraron productos con ese nombre."
                    : "Este negocio aún no tiene productos."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((bp) => (
                <ProductGridCard
                  key={bp.id}
                  bp={bp}
                  quantityInCart={quantityByProduct.get(bp.product.id) ?? 0}
                  onAdd={addOne}
                  onSetQuantity={addQuantity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        <SaleCartPanel
          items={cartItems}
          total={grandTotal}
          isPending={createSaleMutation.isPending}
          onSetQuantity={setItemQuantity}
          onRemove={removeFromCart}
          onSubmit={submitSale}
          onCancel={handleCancel}
          className="lg:sticky lg:top-6"
        />
      </div>
    </div>
  )
}
