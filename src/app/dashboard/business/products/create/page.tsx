import { NewProductForm } from "@/components/products/new-product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Link2, PackagePlus } from "lucide-react";
import Link from "next/link";

export default function CreateProductPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/products"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Crear producto
          </h1>
          <p className="text-muted-foreground">
            Agrega un producto nuevo al inventario del almacén
          </p>
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
                Nuevo producto
              </CardTitle>
              <CardDescription>
                Completa la información del producto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <NewProductForm />
        </CardContent>
      </Card>
    </section>
  )
}
