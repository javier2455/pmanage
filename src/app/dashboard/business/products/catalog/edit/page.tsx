import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { EditCatalogProductForm } from "@/components/products/edit-catalog-product-form";

export default function EditCatalogProductPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/products/catalog"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Editar producto del catálogo
          </h1>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <PackagePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Editar producto del catálogo
              </CardTitle>
              <CardDescription>
                Modifica nombre, descripción, categoría, unidad e imagen del producto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense>
            <EditCatalogProductForm />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  );
}
