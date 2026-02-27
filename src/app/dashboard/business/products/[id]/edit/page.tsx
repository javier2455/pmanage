import { EditProductForm } from "@/components/products/edit-product-form";
import { NewProductForm } from "@/components/products/new-product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackagePlus } from "lucide-react";

export default function EditProductPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Editar producto
        </h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <PackagePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Editar producto
              </CardTitle>
              <CardDescription>
                Edita los datos del producto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="">
          <EditProductForm />
        </CardContent>
      </Card>
    </section>
  )
}

