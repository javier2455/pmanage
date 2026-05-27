"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton"
import { useBusiness } from "@/context/business-context"
import { useGetAllProvidersQuery } from "@/hooks/use-provider"
import { ProvidersTable } from "@/components/business-providers/providers-table"

const DEFAULT_LIMIT = 10

export default function ProvidersPage() {
  const { activeBusinessId } = useBusiness()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isFetching, isError } = useGetAllProvidersQuery({
    page,
    limit,
    businessId: activeBusinessId ?? undefined,
  })

  const total = data?.total ?? 0

  // Filtrado client-side por nombre (el endpoint no soporta `search`).
  const filtered = useMemo(() => {
    const providers = data?.data ?? []
    if (!debouncedSearch) return providers
    return providers.filter((p) =>
      p.name.toLowerCase().includes(debouncedSearch),
    )
  }, [data?.data, debouncedSearch])

  function handleLimitChange(next: number) {
    setLimit(next)
    setPage(1)
  }

  if (isError) {
    return (
      <section>
        <p className="text-destructive">Error al cargar los proveedores.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Proveedores
        </h1>
        <p className="text-muted-foreground">
          Gestiona los proveedores de tu negocio y los productos que suministran
        </p>
        <div className="mb-4 mt-4 flex items-center justify-end">
          <Button asChild>
            <Link href="/dashboard/business/providers/create">
              <Plus data-icon="inline-start" />
              Crear proveedor
            </Link>
          </Button>
        </div>

        {isLoading && !data ? (
          <SimpleTableSkeleton />
        ) : (
          <ProvidersTable
            providers={filtered}
            total={debouncedSearch ? filtered.length : total}
            page={page}
            limit={limit}
            isFetching={isFetching}
            search={search}
            onSearchChange={setSearch}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>
    </section>
  )
}
