# PENDIENTE — Categorías de producto globales por usuario (Opción A)

> **Estado:** ⏸️ **Revertido en `develop`.** A la espera de que **backend** defina cómo lo va a
> implementar. Este documento conserva **todo lo que se hizo** en el frontend para poder
> re-aplicarlo sin re-investigar.

| | |
|---|---|
| **Fecha** | 2026-06-10 |
| **Commit con la implementación** | `27af9af` — *feat: implement global product categories and update related components* |
| **Revertido por** | (este cambio) — `git revert 27af9af` |
| **Base URL backend** | `https://psearch.dveloxsoft.com/api/v2` |

---

## 0. Cómo re-aplicar cuando backend esté listo

El commit original **sigue en el historial** (se revirtió, no se borró). Para volver a traer
todo el frontend:

```bash
git cherry-pick 27af9af
# o, si este doc se commiteó junto al revert y prefieres "revertir el revert":
git revert <sha-del-commit-de-revert>
```

Si el historial se reescribió y el SHA ya no existe, al final de este documento (§5) está el
**diff completo** para aplicarlo con `git apply`.

---

## 1. El problema que resuelve (por qué Opción A)

- El `Product` es **global por usuario** (`userId`, sin `businessId`): es el mismo en todos los
  negocios del usuario y tiene un único `categoryId`.
- La `ProductCategory` tenía `businessId` → pertenecía a **un solo negocio**.
- Contradicción: un producto compartido por los negocios X e Y guarda un único `categoryId`
  que físicamente solo existe en uno de ellos. En el otro negocio la categoría "se fuga" o no
  aparece en su lista filtrada.

**Opción A:** la categoría de producto pasa a ser **global por usuario**, igual que el producto.
Así el `categoryId` es válido en todos los negocios. (Las categorías de **gasto** NO cambian:
un gasto sí pertenece a un negocio — ver §4.)

---

## 2. Cambios de frontend realizados

Todo está hecho de forma *kind-aware*: los componentes de categorías se comparten entre gasto
y producto, así que se introdujo un flag `isBusinessScoped` en el config en vez de duplicar.

### Tipos / datos (solo producto)
- **`src/lib/types/product-category.ts`** — se quita `businessId` de `ProductCategory` y de
  `CreateProductCategoryProps`; se elimina la interfaz `ProductCategoryWithBusiness`.
- **`src/lib/validations/product-category.ts`** — se quita `businessId` del
  `createProductCategorySchema`.
- **`src/lib/api/product-category.ts`** — `getAllProductCategories` ya no envía `businessId`;
  `getProductCategoryById` devuelve `ProductCategory` (sin objeto `business`).
- **`src/hooks/use-product-categories.ts`** — la query ya no filtra/cachea por `businessId`
  (`queryKey` sin negocio); la invalidación al crear se simplifica a `["product-categories"]`.

### Componentes compartidos (gasto + producto)
- **`src/components/categories/kind-config.ts`** — nuevo flag `isBusinessScoped`
  (`expenses: true`, `products: false`) y nuevo tipo base **`BaseCategory`** (sin `businessId`)
  contra el que se tipan los componentes compartidos.
- **`src/components/categories/category-form-dialog.tsx`** — el campo **"Negocio" solo se
  muestra/valida cuando `isBusinessScoped`** (gastos). Para productos no se pide ni se envía
  `businessId`. Schema común con `businessId` opcional; la obligatoriedad para gastos se valida
  manualmente en `onSubmit`. El payload de crear se acota con un cast para no enviar
  `businessId` en productos (la unión de tipos de las dos mutaciones lo exigía).
- **`src/components/categories/category-details-dialog.tsx`** — la fila "Negocio" solo se
  renderiza para gastos.
- **`src/components/categories/categories-table.tsx`** y **`categories-table-columns.tsx`** —
  tipados contra `BaseCategory` en vez de `ExpenseCategory`.
- **`src/app/dashboard/business/categories/[kind]/categories-kind-client.tsx`** y
  **`src/app/dashboard/business/categories/page.tsx`** — para productos la lista carga sin
  depender del negocio activo (sin `businessId`, `enabled` siempre).

