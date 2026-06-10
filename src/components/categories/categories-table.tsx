"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import { sileo } from "sileo";
import { Loader2, Plus, Tags } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";

import type {
  ExpenseCategory,
  GetAllExpenseCategoriesResponse,
} from "@/lib/types/expense-category";
import {
  createCategoriesColumns,
  type CategoriesColumnMeta,
} from "./categories-table-columns";
import { CategoryFormDialog } from "./category-form-dialog";
import { CATEGORY_KINDS, type CategoryKind } from "./kind-config";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): CategoriesColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as CategoriesColumnMeta;
  }
  return {};
}

interface CategoriesTableProps {
  kind: CategoryKind;
  categories: ExpenseCategory[];
  meta: GetAllExpenseCategoriesResponse["meta"];
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function CategoriesTable({
  kind,
  categories,
  meta,
  isFetching = false,
  onPageChange,
  onLimitChange,
}: CategoriesTableProps) {
  const config = CATEGORY_KINDS[kind];
  const deleteCategoryMutation = config.useDelete();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] =
    React.useState<ExpenseCategory | null>(null);

  const handleDelete = React.useCallback(
    async (categoryId: string) => {
      try {
        await deleteCategoryMutation.mutateAsync(categoryId);
        sileo.success({
          title: "Categoría eliminada correctamente",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: "La categoría se ha eliminado correctamente",
        });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          sileo.error({
            title: error.response?.data?.error ?? "Error",
            styles: { description: "text-[#dc2626]/90! text-[15px]!" },
            description: error.response.data.message,
          });
        } else {
          sileo.error({
            title: "Error al eliminar la categoría",
            fill: "",
            styles: {
              title: "text-white! text-[16px]! font-bold!",
              description: "text-white/90! text-[15px]!",
            },
            description: "Error al eliminar la categoría. Intenta de nuevo.",
          });
        }
      }
    },
    [deleteCategoryMutation],
  );

  const columns = React.useMemo(
    () =>
      createCategoriesColumns({
        kind,
        onEditCategory: (category) => setEditingCategory(category),
        onDeleteCategory: handleDelete,
      }),
    [kind, handleDelete],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: categories,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const isEmpty = meta.total === 0;

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex justify-end px-4 pt-4">
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={cn(
                "w-full shrink-0 lg:w-auto",
                isFetching && "pointer-events-none opacity-50",
              )}
              aria-disabled={isFetching}
            >
              <Plus data-icon="inline-start" />
              Nueva categoría
            </Button>
          </div>

          {isEmpty ? (
            <div className="px-4 pb-6">
              <Empty className="border-border border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Tags />
                  </EmptyMedia>
                  <EmptyTitle>{config.emptyStateTitle}</EmptyTitle>
                  <EmptyDescription>
                    {config.emptyStateDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="relative">
              {isFetching ? (
                <div
                  className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando…</span>
                  </div>
                </div>
              ) : null}
              <div
                className={cn(
                  "transition-opacity",
                  isFetching && "pointer-events-none opacity-60 select-none",
                )}
                aria-busy={isFetching}
              >
                <Table id="categories-table" className="min-w-[700px]">
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
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {categories.length}
              </span>{" "}
              de{" "}
              <span className="font-medium text-foreground">{meta.total}</span>{" "}
              categoría{meta.total === 1 ? "" : "s"}
              {meta.totalPages > 1 ? (
                <>
                  {" "}
                  — Página{" "}
                  <span className="font-medium text-foreground">
                    {meta.page}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {meta.totalPages}
                  </span>
                </>
              ) : null}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <PageSizeSelect
                value={meta.limit}
                onChange={onLimitChange}
                disabled={isFetching}
              />
              {meta.totalPages > 1 ? (
                <DataTablePaginationNav
                  pageIndex={meta.page - 1}
                  pageCount={meta.totalPages}
                  onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                  navLabel="Paginación de categorías"
                  disabled={isFetching}
                />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <CategoryFormDialog
        kind={kind}
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <CategoryFormDialog
        kind={kind}
        mode="edit"
        open={!!editingCategory}
        onOpenChange={(next) => {
          if (!next) setEditingCategory(null);
        }}
        categoryId={editingCategory?.id}
        defaultValues={
          editingCategory
            ? {
                name: editingCategory.name,
                description: editingCategory.description,
                businessId: editingCategory.businessId,
              }
            : undefined
        }
      />
    </TooltipProvider>
  );
}
