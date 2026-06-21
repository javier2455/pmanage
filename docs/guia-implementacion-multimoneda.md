# Guía de implementación — Ventas Multimoneda, Pagos y Facturación

> Documento de referencia para leer con calma antes de implementar.
> Resume **todo lo que entrega el backend** (origen: [new-functionality.md](./new-functionality.md))
> y lo organiza **por fases** para el frontend.
>
> Base path de la API: `/v2` → en este proyecto `https://psearch.dveloxsoft.com/api/v2`
> (constante `BASIC_ROUTE` en [src/lib/routes/index.ts](../src/lib/routes/index.ts)).
> Todas las peticiones requieren `Authorization: Bearer <token>` (ya lo inyecta el
> interceptor de [src/lib/axios.ts](../src/lib/axios.ts)).

---

## 0. Visión general — ¿qué cambia y por qué?

### El problema que resolvemos

Hoy una venta es un evento atómico en una sola moneda implícita (CUP, mostrada
como "MN" y formateada como COP en varios componentes). Solo tiene dos estados:
"Efectuada" o "Cancelada" (`isCancelled: boolean`). **No existe el concepto de pago.**

Esto no refleja la realidad del negocio:

- Las ventas se cotizan en distintas monedas (CUP, USD, EURO, MLC…).
- Los clientes pagan en **varias monedas a la vez** y de forma **parcial** (abonos).
- Cada pago debe **congelar la tasa** del momento, para que no se distorsione si
  la tasa cambia mañana.
- Hace falta una **factura PDF** formal cuando la venta queda pagada.
- Las **compras a proveedores** (entrada de stock) también ocurren en divisas y su
  costo debe normalizarse a CUP.

### El flujo completo (de principio a fin)

1. El usuario **crea una venta** eligiendo `currency` (default `CUP`).
2. El backend **valida la moneda** contra la configuración de tasas del negocio
   (`MonetaryExchange`) si no es `CUP`.
3. El usuario **registra pagos** parciales o completos, en una o varias monedas.
4. El backend **convierte cada pago** a la moneda base de la venta usando la tasa
   del negocio, y **congela esa tasa** en el pago.
5. Cuando `totalPagado >= total`, la venta pasa a estado `paid`.
6. El usuario **descarga la factura PDF** (solo si la venta está `paid`).

### Las 3 fases de implementación

| Fase | Alcance | Qué entrega al usuario |
|------|---------|------------------------|
| **Fase 1** | Ventas con moneda + pagos multimoneda | Crear venta en cualquier moneda, registrar abonos, ver estado de pago |
| **Fase 2** | Facturación PDF | Descargar/regenerar la factura de una venta pagada |
| **Fase 3** | Compras de inventario multimoneda | Registrar entrada de stock con costo en divisa, normalizado a CUP |

---

## 0.1. Estado de implementación (actualizado 2026-06-20)

> **Todo lo descrito en esta guía ya está implementado en el frontend.** Esta
> sección resume el estado real, las **desviaciones** respecto a la guía y lo que
> queda **pendiente del backend**. El resto del documento se conserva como
> especificación/referencia.

| Fase | Estado | Notas |
|------|--------|-------|
| **Fase 1** — Ventas + pagos | ✅ Implementado | Selector de moneda al crear venta, dialog de pagos multimoneda con preview de equivalente y `sugerencia`, badges de `paymentStatus` en tabla y detalle. |
| **Fase 2** — Factura PDF | ✅ Implementado | Descargar **y regenerar** (ambos botones en el detalle, solo cuando la venta está `paid`). |
| **Fase 3** — Compras (add-stock) | ✅ Implementado | Selector de moneda + preview del costo convertido a CUP. **Desviación:** la tasa se toma automática de `MonetaryExchange` y se **envía** como `exchangeRateApplied` (no es editable), por decisión de producto. |

**Extras implementados (fuera de la guía original):**

- **Asignar producto al negocio multimoneda** (`createWithBusiness`): el `entryPrice`
  admite `currency` + `exchangeRateApplied`, igual que add-stock. Componente
  compartido `EntryCostCurrency`
  ([src/components/products/entry-cost-currency.tsx](../src/components/products/entry-cost-currency.tsx))
  reutilizado en ambos formularios. Contrato en [multimoneda-productos.md](./multimoneda-productos.md).
