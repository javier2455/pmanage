# Especificaciones Técnicas — Variantes de Plan Pro

> Fecha: 2026-05-19
> Proyecto: PManage
> Backend base URL: `http://psearch.dveloxsoft.com/api/v2`

Este documento describe con detalle los cambios necesarios en backend y frontend para implementar cada variante. Está pensado para ser compartido con el equipo de backend para revisión y acuerdo.

---

# VARIANTE A — "Más datos, misma operativa"

## Resumen de cambios

| Área | Cambios |
|------|---------|
| **Backend** | 4 endpoints nuevos, 1 campo nuevo en `BusinessProduct` |
| **Frontend** | 6–8 componentes nuevos, 1 página activada, 1 página modificada |
| **Base de datos** | 1 campo nuevo: `stockAlertThreshold` en `BusinessProduct` |

---

## Backend — Variante A

### Cambio en modelo de datos

**Entidad `BusinessProduct` — añadir campo:**
```
stockAlertThreshold: number | null   (default: null = sin alerta configurada)
```

> **Dónde se define el umbral (decisión 2026-06-02).** Al ser un campo del `BusinessProduct`,
> se puede establecer en **dos momentos** (no excluyentes):
> 1. **Al asignar el producto al negocio** — campo opcional Pro en el `POST .../products`
>    (junto a `price`, `entryPrice`, `stock`). Ver "Endpoint 0".
> 2. **Más tarde**, desde el inventario, vía el `PATCH .../stock-alert` (Endpoint 1).
>
> El frontend implementa ambos: el campo opcional en el formulario de asignación (gateado a Pro)
> y el diálogo de edición en la tabla de inventario. Contrato completo para backend en
> [docs/backend-alertas-stock.md](../../backend-alertas-stock.md).

---

### Endpoint 0: Aceptar el umbral al asignar un producto

**`POST /businesses/{businessId}/products`** — añadir campo **opcional** `stockAlertThreshold`
(`number | null`) al body existente. Mismas validaciones que el Endpoint 1. Solo lo envía el
frontend para usuarios Pro; ausente/`null` = se crea sin alerta.

---

### Endpoint 1: Configurar alerta de stock bajo

**`PATCH /businesses/{businessId}/products/{businessProductId}/stock-alert`**

Propósito: permite al usuario Pro establecer un umbral mínimo de stock para un producto. Cuando el stock cae por debajo de ese umbral, se muestra una alerta visual.

Request body:
```json
{
  "threshold": 5
}
```

Response `200 OK`:
```json
{
  "id": "string",
  "businessProductId": "string",
  "threshold": 5,
  "updatedAt": "2026-05-19T10:00:00Z"
}
```

Response `400` si threshold es negativo o no numérico.
Response `403` si el usuario no tiene plan Pro.
Response `404` si businessProductId no existe o no pertenece al businessId.

---

### Endpoint 2: Listar alertas de stock activas

**`GET /businesses/{businessId}/stock-alerts`**

Propósito: devuelve todos los productos del negocio que tienen alerta configurada, indicando cuáles están actualmente por debajo del umbral.

Response `200 OK`:
```json
{
  "alerts": [
    {
      "productId": "string",
      "businessProductId": "string",
      "name": "string",
      "category": "string",
      "unit": "kg | lb | g | L | mL | ud",
      "stock": 3,
      "threshold": 5,
      "isLow": true
    }
  ]
}
```

`isLow: true` cuando `stock <= threshold`.

---

### Endpoint 3: Rentabilidad por producto

**`GET /analytics/profitability/{businessId}`**

Propósito: calcula la ganancia bruta por producto en un período dado. Cruza las ventas realizadas con el precio de entrada (costo) de cada producto.

Query params:
- `period`: `week | month | quarter` (opcional, default `month`)
- `startDate`: ISO 8601 (opcional, si se envía ignora `period`)
- `endDate`: ISO 8601 (opcional, usar junto con `startDate`)
- `sortBy`: `margin | revenue | quantity` (opcional, default `margin`)
- `limit`: número (opcional, default sin límite)

Lógica de cálculo:
- `revenue` = suma de (cantidad × precioVenta) de SaleItems del período, por producto
- `cost` = suma de (cantidad × entryPrice) usando el entryPrice del BusinessProduct al momento de la venta
- `grossProfit` = `revenue - cost`
- `margin` = `(grossProfit / revenue) × 100` expresado en porcentaje

Response `200 OK`:
```json
{
  "period": {
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-05-19T23:59:59Z"
  },
  "data": [
    {
      "productId": "string",
      "businessProductId": "string",
      "name": "string",
      "category": "string",
      "unit": "string",
      "quantitySold": 42,
      "revenue": 1260.00,
      "cost": 840.00,
      "grossProfit": 420.00,
      "margin": 33.33
    }
  ],
  "totals": {
    "totalRevenue": 5000.00,
    "totalCost": 3200.00,
    "totalGrossProfit": 1800.00,
    "avgMargin": 36.00
  }
}
```

