# Backend — Alertas de stock bajo / agotado

> Contrato que el **backend** debe implementar para alinearse con el frontend ya construido
> en `develop`. La feature avisa visualmente cuando el stock de un producto cae por debajo de
> un umbral configurable (**stock bajo**) o llega a 0 (**agotado**).
>
> Es una **feature Pro**: configurar umbrales requiere plan Pro.

| | |
|---|---|
| **Fecha** | 2026-06-02 |
| **Base URL** | `https://psearch.dveloxsoft.com/api/v2` |
| **Spec original** | [docs/extra/análisis-planes/spec-tecnicas.md](extra/análisis-planes/spec-tecnicas.md) (Variante A) |
| **Estado frontend** | ✅ Implementado contra este contrato (a la espera del backend) |

---

## 1. Cambio en el modelo de datos

Añadir **un campo** a la entidad `BusinessProduct` (la relación producto ↔ negocio,
no al `Product` global):

```
stockAlertThreshold: number | null   // default: null  (= sin alerta configurada)
```

- `null` → el producto **no** tiene alerta de stock configurada.
- `>= 1` → umbral mínimo. Cuando `stock <= stockAlertThreshold` el producto está "en alerta".
- Solo enteros positivos. Rechazar `0` y negativos en el `PATCH` (ver §2.1).

---

## 2. Endpoints

### 2.1. Configurar / actualizar / desactivar la alerta de un producto

```
PATCH /businesses/{businessId}/products/{businessProductId}/stock-alert
```

- **Auth:** requerido. **Gating:** solo plan **Pro** → `403` si no.
- `{businessProductId}` es el id del `BusinessProduct` (el mismo `id` que el frontend recibe
  como `CurrentInventoryEntry.id` en `GET /inventory/business/:id/current`, ver §3).

**Request body:**
```json
{ "threshold": 5 }
```

- `threshold: number` → fija/actualiza el umbral (entero `>= 1`).
- `threshold: null` → **desactiva** la alerta del producto (vuelve a `stockAlertThreshold = null`).

> El frontend envía `null` cuando el usuario pulsa "Desactivar alerta". Debe aceptarse.

**Response `200 OK`:**
```json
{
  "id": "string",
  "businessProductId": "string",
  "threshold": 5,
  "updatedAt": "2026-06-02T10:00:00Z"
}
```

- `threshold` en la respuesta refleja el valor guardado (`number` o `null` si se desactivó).

**Errores esperados:**

| Código | Caso |
|---|---|
| `400` | `threshold` negativo, `0`, o no numérico (y distinto de `null`) |
| `403` | El usuario no tiene plan Pro |
| `404` | `businessProductId` no existe o no pertenece a `businessId` |

---

### 2.2. Listar las alertas configuradas del negocio

```
GET /businesses/{businessId}/stock-alerts
```

- **Auth:** requerido. **Gating:** Pro (el frontend solo lo llama para usuarios Pro).
- Devuelve **solo** los productos que tienen `stockAlertThreshold != null`, indicando con
  `isLow` cuáles están actualmente por debajo o en el umbral.

**Response `200 OK`:**
```json
{
  "alerts": [
    {
      "productId": "string",
      "businessProductId": "string",
      "name": "Arroz",
      "category": "Granos",
      "unit": "kg",
      "stock": 3,
      "threshold": 5,
      "isLow": true
    }
  ]
}
```

- `isLow: true` **⟺** `stock <= threshold`. Lo calcula el backend (el frontend confía en este flag
  para el banner-resumen y para el badge numérico opcional del sidebar).
- `unit`: uno de `kg | lb | g | L | mL | ud`.
- Si el negocio no tiene alertas configuradas → `{ "alerts": [] }`.

---

### 2.3. Aceptar el umbral al **asignar** un producto al negocio

El umbral puede definirse de dos formas (no excluyentes):

1. **Al asignar el producto al negocio** (este endpoint) — valor inicial opcional.
2. **Más tarde**, desde el inventario, vía `PATCH .../stock-alert` (§2.1).

Por eso, el endpoint que ya crea el `BusinessProduct` debe aceptar un campo **opcional**
`stockAlertThreshold`:

```
POST /businesses/{businessId}/products
```

**Request body (campo añadido):**
```jsonc
{
  "productId": "string",
  "price": 120,
  "entryPrice": 90,
  "stock": 50,
  "stockAlertThreshold": 5   // ← OPCIONAL (number | null). Ausente/null = sin alerta.
}
```

- El frontend **solo** envía `stockAlertThreshold` cuando el usuario es **Pro** y rellenó el campo
  (que aparece oculto para no-Pro). Si llega para un usuario no Pro, el backend debe ignorarlo o
  responder `403` (criterio del backend; el frontend nunca lo manda en ese caso).
