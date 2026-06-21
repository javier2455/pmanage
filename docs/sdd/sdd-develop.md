# SDD — pmanage (`develop` / Pre-producción)

> **Documento de especificación de la siguiente versión.** Describe el **delta sobre `main`**: features ya implementadas en `develop` que esperan promoverse a producción, trabajo en curso y roadmap.
> Para el sistema en producción ver [sdd-main.md](./sdd-main.md).

| | |
|---|---|
| **Rama** | `develop` |
| **Versión en `package.json`** | `1.16.5-alpha` |
| **Último commit** | `18b503a` (al 2026-06-20) |
| **Entorno** | Pre-producción / staging (pruebas internas) |
| **Sirve para** | Validar features antes de promover a `main` |
| **Backend** | `https://psearch.dveloxsoft.com/api/v2` (mismo que producción) |
| **Última actualización del documento** | 2026-06-20 |

---

## 1. Resumen ejecutivo

Cambios respecto a `main` agrupados por estado:

| # | Feature / cambio | Estado | PR / commit | ¿Lista para promover? |
|---|---|---|---|---|
| 1 | Historial de precios — iteración final con `EditPriceDialog` | ✅ Mergeada en develop | #8 | Sí |
| 2 | Refactor de rutas dinámicas con query params | ✅ Mergeada | `a18f6c7` | Sí |
| 3 | Despliegue en subdirectorio (`basePath` + `.htaccess`) | ✅ Mergeada | `8051f30`, `964c4c7` | Sí — requiere validar `NEXT_PUBLIC_BASE_PATH` en deploy |
| 4 | Limpieza del workflow de cPanel viejo | ✅ Mergeada | `efdf04e` | Sí |
| 5 | Sección **Categorías** + endpoints `expense-categories` | ✅ Mergeada | — | Sí — pendiente que backend incluya el menu item dinámico |
| 6 | Selector de categoría en formulario de gasto | ✅ Mergeada | `0dad138`, `fbfff42` | Sí |
| 7 | **Módulo de Proveedores** completo (CRUD, detalle, productos) | ✅ Mergeada | #9, `50a959d` | Sí |
| 8 | Tabla de productos por proveedor (`ProviderProductsTable`) | ✅ Mergeada | `8ef2b3d` | Sí |
| 9 | Auto-completar precio de entrada desde proveedor | ✅ Mergeada | `25e2b6a` | Sí |
| 10 | Refactor sidebar con secciones y visibilidad por rol | ✅ Mergeada | `a5a2a03` | Sí |
| 11 | Gestión de submenús (admin navigation) | ✅ Mergeada | `4c579ce` | Sí |
| 12 | Historial de inventario con timeline + back navigation | ✅ Mergeada | `3138a7e` | Sí |
| 13 | Página de edición catálogo con back navigation | ✅ Mergeada | `3138a7e` | Sí |
| 14 | Validación y estilado de `phone-input` | ✅ Mergeada | `636a506` | Sí |
| 15 | Comparador multi-producto en historial de precios | ✅ Mergeada | `485ae8b` | Sí — feature Pro gateada |
| 16 | **Exportación a PDF y Excel** en cierre diario y mensual | ✅ Mergeada | — | Sí — feature Pro gateada |
| 17 | OAuth con Google | 🔵 En rama remota `feature/auth-google` | — | **No** — no integrado en develop |
| 18 | Fix CORS / limpieza `src/app/api/` | 🔵 En rama remota `fix/cors-error` | — | **No** — sin merge |
| 19 | **Alertas de stock bajo/agotado** (feature Pro) | 🟡 Frontend implementado, backend pendiente | — | **No** — espera endpoints backend (ver §3.2) |
| 20 | **Configuración de notificaciones externas** (correo/SMS/WhatsApp, multi-canal, plan-gated) | ✅ Frontend + backend (`/businesses/:id/settings`) | — | Sí — backend entregó endpoints (ver §2.12) |
| 21 | **Notificaciones internas (in-app)** — campana + dropdown + página | 🟡 Frontend implementado, backend pendiente | — | **No** — espera endpoints backend (ver §3.3) |
| 22 | **Fila de producto cliqueable** abre el detalle en las tablas de Catálogo y Productos a la venta (se elimina "Ver detalles" del menú de acciones) | ✅ Mergeada en develop | — | Sí |
| 23 | **Gastos filtrados por negocio activo** + toggle "Todos los negocios" (reporte consolidado, gateado a Pro) | ✅ Mergeada en develop | — | Sí — backend ya soporta query param `businessId` |
| 24 | **Fila de venta cliqueable** abre el detalle; se elimina el dropdown de acciones y se deja solo un icono de "Cancelar venta" en la fila | ✅ Mergeada en develop | — | Sí |
| 25 | **Búsqueda de productos en servidor** + mejora de estados de carga | ✅ Mergeada | `02117cb` (1.4.3) | Sí |
| 26 | **Logout funcional** — invalida el token (`POST /auth/logout`) y limpia la sesión | ✅ Mergeada | `101828a` (1.5.0) | Sí |
| 27 | **Categoría a nivel de `BusinessProduct`** (por negocio) + paginación de categorías | ✅ Frontend mergeado | `2a13ebe` (1.6.0) | **No** — requiere migración de datos backend (ver §3) |
| 28 | **Horario de atención del negocio** (config por día) | ✅ Frontend + backend (`GET`/`PUT /businesses/:id/schedule`) | `16d42a6` (1.7.0) | Sí |
| 29 | **Refactor de permisos de trabajador a secciones** (payload de 3 capas con `sectionId`) | ✅ Mergeada | `de7e16a` (1.8.0) | Sí |
| 30 | **Stock con cantidades decimales** (unidades de peso/volumen) | ✅ Frontend mergeado | `c771e5e` (1.8.1) | Sí — verificar persistencia decimal en backend |
| 31 | **Editar la categoría de un producto dentro del negocio** (precio + categoría en un solo diálogo) | 🟡 Frontend implementado, backend pendiente | `22ee005` (1.13.0) | **No** — espera `PATCH .../products/:bpId/category` (ver [docs/backend-categoria-business-product.md](../backend-categoria-business-product.md)) |
| 32 | **Módulo de Tickets de Soporte** (conversación, cerrar/reabrir, asignación de admins) + **notificaciones de soporte** integradas (campana + página) | ✅ Frontend + backend (contrato entregado) | `c4b0801`→`da56ce3` (1.14.0–1.15.4) | Sí — verificar en QA (ver §2.15) |
| 33 | **Suite Multimoneda** (ventas + pagos + factura PDF + compras de inventario + asignar producto + tipo de venta/entrega + gastos) | 🟡 Frontend completo, backend parcial | `be2fec8`→`18b503a` (1.16.0–1.16.5) | **Parcial** — pagos/factura/stock OK; bloquea: bug de conversión base ≠ CUP, `currency` en gastos, regla de delivery (ver §2.16) |