Notas:
- Excluir ventas canceladas (`isCancelled: true`)
- Si `entryPrice` es 0 o null para algún producto, reportar `cost: 0` y `margin: 100`
- Response `403` si el usuario no tiene plan Pro

---

### Endpoint 4: Comparativa de períodos

**`GET /analytics/period-comparison/{businessId}`**

Propósito: compara las métricas del negocio entre el período actual y el período inmediatamente anterior del mismo tipo.

Query params:
- `period`: `week | month` (requerido)

Lógica de períodos:
- Si `period=week`: actual = semana en curso (lunes a hoy), anterior = la semana anterior completa
- Si `period=month`: actual = mes en curso (1 al día de hoy), anterior = el mes anterior completo

Response `200 OK`:
```json
{
  "period": "week",
  "current": {
    "startDate": "2026-05-13T00:00:00Z",
    "endDate": "2026-05-19T23:59:59Z",
    "totalSales": 3500.00,
    "totalExpenses": 800.00,
    "netProfit": 2700.00,
    "transactionCount": 47,
    "cancellationCount": 3
  },
  "previous": {
    "startDate": "2026-05-06T00:00:00Z",
    "endDate": "2026-05-12T23:59:59Z",
    "totalSales": 3100.00,
    "totalExpenses": 720.00,
    "netProfit": 2380.00,
    "transactionCount": 41,
    "cancellationCount": 2
  },
  "changes": {
    "salesPct": 12.90,
    "expensesPct": 11.11,
    "profitPct": 13.45,
    "transactionsPct": 14.63
  }
}
```

`changes.salesPct` = `((current.totalSales - previous.totalSales) / previous.totalSales) × 100`
Valor positivo = mejora, negativo = caída.

Response `403` si el usuario no tiene plan Pro.

---

### Endpoint 5: Ventas por trabajador

**`GET /analytics/sales-by-worker/{businessId}`**

Propósito: muestra el desempeño de ventas de cada trabajador del negocio. Se basa en el campo `createdBy` de la entidad `Sale`.

Query params:
- `period`: `week | month | quarter` (opcional, default `month`)
- `startDate`: ISO 8601 (opcional)
- `endDate`: ISO 8601 (opcional)

Lógica:
- GROUP BY `createdBy` en las ventas del negocio en el período dado
- JOIN con la tabla de usuarios/trabajadores para obtener nombre
- Incluir solo ventas no canceladas para `totalSales` y `transactionCount`
- `cancellationCount` = ventas canceladas por ese trabajador en el período

Response `200 OK`:
```json
{
  "period": {
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-05-19T23:59:59Z"
  },
  "data": [
    {
      "workerId": "string",
      "workerName": "string",
      "workerEmail": "string",
      "totalSales": 1800.00,
      "transactionCount": 23,
      "avgTicket": 78.26,
      "cancellationCount": 1,
      "cancellationRate": 4.17
    }
  ]
}
```

`cancellationRate` = `(cancellationCount / (transactionCount + cancellationCount)) × 100`

Response `403` si el usuario no tiene plan Pro.
Response devuelve lista vacía si el negocio no tiene trabajadores.

---

## Frontend — Variante A

### Nuevos tipos TypeScript

**Ampliar `src/lib/types/analytics.ts`:**

```typescript
// Rentabilidad
export interface ProfitabilityItem {
  productId: string;
  businessProductId: string;
  name: string;
  category: string;
  unit: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  margin: number;
}

export interface ProfitabilityResponse {
  period: { startDate: string; endDate: string };
  data: ProfitabilityItem[];
  totals: {
    totalRevenue: number;
    totalCost: number;
    totalGrossProfit: number;
    avgMargin: number;
  };
}

// Comparativa de períodos
export interface PeriodMetrics {
  startDate: string;
  endDate: string;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  cancellationCount: number;
}

export interface PeriodComparisonResponse {
  period: "week" | "month";
  current: PeriodMetrics;
  previous: PeriodMetrics;
  changes: {
    salesPct: number;
    expensesPct: number;
    profitPct: number;
    transactionsPct: number;
  };
}

// Ventas por trabajador
export interface WorkerSalesItem {
  workerId: string;
  workerName: string;
  workerEmail: string;
  totalSales: number;
  transactionCount: number;
  avgTicket: number;
  cancellationCount: number;
  cancellationRate: number;
}

export interface SalesByWorkerResponse {
  period: { startDate: string; endDate: string };
  data: WorkerSalesItem[];
}
```