- **Tipo de venta + entrega** (`saleType` + `deliveryAddress`/`deliveryContactPhone`/`deliveryContactName`):
  selector en el carrito ([sale-cart-panel.tsx](../src/components/sales/sale-cart-panel.tsx))
  con campos de delivery condicionales y validación (dirección obligatoria si `saleType = delivery`).
- **Gastos multimoneda** (`currency` en el gasto): tipos, validación, selector en el
  formulario y visualización por moneda con `formatMoney`. ⚠️ **Bloqueado por backend** (ver pendientes).
- **Util compartido de errores** `mapCurrencyError`
  ([src/lib/currency-errors.ts](../src/lib/currency-errors.ts)), usado en pagos, productos y stock.

**Pendiente del backend (no es frontend):**

- 🐞 **Bug de conversión de pagos con base ≠ CUP:** el backend **invierte el cruce de
  tasas**; un pago en EUR sobre una venta en USD se acredita mal y la venta no llega a
  `paid`. Caso reproducible y fórmula correcta en
  [docs/bug-conversion-pagos-multimoneda.md](./bug-conversion-pagos-multimoneda.md).
- 🚧 **Gastos `currency`:** `POST /api/v2/expenses` responde `400 "property currency
  should not exist"` (el DTO no acepta el campo). El frontend ya lo envía; falta
  añadir/desplegar `currency` en el backend de gastos.
- ❓ **Negocio sin delivery:** `POST /v2/sales` con `saleType: delivery` puede responder
  `400 "Este negocio no ofrece servicio de delivery/mensajería"`. La regla vive en el
  backend y **no está expuesta** en el front (el tipo `Business` no tiene flag de
  delivery). Pendiente: confirmar la condición y, si procede, exponer el flag para
  deshabilitar la opción en la UI.

---

## 1. Conceptos base de moneda y tasas (leer primero)

Estos conceptos aplican a **todas** las fases.

### 1.1. Moneda base

- **`CUP` es la moneda base implícita** del sistema. No requiere configuración.
- Si la venta es en `CUP`, los pagos en `CUP` tienen `tasa = 1`.
- Si la venta es en `USD`, los pagos en `USD` tienen `tasa = 1`.
  (es decir: un pago en la **misma** moneda que la venta siempre tiene tasa 1).

### 1.2. La tasa de cambio

- Se define por negocio en `MonetaryExchange` (en el front ya existe la pantalla
  **Tasa de cambio**, con su hook `useExchangeRate`).
- **Cada tasa representa cuántas CUP vale 1 unidad de esa moneda.**
  - Ejemplo: `USD = 300` significa **1 USD = 300 CUP**.
- Al registrar un pago, la tasa se **congela** en el campo `exchangeRateApplied`
  del pago. Si el negocio cambia la tasa después, los pagos ya registrados
  **mantienen** su tasa original; solo los pagos futuros usan la tasa nueva.

### 1.3. Cómo se convierte

```
Pago en la MISMA moneda que la venta:
    montoEnMonedaBase = monto × 1

Pago en OTRA moneda:
    montoEnMonedaBase = monto × tasa_de_esa_moneda   (desde MonetaryExchange)
```

**Ejemplo (venta en USD, total = 312 USD):**

- Pago de **200 USD** → `equivalente = 200 × 1 = 200 USD`
- Pago de **33 600 CUP** → tasa USD = 300 → `equivalente = 33 600 × (1/300) = 112 USD`
- Total pagado: `200 + 112 = 312 USD` → venta `paid`.

> ⚠️ **Nota para el frontend (conversión de precios al crear la venta):** los
> precios de los productos están guardados en CUP. Si el usuario crea la venta en
> otra moneda, para **mostrar** y **enviar** los precios hay que convertir:
> `precioEnMoneda = precioCUP / tasa`. Ejemplo: 68 000 CUP a USD (tasa 300) →
> `68 000 / 300 = 226.67 USD`. Conviene confirmar con backend si los `items[].price`
> del `POST /sales` se esperan ya en la moneda de la venta (lo más probable) o en CUP.

### 1.4. Monedas disponibles en los selectores

El selector de moneda **no es una lista fija**. Se deriva de la configuración de
tasas del negocio:

- Consultar `GET /v2/monetary-exchange/business/:businessId` (hook `useExchangeRate`).
- Tomar las monedas con **tasa > 0**.
- `CUP` siempre disponible (tasa 1, no necesita configuración).