> Ajustes menores en el rango 1.3.8–1.8.1 (no itemizados): eliminación del menú estático de fallback, hover en filas de productos, fix `markAllAsRead`, afinado de límites de notificaciones, botones `outline`.

---

## 2. Features mergeadas en `develop` (esperando producción)

### 2.1. Historial de precios — versión refinada (PR #8)

**Qué hace.** Cada vez que cambia el precio de un `BusinessProduct` se registra un `PriceHistoryEntry` con precio anterior, precio nuevo, moneda, usuario y fecha. El usuario puede:

- Editar el precio inline desde la fila del producto vía `EditPriceDialog` (reemplaza el viejo `EditProductForm` + `PriceHistoryTrigger`). _Nota (feature 31): este diálogo se renombró a `EditBusinessProductDialog` y ahora también edita la categoría._
- Ver el historial completo en una **página dedicada** (antes era un modal popover desde la fila).
- Comparar el historial de múltiples productos en paralelo (feature Pro, `485ae8b`).

**Archivos clave.**
- [src/hooks/use-product-price-history.ts](../../src/hooks/use-product-price-history.ts)
- [src/components/products/](../../src/components/products/) — `EditPriceDialog`, `price-history-item.tsx`, `price-history-product-selector.tsx`
- Tipo `PriceHistoryEntry` con `price` y `previousPrice` como **string** (para precisión decimal).

**Criterios de aceptación.**
- Cambiar el precio de un producto crea un nuevo registro visible al instante.
- El historial muestra delta, moneda formateada, usuario que realizó el cambio.
- El historial mock data fue eliminado (`d5350f8`); todo viene del backend.

**Riesgos.** Verificar que la migración no rompa instancias donde `price` venía como `number` en el frontend.

---

### 2.2. Rutas de edición con query params (`a18f6c7`, `3ba032e`)

**Qué hace.** Las páginas de edición usan `useSearchParams()` para leer el id en lugar de depender del segmento dinámico de Next.js. Se mantiene `generateStaticParams()` con el placeholder `__dynamic__`. Los links se construyen con `?id=...` donde aplica.

**Riesgos.** Si algún link interno aún apunta al patrón `/products/${id}/edit` sin query param puede romper en producción. Hacer grep antes de promover.

---

### 2.3. Despliegue en subdirectorio (SPA `basePath`)

- [next.config.ts](../../next.config.ts) lee `NEXT_PUBLIC_BASE_PATH` y aplica `basePath` + `assetPrefix`.
- [public/.htaccess](../../public/.htaccess) maneja rewrites tanto en raíz como en subdirectorio.

**Criterios de aceptación.**
- Build con `NEXT_PUBLIC_BASE_PATH=/pmanage` produce assets prefijados correctamente.
- Refresh de cualquier ruta dinámica resuelve gracias al `.htaccess`.

**Riesgos.** El env var debe inyectarse en build, no en runtime (export es estático).

---

### 2.4. Sección **Categorías** (nomenclador propio del negocio)

**Qué hace.** Nueva sección bajo `/dashboard/business/categories` con CRUD de categorías propias. Cubre **categorías de gastos** (endpoints backend listos); el diseño escala a futuras familias agregando entradas al record `KIND_META`.

