# Plan de implementación — V3-110 v1: Difusión de listados de productos

> **Fecha:** 2026-08-21 · **Estado:** listo para implementar · **Tier:** Pro
> **Diseño y contexto:** [listados-productos-whatsapp.md](./listados-productos-whatsapp.md)
> **Maestro:** [V3-MASTER.md](./V3-MASTER.md) — V3-110

---

## 1. Contexto

El dueño de un negocio pequeño ya publica a mano, cada día, la lista de lo que
vende en un grupo de WhatsApp: copia nombres, recuerda precios, se olvida de lo
que se agotó. Negora tiene ese dato exacto y actualizado, así que puede armarle
el mensaje y ahorrarle el mecanografiado — y de paso garantizar que **el precio
que publica es el que cobra en caja**, que hoy es una fuente real de fricción con
el cliente.

La función se detiene justo antes del envío masivo: **Negora entrega el mensaje
al dueño o al trabajador que él designe, y esa persona lo reenvía a su grupo**.
El sistema nunca escribe al grupo. No es una limitación técnica, es lo que
mantiene la función fuera del terreno del spam y protege el número emisor
compartido de la plataforma (razonamiento completo en el documento de diseño §2 y §8).

---

## 2. Decisiones cerradas

| # | Decisión | Consecuencia |
|---|---|---|
| **D1** | **Sección nueva "Difusión"** en el sidebar, con el menú "Listado de productos" dentro. | Deja sitio para novedades, ofertas y recordatorios sin reorganizar el menú después. |
| **D2** | **Sin envío programado en la v1.** | Queda como pendiente documentado (§9). Evita depender de dar de alta un cron en cPanel. |
| **D3** | **Solo plan Pro por ahora**, con llave de plan **propia** (`productListShare`), no reutilizando `whatsappNotifications`. | Una migración pequeña hoy permite abrirla a Básico mañana cambiando un JSON, sin abrir de paso las 13 alertas de WhatsApp al plan Básico. |
| **D4** | **Las plantillas guardan criterio, no productos fijos** (categorías + solo disponibles), y la lista resultante **siempre es editable** antes de enviar. | El mensaje nunca queda desactualizado, y el usuario conserva el control final. |
| **D5** | **El destinatario se elige en cada envío**, entre el número del negocio y los trabajadores registrados que tengan teléfono válido. | Cumple "1 número aparte del dueño" sin crear la entidad de contactos (V3-114), que queda pendiente. |

---

## 3. Anatomía del mensaje

Cuatro bloques; **solo el nombre del negocio y los productos son obligatorios**:

```
*La Esquina*                          ← nombre del negocio (obligatorio, automático)
                                      
Buenos días! Ya estamos abiertos,     ← introducción (opcional, texto libre)
hacemos entrega en toda la zona.

*LÁCTEOS*                             ← productos (obligatorio)
• Queso gouda — 450 CUP/kg
• Yogurt natural — 120 CUP
                                      
*ASEO*
• Detergente 1L — ~350~ *310 CUP*     ← oferta vigente, marcada automáticamente
• Jabón de baño — 95 CUP (agotado)

Pedidos al 5555-5555 hasta las 6.     ← nota final (opcional, texto libre)

_Actualizado: 21/08/2026_             ← fecha (evita que un reenvío viejo confunda)
```

**De cada producto se muestra por defecto: nombre, precio y disponibilidad.** El
usuario puede desactivar precio y/o disponibilidad, y activar unidad y categoría:

| Dato | Por defecto | Origen |
|---|---|---|
| Nombre | ✅ siempre | `Product.name` |
| Precio | ✅ activado | `BusinessProduct.getEffectivePrice()` (respeta oferta vigente) |
| Disponibilidad | ✅ activado | `stock > 0` → nada / `(agotado)`. **Nunca la cantidad exacta.** |
| Unidad | ⬜ desactivado | `Product.unit`, se anexa al precio (`450 CUP/kg`) y se omite si es `ud` |
| Agrupar por categoría | ✅ activado | `BusinessProduct.category`; los sin categoría van al final bajo "OTROS" |
| Marcar ofertas | ✅ activado | `isOnOffer()` → precio anterior tachado |

