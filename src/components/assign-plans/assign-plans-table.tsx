"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import Link from "next/link"
import { Plus, Search, Users } from "lucide-react"
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
  onPlanSelect: (user: UserDataResponse, plan: PlanResponse | null) => void
}

export function AssignPlansTable({
  users,
  plans,
  isLoading,
  onPlanSelect,
}: AssignPlansTableProps) {
  const columns = React.useMemo(
    () => createAssignPlansColumns(plans, onPlanSelect),
    [plans, onPlanSelect],
  )

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [users])

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [columnFilters])

  const table = useReactTable({
    data: users,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  const pageCount = table.getPageCount()
  const maxPageIndex = Math.max(0, pageCount - 1)
  React.useEffect(() => {
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((p) => ({ ...p, pageIndex: maxPageIndex }))
    }
  }, [maxPageIndex, pagination.pageIndex])

  const nameColumn = table.getColumn("name")
  const nameFilterValue = String(nameColumn?.getFilterValue() ?? "")
  const filteredTotal = table.getFilteredRowModel().rows.length
  const hasNameFilter = nameFilterValue.trim().length > 0

  function clearNameFilter() {
    nameColumn?.setFilterValue(undefined)
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
              Selecciona un usuario para asignarle un plan
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
              value={nameFilterValue}
              disabled={isLoading || users.length === 0}
              onChange={(e) =>
                nameColumn?.setFilterValue(
                  e.target.value.length ? e.target.value : undefined,
                )
              }
              className="h-10 pl-9"
              aria-controls="assign-plans-users-table"
            />
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
          <p className="text-center text-muted-foreground">Cargando usuarios…</p>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
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
        {filteredTotal === 0 ? (
          <div className="px-4 pb-6 pt-2">
            <Empty className="border-border border bg-muted/30">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>Sin resultados</EmptyTitle>
                <EmptyDescription>
                  No hay usuarios que coincidan con «{nameFilterValue.trim()}».
                  Prueba con otro término o limpia la búsqueda.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearNameFilter}
                >
                  Limpiar búsqueda
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto">
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

        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hasNameFilter ? (
              <>
                <span className="font-medium text-foreground">
                  {filteredTotal}
                </span>{" "}
                coincidencia{filteredTotal === 1 ? "" : "s"} de{" "}
                <span className="font-medium text-foreground">
                  {users.length}
                </span>{" "}
                usuarios
              </>
            ) : (
              <>
                Total:{" "}
                <span className="font-medium text-foreground">
                  {users.length}
                </span>{" "}
                usuario{users.length === 1 ? "" : "s"}
              </>
            )}
          </p>
          {filteredTotal > 0 ? (
            <DataTablePaginationNav
              pageIndex={pagination.pageIndex}
              pageCount={pageCount}
              onPageIndexChange={(nextIndex) =>
                setPagination((p) => ({ ...p, pageIndex: nextIndex }))
              }
              navLabel="Paginación de usuarios"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