- Hub `/dashboard/business/categories`: grid de cards con preview, contador, botón "Ver todas" y modal de alta.
- Detalle `/dashboard/business/categories/[kind]`: tabla paginada con acciones Ver / Editar / Eliminar.

**Archivos clave.**
- [src/components/categories/](../../src/components/categories/)
- [src/hooks/use-expense-categories.ts](../../src/hooks/use-expense-categories.ts)
- [src/app/dashboard/business/categories/](../../src/app/dashboard/business/categories/)

**Sidebar.** Mientras backend no incluye la entrada en `GET /menu/`, se inyecta vía [src/lib/menu/static-fallback.ts](../../src/lib/menu/static-fallback.ts). Cuando backend agregue el item con el payload siguiente, borrar el fallback:

```json
{
  "icon": "Tags",
  "name": "Categorías",
  "url": "/dashboard/business/categories",
  "active": true,
  "roles": null,
  "plans": null,
  "submenus": []
}
```

---

### 2.5. Selector de categoría en formulario de gasto (`0dad138`, `fbfff42`)

**Qué hace.** El formulario de gasto ([src/components/expenses/expense-form.tsx](../../src/components/expenses/expense-form.tsx)) ahora expone un `Select` que lista las categorías del negocio activo. El campo `expenseCategoryId` se persiste al crear/editar un gasto, y la categoría se muestra en la tabla y en el detalle de gasto.

**Estado.** Implementado y mergeado. Depende de que el backend acepte `expenseCategoryId` en el payload de gasto.

---

### 2.6. Módulo de Proveedores (PR #9, `50a959d` → `25e2b6a`)

**Qué hace.** Módulo completo de gestión de proveedores/suppliers:

- **Listado** (`/dashboard/business/providers`): tabla paginada con todos los proveedores del negocio.
- **Alta** (`/dashboard/business/providers/create`): formulario con nombre, teléfono (con validación de formato), y datos de contacto.
- **Edición** (`/dashboard/business/providers/[providerId]/edit`): edita todos los campos.
- **Detalle** (`/dashboard/business/providers/details`): vista completa del proveedor.
- **Productos del proveedor** (`ProviderProductsTable`): tabla de productos que ofrece el proveedor con precios. Implementada en `8ef2b3d`.
- **Auto-completar precio de entrada**: al seleccionar un proveedor en `UpdateStockForm`, el campo de precio de entrada se pre-rellena con el precio del producto en ese proveedor (`25e2b6a`).

**Archivos clave.**
- [src/components/business-providers/](../../src/components/business-providers/)
- [src/hooks/use-provider.ts](../../src/hooks/use-provider.ts)
- [src/lib/api/provider.ts](../../src/lib/api/provider.ts)
- [src/lib/routes/provider.ts](../../src/lib/routes/provider.ts)
- [src/lib/types/provider.ts](../../src/lib/types/provider.ts)
- [src/lib/validations/providers.ts](../../src/lib/validations/providers.ts)

**Criterios de aceptación.**
- CRUD completo de proveedores funcional contra el backend.
- La tabla de productos del proveedor muestra precios actualizados.
- Al crear una entrada de inventario y seleccionar un proveedor, el precio de entrada se auto-completa.
- Validación de formato de teléfono activa en el formulario.

---

### 2.7. Refactor del sidebar con secciones y visibilidad por rol (`a5a2a03`)

**Qué hace.** El sidebar ahora organiza los items en secciones (ej. "Negocio", "Admin") y filtra la visibilidad de cada item según el rol del usuario, consumiendo la respuesta de `GET /menu/` con mayor granularidad.

---

### 2.8. Gestión de submenús — admin navigation (`4c579ce`)

**Qué hace.** Los administradores pueden crear, editar y eliminar submenús desde `/dashboard/admin/menus`. Nuevos diálogos `SubmenuFormDialog` integrados en el árbol de navegación de admin.

**Archivos clave.**
- [src/components/navigation-admin/submenu-form-dialog.tsx](../../src/components/navigation-admin/submenu-form-dialog.tsx)

---

### 2.9. Historial de inventario + back navigation (`3138a7e`)

**Qué hace.**
- La página `/dashboard/business/inventory/history` muestra un timeline completo de movimientos de inventario (compras, cancelaciones, stock inicial) con estilos por tipo de acción.
- Ambas páginas (historial de inventario y edición de catálogo) incluyen ahora links de navegación "Volver" para mejorar el flujo.
- Mejoras de estilo en `phone-input` para mayor consistencia visual.

---

### 2.10. Exportación a PDF y Excel en cierres contables

**Qué hace.** Los usuarios Pro pueden descargar el cierre contable (diario o mensual) como archivo PDF o Excel directamente desde la página de cierre. El backend devuelve un `Blob` que el cliente convierte en descarga nativa del navegador.