**Filtro por defecto: solo productos con stock disponible** (`stock > 0`), desactivable.

---

## 4. Alcance

**Dentro de la v1**

- Vista de composición: selección de productos, textos libres, opciones de presentación, vista previa.
- Envío inmediato al número del negocio o a un trabajador con teléfono válido.
- Plantillas guardadas por criterio, reutilizables y editables.
- Gating de plan Pro, aplicado **también server-side**.
- Historial de envíos (reutilizando la tabla `notifications` existente).

**Fuera de la v1** (pendientes documentados en §9)

- Envío programado por horario. · Imágenes, flyers o PDF. · Envío a varios
  destinatarios a la vez. · Entidad de contactos gestionados (V3-114). ·
  Verificación de números. · Disponibilidad en plan Básico.

---

## 5. Backend

Módulo nuevo `psearch-back/src/v2/product-list-share/` — generado con **NestJS CLI**
(`nest g mo`), como exige `psearch-back/AGENTS.md`. Estructura copiada de
`monetary-exchange/` (el módulo más reciente y completo).

### 5.1 Entidad `ProductListTemplate`

Una sola tabla nueva. Guarda **criterio**, no productos fijos (D4):

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | FK → `businesses`, `ON DELETE CASCADE` | |
| `name` | varchar(100) | "Lista de lunes", "Ofertas del finde" |
| `intro` | text NULL | texto de introducción |
| `outro` | text NULL | nota final |
| `category_ids` | json NULL | `null` = todas las categorías |
| `only_in_stock` | boolean, default `true` | filtro por defecto acordado |
| `excluded_product_ids` | json NULL | productos que el usuario desmarcó a mano |
| `options` | json | `{ showPrices, showAvailability, showUnit, groupByCategory, markOffers }` |
| `created_by` | varchar(36) NULL | userId de quien la creó |
| `created_at` / `updated_at` | timestamp | |

> **Cómo se resuelve una plantilla:** categorías + `only_in_stock` → lista actual
> del inventario, menos `excluded_product_ids`. El usuario ajusta la selección y,
> si guarda, las nuevas exclusiones se persisten. Un producto borrado desaparece
> solo; uno nuevo de una categoría incluida entra solo. **Nunca falla el envío por
> una plantilla desactualizada.**

**Migración:** `psearch-back/src/v2/migrations/YYYYMMDDHHmmss-CreateProductListTemplates.ts`,
patrón de `20260817120000-CreateMonetaryExchangeHistory.ts` con `CREATE TABLE IF NOT EXISTS`
(porque `synchronize` ya la habrá creado en dev).

### 5.2 Constructor del mensaje

`product-list-message.util.ts` + su `.spec.ts` — **lógica pura**, siguiendo el
patrón de `closing-schedule.util.ts`. Es el corazón de la función y donde va el
grueso de los tests.

Reutiliza lo que ya existe en `notification.service.ts`: `formatMoney()` (agrupa
miles), `formatDateDMY()` y el estilo de `buildWhatsappContent()` (multilínea con
`*negritas*`).

Reglas no negociables:

- **`preview` y `send` llaman a la misma función.** Si la previa se reimplementa
  en el frontend, lo que el dueño revisa y lo que reenvía a sus clientes divergen
  a la primera diferencia de redondeo.
- **Precio en CUP.** `BusinessProduct.price` ya está siempre en CUP;
  `priceCurrency` solo indica en qué moneda se *fijó*.
- **Paginación:** por encima de ~3.500 caracteres se parte en mensajes numerados
  `(1/2)`, cada uno con su encabezado. La previa debe decir cuántos van a salir,
  porque cada uno se reenvía por separado.

### 5.3 Endpoints

```
POST   /v2/product-list/preview        → { messages: string[], productCount, characterCount }
POST   /v2/product-list/send           → { sent: true, messages: 2, notificationIds: [...] }
GET    /v2/product-list/recipients?businessId=   → destinatarios disponibles
GET    /v2/product-list/templates?businessId=
POST   /v2/product-list/templates
PATCH  /v2/product-list/templates/:id
DELETE /v2/product-list/templates/:id
```

