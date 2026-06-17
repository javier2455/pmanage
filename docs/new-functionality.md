# Guía para el Frontend — Ventas Multimoneda, Pagos y Facturación

> Documento orientado al agente de frontend que consumirá los endpoints de ventas, pagos y facturación en v2.
> Base path: `/v2`

---

## 1. Resumen del flujo

1. El usuario **crea una venta** con `currency` (default `CUP`).
2. El backend **valida la moneda** contra `MonetaryExchange` del negocio (si no es `CUP`).
3. El usuario **registra pagos** parciales o completos en una o varias monedas.
4. El backend convierte cada pago a la moneda base de la venta usando la tasa del negocio.
5. Cuando `totalPaid >= total`, la venta pasa a `paid`.
6. El usuario **descarga la factura PDF** solo si la venta está `paid`.

---

## 2. Configuración previa

Antes de permitir pagos multimoneda, el frontend debe consultar la configuración de tasas del negocio para mostrar al usuario las monedas disponibles.

**Endpoint:**
```
GET /v2/monetary-exchange/business/:businessId
```
*(Ver módulo MonetaryExchange existente)*

La respuesta incluye las tasas activas (USD, EURO, MLC, etc.). Solo las monedas con `tasa > 0` están disponibles.
CUP siempre está disponible implícitamente con tasa 1.

---

## 3. Endpoints

### 3.1. POST /v2/sales — Crear venta

Crea una venta. Ahora acepta `currency` (default `CUP`). Si la moneda no es `CUP`, debe estar configurada en `MonetaryExchange`.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**

| Campo | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| `idbusiness` | string (uuid) | sí | — | ID del negocio |
| `items` | array | sí | — | Productos vendidos |
| `items[].idproducto` | string (uuid) | sí | — | ID del producto |
| `items[].quantity` | number | sí | — | Cantidad |
| `items[].price` | number | sí | — | Precio unitario |
| `descripcion` | string | no | — | Descripción de la venta |
| `currency` | string | no | `"CUP"` | Moneda base de la venta (`USD`, `CUP`, `EURO`, `MLC`, etc.) |
| `saleType` | string | no | `"in_store"` | `in_store` / `delivery` / `pickup` |
| `deliveryAddress` | string | no | — | Requerido si `saleType = delivery` |
| `deliveryContactPhone` | string | no | — | Teléfono de contacto |
| `deliveryContactName` | string | no | — | Nombre de contacto |

**Response 201:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (uuid) | ID de la venta |
| `idbusiness` | string (uuid) | ID del negocio |
| `total` | number | Total de la venta en `currency` |
| `currency` | string | Moneda base (`CUP`, `USD`, etc.) |
| `paymentStatus` | string | `pending` / `partially_paid` / `paid` / `cancelled` |
| `totalPaid` | number | Total acumulado pagado (en `currency`) |
| `items` | array | Items de la venta |
| `saleType` | string | Tipo de venta |
| `isCancelled` | boolean | Si está cancelada |
| `createdAt` | string (ISO) | Fecha de creación |

**Errores relevantes:**

| Status | Código | Descripción |
|--------|--------|-------------|
| 400 | `MONEDA_NO_CONFIGURADA` | La moneda no está en `MonetaryExchange` del negocio |
| 400 | `MONEDAS_NO_CONFIGURADAS` | El negocio no tiene `MonetaryExchange` y la moneda no es `CUP` |

---

### 3.2. POST /v2/sales/:saleId/payments — Registrar pagos

Registra uno o varios pagos en diferentes monedas para una venta.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body (RegistrarPagoDto):**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `pagos` | array | sí | Array de pagos (mínimo 1) |
| `pagos[].moneda` | string | sí | Código de moneda (`USD`, `CUP`, `EURO`, `MLC`, etc.) |
| `pagos[].monto` | number | sí | Monto original en esa moneda |
| `pagos[].metodo` | string | sí | `cash` / `transfer` / `card` / `crypto` |
| `pagos[].referencia` | string | no | Referencia de la operación (ticket, TX ID, etc.) |