**Archivos clave.**
- [src/hooks/use-accounting-close.ts](../../src/hooks/use-accounting-close.ts) — `useExportToPdf`, `useExportToExcel`
- [src/lib/api/accounting-close.ts](../../src/lib/api/accounting-close.ts) — `exportToPdf`, `exportToExcel` (axios con `responseType: "blob"`)
- [src/app/dashboard/accounting-close/daily/page.tsx](../../src/app/dashboard/accounting-close/daily/page.tsx) — botones "Exportar a PDF" / "Exportar a Excel"
- [src/app/dashboard/accounting-close/monthly/page.tsx](../../src/app/dashboard/accounting-close/monthly/page.tsx) — ídem

**Pro-gating.** Botones deshabilitados con tooltip "Requiere plan Pro para exportar" cuando `!isProPlan`.

---

### 2.12. Configuración de notificaciones externas (`business-settings`)

**Qué hace.** Permite configurar, por negocio, qué alertas se reciben y por qué **canal**
(`email`, `sms`, `whatsapp`). Cubre 4 tipos: cierre diario, cierre mensual, stock bajo y producto agotado.
Reutiliza y amplía la tarjeta `NotificationSettingsCard` dentro de los detalles del negocio.

- **Multi-canal con gating por plan:** `email` disponible en todos los planes; `sms`/`whatsapp` requieren
  plan PRO (Premium/Enterprise) y un teléfono válido asociado al negocio.
- Carga la config con GET y persiste con PATCH (el backend crea la config al crear el negocio).

**Archivos clave.**
- [src/lib/types/business-settings.ts](../../src/lib/types/business-settings.ts), [src/lib/validations/business-settings.ts](../../src/lib/validations/business-settings.ts)
- [src/lib/api/business-settings.ts](../../src/lib/api/business-settings.ts), [src/hooks/use-business-settings.ts](../../src/hooks/use-business-settings.ts)
- [src/components/business/notification-settings-card.tsx](../../src/components/business/notification-settings-card.tsx)
- [src/lib/routes/business.ts](../../src/lib/routes/business.ts) — ruta `settings(businessId)`.
- Fix relacionado en [src/lib/pro-gates.ts](../../src/lib/pro-gates.ts): `isProPlan()` ahora reconoce `enterprise`.

**Contrato backend.** [docs/API.md](../API.md) (GET/POST/PATCH `/businesses/{businessId}/settings`).

**Estado.** Frontend implementado y backend con endpoints entregados. Listo para promover.

---

### 2.13. Fila de producto cliqueable abre el detalle (tablas de Productos)

**Qué hace.** En la vista de Productos (`/dashboard/business/products`), cada fila de las **dos** tablas — **Catálogo del almacén** y **Productos a la venta** — es cliqueable y abre el diálogo de detalle del producto (`ProductDetailsDialog`). Se **elimina** la opción "Ver detalles" del menú de acciones (`Popover`) de ambas tablas, ya que la fila la reemplaza. El resto de acciones (Editar, Editar precio, Eliminar) se conserva; al hacer click sobre la celda de acciones se detiene la propagación para no abrir el detalle.

**Implementación.**
- [src/components/products/details-dialog.tsx](../../src/components/products/details-dialog.tsx) — `ProductDetailsDialog` admite modo **controlado** opcional (`open` / `onOpenChange`); cuando se controla externamente no renderiza su propio `DialogTrigger`. El modo no controlado (con `trigger`) sigue funcionando para otros consumidores.
- [src/components/products/table.tsx](../../src/components/products/table.tsx) (Productos a la venta) y [src/components/products/table-of-other-products.tsx](../../src/components/products/table-of-other-products.tsx) (Catálogo) — estado local del producto seleccionado, `onClick` por fila con `cursor-pointer`, `stopPropagation` en la celda `actions`, y un único `ProductDetailsDialog` controlado por tabla.
- [src/components/products/business-products-table-columns.tsx](../../src/components/products/business-products-table-columns.tsx) y [src/components/products/catalog-products-table-columns.tsx](../../src/components/products/catalog-products-table-columns.tsx) — se quita el item "Ver detalles" del `Popover` y los imports asociados (`Eye`, `ProductDetailsDialog`).

**Criterios de aceptación.**
- Click en cualquier parte de una fila (salvo la celda de acciones) abre el detalle del producto correcto.
- El menú de acciones ya no incluye "Ver detalles"; las demás acciones siguen operando sin abrir el detalle.

---

### 2.14. Fila de venta cliqueable + acción de cancelar simplificada

**Qué hace.** En la vista de Ventas (`/dashboard/business/sales`), cada fila de la tabla es cliqueable y abre el diálogo "Resumen de venta" (`DetailsDialog`). Se **elimina** el dropdown de acciones (`Popover` con "Ver detalles" + "Cancelar venta") y se deja **una sola acción directa en la fila**: un botón-icono fantasma (`XCircle`) que se tiñe de `destructive` al hover, con tooltip "Cancelar venta". En ventas ya canceladas el icono **no se renderiza** (el badge "Cancelada" de la columna Estado ya lo comunica). Al hacer click sobre la celda de acciones se detiene la propagación para no abrir el detalle.