> Si el negocio no tiene USD/EURO configurados con tasa > 0, **solo aparecerá CUP**.
> Es el comportamiento esperado.

### 1.5. Estados de pago

| Estado | Condición |
|--------|-----------|
| `pending` | `totalPagado = 0` |
| `partially_paid` | `0 < totalPagado < total` |
| `paid` | `totalPagado >= total - 0.01` |
| `cancelled` | La venta fue cancelada |

El margen de `0.01` evita falsos negativos por precisión decimal.

Mapeo a UI (qué mostrar en cada estado):

| `paymentStatus` | UI |
|-----------------|-----|
| `pending` | "Pendiente de pago" + botón **Registrar pago** |
| `partially_paid` | "Pago parcial — faltan X" + botón **Agregar pago** + resumen |
| `paid` | "Pagada" + botón **Ver factura** |
| `cancelled` | "Cancelada" — pagos deshabilitados |

---

## 2. FASE 1 — Ventas multimoneda + Pagos

**Objetivo:** poder crear ventas en cualquier moneda configurada, registrar pagos
(parciales y mixtos), y ver el estado de pago de cada venta.

### 2.1. Endpoints que entrega el backend

#### `POST /v2/sales` — Crear venta (ahora con `currency`)

**Body:**

| Campo | Tipo | Req. | Default | Descripción |
|-------|------|------|---------|-------------|
| `idbusiness` | uuid | sí | — | ID del negocio |
| `items` | array | sí | — | Productos vendidos |
| `items[].idproducto` | uuid | sí | — | ID del producto |
| `items[].quantity` | number | sí | — | Cantidad |
| `items[].price` | number | sí | — | Precio unitario |
| `descripcion` | string | no | — | Descripción |
| `currency` | string | no | `"CUP"` | Moneda base de la venta |
| `saleType` | string | no | `"in_store"` | `in_store` / `delivery` / `pickup` |
| `deliveryAddress` | string | no | — | Requerido si `saleType = delivery` |
| `deliveryContactPhone` | string | no | — | Teléfono de contacto |
| `deliveryContactName` | string | no | — | Nombre de contacto |

**Respuesta 201 (campos relevantes nuevos):**

| Campo | Descripción |
|-------|-------------|
| `id` | ID de la venta |
| `total` | Total **en `currency`** |
| `currency` | Moneda base (`CUP`, `USD`, …) |
| `paymentStatus` | `pending` / `partially_paid` / `paid` / `cancelled` |
| `totalPaid` | Total acumulado pagado (en `currency`) |
| `items`, `saleType`, `isCancelled`, `createdAt` | … |

**Errores:**

| Status | Código | Cuándo |
|--------|--------|--------|
| 400 | `MONEDA_NO_CONFIGURADA` | La moneda no está en `MonetaryExchange` del negocio |
| 400 | `MONEDAS_NO_CONFIGURADAS` | El negocio no tiene tasas y la moneda no es `CUP` |

---

#### `POST /v2/sales/:saleId/payments` — Registrar pagos

Registra **uno o varios** pagos, en diferentes monedas, para una venta.

**Body (`RegistrarPagoDto`):**

| Campo | Tipo | Req. | Descripción |
|-------|------|------|-------------|
| `pagos` | array | sí | Mínimo 1 pago |
| `pagos[].moneda` | string | sí | Código (`USD`, `CUP`, `EURO`, `MLC`…) |
| `pagos[].monto` | number | sí | Monto **original** en esa moneda |
| `pagos[].metodo` | string | sí | `cash` / `transfer` / `card` / `crypto` |
| `pagos[].referencia` | string | no | Ticket, TX ID, etc. |

**Respuesta 200 — objeto `resumen`:**

| Campo | Descripción |
|-------|-------------|
| `resumen.totalVenta` | Total de la venta (moneda base) |
| `resumen.totalPagado` | Total acumulado pagado |
| `resumen.pendiente` | Falta por pagar |
| `resumen.monedaBase` | Moneda base de la venta |
| `resumen.estado` | `pending` / `partially_paid` / `paid` |
| `resumen.pagos[]` | Pagos registrados en **esta** llamada |
| `resumen.pagos[].id` | ID del pago |
| `resumen.pagos[].moneda` | Moneda del pago |
| `resumen.pagos[].monto` | Monto original |
| `resumen.pagos[].tasa` | Tasa aplicada (1 si es la moneda base) |
| `resumen.pagos[].equivalente` | Monto convertido a la moneda base |
| `resumen.pagos[].metodo` | Método |
| `resumen.pagos[].referencia` | Referencia (si aplica) |
| `resumen.pagos[].fecha` | Fecha ISO |
| `resumen.sugerencia` | Sugerencia para completar (si falta), o `null` |

