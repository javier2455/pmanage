# Notificaciones internas (in-app) — Spec para Backend

> Documento entregable para el equipo de backend. Describe el contrato necesario para mostrar las
> notificaciones **dentro del sistema** (bandeja in-app), partiendo de la entidad `Notification` y los 11
> tipos que el backend ya genera.

| | |
|---|---|
| **Fecha** | 2026-06-04 |
| **Relacionado** | [API.md](./API.md) (notificaciones externas / `business-settings`), [notificaciones-alertas.md](./notificaciones-alertas.md) (catálogo de alertas). |
| **Estado** | Frontend con el scaffolding listo, a la espera de que backend exponga el contrato de la Parte 2. |

---

## 1. Contexto y problema

Hoy el sistema solo **emite** notificaciones externas (correo / SMS / WhatsApp) según `business-settings`.
El backend ya **persiste** 11 tipos de notificación en la entidad `Notification`, pero esa entidad está
orientada al *envío*:

```ts
class Notification {
  id: string;
  business: Business;          // ManyToOne, onDelete CASCADE
  type: NotificationType;      // 11 tipos (ver §3)
  channel: NotificationChannel;// email | sms | whatsapp
  content: string;             // texto legible
  metadata: Record<string, any> | null;
  isSent: boolean;
  sendError: string | null;
  sentAt: Date | null;
  createdAt: Date;
}
```

**Falta para tener una bandeja in-app:**
1. Un **canal `in_app`** (las notificaciones internas no se "envían" por un proveedor externo).
2. Un **estado de leído/no leído** (`readAt`) — la entidad no lo tiene.
3. **Endpoints** para listar, contar no leídas y marcar leídas.

---

## 2. Contrato solicitado al backend

### 2.1 Cambios a la entidad `Notification`
- Añadir valor `'in_app'` al enum `NotificationChannel`.
- Añadir **estado de lectura**: `readAt: Date | null` (no leída ⇔ `readAt === null`). Se prefiere timestamp
  sobre un boolean `isRead` porque permite ordenar/auditar.
- Las filas `in_app` no se envían: `isSent` puede marcarse `true` al crear o ignorarse para ese canal.

### 2.2 Alcance del estado de leído — **decisión a confirmar**
La entidad referencia solo `Business`, no `User`. Dos opciones:

- **Por negocio (recomendado para v1).** Bandeja compartida: si el dueño marca leída una notificación, los
  trabajadores la ven leída. Simple, coherente con la entidad actual. `readAt` vive en la fila `Notification`.
- **Por usuario (evolución futura).** Cada trabajador con su propio estado. Requiere tabla
  `notification_reads (notification_id, user_id, read_at)` y calcular no-leídas por usuario.

> Pedimos confirmar esta decisión. El frontend está preparado para el shape "por negocio"; migrar a
> "por usuario" más adelante no cambia la UI, solo el cálculo del backend.

### 2.3 Generación de las filas in-app
- Por **cada** evento de los 11 tipos, crear **siempre** una fila `channel='in_app'` (es gratis y funciona
  como log/auditoría), **independiente** de `business-settings`. Recordar que `business-settings` solo
  gatea email/SMS/WhatsApp y solo para 4 tipos; la bandeja in-app debe mostrar **los 11**.
- Rellenar `content` (texto ya formateado) y `metadata` (datos estructurados para deep-link, ver §4).

### 2.4 Endpoints (implementados)

Bajo `BASIC_ROUTE` = `https://psearch.dveloxsoft.com/api/v2`, con `Authorization: Bearer <jwt>`.
El negocio se indica por **query param `?businessId=`** (no va en el path).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/notifications?businessId=` | Lista paginada de `channel='in_app'`, orden **desc** por `createdAt`. |
| `GET` | `/notifications/unread-count?businessId=` | Conteo liviano de no leídas (para el badge; se consulta por polling). |
| `PATCH` | `/notifications/{id}/read` | Marca **una** como leída (`readAt = now`). |
| `PATCH` | `/notifications/read-all?businessId=` | Marca **todas** las del negocio como leídas. |

> El backend también expone `POST /notifications/retry-failed`, `GET /notifications/unsent` y
> `GET /notifications/summaries/monthly` (gestión de envíos externos); el frontend in-app no los consume.

**`GET /notifications` — query params**

| Param | Tipo | Default | Notas |
|---|---|---|---|
| `businessId` | string | — | **Requerido.** Negocio del que se listan las notificaciones. |
| `page` | number | 1 | |
| `limit` | number | 20 | |
| `type` | string | — | Filtra por uno de los 11 tipos (opcional). |
| `unreadOnly` | boolean | false | Si `true`, solo `readAt === null`. |

**`GET /notifications` — respuesta (200)**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "sale_cancelled",
      "content": "Venta de $1500 cancelada por Juan (motivo: error de cobro)",
      "metadata": { "saleId": "uuid", "total": 1500, "userName": "Juan", "reason": "error de cobro" },
      "readAt": null,
      "createdAt": "2026-06-04T14:30:00.000Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 },
  "unreadCount": 7
}
```