**Decisión de diseño.** Se evaluaron tres variantes (icono fantasma + tooltip, botón con texto, icono rojo siempre visible). Se eligió **icono fantasma + tooltip** por ser consistente con el patrón `Button variant="ghost" size="icon-sm"` ya usado en la app, mantener la columna estrecha y dar protagonismo a la fila como elemento interactivo principal.

**Implementación.**
- [src/components/sales/details-dialog.tsx](../../src/components/sales/details-dialog.tsx) — `DetailsDialog` admite modo **controlado** opcional (`open` / `onOpenChange`); sin trigger propio cuando se controla externamente. El modo no controlado (con `trigger`) se conserva.
- [src/components/sales/table-of-sales.tsx](../../src/components/sales/table-of-sales.tsx) — estado de la venta seleccionada, `onClick` por fila con `cursor-pointer` + `hover:bg-muted/60`, `stopPropagation` en la celda `actions`, y un único `DetailsDialog` controlado.
- [src/components/sales/sales-table-columns.tsx](../../src/components/sales/sales-table-columns.tsx) — la columna `actions` renderiza solo el `CancelSaleDialog` (con `tooltip`) sobre un botón-icono fantasma; se quita el `Popover` y el item "Ver detalles". `CancelSaleDialog` ya soportaba la prop `tooltip`.

**Criterios de aceptación.**
- Click en cualquier parte de una fila (salvo la celda de acciones) abre el resumen de la venta correcta.
- La columna de acciones muestra solo "Cancelar venta" (icono + tooltip) en ventas activas; nada en las canceladas.
- Cancelar desde el icono no abre el detalle y conserva el flujo de razón obligatoria.

---

### 2.15. Módulo de Tickets de Soporte (`c4b0801` → `da56ce3`)

**Qué hace.** Canal de soporte dentro de la app: el usuario crea tickets y conversa con el equipo; el admin gestiona, responde, cierra/reabre y se asigna tickets. Incluye notificaciones de soporte integradas en la bandeja existente. Contrato backend completo en [docs/funtion.md](../funtion.md).

**Vistas.**
- **Usuario** (`/dashboard/support`): listado "Mis tickets" paginado, diálogo de creación y detalle (`/dashboard/support/details?id=`) con **conversación tipo chat**, caja de respuesta y cerrar/reabrir.
- **Admin** (`/dashboard/admin/support`): bandeja paginada con filtro por estado (Tabs), columna de asignación, y detalle de gestión (`/dashboard/admin/support/details?id=`) con responder, cerrar/reabrir, refrescar y **"Asignarme"**.

**Conversación y estado.** El hilo se renderiza desde `ticket.messages`. Responder: `POST /:id/messages` (usuario) o `/:id/admin-messages` (admin), que reabre el ticket si estaba cerrado. Cerrar/reabrir: `PATCH /:id/status` (canónico; el `/close` legacy queda sin usar).

**Asignación de admins.** Auto-asignación por menor carga (`assignedAdminId`/`assignedAdminName`/`assignedAt`); solo el admin asignado puede responder (`403` en caso contrario). `PATCH /:id/assign` (con body `{}` por diseño) permite tomar el ticket; el botón **"Asignarme"** aparece **solo en tickets sin asignar** y la bandeja muestra el **nombre** del admin asignado (columna "Asignado a").

**Notificaciones de soporte.** Por usuario (no por negocio), fusionadas en la campana del topbar (contador combinado) y en `/dashboard/notifications` como pestaña "Soporte" con paginador propio. El deep-link resuelve destino (usuario vs admin) según el rol logueado, no por `recipientType` (que la lista puede omitir).

**Archivos clave.**
- [src/lib/routes/support-ticket.ts](../../src/lib/routes/support-ticket.ts), [src/lib/types/support-ticket.ts](../../src/lib/types/support-ticket.ts), [src/lib/validations/support-ticket.ts](../../src/lib/validations/support-ticket.ts), [src/lib/api/support-ticket.ts](../../src/lib/api/support-ticket.ts), [src/hooks/use-support-ticket.ts](../../src/hooks/use-support-ticket.ts).
- Notificaciones: [src/lib/types/support-notification.ts](../../src/lib/types/support-notification.ts), [src/lib/api/support-notification.ts](../../src/lib/api/support-notification.ts), [src/hooks/use-support-notification.ts](../../src/hooks/use-support-notification.ts), [src/components/notifications/support-notification-item.tsx](../../src/components/notifications/support-notification-item.tsx).
- UI: [src/components/support-tickets/](../../src/components/support-tickets/), [src/app/dashboard/support/](../../src/app/dashboard/support/), [src/app/dashboard/admin/support/](../../src/app/dashboard/admin/support/).
- `ICON_MAP` ampliado con iconos de soporte (`LifeBuoy`, `Headset`, `Ticket`, etc.) para el gestor de menús ([src/lib/icon-map.ts](../../src/lib/icon-map.ts)).

**Criterios de aceptación.**
- Usuario crea ticket → aparece en su listado → abre el detalle y ve/responde la conversación.
- Admin lista, filtra por estado, se asigna un ticket, responde y cierra/reabre.
- Las notificaciones de soporte aparecen en la campana y en la pestaña "Soporte" de la página.

