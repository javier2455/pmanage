import { Plus } from "lucide-react";
import Link from "next/link";

export default function EntriesPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Entradas de Productos
        </h1>
        <p className="text-muted-foreground">
          Consulta y actualiza los productos que entran a tu negocio y almacen.
        </p>
        <div className="flex justify-end items-center mb-4">
          <Link href="/dashboard/business/entries/create" className="flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-all duration-300 bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Agregar entrada de producto
            <Plus className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