Todos con `@UseGuards(JwtAuthGuard, ProPlanGuard)` + `@RequiresFeature("productListShare")`,
y `PlansModule` importado en el módulo (patrón exacto de `sale.module.ts`).
Autorización de negocio con `extractRoleId(req)` + `assertCanManageBusiness`, como
`business-schedule.controller.ts`.

**`GET /recipients`** devuelve el número del negocio (etiqueta "Dueño") más los
trabajadores de `businessWorkerService.findAllByBusiness(...)` que tengan teléfono
válido según `isValidPhone`. Requiere el `accessToken` del usuario para que
`DVSUserClient` resuelva los teléfonos — ya es el patrón de ese servicio.

**`POST /send`**:
1. Valida plan y permiso de negocio.
2. Resuelve el destinatario (por defecto el número del negocio) y lo normaliza a chatId.
3. Construye los mensajes con la util.
4. Persiste una fila en `notifications` por mensaje (`type: "product_list"`, `channel: "whatsapp"`).
5. Llama a `openwaService.sendText()` **directamente**, sin pasar por
   `NotificationService.create()` — ese camino resuelve canales desde
   `BusinessSetting` y aquí no aplica: esto no es una alerta configurable, es una
   acción explícita del usuario.
6. Actualiza `isSent` / `sentAt` / `sendError` y **devuelve el resultado real**.

### 5.4 Manejo de errores

Este es el primer envío de WhatsApp **síncrono y con un humano esperando**:

- Si `sendText()` devuelve `false`, el endpoint responde **502 con motivo**, no 200.
- La fila queda con `isSent: false`, así que el `retry-failed` existente la recoge.
- **Nunca un toast de éxito optimista.** Es lo que más rápido destruye la
  confianza: el dueño cree que publicó y no publicó.
- `preview` no toca el gateway: funciona aunque WhatsApp esté caído.

### 5.5 Tipo de notificación

Añadir `"product_list"` al union `NotificationType` en `notification.entity.ts`.
El `Record` de `resolveChannels()` es exhaustivo — TypeScript obligará a añadir la
entrada; se mapea a `null` (no es una alerta con toggle de canal), igual que se
tratan los tipos sin campo en `BusinessSetting`.

### 5.6 Gating de plan

1. Añadir `"productListShare"` a `PLAN_FEATURE_KEYS` en
   `psearch-back/src/v2/entities/plan.entity.ts`. **Sin esto, `sanitizeFeatures()`
   descarta la llave en silencio** al guardar un plan.
2. Migración `JSON_SET(features, '$.productListShare', CAST('true' AS JSON))` para
   `premium`, `enterprise` y `free` (el trial replica Pro). **`CAST('true' AS JSON)`,
   no `TRUE`** — en MySQL `TRUE` es el entero 1 y el gate compara `=== true`.
   Precedente exacto: `20260730120000-GrantSmsNotificationsToAllPlans.ts`.

---

## 6. Frontend

### 6.1 Navegación (D1)

**No se toca código ni migraciones**: los nodos del menú se crean desde
`/dashboard/admin/menus` (o `POST /api/v2/section` y `/api/v2/menu`):

| Nodo | Valores |
|---|---|
| Sección | `name: "Difusión"`, `icon: "Megaphone"`, `active: true` |
| Menú | `name: "Listado de productos"`, `icon: "Send"`, `url: "/dashboard/difusion/listado-productos"`, `sectionId: <id de Difusión>` |

Dos avisos verificados en el código:

- El `url` debe coincidir **carácter a carácter** con la ruta del archivo Next, o
  el enlace da 404 (`next.config.ts` usa `output: "export"` + `trailingSlash: true`).
- El `icon` debe ser una clave existente de `pmanage/src/lib/icon-map.ts`.
- El `name` debe ser **único**: la re-hidratación del formulario de permisos de
  trabajador hace match por nombre (`worker-form.tsx:123-128`), y un duplicado
  produciría selecciones cruzadas.