**Response 200:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `resumen.totalVenta` | number | Total de la venta en moneda base |
| `resumen.totalPagado` | number | Total acumulado pagado |
| `resumen.pendiente` | number | Falta por pagar |
| `resumen.monedaBase` | string | Moneda base de la venta |
| `resumen.estado` | string | `pending` / `partially_paid` / `paid` |
| `resumen.pagos` | array | Pagos registrados en esta llamada |
| `resumen.pagos[].id` | string | ID del pago |
| `resumen.pagos[].moneda` | string | Moneda del pago |
| `resumen.pagos[].monto` | number | Monto original |
| `resumen.pagos[].tasa` | number | Tasa aplicada (1 para moneda base) |
| `resumen.pagos[].equivalente` | number | Monto convertido a moneda base |
| `resumen.pagos[].metodo` | string | Método de pago |
| `resumen.pagos[].referencia` | string | Referencia (si aplica) |
| `resumen.pagos[].fecha` | string (ISO) | Fecha del pago |
| `resumen.sugerencia` | object | Sugerencia de pago para completar (si falta) |

**`sugerencia` cuando `pendiente > 0`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sugerencia.moneda` | string | Moneda sugerida (USD o CUP según disponibilidad) |
| `sugerencia.monto` | number | Monto sugerido para completar |
| `sugerencia.tasa` | number | Tasa usada para la sugerencia |

**Errores relevantes:**

| Status | Código | Descripción |
|--------|--------|-------------|
| 400 | `MONEDA_NO_CONFIGURADA` | Moneda del pago no configurada en `MonetaryExchange` |
| 400 | `PAGO_EXCEDE_TOTAL` | La suma de pagos supera el total de la venta |
| 400 | `MONEDAS_NO_CONFIGURADAS` | El negocio no tiene tasas configuradas para la moneda del pago |

---

### 3.3. GET /v2/sales/:saleId/payments/summary — Resumen de pagos

Obtiene el estado actual de pagos de una venta. Útil para refrescar la UI después de registrar pagos.

**Response 200:**

Igual que `resumen` en el endpoint anterior, pero con **todos** los pagos de la venta (no solo los últimos).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalVenta` | number | Total de la venta |
| `totalPagado` | number | Total pagado acumulado |
| `pendiente` | number | Falta por pagar |
| `monedaBase` | string | Moneda base |
| `estado` | string | Estado de pago |
| `pagos` | array | Historial completo |
| `sugerencia` | object / null | Sugerencia de pago restante |

---

### 3.4. GET /v2/sales/:saleId/payments — Historial de pagos

Lista todos los pagos registrados para una venta.

**Response 200 (array):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (uuid) | ID del pago |
| `sale` | object | `{ id: string }` — Venta asociada |
| `currency` | string | Moneda del pago |
| `amount` | number | Monto original |
| `exchangeRateApplied` | number | Tasa usada |
| `amountInBaseCurrency` | number | Monto normalizado |
| `method` | string | Método de pago |
| `reference` | string / null | Referencia |
| `createdById` | string / null | Usuario que registró |
| `createdAt` | string (ISO) | Fecha |

---

### 3.5. GET /v2/sales/:saleId/factura — Descargar factura PDF

Genera y descarga la factura PDF de una venta. **Solo disponible si `paymentStatus = 'paid'`**.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```
Content-Type: application/pdf
Content-Disposition: inline; filename="factura-{saleId}.pdf"
Content-Length: <bytes>

[PDF binario]
```

El frontend debe abrirlo en una pestaña nueva o descargarlo según prefiera el usuario.

**Errores relevantes:**

| Status | Descripción |
|--------|-------------|
| 400 | La venta no está completamente pagada |
| 404 | Venta no encontrada |

---

### 3.6. POST /v2/sales/:saleId/factura/regenerate — Regenerar factura

Fuerza la regeneración de la factura PDF. Reemplaza la factura anterior.

**Response:** Igual que `GET /factura`.

---

## 4. Convenciones de moneda y tasas

### 4.1. Moneda base

- `CUP` es la moneda base implícita del sistema. No requiere tasa configurada.
- Si la venta es en `CUP`, los pagos en `CUP` tienen `tasa = 1`.
- Si la venta es en `USD`, los pagos en `USD` tienen `tasa = 1`.

### 4.2. Tasa de cambio

