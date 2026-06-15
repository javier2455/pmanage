# Backend — Editar la categoría de un producto dentro de un negocio

> Contrato que el **backend** debe implementar para alinearse con el frontend ya construido
> en `develop`. Permite **cambiar (o quitar) la categoría** de un producto ya asignado a un
> negocio, sin tener que eliminarlo y volver a asignarlo.

| | |
|---|---|
| **Fecha** | 2026-06-15 |
| **Base URL** | `https://psearch.dveloxsoft.com/api/v2` |
| **Relacionado** | [docs/category.md](category.md) (la categoría vive en `BusinessProduct`), [docs/backend-alertas-stock.md](backend-alertas-stock.md) (mismo patrón de endpoint granular por campo) |
| **Estado frontend** | ✅ Implementado contra este contrato (a la espera del backend) |

---

## 1. Contexto

Desde la feature 27 ([docs/category.md](category.md)) la categoría dejó de vivir en el `Product`
(catálogo global) y pasó al **`BusinessProduct`** (la relación producto ↔ negocio): un mismo
producto puede tener categorías distintas en cada negocio.

Hoy la categoría **solo se puede fijar al asignar** el producto al negocio
(`POST /businesses/{businessId}/products`, campo `categoryId`). **No existe** forma de cambiarla
después. Los únicos updates sobre un `BusinessProduct` existente son granulares por campo:

- `PUT /product/business-product/{businessProductId}/price` — actualiza el precio.
- `PATCH /businesses/{businessId}/products/{businessProductId}/stock-alert` — actualiza el umbral.

Este doc añade el endpoint que falta, **siguiendo el mismo patrón** que `stock-alert`.

**No requiere cambios de modelo de datos:** el campo `category` / `categoryId` ya existe en
`BusinessProduct`. Solo hay que exponer un endpoint para actualizarlo.

---

## 2. Endpoint

### Cambiar / quitar la categoría de un `BusinessProduct`

```
PATCH /businesses/{businessId}/products/{businessProductId}/category
```

- **Auth:** requerido. Autorizar por **dueño del negocio** (mismo criterio que el resto de
  operaciones sobre el `BusinessProduct`).
- `{businessProductId}` es el id del `BusinessProduct` (el mismo `id` que el frontend recibe en
  cada item de `GET /businesses/{businessId}/products` — ver §3).

**Request body:**
```jsonc
{
  "categoryId": "uuid-de-categoria"   // string  → asigna/cambia la categoría
}
```
o bien:
```jsonc
{
  "categoryId": null                  // null    → quita la categoría (queda "Sin categoría")
}
```

- `categoryId: string` → fija o cambia la categoría del `BusinessProduct`.
- `categoryId: null` → **des-asigna** la categoría (vuelve a `category = null`). El frontend
  envía `null` cuando el usuario limpia el selector. **Debe aceptarse.**

**Validaciones:**

- La `categoryId` (cuando no es `null`) debe existir y **pertenecer al mismo negocio/dueño**.
  Si no, `404` (o `400`, ver tabla).

**Response `200 OK`:**
```jsonc
{
  "id": "string",                 // = businessProductId
  "businessId": "string",
  "productId": "string",
  "category": {                   // refleja el valor guardado; null si se quitó
    "id": "string",
    "name": "Frutas",
    "description": null
  },
  "updatedAt": "2026-06-15T10:00:00Z"
}
```

- `category` en la respuesta refleja el estado final (objeto embebido o `null`).
- El frontend no depende del cuerpo de la respuesta para refrescar (invalida la lista de
  productos del negocio), pero devolver el objeto actualizado es lo deseable y consistente con
  `stock-alert`.

**Errores esperados:**

| Código | Caso |
|---|---|
| `400` | `categoryId` con formato inválido (ni string ni `null`) |
| `403` | El usuario no es dueño del negocio |
| `404` | `businessProductId` no existe / no pertenece a `businessId`, **o** la `categoryId` indicada no existe / no pertenece al negocio |

---

## 3. Nota de correlación

El frontend usa como `businessProductId` el campo **`id`** que devuelve cada item de
`GET /businesses/{businessId}/products` (es el id raíz del `BusinessProduct`, junto a `price`,
`stock`, `category`). Es la misma clave que ya se usa para `PUT .../price`. Si por alguna razón
ese `id` **no** fuese el del `BusinessProduct`, hay que ajustar la respuesta del listado para
exponerlo (o coordinar el cambio de clave), igual que se anotó para alertas de stock.

---

## 4. Por qué un endpoint dedicado (y no extender el de precio)

Se eligió esta forma (Opción A) en lugar de generalizar `PUT .../price` a un update parcial
del `BusinessProduct` porque:

- Sigue el **patrón ya establecido** por `stock-alert` (un endpoint granular por campo).
- Mantiene **limpio el historial de precios**: el `PUT .../price` registra un `PriceHistoryEntry`
  en cada llamada (ver [docs/extra/análisis-planes/spec-tecnicas.md](extra/análisis-planes/spec-tecnicas.md)).
  Mezclar el cambio de categoría ahí generaría entradas de historial espurias.
- Separa responsabilidades: cambiar categoría no debe tocar precio ni viceversa.

> En el frontend, si el usuario edita precio **y** categoría a la vez, se disparan **dos**
> llamadas independientes (`PUT .../price` y este `PATCH .../category`), cada una con su propia
> validación. El frontend solo envía la(s) que realmente cambió.

---

## 5. Checklist para backend

- [ ] `PATCH /businesses/{businessId}/products/{businessProductId}/category` acepta
      `{ categoryId: string | null }`.
- [ ] `categoryId: null` des-asigna la categoría (no es error).
- [ ] Valida que la `categoryId` (no nula) exista y pertenezca al negocio/dueño.
- [ ] Autorización por dueño del negocio (errores `403` / `404`).
- [ ] Devuelve el `BusinessProduct` actualizado (con `category` embebida o `null`).
- [ ] Confirmar que el `id` del item en `GET /businesses/{businessId}/products` es el `businessProductId`.