**A verificar en QA.** Formas de respuesta de cada endpoint, flujo de asignación (qué admin puede responder), y registro de las dos secciones de navegación en el gestor de menús.

### 2.11. Otros mergeados menores

- **ICON_MAP expandido** (`7a55b56`) — nuevos iconos para mayor consistencia en UI.
- **Rutas de búsqueda** actualizadas con prefijo `/search` (`ffeb665`).
- **Guías de uso** para Navigation Management y Providers en `docs/` (`0bb7b64`).
- **Bump de versión** a `1.1.0-alpha` (`c3937f2`), `1.3.1-alpha` (`3138a7e`), `1.3.2-alpha` (`ef36fac`).
- **Upgrade lucide-react** a `1.17.0` (`ef36fac`).

### 2.16. Suite Multimoneda (feature 33) — `be2fec8`→`18b503a`

**Qué hace.** Lleva la divisa a todo el flujo comercial: ventas en cualquier moneda
configurada, pagos parciales/mixtos con tasa congelada, factura PDF, compras de
inventario y asignación de producto con costo en divisa, tipo de venta + entrega, y
gastos con moneda. Reutiliza `src/lib/currency.ts`, `useExchangeRate` y
`getAvailableCurrencies` (monedas derivadas de `MonetaryExchange`, no lista fija).

**Spec/guía completa.** [docs/guia-implementacion-multimoneda.md](../guia-implementacion-multimoneda.md)
(sección **0.1 Estado de implementación** = fuente de verdad del estado actual).
Detalle también en [estado-proyecto.md](../estado-proyecto.md) (feature 33).

**Archivos clave.**
- Ventas/pagos: [payment-dialog.tsx](../../src/components/sales/payment-dialog.tsx),
  [sale-cart-panel.tsx](../../src/components/sales/sale-cart-panel.tsx),
  [sales/create/page.tsx](../../src/app/dashboard/business/sales/create/page.tsx),
  [details-dialog.tsx](../../src/components/sales/details-dialog.tsx) (factura descargar/regenerar).
- Inventario/productos: [update-stock-form.tsx](../../src/components/inventory/update-stock-form.tsx),
  [entry-cost-currency.tsx](../../src/components/products/entry-cost-currency.tsx) (componente compartido).
- Gastos: [expense-form.tsx](../../src/components/expenses/expense-form.tsx).
- Utilidades: [src/lib/currency.ts](../../src/lib/currency.ts), [src/lib/currency-errors.ts](../../src/lib/currency-errors.ts).

**Desviación de diseño.** En add-stock y asignar producto la **tasa no es editable**:
se toma automática de `MonetaryExchange` y se envía como `exchangeRateApplied` para que
el preview coincida con lo guardado.

**Bloqueadores (backend) — ver §3.**
- 🐞 Conversión de pagos con base ≠ CUP invertida → [docs/bug-conversion-pagos-multimoneda.md](../bug-conversion-pagos-multimoneda.md).
- 🚧 `POST/PATCH /expenses` no acepta `currency` (400 `"property currency should not exist"`).
- ❓ Regla de delivery por negocio no expuesta (`400 "Este negocio no ofrece servicio de delivery/mensajería"`).

**Criterios de aceptación.**
- Venta en USD + pago mixto USD/CUP → conversión correcta, `paid` al completar.
- Factura solo visible/descargable en ventas `paid`; regenerar reemplaza el PDF.
- add-stock/asignar producto en USD → `entryPrice` guardado en CUP = `monto × tasa`.

---

## 3. Trabajo en curso (ramas en flight)

### 3.1. Ramas pendientes de merge

| Rama | Último commit | Estado | Notas |
|---|---|---|---|
| `feature/auth-google` (remota) | `35eee53` | En revisión | Popup OAuth con Google. Requiere endpoint backend `/auth/google`. |
| `fix/cors-error` (remota) | `b71a03a` | En revisión | Limpia carpeta `src/app/api/` no usada que causaba CORS al deployar. |

> La rama local `cooing-weather` (`v0.16.1-beta`) y `feature-providers` (placeholder) siguen presentes. Validar si tienen cambios relevantes o deben borrarse antes del PR de promoción.

### 3.2. Alertas de stock bajo / agotado (frontend listo, backend pendiente)

**Qué hace.** Avisa cuando el stock de un producto cae por debajo de un umbral configurable
(**stock bajo**) o llega a 0 (**agotado**). Feature **Pro**.

- Campo `stockAlertThreshold` en `BusinessProduct` (null = sin alerta).
- El umbral se define en **dos lugares** (complementarios): opcional al **asignar** un producto al
  negocio ([assign-product-to-business-form.tsx](../../src/components/products/assign-product-to-business-form.tsx), gateado a Pro)
  y editable luego desde el **diálogo en la tabla de inventario**.
- Badge visual por fila ("Sin stock" / "Stock bajo") + banner-resumen en la página de inventario.

