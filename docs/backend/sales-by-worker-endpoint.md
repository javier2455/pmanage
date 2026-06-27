# Endpoint a implementar: Ventas por trabajador

> **Para:** equipo de backend (`psearch.dveloxsoft.com`)
> **De:** equipo de frontend (pmanage)
> **Estado del frontend:** ya implementado y consumiendo este endpoint. Falta que el backend lo exponga con el contrato descrito a continuación.

El frontend (pestaña **"Desempeño de ventas"** dentro de la vista de Trabajadores) ya llama a este endpoint mediante React Query. Solo necesitamos que el backend lo implemente **respetando el contrato exacto** de este documento, para no romper el cliente.

---

## 1. Ruta y método

```
GET /api/v2/analytics/sales-by-worker/:businessId
```

Sigue el mismo patrón que los endpoints de analytics ya existentes (`/analytics/kpis/:businessId`, `/analytics/sales-trend/:businessId`, `/analytics/top-products/:businessId`).

## 2. Autenticación y permisos (reglas a respetar)

- **`authenticateToken`** (JWT Bearer) — igual que el resto de endpoints autenticados.
- **Verificar pertenencia al negocio**: el usuario autenticado debe ser dueño o pertenecer al `businessId` solicitado.
- **Gate de plan Pro**: responder **`403`** si el usuario **no tiene plan Pro** (mismo comportamiento que los otros endpoints de analytics).

## 3. Query params

| Param | Tipo | Requerido | Default | Notas |
|---|---|---|---|---|
| `period` | `"week" \| "month" \| "quarter"` | No | `"month"` | Define el rango si no se envían fechas explícitas |
| `startDate` | ISO 8601 | No | — | Si viene junto con `endDate`, tiene prioridad sobre `period` |
| `endDate` | ISO 8601 | No | — | — |

**Resolución del rango:** si llegan `startDate` y `endDate`, usarlos; en caso contrario, derivar el rango a partir de `period` (semana / mes / trimestre actual).

## 4. Lógica de agregación

Se basa en el campo **`createdBy`** de la entidad `Sale` (el usuario que registró la venta). No se requieren columnas nuevas: la entidad `Sale` ya tiene `id`, `idbusiness`, `total`, `createdBy` (FK a `users.id`), `isCancelled`, `createdAt`.

Sobre las ventas del negocio (`idbusiness = :businessId`) dentro del rango (`createdAt BETWEEN startDate AND endDate`):

1. **Ventas NO canceladas** (`isCancelled = false`), agrupadas por `createdBy`:
   - `totalSales` = `SUM(total)`
   - `transactionCount` = `COUNT(*)`
2. **Ventas canceladas** (`isCancelled = true`), agrupadas por `createdBy`:
   - `cancellationCount` = `COUNT(*)`
3. **JOIN** con la tabla de usuarios/trabajadores por `createdBy` para obtener `workerName` y `workerEmail`.
4. **Métricas calculadas** por trabajador:
   - `avgTicket` = `transactionCount > 0 ? totalSales / transactionCount : 0`
   - `cancellationRate` = `(transactionCount + cancellationCount) > 0 ? cancellationCount / (transactionCount + cancellationCount) * 100 : 0`

### Edge cases

- **`createdBy` puede ser el dueño** del negocio, no solo trabajadores invitados. **Recomendado: incluirlo** en la lista, ya que también genera ventas.
- Si el negocio no tiene ventas/trabajadores en el período, devolver `data: []` (lista vacía, no error).
- Un trabajador que solo tiene ventas canceladas en el período debe aparecer con `totalSales = 0`, `transactionCount = 0`, `avgTicket = 0` y su `cancellationCount` / `cancellationRate` correspondientes.

## 5. Redondeo

- `totalSales` y `avgTicket`: **2 decimales**.
- `cancellationRate`: **2 decimales**.
- `transactionCount` y `cancellationCount`: enteros.

## 6. Respuesta `200 OK`

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

### Tipos esperados por el cliente (TypeScript de referencia)

```typescript
interface WorkerSalesItem {
  workerId: string;
  workerName: string;
  workerEmail: string;
  totalSales: number;
  transactionCount: number;
  avgTicket: number;
  cancellationCount: number;
  cancellationRate: number;
}

interface SalesByWorkerResponse {
  period: { startDate: string; endDate: string };
  data: WorkerSalesItem[];
}
```

## 7. Códigos de respuesta

| Código | Caso |
|---|---|
| `200` | OK (incluye lista vacía si no hay datos) |
| `401` | Token ausente o inválido |
| `403` | El usuario no tiene plan Pro |
| `404` | `businessId` inexistente / el usuario no pertenece al negocio (según convención actual del backend) |

## 8. Implementación sugerida (paso a paso, patrón TypeORM/Express existente)

1. Confirmar la entidad `Sale` y sus campos (`createdBy`, `isCancelled`, `total`, `idbusiness`, `createdAt`).
2. Registrar la ruta en el router de analytics con los middlewares `authenticateToken` + verificación de negocio + gate Pro.
3. Controller: leer `:businessId`, parsear `period`/`startDate`/`endDate`, resolver el rango y delegar al service.
4. Service (QueryBuilder):
   - Subconsulta de no canceladas: `SUM(total)`, `COUNT(*)` `GROUP BY createdBy`.
   - Subconsulta de canceladas: `COUNT(*)` `GROUP BY createdBy`.
   - `JOIN` con usuarios para nombre/email.
   - Combinar ambos conjuntos por `workerId`, calcular `avgTicket` y `cancellationRate`, aplicar redondeo.
5. Devolver `{ period, data }` con la forma exacta de la sección 6.

## 9. Cómo probar (alineado con el frontend)

El cliente hace una petición de esta forma:

```
GET /api/v2/analytics/sales-by-worker/<businessId>?period=month
Authorization: Bearer <token>
```

- Con período `week` / `month` / `quarter` debe devolver datos distintos según el rango.
- Con usuario **free** debe devolver `403`.
- Con negocio sin ventas debe devolver `data: []` (la UI muestra "Sin trabajadores registrados").
