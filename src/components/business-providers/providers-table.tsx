"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Search, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { TooltipProvider } from "@/components/ui/tooltip"
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
import { useDeleteProviderMutation } from "@/hooks/use-provider"
import type { ProviderWithRelations } from "@/lib/types/provider"
import { createProvidersColumns } from "./providers-table-columns"
import { columnMeta } from "@/components/data-table/column-meta"
import { TableLoadingOverlay } from "@/components/data-table/table-loading-overlay"
import { toastApiError, toastSuccess } from "@/lib/toast"
import { ProviderDetailsDialog } from "./provider-details-dialog"

interface ProvidersTableProps {
  providers: ProviderWithRelations[]
  total: number
  page: number
  limit: number
  isFetching?: boolean
  search: string
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function ProvidersTable({
  providers,
  total,
  page,
  limit,
  isFetching = false,
  search,
  onSearchChange,
  onPageChange,
  onLimitChange,
}: ProvidersTableProps) {
  const deleteMutation = useDeleteProviderMutation()

  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)))

  const handleDelete = React.useCallback(
    async (providerId: string) => {
      try {
        const res = await deleteMutation.mutateAsync(providerId)
        if (res?.success) {
          toastSuccess({
            title: "Proveedor eliminado",
            description: "El proveedor se ha eliminado correctamente",
          })
        }
      } catch (error) {
        toastApiError(error, "No se pudo eliminar el proveedor. Intenta de nuevo.")
      }
    },
    [deleteMutation],
  )

  const columns = React.useMemo(
    () => createProvidersColumns(handleDelete),
    [handleDelete],
  )

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [detailsProviderId, setDetailsProviderId] = React.useState<
    string | null
  >(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const handleRowClick = React.useCallback((providerId: string) => {
    setDetailsProviderId(providerId)
    setDetailsOpen(true)
  }, [])

  const table = useReactTable({
    data: providers,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    onSortingChange: setSorting,
    state: { sorting },
  })

  const isEmpty = total === 0 && !search

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isEmpty ? (
            <div className="px-4 py-6">
              <Empty className="border-border border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Truck />
                  </EmptyMedia>
                  <EmptyTitle>Sin proveedores aún</EmptyTitle>
                  <EmptyDescription>
                    Aún no has registrado proveedores en este negocio.
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
                <Table id="providers-table" className="min-w-[720px]">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "px-4 py-3 text-foreground",
                              columnMeta(header.column).headerClassName,
                            )}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No se encontraron proveedores.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          onClick={() => handleRowClick(row.original.id)}
                          className="cursor-pointer transition-colors hover:bg-muted/60"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              onClick={
                                cell.column.id === "actions"
                                  ? (e) => e.stopPropagation()
                                  : undefined
                              }
                              className={cn(
                                "px-4 py-3 text-foreground",
                                columnMeta(cell.column).cellClassName,
                              )}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {providers.length}
              </span>{" "}
              proveedor{providers.length === 1 ? "" : "es"} de{" "}
              <span className="font-medium text-foreground">{total}</span>
              {totalPages > 1 ? (
                <>
                  {" "}
                  — Página{" "}
                  <span className="font-medium text-foreground">{page}</span> de{" "}
                  <span className="font-medium text-foreground">
                    {totalPages}
                  </span>
                </>
              ) : null}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <PageSizeSelect
                value={limit}
                onChange={onLimitChange}
                disabled={isFetching}
              />
              {totalPages > 1 ? (
                <DataTablePaginationNav
                  pageIndex={page - 1}
                  pageCount={totalPages}
                  onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                  navLabel="Paginación de proveedores"
                  disabled={isFetching}
                />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
      {detailsProviderId ? (
        <ProviderDetailsDialog
          providerId={detailsProviderId}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      ) : null}
    </TooltipProvider>
  )
}