**Archivos clave (frontend).**
- [src/lib/types/inventory.ts](../../src/lib/types/inventory.ts) — `StockAlert`, `StockAlertsResponse`, `SetStockAlert*`, `stockAlertThreshold` en `CurrentInventoryEntry`.
- [src/lib/routes/inventory.ts](../../src/lib/routes/inventory.ts) — `stockAlertRoutes`.
- [src/lib/api/stock-alerts.ts](../../src/lib/api/stock-alerts.ts), [src/hooks/use-stock-alerts.ts](../../src/hooks/use-stock-alerts.ts), [src/lib/stock-alert.ts](../../src/lib/stock-alert.ts).
- [src/components/inventory/](../../src/components/inventory/) — `stock-alert-badge.tsx`, `set-stock-alert-dialog.tsx`, `low-stock-alert-banner.tsx`.

**Bloqueador.** Endpoints backend pendientes. Contrato completo en
[docs/backend-alertas-stock.md](../backend-alertas-stock.md). Las llamadas (`apiClient`) ya apuntan
a las rutas definidas; fallan hasta que backend las implemente.

### 3.3. Notificaciones internas / in-app (frontend listo, backend pendiente)

**Qué hace.** Muestra **dentro del sistema** las notificaciones que el backend ya genera (11 tipos:
`out_of_stock`, `low_stock`, `sale_cancelled`, `negative_margin`, `expense_alert`, `price_changed`,
`weekly_summary`, `monthly_summary`, `stale_product`, `exchange_rate_stale`, `new_worker`).

- **Campana** en el topbar con badge de no leídos (polling 60s) + **dropdown** con feed reciente y
  "marcar todas como leídas".
- **Página** `/dashboard/notifications` con filtros por dominio (Inventario/Ventas/Finanzas/Equipo),
  toggle "solo no leídas" y paginación.
- Cada notificación lleva a su pantalla relevante (**deep-link** según `metadata`) y se marca leída al abrir.

**Archivos clave (frontend).**
- [src/lib/types/notification.ts](../../src/lib/types/notification.ts), [src/lib/routes/notification.ts](../../src/lib/routes/notification.ts)
- [src/lib/api/notifications.ts](../../src/lib/api/notifications.ts), [src/hooks/use-notifications.ts](../../src/hooks/use-notifications.ts)
- [src/components/notifications/](../../src/components/notifications/) — `notification-type-meta.ts` (icono/severidad/dominio/deep-link por tipo), `notification-bell.tsx`, `notification-item.tsx`.
- [src/app/dashboard/notifications/page.tsx](../../src/app/dashboard/notifications/page.tsx); campana montada en [src/app/dashboard/layout.tsx](../../src/app/dashboard/layout.tsx).

**Bloqueador.** Backend debe añadir un canal `in_app` y estado de leído (`readAt`) a la entidad
`Notification`, y exponer 4 endpoints (listar paginado, conteo de no leídos, marcar una/todas leídas).
Contrato completo en [docs/notificaciones-internas.md](../notificaciones-internas.md). Entrada de sidebar
"Notificaciones" pendiente de agregarse a `GET /section` (payload en ese doc).

> **Nota (feature 32):** las **notificaciones de soporte** son un segundo origen, **por usuario** (no por negocio), con su contrato **ya entregado** por backend (`/support-tickets/my-notifications`). Se integran en la misma campana y página de notificaciones (ver §2.15). El bloqueador de arriba aplica solo a las notificaciones **generales** (por negocio), no a las de soporte.

---

## 4. Roadmap (no implementado)

Tomado de [docs/extra/análisis-planes/analisis-planes.md](../extra/análisis-planes/analisis-planes.md) y [docs/extra/CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md).

### 4.1. Variante A — "Más datos, mismas operaciones" (est. 2–3 semanas)

Reportes sobre la información que ya capturamos. **Sin nuevas entidades**, solo agregaciones y filtros nuevos.

| Feature | Descripción | Endpoint backend necesario |
|---|---|---|
| Alertas de stock bajo | Marca productos por debajo de un umbral configurable. **Frontend ya implementado** (ver §3.2). | `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` (ver [docs/backend-alertas-stock.md](../backend-alertas-stock.md)) |
| Rentabilidad por producto | Margen = venta − costo entrada × cantidad vendida | `GET /products/profitability?from=&to=` |
| Comparativas de periodos | Ventas/gastos de este mes vs. el anterior | `GET /analytics/period-compare?range=` |
| Métricas por trabajador | Ventas atribuibles a cada worker | `GET /sales/by-worker` |

Spec técnica: [docs/extra/análisis-planes/spec-tecnicas.md](../extra/análisis-planes/spec-tecnicas.md).

### 4.2. Variante B — "Gestión integral" (est. 6–8 semanas)

| Feature | Estado de preparación |
|---|---|
| Presupuestos mensuales | Solo idea, sin spec |
| Historial de precios — fase 2 (forecasts, gráficos comparativos) | Ver [docs/extra/price-history-fase-2.md](../extra/price-history-fase-2.md) |