- Mismas validaciones que §2.1: entero `>= 1`, o `null`.
- Si se omite, el `BusinessProduct` se crea con `stockAlertThreshold = null` (sin alerta).

---

## 3. Recomendado (no bloqueante): embeber el umbral en el inventario actual

El frontend ya soporta **dos caminos** para conocer el umbral de cada fila de la tabla de stock,
en este orden de prioridad:

1. **`stockAlertThreshold` embebido en cada entrada** de `GET /inventory/business/:id/current`.
2. Fallback: cruce por `businessProductId` con el resultado de `GET .../stock-alerts`.

👉 **Recomendación:** añadir `stockAlertThreshold` a cada item de la respuesta de
`GET /inventory/business/:id/current`:

```jsonc
{
  "id": "string",            // = businessProductId (clave de correlación)
  "businessId": "string",
  "productId": "string",
  "price": "120.00",
  "stock": 3,
  "entryPrice": "90.00",
  "updatedAt": "2026-06-02T10:00:00Z",
  "stockAlertThreshold": 5,  // ← AÑADIR (number | null)
  "product": { /* ... */ }
}
```

Con esto la tabla pinta el badge "Stock bajo" sin depender de una segunda llamada.
`GET .../stock-alerts` sigue siendo necesario para el **banner-resumen** y para contar alertas activas.

> **Importante:** el frontend usa `CurrentInventoryEntry.id` como `businessProductId` tanto para
> el `PATCH` (§2.1) como para el cruce con `/stock-alerts`. Si `id` **no** fuese el id del
> `BusinessProduct`, hay que ajustar la respuesta para exponerlo (o coordinar el cambio de clave).

---

## 4. Lógica de estado en el frontend (referencia)

El badge visual se deriva así (`src/lib/stock-alert.ts`):

| Condición | Estado | Badge |
|---|---|---|
| `stock === 0` | `out` | 🔴 "Sin stock" (se muestra **aunque no haya umbral**) |
| `threshold != null && stock <= threshold` (y `stock > 0`) | `low` | 🟡 "Stock bajo" |
| resto | `ok` | — (sin badge) |

> Nota: "Sin stock" se muestra siempre que `stock = 0`, independientemente del umbral, porque un
> producto agotado siempre es relevante. "Stock bajo" sí requiere umbral configurado.

---

## 5. Entrega de notificaciones (email / WhatsApp) — relacionado

La tarjeta de preferencias (`src/components/business/notification-settings-card.tsx`) ya está
construida y, además del aviso visual in-app, permite elegir **por qué vía** recibir cada aviso.
Necesita su propio endpoint (también pendiente en backend):

```
PUT /businesses/{businessId}/notification-settings
```

**Request body** (forma actual que envía el frontend):
```json
{
  "notifications": {
    "dailyClose":   { "email": false, "whatsapp": false },
    "monthlyClose": { "email": false, "whatsapp": false },
    "lowStock":     { "email": true,  "whatsapp": false },
    "outOfStock":   { "email": true,  "whatsapp": true  }
  }
}
```

- `lowStock` / `outOfStock` son las dos claves que conectan con esta feature:
  - **lowStock** → disparar cuando `stock <= stockAlertThreshold` (requiere umbral configurado).
  - **outOfStock** → disparar cuando `stock` llega a 0.
- **Gating de canales (a respetar en backend):**
  - Plan **free**: notificaciones deshabilitadas por completo.
  - Plan **básico**: solo `email`.
  - Plan **pro**: `email` + `whatsapp` (WhatsApp requiere que el negocio tenga `phone` válido E.164).
- `GET /businesses/{businessId}/notification-settings` (mismo shape) sería útil para precargar el
  estado guardado al abrir la tarjeta (hoy el frontend parte de todo en `false`).

> El **disparo** real de la notificación (cron/evento al registrar venta o al caer el stock) es
> lógica de backend. El frontend solo gestiona el **umbral**, la **visualización** y las **preferencias** de canal.

---

## 6. Checklist para backend

- [ ] Campo `stockAlertThreshold (number | null, default null)` en `BusinessProduct`.
- [ ] `PATCH /businesses/{businessId}/products/{businessProductId}/stock-alert` (acepta `threshold: number | null`, gating Pro, errores 400/403/404).
- [ ] `POST /businesses/{businessId}/products` acepta `stockAlertThreshold` **opcional** al asignar (§2.3).
- [ ] `GET /businesses/{businessId}/stock-alerts` con `isLow` calculado.
- [ ] (Recomendado) `stockAlertThreshold` embebido en `GET /inventory/business/:id/current`.
- [ ] Confirmar que `CurrentInventoryEntry.id === businessProductId`.
- [ ] (Relacionado) `GET`/`PUT /businesses/{businessId}/notification-settings` + disparo de avisos `lowStock`/`outOfStock`.
