# Gasto de reposición al asignar un producto — retirado, pendiente de reponer

> **Estado:** retirado de la interfaz el **10 de agosto de 2026**.
> El checkbox existía y se enviaba al backend, pero **el endpoint nunca lo procesó**:
> no creaba ningún gasto y aun así la aplicación confirmaba que sí. Se retira hasta
> que el backend lo soporte.

Este documento existe para que el trabajo no se pierda: qué se quitó, qué prometía,
por qué no funcionaba y qué hace falta para reponerlo.

---

## Qué era

Un checkbox —«Registrar como gasto de reposición de stock»— en el formulario de
asignación de un producto a un negocio
([assign-product-to-business-form.tsx](../src/components/products/assign-product-to-business-form.tsx)),
justo debajo del precio de entrada. Al marcarlo, el backend debía crear un gasto en la
categoría «Reposición de stock» por `entryPrice × stock`, en la moneda original, de forma
atómica con el alta del producto.

Es la misma prestación que describe la guía de backend
[089-auto-expense-stock-replenishment-frontend-guide.md](../../psearch-back/src/v2/migration_doc/089-auto-expense-stock-replenishment-frontend-guide.md).

## Por qué se retiró

El formulario asigna un producto **ya existente del catálogo**, así que llama a
`POST /businesses/:id/products`. Ese endpoint **no acepta `registerAsExpense`**: su body
es un tipo inline que no declara el campo, y `addProductToBusiness` tampoco lo tiene en su
firma. El valor viajaba en el JSON y se descartaba en silencio — el `ValidationPipe` global
no lo rechazaba porque solo actúa sobre clases DTO, no sobre tipos inline.

Encima, el frontend mostraba un toast «Gasto registrado: X CUP en Reposición de stock»
basándose solo en el valor del checkbox, sin ninguna confirmación del backend. El usuario
veía la confirmación y en la sección de Gastos no había nada.

## Qué NO se retiró

La prestación **funciona correctamente** en los otros dos caminos, y ahí sigue intacta:

| Flujo | Endpoint | Estado |
|---|---|---|
| **Agregar stock** ([update-stock-form.tsx](../src/components/inventory/update-stock-form.tsx)) | `POST /inventory/business/:businessId/product/:productId/add-stock` | ✅ Intacto |
| **Importación masiva** ([import-products-client.tsx](../src/components/products/import-products-client.tsx)) | `POST /businesses/:id/products/bulk` | ✅ Intacto |
| Alta de producto **nuevo** con negocio | `POST /product/business/:businessId` | ✅ Soportado en backend (el frontend no lo usa) |

## Qué se quitó exactamente

| Archivo | Cambio |
|---|---|
| [assign-product-to-business-form.tsx](../src/components/products/assign-product-to-business-form.tsx) | Bloque del checkbox (`Checkbox` + `Label` + descripción), el `defaultValue`, el campo del payload y el toast «Gasto registrado». |
| [validations/products.ts](../src/lib/validations/products.ts) | `registerAsExpense` de `assignProductToBusinessSchema`. |
| [types/product.ts](../src/lib/types/product.ts) | `registerAsExpense` de `CreateProductInBusinessProps`. |
| [api/product.ts](../src/lib/api/product.ts) | El campo del body de `createInBusiness`. |
| [tour/tours/sections.ts](../src/lib/tour/tours/sections.ts) | Paso `asignar-as-expense` del tour de asignación. |

`registerAsExpense` sigue existiendo en `lib/types/inventory.ts`, `lib/validations/inventory.ts`
y `lib/api/inventory.ts`: son los de agregar stock, que sí funcionan. **No tocarlos.**

---

## Cómo reponerlo

### 1. Backend (el trabajo real)

En `POST /businesses/:id/products`:

1. Añadir `registerAsExpense?: boolean` al body de `addProduct`
   ([business.controller.ts](../../psearch-back/src/v2/business/business.controller.ts)) y
   propagarlo al servicio.
2. En `addProductToBusiness`
   ([business.service.ts](../../psearch-back/src/v2/business/business.service.ts)),
   validar antes de abrir la transacción: `entryPrice > 0 && stock > 0`, con el mismo
   mensaje que los otros dos endpoints (`"entryPrice y stock son requeridos y deben ser > 0
   cuando registerAsExpense es true"`).
3. Crear el `Expense` **dentro del `queryRunner` que ya está abierto** — así la atomicidad
   sale gratis. Ya existen en ese mismo archivo las piezas necesarias:
   `findOrCreateExpenseCategory(manager, businessId, "Reposición de stock")` y el patrón
   completo en la rama de importación masiva.
4. El importe va en la **moneda original** sin convertir (`entryPrice × stock`), con
   `currency` = la moneda del costo. Es el criterio de los otros dos flujos.
5. Devolver en la respuesta si el gasto se creó (p. ej. `expenseCreated: boolean`) para que
   el frontend no vuelva a confirmar a ciegas.

### 2. Decisión pendiente: producto ya asignado

El endpoint también actualiza un producto que ya está a la venta (corrección de stock).
Hay que decidir si el gasto se registra solo en el alta nueva o también por el delta cuando
sube el stock.

**Recomendación:** solo en el alta nueva, que es el criterio de la importación masiva.
Reponer stock ya tiene su propio flujo con su propio checkbox (`add-stock`), y registrar el
gasto en ambos sitios abre la puerta a duplicarlo.

### 3. Frontend

Recuperar del historial de git lo que aparece en la tabla de arriba, con dos cambios
respecto a como estaba:

- El toast de confirmación debe condicionarse a la respuesta del backend, no al valor del
  checkbox.
- El texto del importe debe usar el helper de moneda (`formatMoney`) en vez de
  `toLocaleString("en-US")` a mano.

---

## Contexto relacionado

El mismo endpoint tenía un segundo fallo por la misma causa —`currency` y
`exchangeRateApplied` del costo también se descartaban, guardando el costo en divisa como
si fueran pesos—. **Eso sí se corrigió** el 10 de agosto de 2026:
[152-entry-price-currency-on-product-assignment.md](../../psearch-back/src/v2/migration_doc/152-entry-price-currency-on-product-assignment.md).