### Formularios de producto
- **`src/components/products/new-product-form.tsx`** y
  **`src/components/products/edit-catalog-product-form.tsx`** — el combobox de categorías ya no
  filtra por `businessId`; se elimina la dependencia de `useBusiness`/`activeBusinessId`.

### Otros
- **`package.json`** — bump de versión `1.3.6-alpha` → `1.3.7-alpha` (incidental al commit;
  al revertir vuelve a `1.3.6-alpha`).

### Notas de implementación
- Se **mantuvo** el fallback del form de edición que resuelve el nombre de la categoría
  seleccionada. Con categorías globales deja de ser un parche de scoping y queda como red de
  seguridad de **paginación** (por si la categoría cae fuera de las primeras 1000).
- Verificado: `tsc --noEmit` en verde; `eslint` solo con advertencias preexistentes del React
  Compiler (TanStack Table / react-hook-form `watch`).

---

## 3. Contrato que necesita BACKEND (Opción A)

> Esto es lo que el frontend ya asume. Si backend elige otra variante, hay que renegociar el
> contrato y ajustar el frontend antes de re-aplicar.

### 3.1. Modelo
La categoría de producto deja de tener `businessId` y pasa a ligarse al **usuario**:

```diff
ProductCategory {
  id: string
  name: string
  description: string
- businessId: string     // ❌ eliminar
+ userId: string         // ✅ dueño = usuario, no negocio
  createdAt, updatedAt
}
```
- Visible/usable en **todos** los negocios del usuario.
- `Product.categoryId` sigue siendo un único FK; ahora apunta a una categoría del mismo usuario.
- Sugerido: índice único `name` por `userId`.

### 3.2. Migración (la parte sensible)
1. Para cada categoría, `userId = owner(businessId)`; asignar `userId`, quitar `businessId`.
2. **Deduplicar** categorías de igual `name` por usuario y **repuntar** los `Product.categoryId`
   afectados a la superviviente antes de borrar duplicadas.
3. Verificar que ningún `Product.categoryId` quede colgando (huérfano → `null`).
4. Hacerlo en transacción; contar duplicados por usuario antes para decidir estrategia.

### 3.3. Endpoints (`/category/`, mismos paths)
Scope pasa de "por negocio" a "por usuario autenticado"; autorizar siempre por `userId` del token.

- **`GET /category/`** — devuelve las del usuario; ya no filtra por negocio. Si llega
  `businessId`, ignorarlo (el frontend ya no lo envía). Items **sin** `businessId`.
- **`GET /category/{id}/`** — solo si es del usuario; respuesta **sin** objeto `business`.
- **`POST /category/`** — body `{ name, description }` (sin `businessId`); `userId` del token.
- **`PUT /category/{id}/`** — `{ name?, description? }`; autorizar por dueño.
- **`DELETE /category/{id}/`** — autorizar por dueño; definir borrado con productos asociados
  (recomendado: poner `Product.categoryId = null`; alternativa: `409` si está en uso).

### 3.4. Asignación al producto
- `POST /product` y `PUT /product/{id}` reciben `categoryId: string | null`.
- **Validar** que ese `categoryId` pertenezca al **mismo usuario** dueño del producto.
- Al asignar producto a negocio (`POST /businesses/{businessId}/products`) **no** se recibe
  categoría por negocio: vive en el `Product` global.

---

## 4. Lo que NO cambia: categorías de gasto

`ExpenseCategory` **sigue per-negocio** (`businessId`). Es correcto: un gasto pertenece a un
negocio. Su modelo, endpoints y el campo "Negocio" del formulario **no se tocan**. Todo lo
anterior aplica **solo** a categorías de producto.

---

## 5. Diff completo (para `git apply` si se pierde el SHA)

