import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import { UpdateStockForm } from "@/components/entries/update-stock-form"
  import { NewProductForm } from "@/components/products/new-product-form"
  import { PackageOpen, PackagePlus } from "lucide-react"
  
  export default function CreateEntriesPage() {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ingresos
          </h1>
          <p className="text-muted-foreground">
            Actualiza el stock de productos existentes o registra nuevos productos
            al almacen
          </p>
        </div>
  
        <Tabs defaultValue="update-stock" className="w-full">
          <TabsList className="w-fit px-1 py-5 gap-2 ">
            <TabsTrigger
              value="update-stock"
              className="gap-2 px-3 py-4 cursor-pointer border-none data-[state=active]:text-primary! data-[state=active]:border-none"
            >
              <PackageOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Actualizar Stock</span>
              <span className="sm:hidden">Stock</span>
            </TabsTrigger>
            <TabsTrigger
              value="new-product"
              className="gap-2 px-5 py-4 cursor-pointer border-none data-[state=active]:text-primary! data-[state=active]:border-none"
            >
              <PackagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Nuevo</span>
            </TabsTrigger>
          </TabsList>
  
          <TabsContent value="update-stock" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <PackageOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-card-foreground">
                      Actualizar stock
                    </CardTitle>
                    <CardDescription>
                      Selecciona un producto existente para actualizar su
                      inventario
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <UpdateStockForm />
              </CardContent>
            </Card>
          </TabsContent>
  
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
                      Agrega un producto nuevo al inventario del almacen
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <NewProductForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }
  
  