# Support Tickets — Frontend integration guide

## Base URL

Todas las rutas se resuelven bajo `/api/v2/support-tickets`. Si tu API root ya incluye `/api`, usá `/v2/support-tickets`.

## Auth

Cada endpoint requiere el header:

```
Authorization: Bearer <token>
```

El token debe ser un JWT válido de la aplicación. El rol del usuario se determina desde el claim `rolId` del token (`5 = admin`, `4 = business_owner`, resto = `user`).

---

## Endpoints

### 1. Crear ticket (usuario)

`POST /support-tickets`

Crea un nuevo ticket de soporte. El backend asigna automáticamente un admin con menor carga de trabajo.

**Headers:**

```
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
```

**Body:**

```json
{
  "subject": "No puedo agregar productos",
  "message": "Cuando intento agregar un producto nuevo me aparece un error de validación.",
  "userName": "María López"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `subject` | string | Sí | Asunto del ticket (máx. 255 caracteres). |
| `message` | string | Sí | Descripción inicial (máx. 5000 caracteres). |
| `userName` | string | No | Nombre visible del usuario que crea el ticket. |

**Notas:**

- `userEmail` y `userId` no se envían desde el frontend; el backend los obtiene desde el JWT autenticado.
- El ticket se crea con `status: "open"` y se auto-asigna al admin con menor cantidad de tickets abiertos/en progreso.
- Se disparan notificaciones in-app y email.

**Response `201 Created`:**

```json
{
  "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
  "subject": "No puedo agregar productos",
  "message": "Cuando intento agregar un producto nuevo...",
  "userEmail": "maria@example.com",
  "userId": "usr_123abc",
  "userName": "María López",
  "status": "open",
  "response": null,
  "closedAt": null,
  "closedBy": null,
  "reopenedAt": null,
  "reopenedBy": null,
  "lastMessageAt": "2026-06-16T15:30:00.000Z",
  "lastMessageBy": "user",
  "assignedAdminId": "adm_456def",
  "assignedAt": "2026-06-16T15:30:05.000Z",
  "createdAt": "2026-06-16T15:30:00.000Z",
  "updatedAt": "2026-06-16T15:30:05.000Z",
  "messages": [
    {
      "id": "msg_001",
      "ticketId": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
      "senderType": "user",
      "senderUserId": "usr_123abc",
      "senderName": "María López",
      "senderEmail": "maria@example.com",
      "message": "Cuando intento agregar un producto nuevo...",
      "createdAt": "2026-06-16T15:30:00.000Z"
    }
  ]
}
```

---

### 2. Listar mis tickets (usuario)

`GET /support-tickets/my-tickets?page=1&limit=10`

Lista los tickets del usuario autenticado, ordenados por más reciente primero.

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | 1 | Página (mínimo 1). |
| `limit` | number | 10 | Tickets por página (máximo 100). |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
      "subject": "No puedo agregar productos",
      "status": "in_progress",
      "assignedAdminId": "adm_456def",
      "assignedAt": "2026-06-16T15:30:05.000Z",
      "createdAt": "2026-06-16T15:30:00.000Z",
      "updatedAt": "2026-06-16T15:35:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 3. Detalle de mi ticket (usuario)

`GET /support-tickets/my-tickets/:id`

Obtiene un ticket específico del usuario autenticado, incluyendo todos los mensajes ordenados por fecha.

**Response `200 OK`:**

```json
{
  "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
  "subject": "No puedo agregar productos",
  "message": "Cuando intento agregar un producto nuevo...",
  "userEmail": "maria@example.com",
  "status": "in_progress",
  "assignedAdminId": "adm_456def",
  "assignedAt": "2026-06-16T15:30:05.000Z",
  "messages": [
    {
      "id": "msg_001",
      "senderType": "user",
      "senderName": "María López",
      "message": "Cuando intento agregar un producto nuevo...",
      "createdAt": "2026-06-16T15:30:00.000Z"
    },
    {
      "id": "msg_002",
      "senderType": "admin",
      "senderName": "Soporte",
      "message": "Hola María, ¿podés enviarnos una captura de pantalla?",
      "createdAt": "2026-06-16T15:35:00.000Z"
    }
  ]
}
```

**Errores:**

- `404 Not Found` — El ticket no existe o no pertenece al usuario.
- `401 Unauthorized` — Token inválido o faltante.

---

### 4. Listar todos los tickets (admin)

`GET /support-tickets?status=open&page=1&limit=10`

Lista todos los tickets del sistema, con filtro opcional por estado.

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `status` | string | — | Filtrar por `open`, `in_progress` o `closed`. |
| `page` | number | 1 | Página (mínimo 1). |
| `limit` | number | 10 | Tickets por página (máximo 100). |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
      "subject": "No puedo agregar productos",
      "status": "in_progress",
      "userEmail": "maria@example.com",
      "userName": "María López",
      "assignedAdminId": "adm_456def",
      "assignedAt": "2026-06-16T15:30:05.000Z",
      "createdAt": "2026-06-16T15:30:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Errores:**

- `403 Forbidden` — El usuario no tiene rol admin.
- `401 Unauthorized` — Token inválido o faltante.

---

### 5. Detalle de ticket por ID (admin)

`GET /support-tickets/:id`

Obtiene un ticket específico por su UUID. Solo para administradores.

**Response `200 OK`:**

```json
{
  "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
  "subject": "No puedo agregar productos",
  "status": "in_progress",
  "userEmail": "maria@example.com",
  "userId": "usr_123abc",
  "userName": "María López",
  "assignedAdminId": "adm_456def",
  "assignedAt": "2026-06-16T15:30:05.000Z",
  "messages": [
    {
      "id": "msg_001",
      "senderType": "user",
      "senderName": "María López",
      "message": "Cuando intento agregar un producto nuevo...",
      "createdAt": "2026-06-16T15:30:00.000Z"
    }
  ]
}
```

**Errores:**

- `404 Not Found` — No existe un ticket con ese ID.
- `403 Forbidden` — El usuario no tiene rol admin.
- `401 Unauthorized` — Token inválido o faltante.

---

### 6. Responder como usuario

`POST /support-tickets/:id/messages`

El usuario dueño del ticket envía una respuesta. Si el ticket estaba cerrado, se reabre automáticamente a `open` y se reasigna a un admin con menor carga.

**Body:**

```json
{
  "message": "Sigo teniendo el problema después de la corrección."
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `message` | string | Sí | Texto de la respuesta (máx. 5000 caracteres). |

**Response `201 Created`:**

```json
{
  "ticket": {
    "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
    "status": "in_progress",
    "assignedAdminId": "adm_789ghi",
    "lastMessageAt": "2026-06-16T16:00:00.000Z",
    "lastMessageBy": "user"
  },
  "message": {
    "id": "msg_003",
    "ticketId": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
    "senderType": "user",
    "senderName": "María López",
    "message": "Sigo teniendo el problema después de la corrección.",
    "createdAt": "2026-06-16T16:00:00.000Z"
  }
}
```

**Errores:**

- `403 Forbidden` — El usuario no es el dueño del ticket.
- `404 Not Found` — El ticket no existe.
- `401 Unauthorized` — Token inválido o faltante.

---

### 7. Responder como admin

`POST /support-tickets/:id/admin-messages`

Un administrador responde un ticket. **Solo el admin asignado puede responder.** Si el ticket no tiene admin asignado, el sistema lo asigna automáticamente al admin con menor carga; si otro admin tiene menor carga, el que intenta responder recibe `403`.

**Body:**

```json
{
  "message": "Verificamos y el problema está corregido. Por favor probá de nuevo."
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `message` | string | Sí | Texto de la respuesta (máx. 5000 caracteres). |

**Response `201 Created`:**

```json
{
  "ticket": {
    "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
    "status": "in_progress",
    "assignedAdminId": "adm_456def",
    "lastMessageAt": "2026-06-16T16:05:00.000Z",
    "lastMessageBy": "admin"
  },
  "message": {
    "id": "msg_004",
    "ticketId": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
    "senderType": "admin",
    "senderName": "Soporte",
    "message": "Verificamos y el problema está corregido. Por favor probá de nuevo.",
    "createdAt": "2026-06-16T16:05:00.000Z"
  }
}
```

**Errores:**

- `403 Forbidden` — El ticket está asignado a otro admin: *"Ticket atendido por otro administrador. Use PATCH /:id/assign para reasignarlo."*
- `404 Not Found` — El ticket no existe.
- `401 Unauthorized` — Token inválido o faltante.

---

### 8. Cambiar estado del ticket (cerrar / reabrir)

`PATCH /support-tickets/:id/status`

Usuarios y admins pueden cambiar el estado de un ticket. El `message` adjunto se guarda como mensaje de conversación.

**Body — Cerrar:**

```json
{
  "status": "closed",
  "message": "El problema fue corregido exitosamente."
}
```

**Body — Reabrir:**

```json
{
  "status": "open",
  "message": "Necesitamos más información sobre el error."
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `status` | string | Sí | `closed` o `open`. |
| `message` | string | No | Mensaje adicional (máx. 5000 caracteres). |

**Response `200 OK`:**

```json
{
  "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
  "status": "closed",
  "response": "El problema fue corregido exitosamente.",
  "closedAt": "2026-06-16T16:10:00.000Z",
  "closedBy": "adm_456def",
  "reopenedAt": null,
  "reopenedBy": null,
  "assignedAdminId": null,
  "assignedAt": null
}
```

**Flujo de estados:**

```
open → in_progress → closed
                 ↑         |
                 └─────────┘ (reopen)
```

- `open`: ticket recién creado o reabierto, esperando respuesta.
- `in_progress`: hay conversación activa (alguien respondió).
- `closed`: ticket cerrado por admin o usuario.

**Errores:**

- `403 Forbidden` — Usuario intentando modificar ticket ajeno.
- `404 Not Found` — El ticket no existe.
- `401 Unauthorized` — Token inválido o faltante.

---

### 9. Cerrar ticket (endpoint legacy admin)

`PATCH /support-tickets/:id/close`

Mantenido por compatibilidad. Equivale a `PATCH /:id/status` con `status: "closed"`.

**Body:**

```json
{
  "response": "El problema fue corregido."
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `response` | string | Sí | Respuesta final al cierre (máx. 5000 caracteres). |

**Response `200 OK`:**

```json
{
  "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
  "status": "closed",
  "response": "El problema fue corregido.",
  "closedAt": "2026-06-16T16:10:00.000Z",
  "closedBy": "adm_456def"
}
```

---

### 10. Asignar ticket manualmente (admin)

`PATCH /support-tickets/:id/assign`

Permite a un admin apropiarse de un ticket ya asignado a otro admin. Útil cuando un admin quiere tomar un caso específico.

**Body:** (vacío, no requiere body)

**Response `200 OK`:**

```json
{
  "id": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
  "assignedAdminId": "adm_456def",
  "assignedAt": "2026-06-16T16:15:00.000Z"
}
```

**Errores:**

- `403 Forbidden` — El usuario no tiene rol admin.
- `404 Not Found` — El ticket no existe.
- `401 Unauthorized` — Token inválido o faltante.

---

### 11. Listar mis notificaciones in-app

`GET /support-tickets/my-notifications?page=1&limit=20&unreadOnly=false`

Lista las notificaciones in-app de soporte para el usuario autenticado.

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | 1 | Página (mínimo 1). |
| `limit` | number | 20 | Notificaciones por página (máximo 100). |
| `unreadOnly` | boolean | false | Si `true`, solo devuelve notificaciones no leídas. |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "notif_001",
      "ticketId": "361b620f-605f-4cf5-9c89-59c3a704b3b4",
      "eventType": "admin_replied",
      "channel": "in_app",
      "content": "Soporte respondió el ticket #361b620f...",
      "readAt": null,
      "createdAt": "2026-06-16T16:05:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "unreadCount": 3
}
```

---

### 12. Contar notificaciones no leídas

`GET /support-tickets/my-notifications/unread-count`

**Response `200 OK`:**

```json
{
  "unreadCount": 3
}
```

---

### 13. Marcar notificación como leída

`PATCH /support-tickets/my-notifications/:id/read`

**Response `200 OK`:**

```json
{
  "id": "notif_001",
  "readAt": "2026-06-16T16:20:00.000Z"
}
```

---

### 14. Marcar todas como leídas

`PATCH /support-tickets/my-notifications/read-all`

**Response `200 OK`:**

```json
{
  "unreadCount": 0
}
```

---

## Estructura del ticket

```ts
{
  id: string;                  // UUID del ticket
  subject: string;             // Asunto
  message: string;             // Mensaje inicial del usuario
  userEmail: string;           // Email del usuario que creó el ticket
  userId: string | null;       // ID externo del usuario
  userName: string | null;     // Nombre del usuario
  status: "open" | "in_progress" | "closed";
  response: string | null;     // Respuesta final al cerrar
  closedAt: string | null;     // ISO datetime
  closedBy: string | null;     // ID del admin que cerró
  reopenedAt: string | null;
  reopenedBy: string | null;
  lastMessageAt: string | null;
  lastMessageBy: "user" | "admin" | null;
  assignedAdminId: string | null;  // ID del admin asignado
  assignedAt: string | null;       // ISO datetime de asignación
  createdAt: string;           // ISO datetime
  updatedAt: string;           // ISO datetime
  messages: SupportTicketMessage[];
}
```

### Asignación automática

Cuando se crea, reabre o responde un ticket sin asignar, el backend consulta la carga de cada admin (cantidad de tickets `open` + `in_progress`) y asigna el ticket al admin con **menor carga**. Si hay empate, gana el admin con ID más bajo.

**Campos de asignación:**

| Campo | Cuándo se setea | Descripción |
|-------|-----------------|-------------|
| `assignedAdminId` | Al asignar (auto o manual) | ID del admin responsable. |
| `assignedAt` | Al asignar | Timestamp de la asignación. |

### Restricción de respuesta por admin

Solo el admin con `assignedAdminId` puede responder el ticket. Si otro admin intenta responder, recibe:

```json
{
  "statusCode": 403,
  "message": "Ticket atendido por otro administrador. Use PATCH /:id/assign para reasignarlo.",
  "error": "Forbidden"
}
```

ParaOverride manual, el admin puede ejecutar `PATCH /:id/assign` y apropiarse del ticket.

---

## Estructura del mensaje

```ts
{
  id: string;
  ticketId: string;
  senderType: "user" | "admin";
  senderUserId: string | null;
  senderName: string | null;
  senderEmail: string | null;
  message: string;
  createdAt: string;
}
```

---

## Estructura de notificación de soporte

```ts
{
  id: string;
  ticketId: string;
  messageId: string | null;
  recipientType: "user" | "admin";
  recipientUserId: string | null;
  recipientEmail: string | null;
  eventType: "ticket_created" | "user_replied" | "admin_replied" | "ticket_closed" | "ticket_reopened";
  channel: "in_app" | "email";
  content: string;
  metadata: Record<string, unknown> | null;
  isSent: boolean;
  sendError: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}
```

---

## Ejemplo completo: flujo de ticket

### Paso 1 — Usuario crea ticket

```ts
const res = await fetch('/api/v2/support-tickets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subject: 'Error al cargar imagen',
    message: 'La imagen del producto no se visualiza.',
    userName: 'Carlos Ruiz'
  })
});
const ticket = await res.json();
// ticket.status === "open"
// ticket.assignedAdminId === "adm_100" (el admin con menor carga)
```

### Paso 2 — Admin asignado responde

```ts
const res2 = await fetch(`/api/v2/support-tickets/${ticket.id}/admin-messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Revisamos el caso, debería estar resuelto ahora.'
  })
});
const { ticket: updated, message } = await res2.json();
// updated.status === "in_progress"
```

### Paso 3 — Admin cierra el ticket

```ts
const res3 = await fetch(`/api/v2/support-tickets/${ticket.id}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'closed',
    message: 'Queda cerrado. Avísanos si persiste.'
  })
});
const closed = await res3.json();
// closed.status === "closed"
// closed.assignedAdminId === null  (se limpia al cerrar)
```

### Paso 4 — Usuario reabre

```ts
const res4 = await fetch(`/api/v2/support-tickets/${ticket.id}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'open'
  })
});
const reopened = await res4.json();
// reopened.status === "open"
// reopened.assignedAdminId === "adm_100" (auto-asignado nuevamente)
```

---

## Códigos de error comunes

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| `401` | No autorizado | Token faltante o inválido. |
| `403` | Acceso denegado | Usuario intentando acceder a ticket ajeno, o admin intentando responder ticket asignado a otro. |
| `404` | No encontrado | Ticket o notificación no existe. |
| `500` | Error interno | Falla inesperada (revisar logs del backend). |

### Error 403 por ticket asignado a otro admin

```json
{
  "statusCode": 403,
  "message": "Ticket atendido por otro administrador. Use PATCH /:id/assign para reasignarlo.",
  "error": "Forbidden"
}
```

Solución: el admin debe ejecutar `PATCH /:id/assign` para tomar el ticket antes de responder.