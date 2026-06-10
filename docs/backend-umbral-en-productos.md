# Backend — Incluir `stockAlertThreshold` en `GET /businesses/:businessId/products`

| | |
|---|---|
| **Fecha** | 2026-06-10 |
| **Base URL** | `https://psearch.dveloxsoft.com/api/v2` |
| **Endpoint a modificar** | `GET /businesses/{businessId}/products` |
| **Doc relacionado** | [docs/backend-alertas-stock.md](backend-alertas-stock.md) (contrato general de la feature) |
| **Estado frontend** | ✅ Preparado: el tipo y los componentes ya leen el campo; sin él, caen a un default visual |

---

## El problema

La feature de **alertas de stock** muestra un badge junto al stock de cada producto:

- 🔴 **"Sin stock"** cuando el stock es 0.
- 🟡 **"Stock bajo"** cuando `stock <= umbral` (y `stock > 0`).
- (sin badge) cuando hay stock suficiente.

El **umbral** (`stockAlertThreshold`) es un campo **por negocio-producto** (entidad `BusinessProduct`),
no del `Product` global: cada negocio decide a partir de qué cantidad considera "bajo" un mismo producto.

Hoy el frontend obtiene ese umbral de dos maneras, según la pantalla:

| Pantalla | De dónde saca el stock/umbral | ¿Tiene el umbral? |
|---|---|---|
| **Tabla de inventario** (`/dashboard/business/inventory`) | `GET /inventory/business/:id/current` + fallback `GET /businesses/:id/stock-alerts` | ✅ Sí (vía fallback) |
| **Form "Dar entrada"** (`/dashboard/business/inventory/create`) | `GET /businesses/:businessId/products` | ❌ **No** |
| **Crear venta** (`/dashboard/business/sales/create`) | `GET /businesses/:businessId/products` | ❌ **No** |

El endpoint `GET /businesses/:businessId/products` **no devuelve `stockAlertThreshold`**. Por eso, en
el form de entrada y en la creación de venta, el badge **nunca** puede usar el umbral configurado por
el usuario: siempre cae a un umbral por defecto puramente visual (5 unidades).

> Síntoma adicional ya corregido en frontend: el form leía el campo de un objeto donde no existía
> (`product.stockAlertThreshold`), lo que en runtime era siempre `undefined`. Era código muerto que
> aparentaba funcionar. Ahora el frontend lee el lugar correcto (`BusinessWithProducts.stockAlertThreshold`),
> a la espera de que el backend lo rellene.

## La solución y por qué

**Incluir `stockAlertThreshold` en cada item de `GET /businesses/:businessId/products`.**

¿Por qué esta vía y no otra?

- **Una sola llamada, dato fresco.** El form ya pide este endpoint para poblar el selector de productos.
  Embeber el umbral evita una segunda petición (`/stock-alerts`) y la lógica de cruce por id en el cliente.
- **Consistencia con inventario.** Es el mismo enfoque ya recomendado para
  `GET /inventory/business/:id/current` (ver §3 de [backend-alertas-stock.md](backend-alertas-stock.md)).
  Si ambos endpoints embeben el campo, el frontend deja de depender del fallback `/stock-alerts` para el badge.
- **Sin cambios de modelo.** El campo `stockAlertThreshold` **ya existe** en `BusinessProduct` (lo define
  el contrato general). Aquí solo hay que **exponerlo** en la respuesta de este endpoint; no hay migración nueva.

El frontend ya está listo: el día que la respuesta incluya el campo, el badge usa el umbral real
automáticamente, sin tocar más código.

---

## Pasos para el backend

### Paso 1 — Confirmar que el campo existe en el modelo

`BusinessProduct` debe tener `stockAlertThreshold: number | null` (default `null`). Esto ya está
especificado en [backend-alertas-stock.md §1](backend-alertas-stock.md). Si aún no se implementó ese
campo, hacerlo primero (es prerequisito de toda la feature).

### Paso 2 — Incluir el campo en la query/serialización del endpoint

En el handler de `GET /businesses/{businessId}/products`, añadir `stockAlertThreshold` del
`BusinessProduct` a cada item devuelto. Es a **nivel raíz** del item (junto a `stock`, `price`), **no**
dentro del objeto `product` anidado.

### Paso 3 — Responder con esta forma

**Request:**
```
GET /businesses/{businessId}/products
Authorization: Bearer <token>
```

**Response `200 OK` (campo añadido marcado con ←):**
```jsonc
{
  "message": "string",
  "data": [
    {
      "id": "string",                 // = businessProductId
      "businessId": "string",
      "productId": "string",
      "price": "120.00",
      "stock": 50,
      "updatedAt": "2026-06-10T10:00:00Z",
      "stockAlertThreshold": 5,        // ← AÑADIR (number | null). null = sin alerta.
      "product": {
        "id": "string",
        "name": "Arroz",
        "description": null,
        "category": { "id": "string", "name": "Granos", "description": null },
        "unit": "kg",
        "imageUrl": null,
        "active": true,
        "createdAt": "2026-06-01T10:00:00Z"
      }
    }
  ]
}
```

### Paso 4 — Reglas del valor

- `null` (o ausente) → el producto **no** tiene alerta configurada. El frontend usará su default visual.
- `number` → entero `>= 1`. Es el mismo valor que se fija vía
  `PATCH /businesses/{businessId}/products/{businessProductId}/stock-alert` (ver
  [backend-alertas-stock.md §2.1](backend-alertas-stock.md)).
- No hace falta calcular `isLow` aquí: el frontend deriva el estado del badge a partir de `stock` y
  `stockAlertThreshold` (la tabla de la lógica está en [backend-alertas-stock.md §4](backend-alertas-stock.md)).

### Paso 5 — Gating Pro (opcional, criterio backend)

`stockAlertThreshold` solo es relevante para usuarios **Pro** (son los únicos que pueden configurarlo).
Para usuarios no-Pro puede devolverse siempre `null`. No es bloqueante: si llega un número para un
no-Pro, el frontend lo trata igual (solo afecta el color del badge visual, no dispara notificaciones).

---

## Checklist backend

- [ ] `BusinessProduct.stockAlertThreshold (number | null, default null)` existe (prerequisito, §1 del doc general).
- [ ] `GET /businesses/{businessId}/products` incluye `stockAlertThreshold` a nivel raíz de cada item.
- [ ] El valor es `null` cuando no hay alerta, o el entero `>= 1` configurado.
- [ ] `id` del item sigue siendo el `businessProductId` (clave de correlación, igual que en inventario).

---

## Referencia: qué hace el frontend con el campo

- **Tipo:** `BusinessWithProducts.stockAlertThreshold?: number | null` — [src/lib/types/business.ts](../src/lib/types/business.ts).
- **Form de entrada:** [src/components/inventory/update-stock-form.tsx](../src/components/inventory/update-stock-form.tsx)
  pasa `selectedProduct.stockAlertThreshold` a `getStockAlertStatus`.
- **Crear venta:** [src/app/dashboard/business/sales/create/page.tsx](../src/app/dashboard/business/sales/create/page.tsx) hace lo mismo.
- **Derivación del badge:** [src/lib/stock-alert.ts](../src/lib/stock-alert.ts) → si `threshold` es `null`/ausente,
  usa `DEFAULT_LOW_STOCK_THRESHOLD` (solo visual; no dispara avisos).
- **Normalización por unidad:** [src/lib/units.ts](../src/lib/units.ts) → `ud` se redondea a entero; peso/volumen
  (kg, lb, g, L, mL) admite decimales, para que el número mostrado y el badge nunca se contradigan.