- La tasa se define en `MonetaryExchange` por negocio.
- Cada columna representa **cuántas CUP vale 1 unidad de esa moneda**.
  - Ejemplo: `USD = 300` → 1 USD = 300 CUP
- Al registrar un pago, la tasa se **congela** en `Payment.exchangeRateApplied`.
- Si el negocio cambia la tasa mañana, los pagos ya registrados mantienen su tasa original.

### 4.3. Cálculo de conversión

```
pago en moneda base (misma moneda):
  amountInBaseCurrency = monto * 1

pago en moneda distinta:
  amountInBaseCurrency = monto * tasa_desde_MonetaryExchange
```

**Ejemplo:**
- Venta en USD, total = 312 USD
- Pago: 200 USD → `amountInBase = 200 * 1 = 200 USD`
- Pago: 33,600 CUP → tasa USD = 300 → `amountInBase = 33600 * (1/300) = 112 USD`

---

## 5. Estados de pago

| Estado | Condición |
|--------|-----------|
| `pending` | `totalPaid = 0` |
| `partially_paid` | `0 < totalPaid < total` |
| `paid` | `totalPaid >= total - 0.01` |
| `cancelled` | La venta fue cancelada |

El margen de redondeo es `0.01` para evitar falsos negativos por precisión decimal.

---

## 6. Ejemplos de flujo completo

### Ejemplo A: Venta en USD, pago completo en una moneda

```http
POST /v2/sales
{
  "idbusiness": "biz-uuid",
  "currency": "USD",
  "items": [
    { "idproducto": "prod-laptop", "quantity": 1, "price": 300 },
    { "idproducto": "prod-cargador", "quantity": 2, "price": 6 }
  ]
}
```

```http
POST /v2/sales/{saleId}/payments
{
  "pagos": [
    { "moneda": "USD", "monto": 312, "metodo": "card" }
  ]
}
```

→ `paymentStatus: paid`, `totalPaid: 312`

```http
GET /v2/sales/{saleId}/factura
→ PDF de factura
```

---

### Ejemplo B: Venta en USD, pago mixto (parcial)

```http
POST /v2/sales/{saleId}/payments
{
  "pagos": [
    { "moneda": "USD", "monto": 200, "metodo": "cash", "referencia": "CAJA-001" },
    { "moneda": "CUP", "monto": 100, "metodo": "transfer", "referencia": "TX-123" }
  ]
}
```

→ `paymentStatus: partially_paid`, `totalPaid: 200.33`, `pendiente: 111.67`

El `resumen.sugerencia` devuelve:
```json
{
  "moneda": "USD",
  "monto": 111.67,
  "tasa": 1
}
```

---

### Ejemplo C: Venta en CUP (sin configuración de tasas)

```http
POST /v2/sales
{
  "idbusiness": "biz-uuid",
  "items": [
    { "idproducto": "prod-laptop", "quantity": 1, "price": 15000 }
  ]
  // currency no enviado → default CUP
}
```

```http
POST /v2/sales/{saleId}/payments
{
  "pagos": [
    { "moneda": "CUP", "monto": 15000, "metodo": "cash" }
  ]
}
```

→ `paymentStatus: paid` (sin necesidad de `MonetaryExchange`)

---

## 7. Recomendaciones para el frontend

### 7.1. Validación temprana de moneda

Antes de crear la venta:
1. Consultar `GET /monetary-exchange/business/:businessId` (si existe el módulo en el front).
2. Extraer las monedas con tasa > 0.
3. Mostrar en el selector de moneda:
   - `CUP` (siempre disponible)
   - `USD` (si `USD > 0` en `MonetaryExchange`)
   - `EURO`, `MLC`, etc. (según disponibilidad)

### 7.2. Sugerencia de pago pendiente

Usar `sugerencia` del endpoint `summary` para mostrar al usuario cuánto falta pagar y en qué moneda.

Ejemplo de UI:
```
Total venta: 312 USD
Pagado:     200.33 USD
Pendiente:  111.67 USD
Sugerido:   111.67 USD  (o 33,500 CUP si prefiere pagar en CUP)
```

### 7.3. Manejo de errores