**`sugerencia` (cuando `pendiente > 0`):**

| Campo | Descripción |
|-------|-------------|
| `sugerencia.moneda` | Moneda sugerida (USD o CUP según disponibilidad) |
| `sugerencia.monto` | Monto sugerido para completar |
| `sugerencia.tasa` | Tasa usada |

**Errores:**

| Status | Código | Cuándo |
|--------|--------|--------|
| 400 | `MONEDA_NO_CONFIGURADA` | Moneda del pago no configurada |
| 400 | `PAGO_EXCEDE_TOTAL` | La suma de pagos supera el total |
| 400 | `MONEDAS_NO_CONFIGURADAS` | El negocio no tiene tasas para esa moneda |

---

#### `GET /v2/sales/:saleId/payments/summary` — Resumen de pagos

Estado actual de pagos de una venta. **Útil para refrescar la UI** y para conocer
la moneda base y el total reales. Devuelve la misma forma que `resumen`, pero con
**todos** los pagos de la venta (no solo los últimos):

| Campo | Descripción |
|-------|-------------|
| `totalVenta` | Total de la venta |
| `totalPagado` | Total pagado acumulado |
| `pendiente` | Falta por pagar |
| `monedaBase` | Moneda base |
| `estado` | Estado de pago |
| `pagos[]` | Historial completo |
| `sugerencia` | Sugerencia de pago restante, o `null` |

---

#### `GET /v2/sales/:saleId/payments` — Historial de pagos

Lista todos los pagos registrados. **Respuesta 200 (array):**

| Campo | Descripción |
|-------|-------------|
| `id` | ID del pago |
| `sale` | `{ id: string }` — venta asociada |
| `currency` | Moneda del pago |
| `amount` | Monto original |
| `exchangeRateApplied` | Tasa congelada |
| `amountInBaseCurrency` | Monto normalizado a la moneda base |
| `method` | Método |
| `reference` | Referencia o `null` |
| `createdById` | Usuario que registró, o `null` |
| `createdAt` | Fecha ISO |

### 2.2. Nuevas interfaces (TypeScript) a crear

En [src/lib/types/sales.ts](../src/lib/types/sales.ts):

```ts
type PaymentStatus = "pending" | "partially_paid" | "paid" | "cancelled";
type PaymentMethod = "cash" | "transfer" | "card" | "crypto";
type SaleType = "in_store" | "delivery" | "pickup";

// Ampliar SaleWithProductAndBusiness con: currency, paymentStatus, totalPaid, saleType?
// Ampliar CreateSaleProps con: currency?, saleType?, deliveryAddress?,
//                              deliveryContactPhone?, deliveryContactName?

interface RegistrarPagoItem { moneda: string; monto: number; metodo: PaymentMethod; referencia?: string }
interface RegistrarPagoDto  { pagos: RegistrarPagoItem[] }

interface PagoResumenItem { id; moneda; monto; tasa; equivalente; metodo; referencia?; fecha }
interface PagoSugerencia  { moneda: string; monto: number; tasa: number }
interface PaymentsSummary {
  totalVenta; totalPagado; pendiente; monedaBase: string;
  estado: PaymentStatus; pagos: PagoResumenItem[]; sugerencia: PagoSugerencia | null;
}
interface PaymentHistoryItem {
  id; sale: { id }; currency; amount; exchangeRateApplied;
  amountInBaseCurrency; method; reference: string | null;
  createdById: string | null; createdAt;
}
```

### 2.3. Pasos de implementación (Fase 1)

1. **Util de moneda** (`src/lib/currency.ts`):
   - `getAvailableCurrencies(exchangeRate)` → monedas con tasa > 0 + CUP.
     Tolerar tasas que vengan como **string** (`Number(value)`).
   - `getCurrencyRate(exchangeRate, currency)` → tasa (1 para CUP), o `null`.
   - `convertFromBase(montoCUP, currency, exchangeRate)` → `montoCUP / tasa`.
   - `formatMoney(value, currency?)` → formatea con código de moneda como sufijo.
     **No usar `Intl` con `style: "currency"`** porque `EURO`/`MLC` no son ISO 4217 válidos.