### 4.3. Núcleo contable (largo plazo, est. ~55 días)

Resumen de [docs/extra/CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md), 4 fases:

1. **Plan de cuentas + asientos contables** (doble entrada).
2. **Periodos fiscales con bloqueo** — impide editar transacciones de periodos cerrados.
3. **COGS y margen bruto** — captura el costo unitario al momento de la venta.
4. **AR/AP, snapshots de tipo de cambio por transacción, conciliación bancaria con CSV.**

Este bloque cambia significativamente la arquitectura: requiere modelar `JournalEntry`, `Account`, `FiscalPeriod`, etc. Discutir antes de comenzar.

### 4.4. Otros candidatos

- OAuth Google (rama existe, falta merge — ver §3.1).
- Exportaciones a Excel/PDF (feature Pro, no implementada).
- Notificaciones push o email para alertas de stock.

---

## 5. Política de promoción `develop` → `main`

### Criterios mínimos para promover una feature

1. **Mergeada en develop** y probada en el deploy de develop.
2. **Sin regresiones** reportadas por el equipo después de >48h en pre-producción.
3. **SDD actualizado**: el bloque correspondiente se mueve de `sdd-develop.md` a `sdd-main.md` en el mismo PR de promoción.
4. **Backend compatible**: si depende de endpoints nuevos, éstos ya están en producción del backend.
5. **Sin TODOs críticos** ni `console.log` agregados nuevos.

### Mecanismo

1. Crear PR `develop → main` con changelog acumulado.
2. En ese mismo PR, mover los bloques en los SDDs.
3. Actualizar el campo "Versión en `package.json`" y el commit hash en la cabecera de `sdd-main.md`.
4. Mergear con merge commit (no squash) para preservar la historia de develop.
5. Taggear la versión: `git tag v1.x.y && git push --tags`.

---

## 6. Guía para el equipo (y para Claude)

### 6.1. Cómo agregar una feature nueva

1. **Branch desde `develop`** con nombre descriptivo: `feature/<area>-<corta>` o `fix/<area>-<corta>`.
2. Si la feature introduce una entidad nueva, agregar:
   - `src/lib/routes/<entity>.ts` con los endpoints.
   - `src/lib/types/<entity>.ts` con los tipos.
   - `src/lib/validations/<entity>.ts` con schemas Zod.
   - `src/hooks/use-<entity>.ts` con los hooks de React Query.
   - Componentes en `src/components/<entity>/`.
3. Si toca el menú lateral, actualizar permisos en [src/lib/routes/menu.ts](../../src/lib/routes/menu.ts).
4. Si es feature Pro, añadirla a `PRO_ROUTES` en [src/lib/pro-gates.ts](../../src/lib/pro-gates.ts) y al renderizado del `<ProBadge>` correspondiente.
5. **Actualizar este documento (`sdd-develop.md`) en el mismo PR**: agregar entrada en §2 o §3 según el estado.
6. PR contra `develop` con descripción, screenshots si hay UI, y checklist de criterios de aceptación.

### 6.2. Convenciones

- **Query keys de React Query**: usar arrays `[entity, businessId, ...args]` — nunca strings sueltos.
- **Schemas Zod**: viven en `src/lib/validations/`, no inline.
- **Forms**: React Hook Form + zodResolver, siempre.
- **Currency display**: usar `formatMoney(value, currency)` de [src/lib/currency.ts](../../src/lib/currency.ts) (código de moneda como sufijo). **No** usar `Intl.NumberFormat` con `style: "currency"`: `EURO`/`MLC` no son ISO 4217 y rompen el formateo. Nunca concatenar `"$"` manualmente ni hardcodear `"COP"`/`"CUP"`. Las monedas seleccionables salen de `getAvailableCurrencies(exchange)`, no de listas fijas.
- **Mutations**: invalidar solo las queries específicas afectadas; no usar `queryClient.invalidateQueries()` sin key.
- **Imports**: usar alias `@/` definido en `tsconfig.json`.

### 6.3. Cuando un PR rompe la convención

Actualizar primero esta sección o §6.2, **luego** mergear el PR. Si el cambio amerita un ADR mini en `sdd-main.md`, agregarlo en el PR de promoción.

---

## 7. Mantenimiento de este documento

- Cada PR a `develop` que añade/quita/cambia una feature debe **editar este documento** en el mismo commit.
- Cuando una feature pasa a `main`, su bloque se **mueve** (no se duplica) a [sdd-main.md](./sdd-main.md).
- Cuando un ítem del roadmap se cierra como descartado, anótalo en §4 con una línea y la fecha.
- La tabla §1 (Resumen ejecutivo) es el dashboard. Si la editas, asegúrate de que refleja la realidad de `git log main..develop`.

---

## 8. Anexo — Comandos útiles

```bash
# ¿Qué hay en develop que no esté en main?
git log main..develop --oneline

# Diff de archivos modificados develop vs main
git diff main..develop --stat

# Promover una feature: PR de develop a main
gh pr create --base main --head develop --title "Release v1.x.y" --body "..."
```