**Permisos de trabajador: automáticos.** Al existir el nodo, aparece solo en el
selector de permisos y el dueño lo asigna a quien quiera. Nada que programar.

### 6.2 Gate de ruta

Añadir a `PRO_ROUTES` en `pmanage/src/lib/pro-gates.ts`:

```ts
{ path: "/dashboard/difusion/listado-productos", feature: "productListShare", redirect: "/dashboard" }
```

`RouteGuard` (redirección real) y el sidebar (badge Pro + deshabilitado) se derivan
solos. Añadir también la llave a `PLAN_FEATURES` en `pmanage/src/lib/plan-features.ts`
(grupo "Notificaciones y soporte") para que salga en la vitrina y en el formulario
de admin de planes.

### 6.3 Capas (convención rígida del repo, misma que proveedores)

```
src/lib/routes/product-list.ts        → URLs del backend
src/lib/types/product-list.ts         → tipos de dominio y respuestas
src/lib/validations/product-list.ts   → esquemas Zod
src/lib/api/product-list.ts           → funciones axios (apiClient)
src/hooks/use-product-list.ts         → useQuery / useMutation
src/app/dashboard/difusion/listado-productos/page.tsx
src/components/product-list-share/    → selector, editor, previa
```

### 6.4 La vista

```
┌─ Seleccionar productos ─────────┐ ┌─ Vista previa (así llega) ────────┐
│ [Buscar...] [Categoría ▾]       │ │ *La Esquina*                      │
│ ☑ Solo disponibles (con stock)  │ │                                   │
│ ☑ Seleccionar todos (32)        │ │ Buenos días! Ya estamos abiertos, │
│                                 │ │ hacemos entrega en toda la zona.  │
│ ▼ Lácteos                       │ │                                   │
│   ☑ Queso gouda      450 CUP/kg │ │ *LÁCTEOS*                         │
│   ☑ Yogurt natural   120 CUP/ud │ │ • Queso gouda — 450 CUP/kg        │
│ ▼ Aseo                          │ │ • Yogurt natural — 120 CUP        │
│   ☑ Detergente 1L    310 CUP    │ │                                   │
│                                 │ │ *ASEO*                            │
│ ── Qué mostrar ──               │ │ • Detergente 1L — ~350~ *310 CUP* │
│ ☑ Precio  ☑ Disponibilidad      │ │                                   │
│ ☐ Unidad  ☑ Agrupar por categ.  │ │ Pedidos al 5555-5555 hasta las 6. │
│ ☑ Marcar ofertas                │ │                                   │
│                                 │ │ _Actualizado: 21/08/2026_         │
│ Introducción: [texto libre]     │ │      3 productos · 1 mensaje      │
│ Nota final:   [texto libre]     │ └───────────────────────────────────┘
│                                 │  Enviar a: [ Dueño · +53 5555 5555 ▾ ]
│ Plantilla: [Lista de lunes ▾]   │      [Guardar plantilla] [Enviar]
└─────────────────────────────────┘
```

**Datos del selector:** `GET /v2/businesses/:id/products?search=` — ya existe,
devuelve nombre, precio, stock, unidad y categoría de una sola vez. **No hace
falta endpoint nuevo** para el selector; el filtrado y el agrupado se hacen en
cliente. El texto final siempre lo arma el backend.

**Previa:** `POST /preview` con debounce (~400 ms) sobre los cambios del formulario.

**Estado de error:** si `send` falla, toast de error y **se conserva la selección y
los textos**. Nunca se limpia el formulario ante un fallo.

---

## 7. Pasos de implementación

**Backend**

1. `nest g mo v2/product-list-share` + service, controller y DTOs (patrón `monetary-exchange`).
2. Entidad `ProductListTemplate` + migración `CREATE TABLE IF NOT EXISTS`.
3. `product-list-message.util.ts` + `.spec.ts` — el constructor del mensaje y su paginación.
4. `"product_list"` en `NotificationType` + entrada en el `Record` de `resolveChannels`.
5. Endpoints `preview`, `send`, `recipients` y CRUD de plantillas, con guards y `PlansModule`.
6. `"productListShare"` en `PLAN_FEATURE_KEYS` + migración `JSON_SET` para premium/enterprise/free.
7. Registrar en `v2.module.ts` (imports **y** exports, orden alfabético) y en `swagger-versions.ts`.
8. Docs obligatorios del repo: `src/v2/migration_doc/154-product-list-share.md`, su `README.md` y `DATABASE_SCHEMA_V2.md`.

