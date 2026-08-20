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
import { cn } from "@/lib/utils"
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav"
import { PageSizeSelect } from "@/components/data-table/page-size-select"
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton"
import { useGetProviderProductsQuery } from "@/hooks/use-provider"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { BASE_CURRENCY, formatMoney } from "@/lib/currency"
import { TableLoadingOverlay } from "@/components/data-table/table-loading-overlay"

interface ProviderProductsTableProps {
  providerId: string
}

const DEFAULT_LIMIT = 10

/**
 * Precio con su moneda.
 *
 * Antes formateaba con `Intl` y `currency: "COP"` — pesos colombianos — así que
 * un precio pactado en dólares salía con el símbolo del peso. `formatMoney`
 * pone la moneda real como sufijo y no depende de ISO 4217, que no cubre
 * `EURO` ni `MLC`.
 */
function formatPrice(value: number | string, currency?: string): string {
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return "--"
  return formatMoney(n, currency || BASE_CURRENCY)
}

export function ProviderProductsTable({ providerId }: ProviderProductsTableProps) {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search.trim())
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(DEFAULT_LIMIT)

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, limit])

  const { data, isLoading, isFetching, isError } = useGetProviderProductsQuery(
    providerId,
    { page, limit, search: debouncedSearch },
  )

  const products = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)))

  const hasActiveSearch = debouncedSearch.length > 0
  const isEmpty = !isLoading && total === 0 && !hasActiveSearch
  const noResults = !isLoading && total === 0 && hasActiveSearch

  if (isLoading) {
    return <SimpleTableSkeleton />
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">
              Productos suministrados
            </h2>
            <p className="text-xs text-muted-foreground">
              {total} {total === 1 ? "producto" : "productos"} en total
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
              disabled={isEmpty && !search}
            />
          </div>
        </div>

        {isError ? (
          <div className="px-4 py-6">
            <p className="text-sm text-destructive">
              No se pudieron cargar los productos del proveedor.
            </p>
          </div>
        ) : isEmpty ? (
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
          <div className="relative">
            {isFetching ? (
              <TableLoadingOverlay />
            ) : null}
            <div
              className={cn(
                "transition-opacity",
                isFetching && "pointer-events-none opacity-60 select-none",
              )}
              aria-busy={isFetching}
            >
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
                    products.map((pp) => (
                      <TableRow key={pp.id}>
                        <TableCell className="px-4 py-3 text-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {pp.name}
                            </span>
                            {pp.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {pp.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {pp.unit ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold tabular-nums text-card-foreground">
                          {formatPrice(pp.price, pp.currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!isEmpty && !isError && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {products.length}
              </span>{" "}
              de <span className="font-medium text-foreground">{total}</span>
              {totalPages > 1 ? (
                <>
                  {" "}
                  — Página{" "}
                  <span className="font-medium text-foreground">{page}</span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {totalPages}
                  </span>
                </>
              ) : null}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <PageSizeSelect
                value={limit}
                onChange={setLimit}
                disabled={isFetching}
              />
              {totalPages > 1 ? (
                <DataTablePaginationNav
                  pageIndex={page - 1}
                  pageCount={totalPages}
                  onPageIndexChange={(nextIndex) => setPage(nextIndex + 1)}
                  navLabel="Paginación de productos del proveedor"
                  disabled={isFetching}
                />
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