**Ampliar `src/lib/types/inventory.ts`:**

```typescript
export interface StockAlert {
  productId: string;
  businessProductId: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  threshold: number;
  isLow: boolean;
}

export interface StockAlertsResponse {
  alerts: StockAlert[];
}
```

---

### Nuevas rutas de API

**Ampliar `src/lib/routes/analytics.ts`:**
```typescript
const ANALYTICS = `${BASIC_ROUTE}/analytics`;

export const ANALYTICS_ROUTES = {
  // ... rutas existentes ...
  getProfitability: (businessId: string) => `${ANALYTICS}/profitability/${businessId}`,
  getPeriodComparison: (businessId: string) => `${ANALYTICS}/period-comparison/${businessId}`,
  getSalesByWorker: (businessId: string) => `${ANALYTICS}/sales-by-worker/${businessId}`,
};
```

**Ampliar `src/lib/routes/inventory.ts` (o business.ts):**
```typescript
export const stockAlertRoutes = {
  setAlert: (businessId: string, businessProductId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/products/${businessProductId}/stock-alert`,
  getAlerts: (businessId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/stock-alerts`,
};
```

---

### Nuevas funciones API

**Ampliar `src/lib/api/analytics.ts`:**
```typescript
export const getProfitability = async (
  businessId: string,
  params: { period?: string; startDate?: string; endDate?: string; sortBy?: string }
): Promise<ProfitabilityResponse>

export const getPeriodComparison = async (
  businessId: string,
  params: { period: "week" | "month" }
): Promise<PeriodComparisonResponse>

export const getSalesByWorker = async (
  businessId: string,
  params: { period?: string; startDate?: string; endDate?: string }
): Promise<SalesByWorkerResponse>
```

**Crear `src/lib/api/stock-alerts.ts`:**
```typescript
export const setStockAlert = async (
  businessId: string,
  businessProductId: string,
  threshold: number
): Promise<{ id: string; businessProductId: string; threshold: number; updatedAt: string }>

export const getStockAlerts = async (
  businessId: string
): Promise<StockAlertsResponse>
```

---

### Nuevos hooks React Query

**`src/hooks/use-profitability.ts`**
```typescript
export const useProfitability = (
  businessId: string,
  params: { period?: string; startDate?: string; endDate?: string; sortBy?: string },
  enabled?: boolean
) => useQuery({
  queryKey: ["profitability", businessId, params],
  queryFn: () => getProfitability(businessId, params),
  enabled: !!businessId && enabled,
});
```

**`src/hooks/use-period-comparison.ts`**
```typescript
export const usePeriodComparison = (
  businessId: string,
  period: "week" | "month"
) => useQuery({
  queryKey: ["period-comparison", businessId, period],
  queryFn: () => getPeriodComparison(businessId, { period }),
  enabled: !!businessId,
});
```

**`src/hooks/use-sales-by-worker.ts`**
```typescript
export const useSalesByWorker = (
  businessId: string,
  params: { period?: string; startDate?: string; endDate?: string }
) => useQuery({
  queryKey: ["sales-by-worker", businessId, params],
  queryFn: () => getSalesByWorker(businessId, params),
  enabled: !!businessId,
});
```

**`src/hooks/use-stock-alerts.ts`**
```typescript
export const useStockAlerts = (businessId: string) => useQuery({...})
export const useSetStockAlert = () => useMutation({...})
```

---

### Nuevos componentes

#### `src/components/analytics/period-comparison-card.tsx`

Card que muestra una métrica con comparación entre período actual y anterior.

Props:
```typescript
interface PeriodComparisonCardProps {
  label: string;           // "Ventas", "Gastos", "Ganancia neta"
  currentValue: number;
  previousValue: number;
  changePercent: number;
  format: "currency" | "number";
  invertColors?: boolean;  // Para gastos: subir es malo (rojo), bajar es bueno (verde)
}
```

UI: muestra el valor actual grande, debajo el valor del período anterior en gris, y una flecha de tendencia (↑ verde o ↓ rojo) con el porcentaje de cambio.

---

#### `src/components/analytics/period-comparison-section.tsx`

Agrupa 3 `PeriodComparisonCard` en una grilla: Ventas, Gastos, Ganancia Neta.
Incluye selector de período (Semana / Mes) en la cabecera.
Consume el hook `usePeriodComparison`.

---

#### `src/components/analytics/profitability-table.tsx`

Tabla de productos ordenados por margen.

Columnas:
1. Producto (nombre + categoría)
2. Unidad
3. Cantidad vendida
4. Ingresos (CUP)
5. Costo (CUP)
6. Ganancia bruta (CUP)
7. Margen (%)

Features:
- Ordenable por cualquier columna numérica
- Fila de totales al final
- Color de la columna margen: verde si > 30%, amarillo si 10–30%, rojo si < 10%
- Paginación si hay más de 20 productos

---

#### `src/components/analytics/profitability-filter.tsx`

Controles de filtro para la tabla de rentabilidad:
- Selector de período: Semana / Mes / Trimestre / Rango personalizado
- Si "Rango personalizado": mostrar date-range-picker existente
- Selector "Ordenar por": Margen / Ingresos / Cantidad
- Botón "Exportar" (opcional en fase 2)

---

#### `src/components/analytics/sales-by-worker-table.tsx`

Tabla de trabajadores con su desempeño de ventas.

Columnas:
1. Trabajador (nombre + email)
2. Ventas totales (CUP)
3. Transacciones
4. Ticket promedio (CUP)
5. Cancelaciones
6. Tasa de cancelación (%)

Features:
- Ordenable
- Mostrar mensaje "Sin trabajadores registrados" si la lista está vacía

---

#### `src/components/analytics/sales-by-worker-filter.tsx`

Selector de período (Semana / Mes / Trimestre / Rango personalizado).

---

#### `src/components/inventory/stock-alert-badge.tsx`

Badge pequeño que aparece junto al stock de un producto.

Props:
```typescript
interface StockAlertBadgeProps {
  stock: number;
  threshold: number | null;
}
```

Variantes:
- Si `threshold === null`: no renderiza nada
- Si `stock <= threshold` y `stock === 0`: badge rojo "Sin stock"
- Si `stock <= threshold` y `stock > 0`: badge amarillo "Stock bajo"
- Si `stock > threshold`: no renderiza nada (stock OK)

---

#### `src/components/inventory/set-stock-alert-dialog.tsx`

Dialog para configurar el umbral de alerta de un producto.

Props:
```typescript
interface SetStockAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessProductId: string;
  productName: string;
  currentStock: number;
  currentThreshold: number | null;
}
```

UI:
- Título: "Alerta de stock para [productName]"
- Input numérico: "Notificarme cuando el stock baje de:"
- Texto de ayuda: "Stock actual: X unidades"
- Botón "Guardar alerta" + botón "Desactivar alerta" (si hay umbral configurado)
- Usa el hook `useSetStockAlert`

---

### Páginas a modificar/crear

#### `src/app/dashboard/analytics/page.tsx` — MODIFICAR (actualmente redirige al dashboard)

Reemplazar la redirección con el dashboard de analítica real.

Estructura de la página:
```
<h1>Analítica</h1>
<Tabs defaultValue="comparativa">
  <TabsList>
    <TabsTrigger value="comparativa">Comparativa de períodos</TabsTrigger>
    <TabsTrigger value="rentabilidad">Rentabilidad</TabsTrigger>
    <TabsTrigger value="equipo">Equipo</TabsTrigger>
  </TabsList>

  <TabsContent value="comparativa">
    <PeriodComparisonSection businessId={activeBusinessId} />
  </TabsContent>

  <TabsContent value="rentabilidad">
    <ProfitabilityFilter />
    <ProfitabilityTable />
  </TabsContent>

  <TabsContent value="equipo">
    <SalesByWorkerFilter />
    <SalesByWorkerTable />
  </TabsContent>
</Tabs>
```

La ruta ya está protegida por `src/lib/pro-gates.ts` — no requiere cambios en el gate.

---

#### `src/app/dashboard/business/inventory/page.tsx` — MODIFICAR

Añadir en cada fila de la tabla de inventario:
- `StockAlertBadge` junto al número de stock
- Botón/icono "Configurar alerta" que abre `SetStockAlertDialog`

El hook `useStockAlerts(businessId)` se usa al cargar la página para saber qué productos tienen alerta y cuáles están en estado "low".

---

### Cambios en menú/sidebar

**Activar el ítem de "Analítica" en `src/components/sidebar/nav-main.tsx`:**
El ítem de menú actualmente está en la respuesta del endpoint `/menu/` con `plans: ["premium", "pro"]` (o similar). Verificar con el backend que el menú devuelva este ítem para usuarios con plan Pro.

**Indicador visual de alertas activas:**
En el ítem de "Inventario" del sidebar, si hay alertas de stock bajo activas (`isLow: true`), mostrar un badge numérico rojo con la cantidad de productos en alerta. Usar `useStockAlerts` en el componente del sidebar.

---

---

# VARIANTE B — "Gestión completa del negocio"

## Resumen de cambios

La Variante B incluye TODO lo de la Variante A, más las siguientes adiciones:

| Feature | Backend | Frontend |
|---------|---------|---------|
| Gestión de proveedores | 4 endpoints + 1 entidad nueva | 1 sección nueva (lista + CRUD) |
| Categorías de gastos | 5 endpoints + 1 entidad nueva + modificar Expense | Modificar formulario de gastos + chart nuevo |
| Presupuesto mensual | 3 endpoints + 1 entidad nueva | Widget en cierre mensual |
| Historial de precios | 1 endpoint + 1 entidad nueva (log) | Dialog en productos |

---

## Backend — Proveedores

### Nueva entidad `Supplier`

```
id:           uuid (PK)
businessId:   string (FK → Business)
name:         string (requerido)
phone:        string | null
email:        string | null
description:  string | null
createdAt:    datetime
updatedAt:    datetime
```

### Modificación en entidad `InventoryEntry`

Añadir campo:
```
supplierId: string | null (FK → Supplier, nullable)
```
El campo `supplier` (texto libre) existente se mantiene por compatibilidad. Si se envía `supplierId`, `supplier` puede quedar como backup descriptivo o sincronizarse con el nombre del proveedor seleccionado.

---

### Endpoints de proveedores

**`GET /suppliers/business/{businessId}`**

Query params: `?page=1&limit=20&search=nombre`

Response `200 OK`:
```json
{
  "data": [
    {
      "id": "string",
      "businessId": "string",
      "name": "string",
      "phone": "string | null",
      "email": "string | null",
      "description": "string | null",
      "createdAt": "ISO",
      "updatedAt": "ISO"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

**`POST /suppliers`**

Body:
```json
{
  "businessId": "string",
  "name": "string",
  "phone": "string (opcional)",
  "email": "string (opcional)",
  "description": "string (opcional)"
}
```

Response `201 Created`: el objeto `Supplier` completo.
Response `409` si ya existe un proveedor con el mismo nombre en ese negocio.

---

**`PUT /suppliers/{supplierId}`**

Body: mismos campos que POST (todos opcionales excepto los que se quieran actualizar).
Response `200 OK`: el objeto `Supplier` actualizado.
Response `404` si no existe o no pertenece al negocio del usuario.

---

**`DELETE /suppliers/{supplierId}`**

Response `200 OK`: `{ message: "Proveedor eliminado" }`
Nota: al eliminar un proveedor, los `InventoryEntry` que lo referencian deben quedar con `supplierId: null` (no eliminar el historial de inventario).

---

**Modificar `POST /inventory/business/{businessId}/product/{productId}/add-stock`**

Añadir campo opcional al body:
```json
{
  "supplierId": "string (opcional)"
}
```

Si se envía `supplierId`, validar que pertenece al negocio. Ignorar si no existe.

---

## Backend — Categorías de Gastos

### Nueva entidad `ExpenseCategory`

```
id:         uuid (PK)
businessId: string (FK → Business)
name:       string (requerido)
color:      string (hex color, e.g. "#3B82F6", requerido)
createdAt:  datetime
```

### Modificación en entidad `Expense`

Añadir campo:
```
categoryId: string | null (FK → ExpenseCategory, nullable)
```

---

### Endpoints de categorías de gastos

**`GET /expense-categories/business/{businessId}`**

Response `200 OK`:
```json
{
  "data": [
    {
      "id": "string",
      "businessId": "string",
      "name": "string",
      "color": "#3B82F6",
      "createdAt": "ISO"
    }
  ]
}
```

---

**`POST /expense-categories`**

Body:
```json
{
  "businessId": "string",
  "name": "string",
  "color": "#3B82F6"
}
```

Response `201 Created`: el objeto `ExpenseCategory` completo.
Validar que `color` sea un hex válido (`#RRGGBB`).

---

**`PUT /expense-categories/{categoryId}`**

Body: `{ name?, color? }`
Response `200 OK`: el objeto actualizado.

---

**`DELETE /expense-categories/{categoryId}`**

Response `200 OK`: `{ message: "Categoría eliminada" }`
Al eliminar: actualizar todos los `Expense` que tengan ese `categoryId` → poner `categoryId: null`.

---

**`GET /analytics/expenses-by-category/{businessId}`**

Query params:
- `period`: `week | month | quarter` (opcional, default `month`)
- `startDate`: ISO 8601 (opcional)
- `endDate`: ISO 8601 (opcional)

Response `200 OK`:
```json
{
  "period": { "startDate": "ISO", "endDate": "ISO" },
  "total": 5000.00,
  "data": [
    {
      "categoryId": "string",
      "name": "string",
      "color": "#3B82F6",
      "total": 2000.00,
      "count": 8,
      "percentage": 40.00
    },
    {
      "categoryId": null,
      "name": "Sin categoría",
      "color": "#9CA3AF",
      "total": 1000.00,
      "count": 3,
      "percentage": 20.00
    }
  ]
}
```

Incluir siempre una entrada "Sin categoría" para gastos sin `categoryId`.

---

**Modificar `POST /expenses` y `PATCH /expenses/{expenseId}`**

Añadir campo opcional al body:
```json
{
  "categoryId": "string (opcional)"
}
```

Incluir `categoryId` y `category` (objeto con id, name, color) en la response de `GET /expenses`.

---

**`GET /expenses` — filtrado por negocio (query param `businessId`)**

`GET /expenses` acepta `businessId` como **query param opcional** (además de `page` y `limit`):

```
GET /expenses?page=1&limit=5&businessId={businessId}
```

- **Con `businessId`** → devuelve solo los gastos de ese negocio. Es el modo por defecto del frontend (negocio activo).
- **Sin `businessId`** → devuelve los gastos de **todos** los negocios del usuario (reporte consolidado). En el frontend este modo está **gateado a plan Pro** (los planes gratuito/básico solo tienen un negocio).

Mismo patrón de query param que `GET /expense-categories` (ver más arriba). Implementado en el frontend:
`getAllExpenses` ([src/lib/api/expense.ts](../../../src/lib/api/expense.ts)),
hook `useGetAllExpensesQuery` ([src/hooks/use-expenses.ts](../../../src/hooks/use-expenses.ts)) y
página de Gastos ([src/app/dashboard/business/expenses/page.tsx](../../../src/app/dashboard/business/expenses/page.tsx)).

---

## Backend — Presupuesto Mensual

### Nueva entidad `MonthlyBudget`

```
id:            uuid (PK)
businessId:    string (FK → Business)
year:          integer (e.g. 2026)
month:         integer (1–12)
budgetAmount:  decimal (monto presupuestado total)
notes:         string | null
createdAt:     datetime
updatedAt:     datetime

UNIQUE: (businessId, year, month)
```

---

### Endpoints de presupuesto

**`GET /budgets/business/{businessId}?year=2026&month=5`**

Devuelve el presupuesto configurado para ese mes/año, si existe.

Response `200 OK`:
```json
{
  "id": "string",
  "businessId": "string",
  "year": 2026,
  "month": 5,
  "budgetAmount": 5000.00,
  "notes": "string | null",
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

Response `404` si no hay presupuesto configurado para ese mes.

---

**`POST /budgets`**

Body:
```json
{
  "businessId": "string",
  "year": 2026,
  "month": 5,
  "budgetAmount": 5000.00,
  "notes": "string (opcional)"
}
```

Response `201 Created`: el objeto `MonthlyBudget` completo.
Si ya existe un presupuesto para ese `(businessId, year, month)`, devolver `409 Conflict` con mensaje "Ya existe un presupuesto para este mes. Use PUT para actualizarlo."

---

**`PUT /budgets/{budgetId}`**

Body: `{ budgetAmount?, notes? }`
Response `200 OK`: el objeto actualizado.

---

**`GET /budgets/business/{businessId}/comparison?year=2026&month=5`**

Compara el presupuesto del mes contra el gasto real.

Response `200 OK`:
```json
{
  "year": 2026,
  "month": 5,
  "budgeted": 5000.00,
  "actual": 3200.00,
  "difference": 1800.00,
  "percentage": 64.00,
  "status": "on_track",
  "byCategory": [
    {
      "categoryId": "string | null",
      "name": "string",
      "color": "string",
      "actual": 1200.00,
      "percentage": 24.00
    }
  ]
}
```

`status`: `"on_track"` si `actual < budgeted`, `"over_budget"` si `actual >= budgeted`.
`percentage` = `(actual / budgeted) × 100`.
Response `404` si no hay presupuesto configurado para ese mes.

---

## Backend — Historial de Precios

### Nueva entidad `ProductPriceHistory`

```
id:                  uuid (PK)
businessProductId:   string (FK → BusinessProduct)
priceType:           enum("entry", "sale")
previousValue:       decimal
newValue:            decimal
changedAt:           datetime
changedBy:           string (userId)
```

### Trigger automático

Al ejecutar `PUT /product/business-product/{businessProductId}/price`:
- Si el nuevo `price` es diferente al actual → insertar entrada en `ProductPriceHistory` con `priceType: "sale"`
- Si el nuevo `entryPrice` es diferente al actual → insertar entrada con `priceType: "entry"`
- `changedAt` = timestamp actual, `changedBy` = userId del token

---

**`GET /product/business-product/{businessProductId}/price-history`**

Query params: `?limit=20&page=1`

Response `200 OK`:
```json
{
  "data": [
    {
      "id": "string",
      "priceType": "sale | entry",
      "previousValue": 100.00,
      "newValue": 120.00,
      "changedAt": "ISO",
      "changedBy": "string",
      "changedByName": "string"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

Ordenado por `changedAt` descendente (más reciente primero).

---

## Frontend — Variante B (adicional a Variante A)

### Nuevos tipos TypeScript

**`src/lib/types/supplier.ts`**
```typescript
export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuppliersResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
}
```

**`src/lib/types/expense-category.ts`**
```typescript
export interface ExpenseCategory {
  id: string;
  businessId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ExpensesByCategoryItem {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpensesByCategoryResponse {
  period: { startDate: string; endDate: string };
  total: number;
  data: ExpensesByCategoryItem[];
}
```

**`src/lib/types/budget.ts`**
```typescript
export interface MonthlyBudget {
  id: string;
  businessId: string;
  year: number;
  month: number;
  budgetAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetComparisonResponse {
  year: number;
  month: number;
  budgeted: number;
  actual: number;
  difference: number;
  percentage: number;
  status: "on_track" | "over_budget";
  byCategory: Array<{
    categoryId: string | null;
    name: string;
    color: string;
    actual: number;
    percentage: number;
  }>;
}
```

**`src/lib/types/price-history.ts`**
```typescript
export interface PriceHistoryEntry {
  id: string;
  priceType: "entry" | "sale";
  previousValue: number;
  newValue: number;
  changedAt: string;
  changedBy: string;
  changedByName: string;
}

export interface PriceHistoryResponse {
  data: PriceHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}
```

---

### Nuevas rutas API

**`src/lib/routes/suppliers.ts`**
```typescript
export const SUPPLIER_ROUTES = {
  list: (businessId: string) => `${BASIC_ROUTE}/suppliers/business/${businessId}`,
  create: () => `${BASIC_ROUTE}/suppliers`,
  update: (supplierId: string) => `${BASIC_ROUTE}/suppliers/${supplierId}`,
  delete: (supplierId: string) => `${BASIC_ROUTE}/suppliers/${supplierId}`,
};
```

**`src/lib/routes/expense-categories.ts`**
```typescript
export const EXPENSE_CATEGORY_ROUTES = {
  list: (businessId: string) => `${BASIC_ROUTE}/expense-categories/business/${businessId}`,
  create: () => `${BASIC_ROUTE}/expense-categories`,
  update: (categoryId: string) => `${BASIC_ROUTE}/expense-categories/${categoryId}`,
  delete: (categoryId: string) => `${BASIC_ROUTE}/expense-categories/${categoryId}`,
  byCategory: (businessId: string) => `${BASIC_ROUTE}/analytics/expenses-by-category/${businessId}`,
};
```

**`src/lib/routes/budgets.ts`**
```typescript
export const BUDGET_ROUTES = {
  get: (businessId: string) => `${BASIC_ROUTE}/budgets/business/${businessId}`,
  create: () => `${BASIC_ROUTE}/budgets`,
  update: (budgetId: string) => `${BASIC_ROUTE}/budgets/${budgetId}`,
  comparison: (businessId: string) => `${BASIC_ROUTE}/budgets/business/${businessId}/comparison`,
};
```

---

### Nueva sección: Proveedores

**Páginas:**
- `src/app/dashboard/business/suppliers/page.tsx` — lista paginada de proveedores con búsqueda
- `src/app/dashboard/business/suppliers/create/page.tsx` — formulario de creación
- `src/app/dashboard/business/suppliers/[supplierId]/edit/page.tsx` — formulario de edición

**Componentes:**

`src/components/suppliers/supplier-form.tsx`
Campos: Nombre (requerido), Teléfono, Email, Descripción
Validación con Zod: nombre mínimo 2 caracteres, email con formato válido si se proporciona.

`src/components/suppliers/suppliers-table-columns.tsx`
Columnas: Nombre, Teléfono, Email, Descripción, Fecha creación, Acciones (editar, eliminar)

`src/components/suppliers/suppliers-table.tsx`
Tabla paginada usando el patrón existente del proyecto (ver `table-of-expenses.tsx` como referencia).

`src/components/suppliers/supplier-details-dialog.tsx`
Dialog que muestra la información completa de un proveedor y un enlace a su historial de compras (inventario filtrado por ese proveedor).

---

### Modificar: Formulario de entrada de inventario

**`src/components/inventory/update-stock-form.tsx`**

Añadir campo `supplierId` (opcional):
- Combobox/Select con la lista de proveedores del negocio (`useSuppliers`)
- Opción "Otro proveedor" que muestra el input de texto libre existente (`supplier` string)
- Si se selecciona un proveedor del listado, auto-rellenar el campo de texto con su nombre

---

### Modificar: Formulario de gastos

**`src/components/expenses/expense-form.tsx`**

Añadir campo `categoryId` (opcional):
- Select con las categorías disponibles del negocio
- Opción "Sin categoría" seleccionada por defecto
- Enlace pequeño "+ Crear categoría" que abre el manager de categorías

---

### Nueva sección: Categorías de gastos

**`src/components/expenses/expense-category-manager.tsx`**

Componente de gestión inline (no página propia, sino dentro de la sección de gastos o en la configuración del negocio).

Features:
- Lista de categorías con color visual (dot de color + nombre)
- Botón "+ Nueva categoría"
- Edición inline del nombre y color
- Eliminación con confirmación

**`src/components/analytics/expenses-by-category-chart.tsx`**

Donut chart (Recharts) mostrando el desglose de gastos por categoría.
- Usar los colores definidos en cada `ExpenseCategory`
- Tooltip con nombre, monto total y porcentaje
- Leyenda debajo del chart
- Selector de período integrado

Añadir este chart a la tab "Comparativa" de la página de analítica, o como sección en el cierre mensual.

---

### Nueva sección: Presupuesto mensual

**`src/components/budget/set-budget-dialog.tsx`**

Dialog para definir/editar el presupuesto del mes actual.

Props:
```typescript
interface SetBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  year: number;
  month: number;
  currentBudget: MonthlyBudget | null;
}
```

Campos: Monto presupuestado (numérico, requerido), Notas (textarea, opcional).

**`src/components/budget/monthly-budget-widget.tsx`**

Widget que muestra el estado del presupuesto del mes.

UI:
- Título: "Presupuesto [Mes Año]"
- Barra de progreso: `actual / budgeted × 100%`
- Verde si < 80%, amarillo si 80–100%, rojo si > 100%
- Texto: "X de Y gastados (Z%)"
- Diferencia: "+ X disponibles" o "- X sobre el límite"
- Botón: "Editar presupuesto" (abre SetBudgetDialog)
- Si no hay presupuesto configurado: mostrar "Sin presupuesto" + botón "Configurar presupuesto"

**Modificar `src/app/dashboard/accounting-close/monthly/page.tsx`**

Añadir el `MonthlyBudgetWidget` en la parte superior, antes de las tablas de ventas y gastos.

---

### Nueva feature: Historial de precios

**`src/components/products/price-history-dialog.tsx`**

Dialog que muestra el historial de cambios de precio de un producto.

Props:
```typescript
interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessProductId: string;
  productName: string;
}
```

UI:
- Tabs: "Precio de venta" | "Precio de entrada"
- Timeline o tabla: fecha, precio anterior, precio nuevo, cambiado por
- Flecha indicando si subió (↑) o bajó (↓)
- Paginación si hay más de 20 entradas

**Modificar `src/app/dashboard/business/products/page.tsx`**

Añadir botón "Historial de precios" (icono de reloj) en cada fila de la tabla de productos asignados al negocio. Al hacer clic abre `PriceHistoryDialog`.

---

## Orden de implementación recomendado

### Si se elige Variante A (2–3 semanas)

1. **Semana 1 — Backend:**
   - Endpoint comparativa de períodos
   - Endpoint rentabilidad por producto
   - Endpoint ventas por trabajador
   - Campo `stockAlertThreshold` + endpoints de alertas

2. **Semana 2 — Frontend core:**
   - Tipos + rutas + funciones API + hooks
   - Página de analítica con tabs
   - Componentes: PeriodComparisonSection, ProfitabilityTable, SalesByWorkerTable

3. **Semana 3 — Frontend inventario + ajustes:**
   - StockAlertBadge + SetStockAlertDialog en inventario
   - Activar ítem de menú Analítica para usuarios Pro
   - Badge de alertas activas en sidebar
   - QA y ajustes

### Si se elige Variante B (6–8 semanas)

- **Semanas 1–3:** Todo lo de Variante A
- **Semana 4 — Backend B:**
  - Entidades Supplier, ExpenseCategory
  - Endpoints de proveedores (CRUD)
  - Endpoints de categorías de gastos (CRUD + analytics)
  - Modificar add-stock y expenses para aceptar supplierId/categoryId
- **Semana 5 — Backend B (cont.):**
  - Entidad MonthlyBudget + endpoints
  - Entidad ProductPriceHistory + trigger en update-price + endpoint
- **Semana 6 — Frontend B:**
  - Sección de proveedores (lista + CRUD)
  - Modificar formulario de inventario (select proveedor)
  - Modificar formulario de gastos (select categoría)
  - Manager de categorías de gastos
- **Semana 7 — Frontend B (cont.):**
  - Widget de presupuesto + dialog configuración
  - Integrar en cierre mensual
  - Chart de gastos por categoría
- **Semana 8 — Frontend B (cont.) + QA:**
  - Historial de precios (dialog + botón en tabla de productos)
  - QA end-to-end de toda la Variante B
  - Ajustes finales