```diff
diff --git a/package.json b/package.json
index 8599980..34f39a2 100644
--- a/package.json
+++ b/package.json
@@ -1,6 +1,6 @@
 {
   "name": "pmanage",
-  "version": "1.3.6-alpha",
+  "version": "1.3.7-alpha",
   "private": true,
   "scripts": {
     "dev": "next dev",
diff --git a/src/app/dashboard/business/categories/[kind]/categories-kind-client.tsx b/src/app/dashboard/business/categories/[kind]/categories-kind-client.tsx
index af91072..a557617 100644
--- a/src/app/dashboard/business/categories/[kind]/categories-kind-client.tsx
+++ b/src/app/dashboard/business/categories/[kind]/categories-kind-client.tsx
@@ -33,12 +33,18 @@ function CategoriesKindContent({ kind }: { kind: CategoryKind }) {
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(DEFAULT_LIMIT);
 
-  const { data, isLoading, isFetching, isError } = config.useList({
-    page,
-    limit,
-    businessId: activeBusinessId ?? undefined,
-    enabled: !!activeBusinessId,
-  });
+  // Las categorías de gasto se filtran por negocio activo; las de producto son
+  // globales y se cargan sin depender de un negocio seleccionado.
+  const { data, isLoading, isFetching, isError } = config.useList(
+    config.isBusinessScoped
+      ? {
+          page,
+          limit,
+          businessId: activeBusinessId ?? undefined,
+          enabled: !!activeBusinessId,
+        }
+      : { page, limit },
+  );
 
   function handleLimitChange(nextLimit: number) {
     setLimit(nextLimit);
diff --git a/src/app/dashboard/business/categories/page.tsx b/src/app/dashboard/business/categories/page.tsx
index ebc2bf5..d7a2526 100644
--- a/src/app/dashboard/business/categories/page.tsx
+++ b/src/app/dashboard/business/categories/page.tsx
@@ -16,12 +16,17 @@ function CategoryKindCard({ kind }: { kind: CategoryKind }) {
   const { activeBusinessId } = useBusiness();
   const [createOpen, setCreateOpen] = React.useState(false);
 
-  const { data, isLoading } = config.useList({
-    page: 1,
-    limit: 5,
-    businessId: activeBusinessId ?? undefined,
-    enabled: !!activeBusinessId,
-  });
+  // Gastos: filtradas por negocio activo. Productos: globales por usuario.
+  const { data, isLoading } = config.useList(
+    config.isBusinessScoped
+      ? {
+          page: 1,
+          limit: 5,
+          businessId: activeBusinessId ?? undefined,
+          enabled: !!activeBusinessId,
+        }
+      : { page: 1, limit: 5 },
+  );
 
   const previewItems = (data?.data ?? []).map((c) => ({
     id: c.id,
diff --git a/src/components/categories/categories-table-columns.tsx b/src/components/categories/categories-table-columns.tsx
index 2be29f3..142fd2f 100644
--- a/src/components/categories/categories-table-columns.tsx
+++ b/src/components/categories/categories-table-columns.tsx
@@ -10,9 +10,8 @@ import {
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { DeleteDialog } from "@/components/delete-dialog";
-import type { ExpenseCategory } from "@/lib/types/expense-category";
 import { CategoryDetailsDialog } from "./category-details-dialog";
-import type { CategoryKind } from "./kind-config";
+import type { BaseCategory, CategoryKind } from "./kind-config";
 
 export type CategoriesColumnMeta = {
   headerClassName?: string;
@@ -34,7 +33,7 @@ function CategoriesSortableHeader({
   label,
   className,
 }: {
-  column: Column<ExpenseCategory, unknown>;
+  column: Column<BaseCategory, unknown>;
   label: string;
   className?: string;
 }) {
@@ -53,7 +52,7 @@ function CategoriesSortableHeader({
 
 interface CreateColumnsParams {
   kind: CategoryKind;
-  onEditCategory: (category: ExpenseCategory) => void;
+  onEditCategory: (category: BaseCategory) => void;
   onDeleteCategory: (categoryId: string) => void | Promise<void>;
 }
 
@@ -61,7 +60,7 @@ export function createCategoriesColumns({
   kind,
   onEditCategory,
   onDeleteCategory,
-}: CreateColumnsParams): ColumnDef<ExpenseCategory>[] {
+}: CreateColumnsParams): ColumnDef<BaseCategory>[] {
   return [
     {
       id: "name",
diff --git a/src/components/categories/categories-table.tsx b/src/components/categories/categories-table.tsx
index 933d84d..d65f451 100644
--- a/src/components/categories/categories-table.tsx
+++ b/src/components/categories/categories-table.tsx
@@ -34,16 +34,17 @@ import { cn } from "@/lib/utils";
 import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
 import { PageSizeSelect } from "@/components/data-table/page-size-select";
 
-import type {
-  ExpenseCategory,
-  GetAllExpenseCategoriesResponse,
-} from "@/lib/types/expense-category";
+import type { GetAllExpenseCategoriesResponse } from "@/lib/types/expense-category";
 import {
   createCategoriesColumns,
   type CategoriesColumnMeta,
 } from "./categories-table-columns";
 import { CategoryFormDialog } from "./category-form-dialog";
-import { CATEGORY_KINDS, type CategoryKind } from "./kind-config";
+import {
+  CATEGORY_KINDS,
+  type BaseCategory,
+  type CategoryKind,
+} from "./kind-config";
 
 function columnMeta(column: {
   columnDef: { meta?: unknown };
@@ -57,7 +58,7 @@ function columnMeta(column: {
 
 interface CategoriesTableProps {
   kind: CategoryKind;
-  categories: ExpenseCategory[];
+  categories: BaseCategory[];
   meta: GetAllExpenseCategoriesResponse["meta"];
   isFetching?: boolean;
   onPageChange: (page: number) => void;
@@ -76,7 +77,7 @@ export function CategoriesTable({
   const deleteCategoryMutation = config.useDelete();
   const [createOpen, setCreateOpen] = React.useState(false);
   const [editingCategory, setEditingCategory] =
-    React.useState<ExpenseCategory | null>(null);
+    React.useState<BaseCategory | null>(null);
 
   const handleDelete = React.useCallback(
     async (categoryId: string) => {
@@ -307,7 +308,10 @@ export function CategoriesTable({
             ? {
                 name: editingCategory.name,
                 description: editingCategory.description,
-                businessId: editingCategory.businessId,
+                // Solo las categorías de gasto traen businessId; en las de
+                // producto (globales) es undefined y el diálogo lo ignora.
+                businessId: (editingCategory as { businessId?: string })
+                  .businessId,
               }
             : undefined
         }
diff --git a/src/components/categories/category-details-dialog.tsx b/src/components/categories/category-details-dialog.tsx
index 5a6812f..12632f6 100644
--- a/src/components/categories/category-details-dialog.tsx
+++ b/src/components/categories/category-details-dialog.tsx
@@ -94,14 +94,17 @@ export function CategoryDetailsDialog({
               </span>
             </div>
 
-            <div className="flex items-center justify-between border-b border-border py-4">
-              <span className="text-sm font-medium text-card-foreground">
-                Negocio
-              </span>
-              <span className="text-sm font-medium text-card-foreground">
-                {data.business?.name ?? "—"}
-              </span>
-            </div>
+            {config.isBusinessScoped && (
+              <div className="flex items-center justify-between border-b border-border py-4">
+                <span className="text-sm font-medium text-card-foreground">
+                  Negocio
+                </span>
+                <span className="text-sm font-medium text-card-foreground">
+                  {(data as { business?: { name: string } }).business?.name ??
+                    "—"}
+                </span>
+              </div>
+            )}
 
             <div className="flex items-center justify-between border-b border-border py-4">
               <span className="text-sm font-medium text-card-foreground">
diff --git a/src/components/categories/category-form-dialog.tsx b/src/components/categories/category-form-dialog.tsx
index 4d803bd..61323ea 100644
--- a/src/components/categories/category-form-dialog.tsx
+++ b/src/components/categories/category-form-dialog.tsx
@@ -29,14 +29,19 @@ import {
   SelectValue,
 } from "@/components/ui/select";
 
-import {
-  CreateExpenseCategoryFormData,
-  createExpenseCategorySchema,
-} from "@/lib/validations/expense-category";
+import { z } from "zod";
+import { createExpenseCategorySchema } from "@/lib/validations/expense-category";
 import { useBusiness } from "@/context/business-context";
 import { CATEGORY_KINDS, type CategoryKind } from "./kind-config";
 
-type CategoryFormData = CreateExpenseCategoryFormData;
+// Schema común a ambos tipos: `businessId` es opcional aquí porque las
+// categorías de producto son globales (no llevan negocio). Para las de gasto
+// la obligatoriedad se valida manualmente en onSubmit según `isBusinessScoped`.
+const categoryFormSchema = createExpenseCategorySchema.extend({
+  businessId: z.string().optional(),
+});
+
+type CategoryFormData = z.infer<typeof categoryFormSchema>;
 
 const SUCCESS_TOAST_STYLES = {
   title: "text-white! text-[16px]! font-bold!",
@@ -90,12 +95,13 @@ export function CategoryFormDialog({
     watch,
     formState: { errors },
   } = useForm<CategoryFormData>({
-    resolver: zodResolver(createExpenseCategorySchema),
+    resolver: zodResolver(categoryFormSchema),
     defaultValues: {
       name: defaultValues?.name ?? "",
       description: defaultValues?.description ?? "",
-      businessId:
-        defaultValues?.businessId ?? activeBusinessId ?? "",
+      businessId: config.isBusinessScoped
+        ? (defaultValues?.businessId ?? activeBusinessId ?? "")
+        : undefined,
     },
   });
 
@@ -105,11 +111,12 @@ export function CategoryFormDialog({
       reset({
         name: defaultValues?.name ?? "",
         description: defaultValues?.description ?? "",
-        businessId:
-          defaultValues?.businessId ?? activeBusinessId ?? "",
+        businessId: config.isBusinessScoped
+          ? (defaultValues?.businessId ?? activeBusinessId ?? "")
+          : undefined,
       });
     }
-  }, [open, defaultValues?.name, defaultValues?.description, defaultValues?.businessId, activeBusinessId, reset]);
+  }, [open, config.isBusinessScoped, defaultValues?.name, defaultValues?.description, defaultValues?.businessId, activeBusinessId, reset]);
 
   const selectedBusinessId = watch("businessId");
 
@@ -131,13 +138,29 @@ export function CategoryFormDialog({
           description: "La categoría se ha actualizado correctamente",
         });
       } else {
-        if (!formData.businessId) {
+        if (config.isBusinessScoped && !formData.businessId) {
           setError("businessId", {
             message: "Selecciona un negocio antes de crear la categoría.",
           });
           return;
         }
-        await createMutation.mutateAsync(formData);
+        // Las categorías de producto son globales: no se envía businessId. El
+        // cast acota la unión de tipos de las dos mutaciones a una forma común.
+        const payload: { name: string; description: string; businessId?: string } =
+          config.isBusinessScoped
+            ? {
+                name: formData.name,
+                description: formData.description,
+                businessId: formData.businessId,
+              }
+            : { name: formData.name, description: formData.description };
+        await (
+          createMutation.mutateAsync as (p: {
+            name: string;
+            description: string;
+            businessId?: string;
+          }) => Promise<unknown>
+        )(payload);
         sileo.success({
           title: "Categoría creada correctamente",
           fill: "",
@@ -220,6 +243,7 @@ export function CategoryFormDialog({
             )}
           </div>
 
+          {config.isBusinessScoped && (
           <div className="flex flex-col gap-2">
             <Label htmlFor="category-business" className="text-card-foreground">
               Negocio <span className="text-destructive">*</span>
@@ -263,6 +287,7 @@ export function CategoryFormDialog({
               </p>
             )}
           </div>
+          )}
 
           {errors.root && (
             <p className="text-sm text-destructive">{errors.root.message}</p>
diff --git a/src/components/categories/kind-config.ts b/src/components/categories/kind-config.ts
index 2401dc0..40e11ae 100644
--- a/src/components/categories/kind-config.ts
+++ b/src/components/categories/kind-config.ts
@@ -16,8 +16,23 @@ import {
 
 export type CategoryKind = "expenses" | "products";
 
+// Forma común a las categorías de gasto y de producto. Las de gasto añaden
+// `businessId`; las de producto son globales y no lo tienen. Los componentes
+// compartidos (tabla, diálogos) se tipan contra esta base.
+export interface BaseCategory {
+  id: string;
+  name: string;
+  description: string;
+  createdAt: string;
+  updatedAt?: string;
+}
+
 export interface CategoryKindConfig {
   kind: CategoryKind;
+  // true → la categoría pertenece a un negocio (gastos). false → es global por
+  // usuario (productos). Controla si se filtra por negocio, si se pide el campo
+  // "Negocio" en el formulario y si se muestra en los detalles.
+  isBusinessScoped: boolean;
   cardTitle: string;
   cardDescription: string;
   detailTitle: string;
@@ -46,6 +61,7 @@ export interface CategoryKindConfig {
 export const CATEGORY_KINDS: Record<CategoryKind, CategoryKindConfig> = {
   expenses: {
     kind: "expenses",
+    isBusinessScoped: true,
     cardTitle: "Gastos",
     cardDescription: "Categorías para clasificar tus gastos",
     detailTitle: "Categorías de Gastos",
@@ -64,6 +80,7 @@ export const CATEGORY_KINDS: Record<CategoryKind, CategoryKindConfig> = {
   },
   products: {
     kind: "products",
+    isBusinessScoped: false,
     cardTitle: "Productos",
     cardDescription: "Categorías para clasificar tus productos",
     detailTitle: "Categorías de Productos",
diff --git a/src/components/products/edit-catalog-product-form.tsx b/src/components/products/edit-catalog-product-form.tsx
index ab475e2..19aaf39 100644
--- a/src/components/products/edit-catalog-product-form.tsx
+++ b/src/components/products/edit-catalog-product-form.tsx
@@ -8,7 +8,6 @@ import {
     useGetAllProductCategoriesQuery,
     useGetProductCategoryByIdQuery,
 } from "@/hooks/use-product-categories"
-import { useBusiness } from "@/context/business-context"
 import { ProductUnit } from "@/lib/types/product"
 import { Input } from "@/components/ui/input"
 import { Label } from "@/components/ui/label"
@@ -48,13 +47,11 @@ export function EditCatalogProductForm() {
         refetchOnMount: "always",
     })
     const editProductMutation = useEditProductMutation()
-    const { activeBusinessId } = useBusiness()
+    // Las categorías de producto son globales por usuario; no se filtran por negocio.
     const { data: categoriesData, isLoading: isLoadingCategories } =
         useGetAllProductCategoriesQuery({
             page: 1,
             limit: 1000,
-            businessId: activeBusinessId ?? undefined,
-            enabled: !!activeBusinessId,
         })
     const productCategories = categoriesData?.data ?? []
 
diff --git a/src/components/products/new-product-form.tsx b/src/components/products/new-product-form.tsx
index a314a0e..d5da1cb 100644
--- a/src/components/products/new-product-form.tsx
+++ b/src/components/products/new-product-form.tsx
@@ -5,7 +5,6 @@ import Image from "next/image"
 import { usePathname, useRouter } from "next/navigation"
 import { useCreateProductMutation } from "@/hooks/use-product"
 import { useGetAllProductCategoriesQuery } from "@/hooks/use-product-categories"
-import { useBusiness } from "@/context/business-context"
 import { ProductUnit } from "@/lib/types/product"
 import { Input } from "@/components/ui/input"
 import { Label } from "@/components/ui/label"
@@ -38,13 +37,11 @@ export function NewProductForm() {
     const router = useRouter()
     const pathname = usePathname()
     const createProductMutation = useCreateProductMutation();
-    const { activeBusinessId } = useBusiness()
+    // Las categorías de producto son globales por usuario; no se filtran por negocio.
     const { data: categoriesData, isLoading: isLoadingCategories } =
         useGetAllProductCategoriesQuery({
             page: 1,
             limit: 1000,
-            businessId: activeBusinessId ?? undefined,
-            enabled: !!activeBusinessId,
         })
     const productCategories = categoriesData?.data ?? []
 
diff --git a/src/hooks/use-product-categories.ts b/src/hooks/use-product-categories.ts
index 74b7fec..de5a3ba 100644
--- a/src/hooks/use-product-categories.ts
+++ b/src/hooks/use-product-categories.ts
@@ -19,19 +19,19 @@ import {
 interface UseGetAllProductCategoriesParams {
   page?: number;
   limit?: number;
-  businessId?: string;
   enabled?: boolean;
 }
 
+// Las categorías de producto son globales por usuario, así que no se filtran ni
+// se cachean por negocio (a diferencia de las de gasto).
 export function useGetAllProductCategoriesQuery({
   page,
   limit,
-  businessId,
   enabled = true,
 }: UseGetAllProductCategoriesParams = {}) {
   return useQuery({
-    queryKey: ["product-categories", businessId ?? null, page, limit],
-    queryFn: () => getAllProductCategories({ page, limit, businessId }),
+    queryKey: ["product-categories", page, limit],
+    queryFn: () => getAllProductCategories({ page, limit }),
     placeholderData: keepPreviousData,
     enabled,
   });
@@ -50,13 +50,8 @@ export function useCreateProductCategoryMutation() {
   return useMutation({
     mutationFn: (credentials: CreateProductCategoryProps) =>
       createProductCategory(credentials),
-    onSuccess: (_, variables) => {
-      queryClient.invalidateQueries({
-        queryKey: ["product-categories", variables.businessId],
-      });
-      queryClient.invalidateQueries({
-        queryKey: ["product-categories", null],
-      });
+    onSuccess: () => {
+      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
     },
   });
 }
diff --git a/src/lib/api/product-category.ts b/src/lib/api/product-category.ts
index 0615195..81242f3 100644
--- a/src/lib/api/product-category.ts
+++ b/src/lib/api/product-category.ts
@@ -4,14 +4,12 @@ import {
   CreateProductCategoryProps,
   GetAllProductCategoriesResponse,
   ProductCategory,
-  ProductCategoryWithBusiness,
   UpdateProductCategoryProps,
 } from "../types/product-category";
 
 interface GetAllProductCategoriesParams {
   page?: number;
   limit?: number;
-  businessId?: string;
 }
 
 interface RawListResponse {
@@ -30,11 +28,10 @@ interface SingleResponse<T> {
 export async function getAllProductCategories({
   page,
   limit,
-  businessId,
 }: GetAllProductCategoriesParams = {}): Promise<GetAllProductCategoriesResponse> {
   const { data } = await apiClient.get<RawListResponse>(
     productRoutes.getAllProductCategory,
-    { params: { page, limit, businessId } },
+    { params: { page, limit } },
   );
   const items = data.data ?? [];
   const resolvedTotal = data.total ?? items.length;
@@ -54,8 +51,8 @@ export async function getAllProductCategories({
 
 export async function getProductCategoryById(
   categoryId: string,
-): Promise<ProductCategoryWithBusiness> {
-  const { data } = await apiClient.get<SingleResponse<ProductCategoryWithBusiness>>(
+): Promise<ProductCategory> {
+  const { data } = await apiClient.get<SingleResponse<ProductCategory>>(
     productRoutes.getProductCategoryById(categoryId),
   );
   return data.data;
diff --git a/src/lib/types/product-category.ts b/src/lib/types/product-category.ts
index 5572c8d..387c67b 100644
--- a/src/lib/types/product-category.ts
+++ b/src/lib/types/product-category.ts
@@ -1,19 +1,15 @@
+// Las categorías de producto son globales por usuario (no pertenecen a un
+// negocio). Un producto es el mismo en todos los negocios del usuario, por lo
+// que su categoría también debe ser la misma en todos. Por eso aquí no hay
+// `businessId` (a diferencia de las categorías de gasto).
 export interface ProductCategory {
   id: string;
   name: string;
   description: string;
-  businessId: string;
   createdAt: string;
   updatedAt?: string;
 }
 
-export interface ProductCategoryWithBusiness extends ProductCategory {
-  business: {
-    id: string;
-    name: string;
-  };
-}
-
 export interface GetAllProductCategoriesResponse {
   data: ProductCategory[];
   meta: {
@@ -27,7 +23,6 @@ export interface GetAllProductCategoriesResponse {
 export interface CreateProductCategoryProps {
   name: string;
   description: string;
-  businessId: string;
 }
 
 export type UpdateProductCategoryProps = Partial<{
diff --git a/src/lib/validations/product-category.ts b/src/lib/validations/product-category.ts
index 1e0986e..8718c3e 100644
--- a/src/lib/validations/product-category.ts
+++ b/src/lib/validations/product-category.ts
@@ -9,7 +9,6 @@ export const createProductCategorySchema = z.object({
     .string()
     .min(2, "La descripción debe tener al menos 2 caracteres")
     .max(500, "La descripción no debe exceder 500 caracteres"),
-  businessId: z.string().min(1, "Selecciona un negocio"),
 });
 
 export const updateProductCategorySchema = createProductCategorySchema
```