- Si el backend devuelve `MONEDA_NO_CONFIGURADA`, refrescar las tasas desde `MonetaryExchange` y actualizar el selector de moneda.
- Si el backend devuelve `PAGO_EXCEDE_TOTAL`, mostrar el exceso exacto para que el usuario ajuste el monto.

### 7.4. Factura PDF

- Mostrar botón de factura solo cuando `paymentStatus === 'paid'`.
- Al hacer clic:
  - `GET /v2/sales/:saleId/factura` abre el PDF en nueva pestaña.
  - Si falla con 400, mostrar mensaje: "La venta debe estar completamente pagada para generar la factura".
- Considerar cachear el PDF en el frontend (el backend lo regenera on-demand, pero el contenido es determinista una vez `paid`).

### 7.5. Estados de la venta a reflejar en UI

| paymentStatus | Mostrar |
|---------------|---------|
| `pending` | "Pendiente de pago" — botón "Registrar pago" |
| `partially_paid` | "Pago parcial — faltan X" — botón "Agregar pago" + resumen |
| `paid` | "Pagada" — botón "Ver factura" |
| `cancelled` | "Cancelada" — deshabilitar pagos |

---

## 8. Referencia rápida de endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/v2/sales` | Crear venta (con `currency` opcional) |
| `POST` | `/v2/sales/:saleId/payments` | Registrar pagos multimoneda |
| `GET` | `/v2/sales/:saleId/payments/summary` | Resumen de pagos |
| `GET` | `/v2/sales/:saleId/payments` | Historial de pagos |
| `GET` | `/v2/sales/:saleId/factura` | Descargar factura PDF |
| `POST` | `/v2/sales/:saleId/factura/regenerate` | Regenerar factura PDF |

Todos requieren `Authorization: Bearer <token>`.

---

## 9. Preguntas frecuentes

**P: ¿Puedo cambiar la moneda de una venta después de creada?**
R: No directamente. La moneda queda definida en `sale.currency` al crear. Si necesitas cambiarla, debes cancelar la venta y crear una nueva.

**P: ¿Qué pasa si registro un pago en una moneda, luego cambia la tasa en MonetaryExchange?**
R: Nada. El pago ya guardó `exchangeRateApplied` con la tasa del momento. Los pagos futuros usarán la nueva tasa.

**P: ¿Se pueden descontar pagos?**
R: No en esta versión. Para revertir un pago, se debe cancelar la venta completa (lo que devuelve el stock).

**P: ¿La factura se guarda en disco?**
R: No por defecto. Se genera on-demand. El backend puede guardarla como mejora futura.

---

## 10. Compras de inventario multimoneda

Además de las ventas, el flujo de **entrada de stock** (compras a proveedores) también soporta multimoneda en v2.

### 10.1. Endpoint

`POST /v2/inventory/business/:businessId/product/:productId/add-stock`

Agrega stock a un producto y registra el costo de compra en la moneda indicada.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body (`AddStockDto`):**

| Campo | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| `quantity` | number | sí | — | Cantidad a agregar al stock |
| `entryPrice` | number | no | — | Precio de costo **por unidad** en la moneda indicada |
| `currency` | string | no | `"CUP"` | Moneda del precio (`USD`, `CUP`, `EURO`, `MLC`, etc.) |
| `exchangeRateApplied` | number | no | — | Tasa para convertir `entryPrice` a CUP. Si se omite, se obtiene desde `MonetaryExchange` del negocio |
| `description` | string | no | — | Descripción adicional de la compra |

> **Importante:** Si `currency` es distinta de `CUP`, el sistema valida que la moneda tenga tasa configurada en `MonetaryExchange`. De lo contrario, retorna error `MONEDA_COMPRA_NO_CONFIGURADA`.

**Response 201 (`InventoryHistory`):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (uuid) | ID del historial |
| `businessId` | string | Negocio |
| `productId` | string | Producto |
| `quantity` | number | Cantidad agregada |
| `previousStock` | number | Stock anterior |
| `newStock` | number | Stock nuevo |
| `entryPrice` | number | Costo convertido a **CUP** |
| `unitPrice` | number | Costo unitario en CUP (solo si `currency === "CUP"`) |
| `currency` | string | Moneda original de la compra |
| `provider` | object / null | Proveedor (si se envía `providerId`) |
| `description` | string | Descripción |
| `createdAt` | string (ISO) | Fecha |