**`GET /notifications/unread-count` — respuesta (200)**
```json
{ "unreadCount": 7 }
```

**`PATCH .../{id}/read` y `.../read-all`** — devolver `200` con la notificación actualizada (o `{ "unreadCount": N }`).

---

## 3. Los 11 tipos y su presentación in-app

In-app no tiene costo por mensaje, así que se muestran **todos**. La UI los agrupa por **dominio** y los
colorea por **severidad**:

| `type` | Dominio | Severidad | Motivo |
|---|---|---|---|
| `out_of_stock` | Inventario | Alta | Venta perdida ahora mismo. |
| `low_stock` | Inventario | Alta | Reabastecer antes de agotar. |
| `stale_product` | Inventario | Media | Capital inmovilizado / merma. |
| `sale_cancelled` | Ventas | Alta | Supervisión: posible error/fraude. |
| `negative_margin` | Ventas | Alta | Pérdida directa (precio < costo). |
| `expense_alert` | Finanzas | Media-alta | Egreso inusual/alto. |
| `price_changed` | Finanzas | Media | Auditoría de cambios de precio. |
| `exchange_rate_stale` | Finanzas | Media | Tasa vieja distorsiona cálculos. |
| `weekly_summary` | Finanzas | Informativa | Digest semanal. |
| `monthly_summary` | Finanzas | Informativa | Digest mensual. |
| `new_worker` | Equipo | Media | Seguridad de acceso. |

---

## 4. `metadata` por tipo (para deep-links)

El frontend usa `metadata` para llevar al usuario a la pantalla relevante al hacer clic. Shape sugerido:

| `type` | `metadata` sugerida | Pantalla destino (frontend) |
|---|---|---|
| `out_of_stock` | `{ productId, productName }` | `/dashboard/business/inventory` |
| `low_stock` | `{ productId, productName, stock, threshold }` | `/dashboard/business/inventory` |
| `stale_product` | `{ productId, productName, daysWithoutSale }` | `/dashboard/business/inventory` |
| `sale_cancelled` | `{ saleId, total, userName, reason }` | `/dashboard/business/sales` |
| `negative_margin` | `{ saleId, productId, price, entryPrice }` | `/dashboard/business/sales` |
| `expense_alert` | `{ expenseId, amount, categoryName }` | `/dashboard/business/expenses` |
| `price_changed` | `{ productId, previousPrice, newPrice, userName }` | `/dashboard/business/products/price-history` |
| `weekly_summary` | `{ periodStart, periodEnd, totalIncome, totalExpense, total }` | `/dashboard/analytics` |
| `monthly_summary` | `{ periodStart, periodEnd, totalIncome, totalExpense, total }` | `/dashboard/accounting-close/monthly` |
| `exchange_rate_stale` | `{ lastUpdatedAt }` | `/dashboard/exchange-rate` |
| `new_worker` | `{ workerId, workerName }` | `/dashboard/business/workers` |

> El `content` debe venir ya redactado en español por el backend; el frontend lo muestra tal cual y usa
> `metadata` solo para el deep-link y para enriquecer la UI cuando aplique.

---

## 5. Entrada de menú lateral (opcional)

El sidebar se alimenta de `GET /api/v2/section`. Para que "Notificaciones" aparezca en el menú, agregar un
item con este payload (el icono `Bell` ya está soportado por el frontend):

```json
{
  "icon": "Bell",
  "name": "Notificaciones",
  "url": "/dashboard/notifications",
  "active": true,
  "roles": null,
  "plans": null,
  "submenus": []
}
```

Mientras no se agregue, la página `/dashboard/notifications` es accesible desde el enlace "Ver todas" de la
campana del topbar.

---

## 6. Resumen de lo que implementa cada lado

**Backend**
- [ ] Canal `in_app` + campo `readAt` en `Notification` (+ decisión §2.2).
- [ ] Crear fila `in_app` por cada evento de los 11 tipos, con `content` + `metadata` (§4).
- [ ] 4 endpoints (§2.4).
- [ ] (Opcional) item de menú "Notificaciones" en `GET /section` (§5).

**Frontend** (ya en desarrollo, espejo de la stack `business-settings`)
- [x] Tipos, rutas, capa API y hooks de React Query (`use-notifications`).
- [x] Campana con badge de no leídos + dropdown (feed reciente, marcar todas como leídas).
- [x] Página `/dashboard/notifications` con filtros por dominio y paginación.
- [x] Deep-links por tipo (§4).
