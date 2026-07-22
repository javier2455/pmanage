"use client"

import Link from "next/link"
import type { Column, ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DeleteDialog } from "@/components/delete-dialog"
import type { ProviderWithRelations } from "@/lib/types/provider"

export type ProvidersColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

const compactMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies ProvidersColumnMeta

function ProvidersSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<ProviderWithRelations, unknown>
  label: string
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "-ml-2 h-8 px-2 lg:-ml-4"}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  )
}

export function createProvidersColumns(
  onDelete: (providerId: string) => void | Promise<void>,
): ColumnDef<ProviderWithRelations>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.name,
      meta: {
        headerClassName: "min-w-[220px] align-top",
        cellClassName: "min-w-[220px] align-top",
      } satisfies ProvidersColumnMeta,
      header: ({ column }) => (
        <ProvidersSortableHeader column={column} label="Proveedor" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "contactName",
      accessorFn: (row) => row.contactName ?? "",
      meta: compactMeta,
      header: ({ column }) => (
        <ProvidersSortableHeader column={column} label="Contacto" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">
          {row.original.contactName ?? "—"}
        </span>
      ),
    },
    {
      id: "email",
      accessorFn: (row) => row.email ?? "",
      meta: compactMeta,
      header: ({ column }) => (
        <ProvidersSortableHeader column={column} label="Email" />
      ),
      cell: ({ row }) =>
        row.original.email ? (
          <a
            href={`mailto:${row.original.email}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            {row.original.email}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "phone",
      accessorFn: (row) => row.phone ?? "",
      meta: compactMeta,
      header: ({ column }) => (
        <ProvidersSortableHeader column={column} label="Teléfono" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.phone ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies ProvidersColumnMeta,
      header: () => (
        <div className="text-right font-medium text-foreground">Acciones</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Abrir acciones"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              <Link
                href={`/dashboard/business/providers/edit?id=${row.original.id}`}
                className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Pencil className="size-4 text-primary" />
                Editar
              </Link>
              <DeleteDialog
                deleteType="Proveedor"
                name={row.original.name}
                onConfirm={() => onDelete(row.original.id)}
                trigger={
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Trash2 className="size-4 text-destructive" />
                    Eliminar
                  </button>
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
    },
  ]
}