### 10.2. Comportamiento de la conversión

- `entryPrice` se interpreta en la moneda indicada en `currency`.
- El backend **siempre** almacena `business_products.entry_price` y `InventoryHistory.entryPrice` en **CUP** (convertido).
- Si `currency === "CUP"`, `exchangeRateApplied` se ignora y la tasa es 1.
- Si `currency !== "CUP"`:
  1. Usa `exchangeRateApplied` si viene en el request.
  2. Si no, busca la tasa en `MonetaryExchange` del negocio.
  3. Convierte: `entryPriceCUP = entryPrice * tasa`.

### 10.3. Ejemplos

**Ejemplo A: Compra en CUP (sin configuración)**

```http
POST /v2/inventory/business/:businessId/product/:productId/add-stock
{
  "quantity": 50,
  "entryPrice": 120,
  "description": "Compra local"
}
```

→ `currency = "CUP"`, `entryPrice en historial = 120 CUP`

---

**Ejemplo B: Compra en USD con tasa automática**

```http
GET /v2/monetary-exchange/business/:businessId
```

```json
{ "USD": 300, "EURO": 330, ... }
```

```http
POST /v2/inventory/business/:businessId/product/:productId/add-stock
{
  "quantity": 20,
  "entryPrice": 5,
  "currency": "USD",
  "description": "Importación"
}
```

→ `entryPrice en historial = 5 * 300 = 1500 CUP`

---

**Ejemplo C: Compra en USD con tasa explícita**

```http
POST /v2/inventory/business/:businessId/product/:productId/add-stock
{
  "quantity": 10,
  "entryPrice": 4.5,
  "currency": "USD",
  "exchangeRateApplied": 285,
  "description": "Compra con tasa pactada"
}
```

→ `entryPrice en historial = 4.5 * 285 = 1282.5 CUP`

### 10.4. Validaciones y errores relevantes

| Status | Código | Descripción |
|--------|--------|-------------|
| 400 | `MONEDA_COMPRA_NO_CONFIGURADA` | La moneda indicada no está en `MonetaryExchange` y no fue `CUP` |
| 404 | `NotFoundException` | Producto o negocio no encontrado |
| 403 | `ForbiddenException` | Sin permisos sobre el producto |

### 10.5. Recomendaciones para el frontend

1. **Selector de moneda**: reutilizar las monedas disponibles desde `GET /v2/monetary-exchange/business/:businessId`. CUP siempre está disponible por defecto.
2. **Tasa editable**: mostrar la tasa obtenida de `MonetaryExchange`, pero permitir que el usuario la modifique si la compra usa otra tasa pactada con el proveedor. Enviar ese valor en `exchangeRateApplied`.
3. **Costo en CUP**: el frontend puede recalcular `entryPrice * exchangeRateApplied` para mostrarle al usuario el costo real en CUP antes de confirmar la compra.
4. **Historial**: usar `GET /v2/inventory/business/:businessId/product/:productId/history` para ver los movimientos. El campo `currency` indica en qué moneda se realizó la compra original.

---

## 11. Referencia rápida de endpoints (actualizada)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/v2/sales` | Crear venta (con `currency` opcional) |
| `POST` | `/v2/sales/:saleId/payments` | Registrar pagos multimoneda |
| `GET` | `/v2/sales/:saleId/payments/summary` | Resumen de pagos |
| `GET` | `/v2/sales/:saleId/payments` | Historial de pagos |
| `GET` | `/v2/sales/:saleId/factura` | Descargar factura PDF |
| `POST` | `/v2/sales/:saleId/factura/regenerate` | Regenerar factura PDF |
| `POST` | `/v2/inventory/business/:businessId/product/:productId/add-stock` | Agregar stock (compra) con moneda y tasa |
| `GET` | `/v2/inventory/business/:businessId/current` | Inventario actual |
| `GET` | `/v2/inventory/business/:businessId/product/:productId/history` | Historial de inventario |
| `GET` | `/v2/inventory/business/:businessId/history` | Historial general del negocio |

Todos requieren `Authorization: Bearer <token>`.