**Frontend**

9. Las 5 capas (`routes`, `types`, `validations`, `api`, `hooks`).
10. Página + componentes: selector agrupado, editor de textos, panel de opciones, previa, selector de destinatario.
11. Entrada en `PRO_ROUTES` y en `PLAN_FEATURES`.

**Puesta en marcha (manual, no es código)**

12. Crear la sección "Difusión" y el menú desde `/dashboard/admin/menus`, con la URL exacta.
13. Asignar el nodo a los trabajadores que deban usarlo.

---

## 8. Verificación

| Qué | Cómo |
|---|---|
| Constructor del mensaje | `pnpm test` sobre `product-list-message.util.spec.ts`: agrupación, ofertas tachadas, agotados, unidades, paginación a 2 mensajes, textos opcionales ausentes. |
| Gating server-side | Con un usuario de plan Básico, `POST /product-list/send` → **403**. Es la prueba de que el gate no vive solo en la UI. |
| Permiso de trabajador | Trabajador sin el nodo asignado → 403 del endpoint, no solo menú oculto. |
| Previa = envío | Comparar carácter a carácter el `messages[0]` de `preview` con el mensaje recibido en WhatsApp. |
| Fallo de gateway | Con `OPENWA_URL` apuntando a un puerto muerto: la UI muestra error, la fila queda `isSent: false` y `retry-failed` la recoge. |
| Plantilla desactualizada | Guardar plantilla, borrar un producto de una categoría incluida, reabrir: se resuelve sin él y sin error. |
| End-to-end | `pnpm dev` en ambos proyectos, componer un listado real y recibirlo en el WhatsApp del negocio. |

Antes de dar por cerrado: `npm run build` y `npm run typecheck` en `psearch-back`, y `pnpm build` en `pmanage` (**nunca `npm` en pmanage**).

---

## 9. Pendientes que deja esta v1

| Pendiente | Por qué se aplaza |
|---|---|
| **Envío programado** (D2) | Requiere entidad de programación, endpoint `POST /v2/cron/product-list` con `x-cron-token`, lógica de "¿toca ahora?" con idempotencia, y **dar de alta el cron en cPanel** — la app no tiene planificador propio (no usa `@nestjs/schedule`). Además, como el cron corre cada hora, una hora tipo "8:30" solo se cumpliría a las 9:00 salvo que se cambie la frecuencia. |
| **Disponibilidad en plan Básico** (D3) | La llave `productListShare` ya está separada; abrirlo es cambiar un JSON del plan. |
| **Imágenes / flyer / PDF** | Bloqueado hasta confirmar si el gateway expone `send-image` / `send-file`. |
| **Varios destinatarios y contactos gestionados (V3-114)** | La v1 elige destinatario por envío entre los trabajadores registrados. |
| **Verificación de números** | Un número sin verificar hace que los mensajes se pierdan en silencio. |
| **Límite de envíos por día** | Protege el número compartido de la plataforma. |

---

## 10. Riesgos a tener presentes

- **Sesión open-wa compartida:** un único número no oficial sirve a todos los
  negocios. Esta función solo escribe a los propios números del negocio, así que
  no lo expone; cualquier evolución hacia clientes finales sí lo haría.
- **Precios desactualizados tras el reenvío:** el cliente puede ver en el grupo un
  mensaje de hace tres días. Mitigado con la fecha en el pie del mensaje.
- **Teléfonos de trabajadores sin formato garantizado:** vienen de un servicio
  externo. Filtrar el desplegable con `isValidPhone` y normalizar antes de armar el chatId.
- **"Leer más":** los listados largos aparecen colapsados en el chat. No es un
  error, es cómo se ven; la paginación lo alivia.
