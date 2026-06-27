"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { useInfiniteProductsQuery } from "@/hooks/use-product"
import type { Product } from "@/lib/types/product"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

interface ProductComboboxProps {
  /** Id del producto seleccionado (proviene del formulario). */
  value: string
  /** Devuelve el producto completo (o null al limpiar) para que el form lo use. */
  onChange: (product: Product | null) => void
  id?: string
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  /** Tamaño de página para el scroll infinito. */
  pageSize?: number
}

const SCROLL_THRESHOLD_PX = 48

export function ProductCombobox({
  value,
  onChange,
  id,
  invalid = false,
  disabled = false,
  placeholder = "Buscar producto...",
  pageSize = 20,
}: ProductComboboxProps) {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  // Guardamos el producto elegido aparte para que su nombre siga mostrándose
  // aunque ya no esté en la página/búsqueda actual del servidor.
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null,
  )

  // Debounce del término de búsqueda para no disparar una request por tecla.
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Si el formulario resetea el valor, limpiamos la selección visible.
  React.useEffect(() => {
    if (!value) setSelectedProduct(null)
  }, [value])

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProductsQuery({ search: debouncedSearch, limit: pageSize })

  const products = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  )

  // Asegura que el item seleccionado exista en `items` aunque no venga en la
  // página actual (base-ui lo necesita para resolver el valor controlado).
  const items = React.useMemo(() => {
    if (selectedProduct && !products.some((p) => p.id === selectedProduct.id)) {
      return [selectedProduct, ...products]
    }
    return products
  }, [products, selectedProduct])

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    if (!hasNextPage || isFetchingNextPage) return
    const el = event.currentTarget
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight <
      SCROLL_THRESHOLD_PX
    ) {
      fetchNextPage()
    }
  }

  const showInitialLoading = isLoading || (isFetching && products.length === 0)

  return (
    <Combobox<Product | null>
      value={selectedProduct}
      onValueChange={(opt) => {
        setSelectedProduct(opt)
        onChange(opt)
      }}
      items={items}
      // Búsqueda en servidor: desactivamos el filtrado interno de base-ui.
      filter={null}
      inputValue={search}
      onInputValueChange={(text) => setSearch(text)}
      itemToStringLabel={(opt) => opt?.name ?? ""}
      isItemEqualToValue={(a, b) => (a?.id ?? null) === (b?.id ?? null)}
    >
      <ComboboxInput
        id={id}
        placeholder={
          showInitialLoading ? "Cargando productos..." : placeholder
        }
        className="w-full"
        showClear={!!selectedProduct}
        disabled={disabled}
        aria-invalid={invalid ? "true" : "false"}
      />
      <ComboboxContent>
        <ComboboxList className="max-h-64" onScroll={handleScroll}>
          {items.map((product) => (
            <ComboboxItem key={product.id} value={product}>
              {product.name}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>
            {showInitialLoading
              ? "Cargando..."
              : "No se encontró ningún producto."}
          </ComboboxEmpty>
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Cargando más...
            </div>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