2. **Tipos** → ampliar [src/lib/types/sales.ts](../src/lib/types/sales.ts) (ver 2.2).
3. **Rutas** → añadir a [src/lib/routes/sales.ts](../src/lib/routes/sales.ts):
   `registerPayments`, `paymentsSummary`, `paymentsHistory`.
4. **API** → en [src/lib/api/sale.ts](../src/lib/api/sale.ts): `registerPayments`,
   `getPaymentsSummary`, `getPaymentsHistory`; ampliar el tipo de `create`.
5. **Hooks** → en [src/hooks/use-sales.ts](../src/hooks/use-sales.ts):
   `usePaymentsSummary`, `usePaymentsHistory`, `useRegisterPaymentsMutation`
   (invalidar `payments-summary`, `payments-history`, `sale-by-id`, lista, etc.).
6. **Validación** (`src/lib/validations/payments.ts`): esquema Zod del array de
   pagos (moneda contra las disponibles, monto > 0, método válido).
7. **UI — crear venta** ([sales/create/page.tsx](../src/app/dashboard/business/sales/create/page.tsx)
   + [sale-cart-panel.tsx](../src/components/sales/sale-cart-panel.tsx)):
   selector de moneda (de `getAvailableCurrencies`), conversión de precios al
   mostrar y al enviar, total con la moneda elegida.
8. **UI — dialog de pagos** (`src/components/sales/payment-dialog.tsx`): lista
   editable de pagos, resumen total/pagado/pendiente, `sugerencia`, preview del
   equivalente, manejo de errores por código.
9. **UI — detalle de venta** ([details-dialog.tsx](../src/components/sales/details-dialog.tsx)):
   mostrar moneda, badge de `paymentStatus`, pagado/pendiente, botón de pago.
10. **UI — tabla** ([sales-table-columns.tsx](../src/components/sales/sales-table-columns.tsx)):
    badge de `paymentStatus` (4 estados) y total con la moneda de cada venta.

### 2.4. Cómo verificar la Fase 1

- Crear venta en USD → `currency: USD`, estado `pending`.
- Registrar pago mixto (USD + CUP) → ver conversión (`equivalente`),
  `partially_paid`, `pendiente` y `sugerencia`.
- Completar el pago → `paid`.
- Probar errores: `PAGO_EXCEDE_TOTAL`, `MONEDA_NO_CONFIGURADA`.
- Venta en CUP sin tasas configuradas → flujo completo sin errores.

---

## 3. FASE 2 — Facturación PDF

**Objetivo:** descargar o regenerar la factura PDF de una venta **pagada**.

### 3.1. Endpoints

#### `GET /v2/sales/:saleId/factura` — Descargar factura PDF

Genera y devuelve el PDF. **Solo si `paymentStatus = 'paid'`.**

**Respuesta 200:**

```
Content-Type: application/pdf
Content-Disposition: inline; filename="factura-{saleId}.pdf"
[PDF binario]
```

**Errores:**

| Status | Cuándo |
|--------|--------|
| 400 | La venta no está completamente pagada |
| 404 | Venta no encontrada |

#### `POST /v2/sales/:saleId/factura/regenerate` — Regenerar factura

Fuerza la regeneración y reemplaza la anterior. Misma respuesta que `GET /factura`.

### 3.2. Pasos de implementación (Fase 2)

1. **Rutas** → `factura(saleId)`, `regenerateFactura(saleId)`.
2. **API** → `downloadFactura(saleId): Promise<Blob>` y `regenerateFactura(...)`
   con `{ responseType: "blob" }`.
   > Reutilizar el patrón ya existente en
   > [src/lib/api/accounting-close.ts](../src/lib/api/accounting-close.ts)
   > (`exportToPdf` usa `responseType: "blob"`).
3. **Hooks** → `useDownloadFacturaMutation` / `useRegenerateFacturaMutation`
   (sin invalidación; disparan la descarga en `onSuccess`).
4. **UI** → reutilizar el helper `downloadBlob` (existe en la página de cierre
   contable diario) para crear `URL.createObjectURL` y abrir en pestaña nueva.
   Botón **"Ver factura"** en el detalle, **visible solo si `paymentStatus === 'paid'`**.
   Si responde 400 → toast: "La venta debe estar completamente pagada para generar la factura".

