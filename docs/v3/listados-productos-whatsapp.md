# V3-110 / V3-114 — Listados de productos por WhatsApp

> **Versión:** v1.0 (borrador de diseño) · **Fecha:** 2026-08-21 · **Estado:** `idea` (con contrato propuesto)
> **Área:** Mensajería (§5 del maestro) · **Tier propuesto:** Pro
> **IDs:** **V3-110** (compositor de listados) · **V3-114** (destinatarios múltiples)
> **Maestro:** [V3-MASTER.md](./V3-MASTER.md) — este documento es el detalle; el maestro manda en caso de conflicto.
>
> Documento de trabajo de la conversación del 2026-08-21. Recoge **el estado real
> verificado en el código**, la funcionalidad acordada, el catálogo completo de
> ideas que abre este canal, los acuerdos tomados y lo que queda pendiente.

---

## Tabla de contenidos

0. [Resumen ejecutivo](#0-resumen)
1. [Estado actual verificado](#1-estado-actual)
2. [El concepto: difusión asistida, no automatizada](#2-concepto)
3. [V3-110 — Compositor de listados de productos](#3-v3-110)
4. [V3-114 — Destinatarios múltiples del negocio](#4-v3-114)
5. [Catálogo de ideas que abre el canal WhatsApp](#5-catalogo)
6. [Acuerdos tomados](#6-acuerdos)
7. [Decisiones pendientes](#7-pendientes)
8. [Riesgos y límites conocidos](#8-riesgos)
9. [Esfuerzo y fases](#9-esfuerzo)
10. [Bitácora de este documento](#10-bitacora)

---

<a name="0-resumen"></a>
## 0. Resumen ejecutivo

Hoy Negora **le avisa** al dueño por WhatsApp (stock bajo, cierres, resúmenes).
La propuesta es dar el segundo paso: que Negora **le prepare al dueño el mensaje
que él quiere publicar** — un listado de productos con precios, armado a mano
desde una vista del sistema, entregado a su WhatsApp, listo para reenviar a su
grupo de clientes con dos toques.

El punto clave del diseño: **el sistema nunca escribe al grupo**. Le escribe al
dueño (o al trabajador designado) y esa persona reenvía. No es una limitación
técnica: es lo que mantiene la función fuera del terreno del spam y protege el
número emisor de la plataforma (ver [§8](#8-riesgos)).

Dos entregables:

| ID | Qué | Esfuerzo |
|---|---|---|
| **V3-110** | Vista para componer un listado (selección de productos + textos libres + vista previa) y enviarlo al WhatsApp del negocio. | ~3 días |
| **V3-114** | Varios números por negocio (dueño, administrador, vendedor…), manuales o importados de los trabajadores registrados, y selector de destino en el envío. | ~2 días |

---

<a name="1-estado-actual"></a>
## 1. Estado actual verificado

Todo lo de esta tabla está comprobado en el código, no supuesto.

| Pieza | Estado real | Dónde |
|---|---|---|
| **Gateway WhatsApp** | Servicio open-wa autohospedado. El backend **solo consume `send-text`** (`POST {OPENWA_URL}/sessions/{id}/messages/send-text` con `{chatId, text}` y header `x-api-key`). Antes de cada envío, `ensureSessionActive()` consulta el estado y, si está caída, intenta arrancarla. | `psearch-back/src/v2/notifications/openwa.service.ts` |
| **Destino de los mensajes** | Siempre `Business.phone`, convertido a chatId con `phone.replace(/\D/g,"") + "@c.us"`. **Un solo número por negocio.** | `notification.service.ts:587` (`resolvePhone`) |
| **Formato de teléfonos** | El frontend valida y guarda en **E.164 con prefijo** (`+53…`), tanto para negocio como para trabajadores. Por eso `resolvePhone` funciona hoy pese a no normalizar el código de país. | `pmanage/src/lib/validations/phone.ts` |
| **Disparo de envíos** | **100 % reactivo**: eventos de dominio (listener) o cron de cierres. Todo pasa por `NotificationService.create()`, que exige que el tipo tenga su campo de canal en `BusinessSetting`. **No existe ningún camino "el usuario pulsa un botón y sale un mensaje".** | `notification.service.ts:76`, `resolveChannels():517` |
| **Plantillas WhatsApp** | Ya existen plantillas multilínea con `*negrita*` y emoji para cierres y stock. El patrón de formateo está resuelto y es reutilizable. | `buildWhatsappContent()` en `notification.service.ts:841` |
| **Persistencia y reintento** | Cada envío deja fila en `notifications` con `isSent` / `sendError`, y hay `POST /v2/notifications/retry-failed`. | `notification.controller.ts:222` |
| **Datos de producto** | `BusinessProduct` tiene `price`, `offerPrice` + `isOnOffer()` / `getEffectivePrice()`, `stock`, `category`, `priceCurrency`, `priceExchangeRateApplied`; la `unit` (kg/lb/g/L/mL/ud) vive en `Product`. **Todo lo que un listado necesita ya está.** | `business/entities/business-product.entity.ts` |
| **Permisos de trabajadores** | Por **nodos de navegación** (sección/menú/submenú) asignados en `business-worker`, con política server-side que veta los nodos de administración. Crear una página nueva la hace asignable automáticamente. | `navigation-policy/navigation-policy.service.ts` |
| **Teléfono de los trabajadores** | `BusinessWorker` **no** guarda teléfono (solo `userId` + `rol`), pero el servicio **ya enriquece cada trabajador con `phone`, `name`, `email` y `avatar`** desde `DVSUserClient` (requiere `accessToken`; sin él devuelve `null`). | `business-worker.service.ts:530-568` |
| **Gating de plan** | Ya existe la llave `whatsappNotifications` en el catálogo de features. | `pmanage/src/lib/plan-features.ts:34` |
| **Selección múltiple en tablas** | **No existe** (`rowSelection` no aparece en ningún componente del frontend). Hay que construir el selector. | — |
| **Envío de imágenes/archivos** | **Desconocido.** El backend no lo usa; falta comprobar qué rutas expone el gateway. | Ver [§7](#7-pendientes) |

---

<a name="2-concepto"></a>
## 2. El concepto: difusión asistida, no automatizada

El dueño de un negocio pequeño ya publica sus productos en un grupo de WhatsApp.
El trabajo tedioso no es enviar el mensaje: es **escribirlo cada día** — copiar
nombres, recordar precios, acordarse de qué se agotó, marcar las ofertas.

Negora tiene ese dato exacto y actualizado. La función le ahorra el mecanografiado
y le garantiza que **los precios que publica son los que están en el sistema**
(hoy el desfase entre "lo que publiqué en el grupo" y "lo que cobro en caja" es
una fuente real de fricción con el cliente).

Y se detiene justo antes del envío masivo:

```
   Negora                     Dueño / vendedor              Grupo de clientes
   ──────                     ────────────────              ─────────────────
   arma el mensaje  ────────▶  lo recibe en su WhatsApp
   con datos reales            lo revisa
                               reenvía (2 toques)  ────────▶  publicado
```

**Por qué parar ahí y no publicar directo en el grupo:**

- La sesión de open-wa es **un número no oficial compartido por todos los negocios**.
  Publicar en grupos de clientes desde ahí es el camino corto al bloqueo de WhatsApp,
  y ese bloqueo tumbaría *todas* las notificaciones de *todos* los negocios a la vez.
- Publicar en el grupo requeriría que la plataforma fuese miembro del grupo, con
  acceso a las conversaciones de los clientes.
- El dueño conserva el control editorial: revisa antes de publicar y puede no publicar.

El coste para el usuario es de dos toques (mantener pulsado → reenviar). El mensaje
aparecerá marcado como "Reenviado", lo cual es cosmético y esperable.

---

<a name="3-v3-110"></a>
## 3. V3-110 — Compositor de listados de productos

### 3.1 Flujo de usuario

1. El dueño (o un trabajador con permiso) entra a **Productos → Compartir listado**.
2. Selecciona los productos: uno a uno, por categoría, o **"seleccionar todos"**.
   Filtros de ayuda: buscador por nombre, filtro por categoría, "solo con stock".
3. Escribe un **texto de introducción** (saludo, horario, condiciones de entrega) y
   un **texto de cierre** (teléfono de pedidos, hora límite).
4. Ajusta opciones de presentación: mostrar precios, mostrar disponibilidad,
   agrupar por categoría, marcar ofertas.
5. Ve la **vista previa exacta** del mensaje mientras edita.
6. (Opcional) Guarda la configuración como **plantilla** reutilizable.
7. Pulsa **Enviar a mi WhatsApp** y elige el destinatario (ver [V3-114](#4-v3-114)).
8. Recibe el mensaje, lo revisa y lo reenvía a su grupo.

### 3.2 Boceto de la vista

```
┌─ Seleccionar productos ─────────┐ ┌─ Vista previa (así llega) ────────┐
│ [Buscar...] [Categoría ▾]       │ │ *Ofertas de hoy — La Esquina*     │
│ ☑ Seleccionar todos (48)        │ │                                   │
│ ☐ Solo con stock disponible     │ │ Buenos días! Ya estamos abiertos, │
│                                 │ │ hacemos entrega en toda la zona.  │
│ ▼ Lácteos                       │ │                                   │
│   ☑ Queso gouda      450 CUP/kg │ │ *LÁCTEOS*                         │
│   ☑ Yogurt natural   120 CUP/ud │ │ • Queso gouda — 450 CUP/kg        │
│   ☐ Leche en polvo   980 CUP/kg │ │ • Yogurt natural — 120 CUP        │
│ ▼ Aseo                          │ │                                   │
│   ☑ Detergente 1L    310 CUP    │ │ *ASEO*                            │
│                                 │ │ • Detergente 1L — ~350~ *310 CUP* │
│ ── Opciones ──                  │ │                                   │
│ ☑ Mostrar precios               │ │ Pedidos al 5555-5555 hasta las 6. │
│ ☐ Mostrar cantidad disponible   │ │                                   │
│ ☑ Agrupar por categoría         │ │        3 de 3 productos · 1 msj   │
│ ☑ Marcar ofertas                │ └───────────────────────────────────┘
│                                 │  Enviar a: [ Dueño · +53 5555 5555 ▾ ]
│ Introducción: [texto libre]     │      [Guardar plantilla] [Enviar]
│ Cierre:       [texto libre]     │
└─────────────────────────────────┘
```

### 3.3 Backend — entidades

**`ProductListTemplate`** (plantillas guardadas y último uso):

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | FK → Business | |
| `name` | string | "Lista de lunes", "Ofertas del finde" |
| `intro` | text \| null | texto de introducción |
| `outro` | text \| null | texto de cierre |
| `options` | json | `{ showPrices, showStock, groupByCategory, markOffers, currencyMode }` |
| `productIds` | json (string[]) | selección guardada; puede quedar obsoleta (ver nota) |
| `createdBy` | string (userId) | quién la creó |
| `createdAt` / `updatedAt` | timestamp | |

> **Nota sobre `productIds` guardados:** un producto puede borrarse o quedarse sin
> stock entre que se guarda la plantilla y se usa. Al cargar una plantilla hay que
> **resolver contra el inventario actual** y avisar en la UI ("2 productos de esta
> plantilla ya no existen"), nunca fallar el envío entero.

El **historial de envíos** no necesita entidad nueva: se reutiliza `notifications`
con un `NotificationType` nuevo (`product_list`), lo que da trazabilidad, `isSent`,
`sendError` y reintento gratis.

### 3.4 Backend — endpoints

```
POST /v2/notifications/product-list/preview
  body: { businessId, productIds[], intro?, outro?, options }
  200:  { messages: string[], productCount: number, characterCount: number }

POST /v2/notifications/product-list/send
  body: { businessId, productIds[], intro?, outro?, options, recipientId? }
  200:  { sent: true, messages: 2, notificationIds: [...] }
  502:  { sent: false, reason: "whatsapp_session_down" }

GET    /v2/product-list-templates?businessId=
POST   /v2/product-list-templates
PATCH  /v2/product-list-templates/:id
DELETE /v2/product-list-templates/:id
```

**Regla de oro:** `preview` y `send` deben usar **exactamente la misma función de
construcción del texto**. Si la vista previa se reimplementa en el frontend, lo que
el dueño revisa y lo que acaba reenviando a sus clientes divergen a la primera
diferencia de redondeo. La preview vive en el backend.

**El envío no pasa por `NotificationService.create()`**: ese camino resuelve canales
desde `BusinessSetting` y aquí no aplica — esto no es una alerta configurable sino
una acción explícita del usuario. Se llama directo a `openwaService.sendText()` y se
persiste la fila de `notifications` a mano, con `channel: "whatsapp"`.

### 3.5 Reglas de formateo del mensaje

| Aspecto | Regla |
|---|---|
| **Precio** | Se publica `getEffectivePrice()` (respeta la oferta vigente). Formato reutilizando `formatMoney()`, que ya agrupa miles. |
| **Moneda** | `BusinessProduct.price` **siempre está en CUP**; `priceCurrency` solo indica en qué moneda se *fijó*. Por defecto se publica en CUP. Opción `currencyMode: "original"` para mostrar el importe de fijación (`price / priceExchangeRateApplied`) en negocios que cotizan en USD. |
| **Unidad** | Se anexa la `unit` del producto cuando no es `ud`: `450 CUP/kg`. |
| **Ofertas** | Si `isOnOffer()`, se muestra el precio anterior tachado: `~350~ *310 CUP*`. Es formato nativo de WhatsApp. |
| **Disponibilidad** | **Apagado por defecto.** Ver [§6](#6-acuerdos). Cuando se activa, publica `Disponible` / `Agotado`, no la cantidad exacta. |
| **Agrupación** | Por categoría, con el nombre de la categoría en `*negrita*` y mayúsculas. Los productos sin categoría van al final bajo "OTROS". |
| **Encabezado** | `*{intro}*` o, si no hay intro, `*{nombre del negocio}*`. |
| **Longitud** | WhatsApp colapsa con "Leer más" alrededor de los ~700 caracteres (aproximado, depende del cliente). Por encima de ~3.500 caracteres el mensaje se vuelve incómodo: se parte en varios mensajes numerados (`(1/2)`), cada uno con su encabezado. **La preview debe decir cuántos mensajes van a salir**, porque cada uno se reenvía por separado. |

### 3.6 Permisos y gating

- **Permiso:** ninguno nuevo. Se crea el submenú y el dueño lo asigna a quien quiera
  desde la gestión de trabajadores existente. La `NavigationPolicyService` no lo
  bloqueará porque no cuelga de Administración.
- **Plan:** gate con `whatsappNotifications` (ya existe) o llave nueva `productListShare`
  si se quiere cobrar aparte. **El gate debe aplicarse también server-side** en el
  endpoint de `send`, siguiendo lo establecido en V3-106.
- **Dato sensible:** un trabajador con acceso a esta vista ve **precios de venta**,
  nunca costos ni márgenes. No hay fuga de información de costos.

### 3.7 Manejo de errores

Este es el primer envío de WhatsApp **síncrono y con un humano esperando**. Los
envíos actuales nacen de eventos y nadie mira si fallan; aquí no vale eso:

- Si `sendText()` devuelve `false` (sesión caída, gateway sin responder), el endpoint
  responde **error explícito**, no 200. La UI muestra "No se pudo enviar, reintenta"
  y **conserva la selección y los textos** del usuario.
- La fila queda con `isSent: false`, así que el `retry-failed` existente la recoge.
- **Nunca un toast de éxito optimista.** Es el detalle que más rápido destruye la
  confianza: el dueño cree que publicó y no publicó.
- La preview no toca el gateway: siempre funciona aunque WhatsApp esté caído.

### 3.8 Criterios de aceptación

- [ ] Seleccionar N productos, escribir intro y cierre, y ver la previa exacta antes de enviar.
- [ ] "Seleccionar todos" respeta los filtros activos (categoría / solo con stock).
- [ ] Un producto con oferta vigente sale con el precio de oferta y el anterior tachado.
- [ ] Un listado de 60 productos se parte en varios mensajes numerados y la previa lo anuncia.
- [ ] Con la sesión de WhatsApp caída, la UI muestra error y no pierde el trabajo del usuario.
- [ ] Un trabajador sin el permiso asignado recibe 403 del endpoint, no solo un menú oculto.
- [ ] Un negocio sin la feature de plan recibe 403 del endpoint.
- [ ] El texto recibido en WhatsApp es idéntico, carácter a carácter, al de la previa.

---

<a name="4-v3-114"></a>
## 4. V3-114 — Destinatarios múltiples del negocio

### 4.1 El problema

Hoy **hay un solo número por negocio** (`Business.phone`) y todo WhatsApp va ahí.
Eso rompe el caso de uso principal de V3-110: si un **vendedor** arma el listado,
el mensaje le llega **al dueño**, no a él — y el vendedor es justo quien iba a
reenviarlo al grupo. Sin resolver esto, la función solo sirve para el dueño.

### 4.2 Opciones evaluadas

| Opción | Cómo | A favor | En contra |
|---|---|---|---|
| **A. Seguir con un número** | Nada que hacer. | Cero trabajo. | Anula el caso "trabajador designado". Descartada. |
| **B. Contactos manuales del negocio** | Entidad nueva con etiqueta + número, gestionada en Ajustes. | Independiente de si la persona es usuario del sistema. Sirve para el móvil personal del dueño, distinto del número fijo del negocio. | El dueño teclea números; puede equivocarse. |
| **C. Tomar el número de los trabajadores** | Ya viable: `business-worker` devuelve `phone` de cada trabajador vía `DVSUserClient`. | Cero tecleo, datos ya existentes, se actualiza solo. | Depende de un servicio externo y de `accessToken`; el `phone` del usuario puede estar vacío o no ser un WhatsApp; un cron no tiene token de usuario. |

### 4.3 Recomendación: híbrido (B + C)

Se crea **un registro propio de destinatarios** (B) y los trabajadores (C) funcionan
como **fuente de sugerencias importables con un clic**:

```
Ajustes del negocio → Números de contacto
┌──────────────────────────────────────────────────────────┐
│ Dueño          +53 5555 5555   [principal] ✓ verificado  │
│ Administración +53 5555 1234               ✓ verificado  │
│ Vendedor turno +53 5555 9876               ⚠ sin verificar│
│                                                          │
│ Importar de mis trabajadores:                            │
│   + María Pérez (Vendedora)   +53 5555 4321              │
│   + Luis Gómez (Almacén)      — sin teléfono registrado  │
└──────────────────────────────────────────────────────────┘
```

Por qué copiar en vez de referenciar en vivo:

- El `phone` del usuario vive en un servicio externo y **el propio usuario puede
  cambiarlo**; un envío programado no debe romperse ni acabar en un número ajeno.
- Resolver el teléfono requiere `accessToken`; los **crons no lo tienen** (el propio
  `business-worker.service.ts` ya devuelve `phone: null` cuando falta). Cualquier
  envío automatizado a destinatarios necesita el dato persistido localmente.
- Un negocio necesita números que **no pertenecen a ningún usuario del sistema**
  (el móvil personal del dueño, el del socio que no usa Negora).

Se guarda `workerUserId` en el contacto importado para poder mostrar "importado de
María Pérez" y ofrecer resincronizar si el número cambia.

### 4.4 Entidad y endpoints

**`BusinessContact`**:

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | FK → Business | |
| `label` | string | "Dueño", "Administrador", "Vendedor de turno" |
| `phone` | varchar | **E.164 con prefijo**, misma validación que el resto (`isValidPhone`) |
| `source` | enum(`manual`,`worker`) | |
| `workerUserId` | string \| null | origen si `source = worker` |
| `isDefault` | boolean | destinatario preseleccionado; único por negocio |
| `verifiedAt` | timestamp \| null | ver [§7](#7-pendientes) |
| `active` | boolean | baja lógica sin perder historial |

```
GET    /v2/business-contacts?businessId=
POST   /v2/business-contacts
PATCH  /v2/business-contacts/:id
DELETE /v2/business-contacts/:id
GET    /v2/business-contacts/importable?businessId=   ← trabajadores con teléfono
```

**Migración:** `Business.phone` **no se toca** (lo usan las notificaciones actuales,
el canal SMS y la ficha pública del negocio). Se siembra un `BusinessContact`
etiquetado "Negocio" con `isDefault: true` a partir de él, y las notificaciones
existentes siguen funcionando igual. Un cambio de `Business.phone` en el futuro
podría sincronizar ese contacto sembrado, o dejarse independiente — decisión abierta.

### 4.5 Riesgos específicos

- **Normalización:** `resolvePhone()` solo quita los no-dígitos y añade `@c.us`; no
  añade el código de país. Funciona hoy porque el frontend guarda E.164, pero los
  números que vengan del servicio externo de usuarios **no tienen ese formato
  garantizado**. Todo contacto debe validarse con `isValidPhone` **antes** de
  guardarse, y el `chatId` construirse desde el número ya normalizado.
- **Consentimiento:** un número añadido a mano es una persona que empezará a recibir
  mensajes. Debe ser el dueño quien los añade, y conviene un primer mensaje de
  bienvenida que diga de dónde salió y cómo dejar de recibirlos.
- **Multiplicación de envíos:** permitir "enviar a varios destinatarios a la vez"
  multiplica el tráfico saliente del número compartido. Ver [§7](#7-pendientes).

---

<a name="5-catalogo"></a>
## 5. Catálogo de ideas que abre el canal WhatsApp

Todo lo evaluado en la conversación, ordenado por relación valor/esfuerzo. Los
apartados 5.1 y 5.2 se apoyan **solo en datos que ya existen** en el sistema.

### 5.1 Contenido que el dueño reenvía a sus clientes

Misma mecánica que V3-110, cambia el disparador:

| Idea | Base existente | Esfuerzo |
|---|---|---|
| **Listado a demanda** (V3-110) | — | M |
| **Listado programado** — "cada lunes 8:00 mándame los disponibles" | cron de cierres ya montado | S, una vez hecho V3-110 |
| **Novedades** — solo lo entrado desde el último envío ("Nuevo esta semana") | `createdAt` de productos y entradas de inventario | S |
| **Volvió a estar disponible** — producto que pasa de 0 a >0 | ya se detecta `out_of_stock`; es el evento inverso | S |
| **Liquidación sugerida** — productos estancados listos para publicar con rebaja | `stale_product` ya calcula `productNames` y `days` | S |
| **Aviso de horario** — cierre por inventario, horario especial, feriado | módulo de horarios del negocio | XS |
| **Flyer en imagen o PDF del catálogo** | `pdf-table.ts` / `pdf-report.ts` ya generan informes en backend | M — **bloqueado** por [§7](#7-pendientes) |

### 5.2 Información operativa para el dueño (no para reenviar)

| Idea | Base existente | Esfuerzo |
|---|---|---|
| **Top del día en el cierre diario** — "más vendido: X (12 uds)", "se agotó hoy: Y" | el cierre ya se envía; solo se enriquece la plantilla | XS |
| **Corte de mediodía** — "van $X en N ventas" a media jornada | mismo cron de cierres con otra hora | S |
| **Consulta bajo demanda** — el dueño escribe "ventas hoy" y el bot responde | **nada**: no hay recepción de mensajes | L — requiere webhook de entrada en el gateway |

### 5.3 Contenido hacia el cliente final

Ya está en el maestro y **requiere CRM (V3-001) y consentimiento explícito**:

- **V3-101** — Recibos y facturas compartibles por WhatsApp.
- **V3-093** — Recordatorios de cobro (AR).
- **V3-004** — Campañas a segmentos de clientes.

> ⚠️ **Advertencia de arquitectura.** En el momento en que la plataforma escriba a
> números de **clientes finales** desde la sesión open-wa compartida, el riesgo de
> bloqueo del número deja de ser teórico y pasa a ser cuestión de tiempo. Ese salto
> exige **un número por negocio** o la **API oficial de WhatsApp Business** con
> plantillas aprobadas. V3-110 evita el problema por completo porque solo escribe a
> los propios números del negocio.

---

<a name="6-acuerdos"></a>
## 6. Acuerdos tomados

1. **El sistema no publica en grupos.** Entrega al dueño/trabajador y esa persona
   reenvía. Es una decisión de diseño permanente, no un paso intermedio.
2. **La vista previa se construye en el backend**, con la misma función que el envío.
3. **El envío es síncrono y reporta el fallo real.** Nada de éxito optimista.
4. **El stock exacto no se publica por defecto.** Le dice a la competencia cuánto
   inventario hay y queda obsoleto a la primera venta; "Disponible / Agotado" cumple igual.
5. **Los precios se publican en CUP por defecto**, con opción de mostrar la moneda
   de fijación para negocios que cotizan en USD.
6. **No se crea un sistema de permisos nuevo:** basta el submenú + los permisos de
   trabajador existentes.
7. **`Business.phone` no se toca.** V3-114 añade una tabla aparte y siembra el
   contacto por defecto desde ese campo.
8. **Los teléfonos de trabajadores se importan (copian), no se referencian en vivo.**
9. **V3-110 no depende de V3-114 para empezar**: se puede entregar enviando al
   número del negocio y añadir el selector de destinatario después. Pero **sin V3-114
   la función solo sirve al dueño**, no al trabajador designado.

---

<a name="7-pendientes"></a>
## 7. Decisiones pendientes

| # | Pregunta | Impacto | Estado |
|---|---|---|---|
| **P1** | **¿El gateway soporta enviar imágenes o archivos?** Hay que mirar qué rutas expone el servicio detrás de `OPENWA_URL` además de `send-text`. | Si las soporta, se abre la mejor versión del catálogo: **un flyer o un PDF = un solo mensaje = un solo reenvío**, con fotos de producto, reutilizando el generador de PDF del backend. Si no, el alcance queda en texto. | **Abierta** |
| **P2** | **¿Se permite enviar a varios destinatarios de una vez?** | Multiplica el tráfico saliente del número compartido. Propuesta: **uno por envío** en la v1, con posibilidad de repetir. | Abierta |
| **P3** | **¿Verificación de números?** ¿Basta con que el dueño lo teclee, o se manda un código para confirmar que el número existe y tiene WhatsApp? | Sin verificar, un número mal tecleado hace que los mensajes se pierdan en silencio (o lleguen a un desconocido). Propuesta: campo `verifiedAt` en la entidad desde el inicio, verificación real en una segunda iteración. | Abierta |
| **P4** | **¿Llave de plan propia o reutilizar `whatsappNotifications`?** | Decide si la función se cobra aparte. | Abierta |
| **P5** | **¿Límite de envíos por negocio y día?** | Protege el número compartido de un uso excesivo. Propuesta: contador simple sobre `notifications` con tipo `product_list`. | Abierta |
| **P6** | **¿`Business.phone` sincroniza con su `BusinessContact` sembrado?** | Evita que queden desalineados tras editar la ficha del negocio. | Abierta |

---

<a name="8-riesgos"></a>
## 8. Riesgos y límites conocidos

| Riesgo | Detalle | Mitigación |
|---|---|---|
| **Sesión open-wa compartida** | Un único número no oficial sirve a todos los negocios. Si WhatsApp lo bloquea, **caen todas las notificaciones de toda la plataforma**. | No escribir jamás a clientes finales desde ahí ([§5.3](#5-catalogo)). Limitar volumen (P5). A futuro: número por negocio o API oficial. |
| **Sesión caída** | `ensureSessionActive()` intenta reiniciarla, pero el envío en curso falla igualmente. | Error explícito en la UI, trabajo del usuario preservado, `retry-failed` disponible. |
| **Solo texto** | Sin fotos de producto el listado es menos atractivo que lo que el dueño publica hoy a mano. | Depende de P1. |
| **"Leer más"** | Los listados largos aparecen colapsados en el chat. No es un error, es cómo se ven. | Paginar y avisar en la previa. |
| **Precios desactualizados tras el reenvío** | El cliente puede ver en el grupo un mensaje de hace tres días con precios ya cambiados. | Incluir fecha en el encabezado del mensaje. |
| **Teléfonos sin formato garantizado** | Los números que llegan del servicio externo de usuarios pueden no ser E.164. | Validar con `isValidPhone` antes de persistir cualquier contacto. |
| **Plantillas con productos borrados** | Una plantilla guardada puede referenciar productos que ya no existen. | Resolver contra el inventario actual al cargarla y avisar; nunca fallar el envío. |

---

<a name="9-esfuerzo"></a>
## 9. Esfuerzo y fases

| Fase | Contenido | Esfuerzo |
|---|---|---|
| **1. V3-110 backend** | Tipo `product_list`, constructor del texto, `preview` + `send`, entidad de plantillas, gating server-side. | ~1,5 d |
| **2. V3-110 frontend** | Página nueva, selector de productos con checkboxes agrupados, editor de textos, previa, manejo de error. | ~1,5 d |
| **3. V3-114** | Entidad `BusinessContact`, migración con siembra, CRUD, importación de trabajadores, selector en el envío. | ~2 d |
| **4. Extras** (opcional) | Listado programado, "novedades", flyer PDF (si P1 lo permite). | S cada uno |

**Total del núcleo (fases 1-3): ~5 días.** Sin tocar el gateway.

**Orden sugerido:** 1 → 2 (entregable útil para el dueño) → 3 (habilita al trabajador
designado) → 4.

---

<a name="10-bitacora"></a>
## 10. Bitácora de este documento

| Fecha | Cambio |
|---|---|
| 2026-08-21 | Creación. Recoge la conversación de diseño: estado verificado del canal WhatsApp, propuesta V3-110 (compositor de listados), propuesta V3-114 (destinatarios múltiples), catálogo completo de ideas del canal, 9 acuerdos y 6 decisiones abiertas. Estado de ambos IDs: `idea` con contrato propuesto. |
