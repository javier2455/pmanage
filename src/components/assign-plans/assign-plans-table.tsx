"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import Link from "next/link"
import { Loader2, Plus, Search, Users, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyContent,
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
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav"
import { PageSizeSelect } from "@/components/data-table/page-size-select"
import {
  createAssignPlansColumns,
  type AssignPlansColumnMeta,
} from "./assign-plans-table-columns"

function columnMeta(column: {
  columnDef: { meta?: unknown }
}): AssignPlansColumnMeta {
  const meta = column.columnDef.meta
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as AssignPlansColumnMeta
  }
  return {}
}

interface AssignPlansTableProps {
  users: UserDataResponse[]
  plans: PlanResponse[]
  isLoading: boolean
  isFetching: boolean
  totalUsers: number
  totalPages: number
  pageIndex: number
  pageSize: number
  onPageChange: (nextIndex: number) => void
  onPageSizeChange: (nextSize: number) => void
  searchValue: string
  onSearchChange: (value: string) => void
  onPlanSelect: (user: UserDataResponse, plan: PlanResponse | null) => void
  onExtendPlan: (user: UserDataResponse) => void
}

export function AssignPlansTable({
  users,
  plans,
  isLoading,
  isFetching,
  totalUsers,
  totalPages,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  onPlanSelect,
  onExtendPlan,
}: AssignPlansTableProps) {
  const columns = React.useMemo(
    () => createAssignPlansColumns(plans, onPlanSelect, onExtendPlan),
    [plans, onPlanSelect, onExtendPlan],
  )

  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data: users,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: true,
    manualFiltering: true,
  })

  const hasSearch = searchValue.trim().length > 0

  const pageCount = Math.max(1, totalPages)

  const canShowNoResults = !isLoading && hasSearch && users.length === 0
  const canShowEmptyState = !isLoading && !hasSearch && users.length === 0

  function clearSearch() {
    onSearchChange("")
  }

  const cardHeader = (
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">
              Lista de usuarios
            </CardTitle>
            <CardDescription>
              Busca un usuario o navega entre páginas para administrar planes
            </CardDescription>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="assign-plans-user-search"
              type="search"
              placeholder="Buscar por nombre o correo…"
              value={searchValue}
              disabled={isLoading}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 pl-9 pr-9"
              aria-controls="assign-plans-users-table"
            />
            {hasSearch ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Button asChild className="h-10 w-full sm:w-auto">
            <Link href="/dashboard/admin/assign-plans/create">
              Agregar plan
              <Plus className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </CardHeader>
  )

  if (isLoading) {
    return (
      <Card className="w-full max-w-full overflow-x-hidden">
        {cardHeader}
        <CardContent className="w-full max-w-full p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando usuarios…</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (canShowEmptyState) {
    return (
      <Card className="w-full max-w-full overflow-x-hidden">
        {cardHeader}
        <CardContent className="p-6">
          <Empty className="border-border border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Sin usuarios</EmptyTitle>
              <EmptyDescription>
                No hay usuarios registrados para mostrar.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-full overflow-x-hidden">
      {cardHeader}
      <CardContent className="w-full max-w-full p-0">
        {canShowNoResults ? (
          <div className="px-4 pb-6 pt-2">
            <Empty className="border-border border bg-muted/30">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>Sin resultados</EmptyTitle>
                <EmptyDescription>
                  No hay usuarios que coincidan con «{searchValue.trim()}». Prueba
                  con otro término o limpia la búsqueda.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSearch}
                >
                  Limpiar búsqueda
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div
            className={cn(
              "relative w-full max-w-full overflow-x-auto transition-opacity",
              isFetching && "opacity-60",
            )}
          >
            {isFetching ? (
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Actualizando…
              </div>
            ) : null}
            <Table id="assign-plans-users-table" className="min-w-[600px]">
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
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hasSearch ? (
              users.length === 0 ? (
                <>Sin coincidencias</>
              ) : (
                <>
                  Mostrando{" "}
                  <span className="font-medium text-foreground">
                    {users.length}
                  </span>{" "}
                  resultado{users.length === 1 ? "" : "s"} de{" "}
                  <span className="font-medium text-foreground">
                    {totalUsers}
                  </span>{" "}
                  usuarios
                </>
              )
            ) : (
              <>
                Total:{" "}
                <span className="font-medium text-foreground">
                  {totalUsers}
                </span>{" "}
                usuario{totalUsers === 1 ? "" : "s"}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <PageSizeSelect
              value={pageSize}
              onChange={onPageSizeChange}
              disabled={isFetching && users.length === 0}
            />
            {pageCount > 1 ? (
              <DataTablePaginationNav
                pageIndex={pageIndex}
                pageCount={pageCount}
                onPageIndexChange={onPageChange}
                navLabel="Paginación de usuarios"
                disabled={isFetching}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