### 3.3. Notas

- La factura **no se guarda en disco** por defecto: se genera on-demand. Es
  determinista una vez la venta está `paid`, por lo que se puede cachear en el front.
- No se puede cambiar la moneda de una venta ya creada (habría que cancelarla y
  crear otra). No se pueden descontar pagos (para revertir, se cancela la venta).

---

## 4. FASE 3 — Compras de inventario multimoneda

**Objetivo:** registrar entrada de stock indicando el costo en una divisa; el
backend lo normaliza a CUP automáticamente.

### 4.1. Endpoint

#### `POST /v2/inventory/business/:businessId/product/:productId/add-stock`

**Body (`AddStockDto`):**

| Campo | Tipo | Req. | Default | Descripción |
|-------|------|------|---------|-------------|
| `quantity` | number | sí | — | Cantidad a agregar |
| `entryPrice` | number | no | — | Precio de costo **por unidad** en la moneda indicada |
| `currency` | string | no | `"CUP"` | Moneda del precio |
| `exchangeRateApplied` | number | no | — | Tasa para convertir a CUP; si se omite, se toma de `MonetaryExchange` |
| `description` | string | no | — | Descripción de la compra |

> Si `currency` ≠ `CUP` y no hay tasa configurada → error `MONEDA_COMPRA_NO_CONFIGURADA`.

**Respuesta 201 (`InventoryHistory`, campos relevantes):**

| Campo | Descripción |
|-------|-------------|
| `entryPrice` | Costo convertido a **CUP** |
| `unitPrice` | Costo unitario en CUP (solo si `currency === "CUP"`) |
| `currency` | Moneda **original** de la compra |
| `quantity`, `previousStock`, `newStock`, `provider`, `createdAt` | … |

### 4.2. Lógica de conversión

- El backend **siempre** almacena `entry_price` en **CUP**.
- Si `currency === "CUP"`: `exchangeRateApplied` se ignora, tasa = 1.
- Si `currency !== "CUP"`:
  1. Usa `exchangeRateApplied` si viene en el request.
  2. Si no, busca la tasa en `MonetaryExchange`.
  3. Convierte: `entryPriceCUP = entryPrice × tasa`.

**Ejemplos:**

- 50 ud a 120 CUP → historial: `entryPrice = 120 CUP`.
- 20 ud a 5 USD, tasa USD = 300 → `entryPrice = 5 × 300 = 1500 CUP`.
- 10 ud a 4.5 USD con tasa pactada 285 → `entryPrice = 4.5 × 285 = 1282.5 CUP`.

### 4.3. Pasos de implementación (Fase 3)

1. **Tipos** → ampliar `AddStockToProductProps` con `currency?` y `exchangeRateApplied?`
   en [src/lib/types/inventory.ts](../src/lib/types/inventory.ts).
2. **API** → en [src/lib/api/inventory.ts](../src/lib/api/inventory.ts) la función
   `addStock` **hoy descarta campos extra** (destructura explícito); añadir
   `currency` y `exchangeRateApplied` al body (solo cuando `currency !== "CUP"`).
3. **UI** → en [update-stock-form.tsx](../src/components/inventory/update-stock-form.tsx):
   - Selector de moneda (reusar `getAvailableCurrencies`).
   - Preview "Costo en CUP" = `entryPrice × tasa` antes de confirmar.
   - Manejar error `MONEDA_COMPRA_NO_CONFIGURADA`.
   > **Implementado con desviación:** la tasa **no** es editable. Se toma automática
   > de `MonetaryExchange` (`getCurrencyRate`) y se envía como `exchangeRateApplied`
   > para garantizar que lo previsualizado sea lo que se guarda (misma decisión que en
   > "Asignar producto"). Si más adelante se quiere permitir una tasa pactada con el
   > proveedor, basta con hacer editable ese valor.
4. **Historial** → mostrar la `currency` original en
   [inventory-history-timeline.tsx](../src/components/inventory/inventory-history-timeline.tsx).
   > **Pendiente (menor):** el historial aún no muestra la `currency` original de la
   > compra (el costo se guarda en CUP igualmente). Mejora opcional.

### 4.4. Errores

