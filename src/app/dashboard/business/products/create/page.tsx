import { NewProductForm } from "@/components/products/new-product-form";
import { AssignProductToBusinessForm } from "@/components/products/assign-product-to-business-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, PackagePlus } from "lucide-react";

export default function CreateProductPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Crear producto
        </h1>
        <p className="text-muted-foreground">
          Registra un producto nuevo o asígnalo a tu negocio
        </p>
      </div>

      <Tabs defaultValue="new-product" className="w-full">
        <TabsList className="w-fit px-1 py-5 gap-2">
          <TabsTrigger
            value="new-product"
            className="gap-2 px-3 py-4 cursor-pointer border-none data-[state=active]:text-primary! data-[state=active]:border-none"
          >
            <PackagePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Crear nuevo producto</span>
            <span className="sm:hidden">Nuevo</span>
          </TabsTrigger>
          <TabsTrigger
            value="assign-product"
            className="gap-2 px-5 py-4 cursor-pointer border-none data-[state=active]:text-primary! data-[state=active]:border-none"
          >
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Asignar producto a negocio</span>
            <span className="sm:hidden">Asignar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-product" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <PackagePlus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-card-foreground">
                    Registrar nuevo producto
                  </CardTitle>
                  <CardDescription>
                    Agrega un producto nuevo al inventario del almacén
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <NewProductForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign-product" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Link2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-card-foreground">
                    Asignar producto a negocio
                  </CardTitle>
                  <CardDescription>
                    Asocia un producto existente con tu negocio
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AssignProductToBusinessForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}
