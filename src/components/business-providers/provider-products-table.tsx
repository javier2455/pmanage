"use client"

import * as React from "react"
import { Package, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav"
import { PageSizeSelect } from "@/components/data-table/page-size-select"
import type { ProviderProduct } from "@/lib/types/provider"

interface ProviderProductsTableProps {
  products: ProviderProduct[]
}

const DEFAULT_LIMIT = 10

function formatPrice(value: number | string): string {
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return "--"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(n)
}

export function ProviderProductsTable({ products }: ProviderProductsTableProps) {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(DEFAULT_LIMIT)

  React.useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      300,
    )
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, limit])

  const filtered = React.useMemo(() => {
    if (!debouncedSearch) return products
    return products.filter((pp) =>
      pp.product.name.toLowerCase().includes(debouncedSearch),
    )
  }, [products, debouncedSearch])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)))
  const safePage = Math.min(page, totalPages)

  const paginated = React.useMemo(() => {
    const start = (safePage - 1) * limit
    return filtered.slice(start, start + limit)
  }, [filtered, safePage, limit])

  const hasProducts = products.length > 0
  const noResults = hasProducts && total === 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">
              Productos suministrados
            </h2>
            <p className="text-xs text-muted-foreground">
              {products.length}{" "}
              {products.length === 1 ? "producto" : "productos"} en total
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              disabled={!hasProducts}
            />
          </div>
        </div>

        {!hasProducts ? (
          <div className="px-4 py-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>Sin productos asociados</EmptyTitle>
                <EmptyDescription>
                  Este proveedor aún no tiene productos suministrados.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <Table id="provider-products-table" className="min-w-[480px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3 text-foreground">
                  Producto
                </TableHead>
                <TableHead className="px-4 py-3 text-foreground">
                  Unidad
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-foreground">
                  Precio
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noResults ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((pp) => (
                  <TableRow key={pp.id}>
                    <TableCell className="px-4 py-3 text-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {pp.product.name}
                        </span>
                        {pp.product.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {pp.product.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {pp.product.unit ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold tabular-nums text-card-foreground">
                      {formatPrice(pp.price)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {hasProducts && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {paginated.length}
              </span>{" "}
              de <span className="font-medium text-foreground">{total}</span>
              {totalPages > 1 ? (
                <>
                  {" "}
                  — Página{" "}
                  <span className="font-medium text-foreground">
                    {safePage}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {totalPages}
                  </span>
                </>
              ) : null}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <PageSizeSelect value={limit} onChange={setLimit} />
              {totalPages > 1 ? (
                <DataTablePaginationNav
                  pageIndex={safePage - 1}
                  pageCount={totalPages}
                  onPageIndexChange={(nextIndex) => setPage(nextIndex + 1)}
                  navLabel="Paginación de productos del proveedor"
                />
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