| Status | Código | Cuándo |
|--------|--------|--------|
| 400 | `MONEDA_COMPRA_NO_CONFIGURADA` | Moneda ≠ CUP sin tasa configurada |
| 404 | — | Producto o negocio no encontrado |
| 403 | — | Sin permisos sobre el producto |

---

## 5. Referencia rápida de endpoints

| Método | Ruta | Fase |
|--------|------|------|
| `POST` | `/v2/sales` (con `currency`) | 1 |
| `POST` | `/v2/sales/:saleId/payments` | 1 |
| `GET`  | `/v2/sales/:saleId/payments/summary` | 1 |
| `GET`  | `/v2/sales/:saleId/payments` | 1 |
| `GET`  | `/v2/sales/:saleId/factura` | 2 |
| `POST` | `/v2/sales/:saleId/factura/regenerate` | 2 |
| `POST` | `/v2/inventory/business/:businessId/product/:productId/add-stock` | 3 |
| `GET`  | `/v2/monetary-exchange/business/:businessId` | base (ya existe) |

---

## 6. Infraestructura del proyecto que ya existe y se reutiliza

No hay que reinventar casi nada; el proyecto tiene un patrón consistente
(feature → `lib/routes` + `lib/api` + `lib/types` + `lib/validations` + `hooks` + `components`).

| Necesidad | Ya existe |
|-----------|-----------|
| Tasas `GET /monetary-exchange/business/:id` | `getExchangeRate` / `useExchangeRate` ([use-exchange.ts](../src/hooks/use-exchange.ts)) |
| Descarga de PDF/Blob | patrón `responseType: "blob"` en [accounting-close.ts](../src/lib/api/accounting-close.ts) + helper `downloadBlob` |
| Negocio activo (`businessId`) | `useBusiness()` ([business-context.tsx](../src/context/business-context.tsx)) |
| Cliente HTTP + token Bearer | `apiClient` ([axios.ts](../src/lib/axios.ts)) |
| Toasts | `toastSuccess` / `toastError` ([toast.ts](../src/lib/toast.ts)) |
| Formularios + validación | `react-hook-form` + `zod` (ver [update-stock-form.tsx](../src/components/inventory/update-stock-form.tsx)) |
| Selector (Select / Combobox) | [src/components/ui/select.tsx](../src/components/ui/select.tsx), `combobox.tsx` |

### ⚠️ Riesgo conocido: naming de monedas

La pantalla de tasas existente tipa columnas fijas (`USD`, `EURO`,
`CUP_TRANSFERENCIA`, `CLASICA`, `MLC`), mientras los pagos usan códigos `moneda`
genéricos (`USD`, `CUP`, `EURO`, `MLC`). **Estrategia:** derivar las monedas
disponibles desde las claves de la respuesta de `monetary-exchange` con valor
> 0 (centralizado en `getAvailableCurrencies`), añadiendo siempre `CUP`. Así la UI
no queda acoplada a una lista fija.

---

## 7. Preguntas frecuentes (del backend)

- **¿Puedo cambiar la moneda de una venta ya creada?** No. Queda fija en
  `sale.currency`. Para cambiarla: cancelar la venta y crear otra.
- **¿Y si registro un pago y luego cambia la tasa?** Nada. El pago guardó su
  `exchangeRateApplied`. Solo los pagos futuros usan la tasa nueva.
- **¿Se pueden descontar pagos?** No en esta versión. Para revertir, se cancela la
  venta completa (lo que devuelve el stock).
- **¿La factura se guarda en disco?** No por defecto. Se genera on-demand.

---

## 8. Puntos a confirmar con el backend antes de empezar

1. **`items[].price` en `POST /sales`**: ¿se esperan en la moneda de la venta
   (ya convertidos) o en CUP? (Asumimos: en la moneda de la venta.)
2. **`GET /v2/sales/:id` y la lista de ventas**: ¿devuelven ya los campos nuevos
   `currency`, `paymentStatus`, `totalPaid`? (Necesario para la tabla y el detalle.)
3. **Forma del error**: ¿el código (`MONEDA_NO_CONFIGURADA`, etc.) viaja en
   `data.code`, `data.error` o dentro de `data.message`? (Para mapear mensajes.)
4. **Tipo de las tasas**: ¿`MonetaryExchange` devuelve números o strings? (El util
   las coerciona con `Number()` por seguridad.)
