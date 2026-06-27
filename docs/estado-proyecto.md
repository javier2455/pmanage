# Estado del proyecto — pmanage

> Documento de referencia del estado real del proyecto. Incluye lo implementado, lo que está en curso y las proyecciones de desarrollo.
> Última actualización: **2026-06-24** (trial Pro de 15 días + **selección de plan self-service** y **reconciliación de negocios** al hacer downgrade; **desactivación/reactivación de cuenta** con gracia de 15 días; **módulo de Caja / cuentas en divisa** (flujo de caja Fase 1); cancelación de venta con **devolución parcial y merma**; **delivery/mensajería por negocio** (`acceptsMessaging`); **rebranding a Negora**; stats del dashboard agrupadas por moneda; `RouteGuard` cliente para rutas Pro/admin en build estático — ver features 34–41). Anterior — 2026-06-20: suite **Multimoneda** (ventas con moneda + pagos multimoneda con factura PDF, compras de inventario y asignación de producto con costo en divisa, tipo de venta + entrega, y gastos con moneda; ver feature 33).

---

## Snapshot general

| | |
|---|---|
| **Versión actual** | `1.28.1-alpha` (rama `develop`) → `2.0.0` en `release/v2.0.0` |
| **Versión en producción** | `1.0.0` (rama `main`) — pendiente de promover a `2.0.0` |
| **Último commit** | `5bc8fe8` — 2026-06-27 |
| **PR `develop → main`** | **En preparación** — rama `release/v2.0.0` lista (ver [Promoción a producción v2](#promoción-a-producción-v2)) |
| **Bloqueadores para promover** | (1) Backend con bug al guardar gasto con `expenseCategoryId` (error SQL `:categoryId`); (2) contrato de **notificaciones in-app** (canal `in_app` + `readAt` + endpoints) — ver `docs/notificaciones-internas.md`; (3) **migración de categorías** a nivel de `BusinessProduct` en backend (ver feature 27); (4) **multimoneda — backend**: bug de conversión de pagos con base ≠ CUP y `currency` no aceptado en gastos (ver feature 33); (5) **selección de plan self-service / trial Pro**: contrato `POST /plans/select`, campos `Business.status`/`archivedReason`, suspensión de trabajadores y enforcement server-side aún por entregar (ver feature 39 y [análisis-planes/backend-cambios.md](análisis-planes/backend-cambios.md)) |

---

## Módulos implementados y en producción (`main` v1.0.0)

| Módulo | Plan |
|---|---|
| Autenticación completa (login, registro, verificación, reset, aceptar invitación) | — |
| Dashboard con stats de ventas y gastos recientes | Básico+ |
| Analytics (KPIs: ingresos, beneficio, ticket promedio, cancelaciones, valor inventario; tendencias; top productos) | Básico+ |
| Gestión de negocios (multi-negocio, detalles, geolocalización con MapLibre) | Básico (1) / Pro (3) |
| Productos (CRUD completo, asignar al negocio, catálogo global) | Básico+ |
| Historial de precios (EditPriceDialog + página dedicada + comparador multi-producto) | Básico+ / Pro |
| Inventario (stock actual, entradas de compra, stock inicial) | Básico+ |
| Ventas (crear, cancelar con razón) | Básico+ |
| Gastos (CRUD) | Básico+ |
| Equipo / Workers (invitaciones por email, permisos granulares por módulo) | Pro |
| Cierre contable diario | Básico+ |
| Cierre contable mensual | Pro |
| Tipos de cambio multi-moneda (USD, EUR, CUP, MXN, CAD, GBP, CHF, JPY) | Básico+ |
| Planes y suscripción (Básico $5/mes · Pro $15/mes; selector mensual/anual) | — |
| Admin: asignación de planes a usuarios | Admin |
| Búsqueda global | Básico+ |
| Menú y permisos dinámico por rol | — |

---

## Implementado en `develop` — pendiente de promover a producción

Todo lo siguiente está mergeado en `develop` y **listo para producción** (salvo los bloqueadores indicados).

| # | Feature | Commit(s) | Bloqueador |
|---|---|---|---|
| 1 | Historial de precios refinado (`EditPriceDialog`) | #8 | — |
| 2 | Comparador multi-producto en historial de precios | `485ae8b` | — (Pro gateado) |
| 3 | Refactor rutas dinámicas con query params | `a18f6c7` | — |
| 4 | Despliegue en subdirectorio (`basePath` + `.htaccess`) | `8051f30`, `964c4c7` | Inyectar `NEXT_PUBLIC_BASE_PATH` en build |
| 5 | Sección Categorías (CRUD de categorías de gastos) | `fbfff42` | — (resuelto: el sidebar se alimenta de `GET /api/v2/section`) |
| 6 | Selector de categoría en formulario de gasto | `0dad138` | **Backend con bug** al persistir `expenseCategoryId` (ver Punto pendiente abajo) |
| 7 | Módulo de Proveedores completo (CRUD + detalle) | #9, `50a959d`, `636a506` | — |
| 8 | Tabla de productos por proveedor | `8ef2b3d` | — |
| 9 | Auto-completar precio de entrada desde proveedor | `25e2b6a` | — |
| 10 | Refactor sidebar con secciones y visibilidad por rol | `a5a2a03` | — |
| 11 | Gestión de submenús (admin navigation) | `4c579ce` | — |
| 12 | Historial de inventario con timeline completo | `3138a7e` | — |
| 13 | Back navigation en inventario y catálogo | `3138a7e` | — |
| 14 | Validación y estilo de `phone-input` | `636a506`, `3138a7e` | — |
| 15 | **Alertas de stock bajo / agotado** (frontend completo) | `3eaf9c3`, `22f6a12`, `b1e1a93` | Parcial (ver detalle) |
| 16 | **Exportación a PDF y Excel** en cierre diario y mensual | — | — (Pro gateado) |
| 17 | **Sistema de notificaciones** (campana in-app + ajustes multi-canal por negocio) | `f0ddcb4`, `52b0159`, `3b12632`, `faf0b8a` | Contrato in-app pendiente (ver detalle) |
| 18 | **Combobox de productos con scroll infinito + búsqueda en servidor** | `22f6a12` | — |
| 19 | Historial de inventario con filtrado por producto | `1f61ac2` | — |
| 20 | Filtrado de módulos admin-only en permisos de trabajadores | `20f9cf9` | — |
| 21 | Limpieza de `src/app/api/` (fix CORS al deployar) — **resuelto y mergeado** | `5aae8d7` (PR #2) | — |
| 22 | Fila de producto cliqueable abre el detalle en ambas tablas de Productos (Catálogo y a la venta); se elimina "Ver detalles" del menú de acciones | — | — |
| 23 | **Gastos filtrados por negocio activo** + toggle "Todos los negocios" (reporte consolidado, gateado a Pro) | — | — |
| 24 | Fila de venta cliqueable abre el detalle; se elimina el dropdown de acciones y se deja solo el icono de "Cancelar venta" en la fila | — | — |
| 25 | **Búsqueda de productos en servidor** + mejora de estados de carga (catálogo y productos del negocio) | `02117cb` (1.4.3) | — |
| 26 | **Logout funcional** — invalida el token en backend (`POST /auth/logout`) y limpia la sesión desde el menú de usuario | `101828a` (1.5.0) | — |
| 27 | **Categoría a nivel de `BusinessProduct`** (por negocio) en lugar de `Product` (catálogo); paginación del endpoint de categorías | `2a13ebe` (1.6.0) | **Migración de datos backend** + paginación (ver detalle) |
| 28 | **Horario de atención del negocio** (config por día, abrir/cerrar, multi-día) | `16d42a6` (1.7.0) | — (backend GET/PUT entregado) |
| 29 | **Refactor de permisos de trabajador a secciones** — payload de 3 capas (sección + menú + submenú) alineado con `GET /section` | `de7e16a` (1.8.0) | — |
| 30 | **Stock con cantidades decimales** para unidades de peso/volumen (kg, lb, g, L, mL) | `c771e5e` (1.8.1) | Verificar que backend persista decimales en `add-stock` (ver detalle) |
| 31 | **Editar la categoría de un producto dentro del negocio** (antes solo se podía el precio) | `22ee005` (1.13.0) | **Endpoint backend pendiente** (ver detalle) |
| 32 | **Módulo de Tickets de Soporte** — conversación tipo chat, cerrar/reabrir, asignación de admins + **notificaciones de soporte** integradas en la campana y la página de notificaciones | `c4b0801`→`da56ce3` (1.14.0–1.15.4) | — (backend entregó el contrato; ver detalle) |
| 33 | **Suite Multimoneda** (ventas + pagos + factura PDF + compras de inventario + asignar producto + tipo de venta/entrega + gastos) | `be2fec8`→`18b503a` (1.16.0–1.16.5) | **Backend**: bug de conversión de pagos (base ≠ CUP), `currency` rechazado en gastos (ver detalle) |
| 34 | **Cancelación de venta con devolución parcial y registro de merma** (`items[]` con `quantity`; lo no devuelto se asienta como pérdida `LOSS`) | `9b19004`, `c722f66` (1.20.0) | — (backend acepta el payload de items) |
| 35 | **Delivery / mensajería por negocio** (`acceptsMessaging`) + datos de entrega en la venta (dirección + contacto) | `4e4e6bb` (1.16.6), `3b9e3e6` (1.18.0) | — (**resuelve** el bloqueador de delivery de la feature 33) |
| 36 | **Rebranding a Negora** (logo `NegoraLogo`, `icon.svg`, copy y landing brief) | `685aef5` (1.19.0) | — |
| 37 | **Módulo de Caja / cuentas en divisa** (saldo consolidado en CUP, tabla de saldos por moneda, widget en dashboard, inicializar presupuestos) — flujo de caja Fase 1 | `7221bee` | Parcial (Fase 1 visual; libro de movimientos y ajustes manuales pendientes — ver detalle) |
| 38 | **Desactivación / reactivación de cuenta** (gracia de 15 días, `deletionReason`, `cuenta-desactivada`, `ReactivationGuard` + middleware) | `8b11178` (1.22.0), `829ad64` (1.22.3) | — (verificar `deactivatedAt` y reactivación en backend) |
| 39 | **Selección de plan self-service + trial Pro de 15 días + reconciliación de negocios** (`/seleccionar-plan`, `/seleccionar-plan/reconciliar`, `PlanGuard`, `plan-session`) | `8311d4d` (1.23.0), `1b4a255` (1.24.0) | **Backend**: `POST /plans/select`, `Business.status`/`archivedReason`, suspensión de trabajadores y enforcement (ver detalle y [análisis-planes/backend-cambios.md](análisis-planes/backend-cambios.md)) |
| 40 | **Stats del dashboard agrupadas por moneda** (`DashboardCurrencyTotal`, total por divisa + contador de transacciones) | `1b4a255` (1.24.0) | — |
| 41 | **`RouteGuard` cliente** para rutas Pro/admin (barrera real en build estático donde el middleware está inerte) | `1b4a255` (1.24.0) | — |

> **Ajustes menores incluidos en este rango** (1.3.8 → 1.8.1, no itemizados arriba): eliminación del menú estático de fallback deprecado (1.3.8), efecto hover en filas de productos, fix del `markAllAsRead` (1.4.1), afinado de límites de notificaciones, y botones a variante `outline` (1.5.2).
>
> **Ajustes menores (1.16.6 → 1.24.0):** unificación de la moneda nacional `MN → CUP` en exchange-rate y grilla de productos (`059bc2e`); **eliminación de la regeneración de factura** (se conserva solo la descarga) (`4a45bd6`); ajuste de precios anuales en planes (`c722f66`); ruta Pro adicional para trabajadores en `PRO_ROUTES` (`1501574`, 1.22.1); documento de análisis comparativo de planes (`c722dd0`, 1.22.2, → [análisis-planes/comparativa-planes.md](análisis-planes/comparativa-planes.md)).

### Detalle: Categoría a nivel de `BusinessProduct` (feature 27) — `2a13ebe`

El backend movió la relación de categoría desde `Product` (catálogo global) a `BusinessProduct` (por negocio): un mismo producto puede tener categorías distintas en cada negocio. Spec completa en [docs/category.md](category.md).

**Frontend adaptado:** la categoría se lee de `businessProduct.category` (antes `product.category`); los tipos `BusinessProduct`, `BusinessWithProducts` y `ProductToShowInTable` ([src/lib/types/business.ts](../src/lib/types/business.ts), [src/lib/types/product.ts](../src/lib/types/product.ts)) llevan `category?: ProductCategoryEmbed | null`; se eliminó `categoryId` de `CreateProductProps`/`EditProductProps` (la categoría se asigna al asignar el producto al negocio vía `POST /product/business/{businessId}`). Formularios de catálogo y de asignación actualizados.

**Sigue pendiente (backend):**
- **Migración de datos:** transferir la categoría actual de cada `Product` al `BusinessProduct` correspondiente; sin esto los productos existentes quedan sin categoría.
- Confirmar que `GET /business/{id}/products`, `GET /business/{id}/stock-alerts` y `GET /inventory/business/{id}/current` ya devuelven la categoría a nivel de `BusinessProduct`.
- Paginación del endpoint `GET /category?page=&limit=` (el doc la define; verificar que el listado del frontend la consuma).

> **Relación con "categorías de producto globales" (reversión pendiente):** este cambio re-define dónde vive la categoría. Reconciliar con [docs/PENDIENTE-categorias-producto-globales.md](PENDIENTE-categorias-producto-globales.md) antes de re-aplicar aquella reversión.

### Detalle: Horario de atención del negocio (feature 28) — `16d42a6`

Permite configurar el horario de apertura/cierre del negocio por día de la semana (0–6), marcando días cerrados. Implementación frontend completa: tipos ([src/lib/types/business-schedule.ts](../src/lib/types/business-schedule.ts)), validación Zod ([src/lib/validations/business-schedule.ts](../src/lib/validations/business-schedule.ts)), ruta, API ([src/lib/api/business-schedule.ts](../src/lib/api/business-schedule.ts)), hook ([src/hooks/use-business-schedule.ts](../src/hooks/use-business-schedule.ts)) y `BusinessScheduleCard` integrada en el formulario de detalles del negocio. Al guardar envía siempre los 7 días (el `PUT` reemplaza el horario completo).

**Backend entregado:** `GET /businesses/:id/schedule` y `PUT /businesses/:id/schedule` (upsert por día). Contrato completo en [docs/funcionalidad.md](funcionalidad.md).

**Menor / opcional:** el `DELETE /businesses/:id/schedule` (resetear todo) aparece en el contrato pero el frontend no lo usa — el reset se hace con un `PUT` de 7 días. Sin plan-gating (disponible para todos los planes).

### Detalle: Refactor de permisos de trabajador a secciones (feature 29) — `de7e16a`

El asignador de permisos de trabajador dejó de basarse en `GET /menu/` y ahora consume el árbol de `GET /section` (`useGetAllSectionsQuery`). El payload de permisos pasa a tener **3 capas**: una entrada por cada menú/submenú seleccionado **más** una entrada por cada sección padre involucrada (deduplicada). Sin la entrada de sección el backend poda el árbol desde la raíz y devuelve navegación vacía. Se añadió `sectionId?` a `WorkerPermissoEntry` ([src/lib/types/worker.ts](../src/lib/types/worker.ts)) y nuevos helpers `buildPermSections`/`flattenPermItems` en [src/components/workers/worker-permissions-section.tsx](../src/components/workers/worker-permissions-section.tsx).

**Sin bloqueador de backend** — el contrato de `GET /section` y el array de permisos con `sectionId` ya están disponibles. Verificar en QA que un trabajador recién creado vea la navegación esperada al iniciar sesión.

### Detalle: Stock con cantidades decimales (feature 30) — `c771e5e`

El formulario de ingreso de stock acepta decimales para unidades de peso/volumen (kg, lb, g, L, mL); las unidades enteras (`ud`) siguen exigiendo enteros. El schema de validación pasó a ser una fábrica `makeInventoryUpdateStockSchema(allowDecimals)` ([src/lib/validations/inventory.ts](../src/lib/validations/inventory.ts)) — la unidad sólo se conoce al elegir el producto en tiempo de render — y limita a 3 decimales. Nuevo helper `parseDecimalInput` ([src/lib/units.ts](../src/lib/units.ts)) que acepta coma o punto como separador.

**Verificar en backend:** que `POST .../add-stock` acepte y persista cantidades decimales (no las redondee a entero) para que el stock mostrado coincida con lo ingresado.

### Detalle: Editar la categoría de un producto dentro del negocio (feature 31)

Hasta ahora la categoría de un `BusinessProduct` **solo** podía fijarse al asignar el producto al negocio (feature 27); editar un producto ya asignado permitía cambiar **solo el precio**. Esta feature añade la edición de la categoría desde la misma tabla de productos del negocio.

**Frontend completo:** el antiguo `EditPriceDialog` se reemplazó por `EditBusinessProductDialog` ([src/components/products/edit-business-product-dialog.tsx](../src/components/products/edit-business-product-dialog.tsx)), que edita **precio + categoría** (reutiliza el `Combobox` de categorías del form de asignación y `useGetAllProductCategoriesQuery`). El menú de acciones dice "Editar" en vez de "Editar precio" ([src/components/products/business-products-table-columns.tsx](../src/components/products/business-products-table-columns.tsx)). Precio y categoría viajan a **endpoints distintos**; el diálogo solo dispara la(s) mutación(es) que cambiaron. Limpiar el selector envía `categoryId: null` (quita la categoría). Nuevos: ruta `updateBusinessProductCategory`, API `updateBusinessProductCategory`, hook `useUpdateBusinessProductCategoryMutation` y `editBusinessProductSchema` (se eliminó el `updateBusinessProductPriceSchema` que quedó sin uso).

**Pendiente (backend):** implementar `PATCH /businesses/{businessId}/products/{businessProductId}/category` con `{ categoryId: string | null }` (el `null` des-asigna). Hasta entonces, el cambio de categoría falla con `404`; el cambio de precio sigue funcionando. Contrato completo en [docs/backend-categoria-business-product.md](backend-categoria-business-product.md).

### Detalle: Módulo de Tickets de Soporte (feature 32) — `c4b0801`→`da56ce3`

Canal de soporte dentro de la app: el usuario reporta problemas y el equipo (admin) los gestiona. Evolucionó en varias iteraciones siguiendo el contrato del backend (spec completa en [docs/funtion.md](funtion.md)).

**Capa de datos** (patrón de 5 capas): rutas, tipos, validaciones Zod, API y hooks de React Query para tickets ([src/lib/api/support-ticket.ts](../src/lib/api/support-ticket.ts), [src/hooks/use-support-ticket.ts](../src/hooks/use-support-ticket.ts)) y para notificaciones de soporte ([src/lib/api/support-notification.ts](../src/lib/api/support-notification.ts), [src/hooks/use-support-notification.ts](../src/hooks/use-support-notification.ts)). Listados paginados `{ data, meta }`; detalle y respuestas devuelven el ticket/objeto directo.

**Vistas de usuario** (`/dashboard/support`): listado "Mis tickets" paginado, diálogo de creación (prerellenando `userName` desde la sesión) y **detalle con conversación tipo chat** ([ticket-conversation.tsx](../src/components/support-tickets/ticket-conversation.tsx) en `ScrollArea`), caja de respuesta y botones de **cerrar/reabrir**.

**Vistas de admin** (`/dashboard/admin/support`): bandeja paginada con filtro por estado (Tabs `open`/`in_progress`/`closed`), columna **"Asignado a"** (nombre del admin), y **detalle de gestión** con responder, cerrar/reabrir, refrescar y **"Asignarme"** el ticket.

**Conversación y estado.** El hilo se renderiza desde `ticket.messages`; responder usa `POST /:id/messages` (usuario) o `/admin-messages` (admin) y reabre el ticket si estaba cerrado. Cerrar/reabrir usa el endpoint canónico `PATCH /:id/status` (reemplaza al `/close` legacy).

**Asignación de admins.** El backend auto-asigna el ticket al admin con menor carga (`assignedAdminId`/`assignedAdminName`/`assignedAt`); solo el admin asignado puede responder (un `403` lo indica). El botón **"Asignarme"** (`PATCH /:id/assign`, con body `{}` por diseño) aparece **solo en tickets sin asignar**; la bandeja y el detalle muestran el **nombre** del admin asignado.

**Notificaciones de soporte integradas.** Son por usuario (no por negocio) y se **fusionan en la campana existente** del topbar (contador combinado, lista ordenada por fecha, "marcar todas") y en la página `/dashboard/notifications` como **pestaña "Soporte"** con su propio paginador ([support-notification-item.tsx](../src/components/notifications/support-notification-item.tsx)). El deep-link decide destino (detalle usuario vs admin) según el rol del usuario logueado.

**Navegación.** Las secciones "Soporte" (usuario → `/dashboard/support`) y la vista de administración (`/dashboard/admin/support`) se registran desde el gestor de menús existente (no se hardcodean).

**Estado.** Frontend completo; el backend entregó el contrato (mismo backend de producción). Verificar en QA las formas de respuesta y el flujo de asignación de admins.

### Detalle: Suite Multimoneda (feature 33) — `be2fec8`→`18b503a`

Reemplaza la venta atómica en una sola moneda por un flujo completo de moneda + pagos
+ factura, y extiende la divisa a inventario, productos y gastos. Spec/guía de
referencia en [docs/guia-implementacion-multimoneda.md](guia-implementacion-multimoneda.md)
(con su sección **0.1 Estado de implementación**). Infra base reutilizada:
`src/lib/currency.ts`, `useExchangeRate` y `getAvailableCurrencies` (monedas derivadas
de `MonetaryExchange`, nunca lista fija).

**Implementado (frontend completo):**

- **Ventas + pagos (Fase 1):** selector de moneda al crear venta
  ([sales/create/page.tsx](../src/app/dashboard/business/sales/create/page.tsx) + [sale-cart-panel.tsx](../src/components/sales/sale-cart-panel.tsx)),
  dialog de pagos multimoneda con preview de equivalente y `sugerencia`
  ([payment-dialog.tsx](../src/components/sales/payment-dialog.tsx)), badges de
  `paymentStatus` en tabla y detalle.
- **Factura PDF (Fase 2):** descargar desde el detalle, solo en
  ventas `paid` ([details-dialog.tsx](../src/components/sales/details-dialog.tsx)).
- **Compras de inventario (Fase 3):** `currency` + `exchangeRateApplied` en add-stock,
  con preview del costo en CUP ([update-stock-form.tsx](../src/components/inventory/update-stock-form.tsx)).
- **Asignar producto al negocio:** mismo costo multimoneda, vía el componente
  compartido `EntryCostCurrency` ([entry-cost-currency.tsx](../src/components/products/entry-cost-currency.tsx)).
- **Tipo de venta + entrega:** `saleType` (`in_store`/`delivery`/`pickup`) con campos
  de delivery condicionales y validación (dirección obligatoria si `delivery`).
- **Gastos multimoneda:** `currency` en tipos/validación/formulario y visualización
  por moneda con `formatMoney`.
- **Util compartido** `mapCurrencyError` ([src/lib/currency-errors.ts](../src/lib/currency-errors.ts)).

**Desviación de diseño:** en add-stock y asignar producto la **tasa no es editable**;
se toma automática de `MonetaryExchange` y se envía como `exchangeRateApplied` para que
lo previsualizado sea exactamente lo que se guarda.

**Pendiente (backend) — bloquea parte de la suite:**

- 🐞 **Conversión de pagos con base ≠ CUP**: el backend invierte el cruce de tasas; un
  pago en EUR sobre una venta en USD se acredita mal y la venta no llega a `paid`. Caso
  reproducible y fórmula correcta en
  [docs/bug-conversion-pagos-multimoneda.md](bug-conversion-pagos-multimoneda.md).
- 🚧 **Gastos `currency`**: `POST /api/v2/expenses` responde `400 "property currency
  should not exist"`; el DTO de gastos no acepta el campo. El frontend ya lo envía.
- ✅ **Delivery por negocio** (resuelto en la feature 35): el tipo `Business` ahora
  expone `acceptsMessaging` y la UI deshabilita la opción de delivery cuando el negocio
  no lo ofrece, evitando el `400 "Este negocio no ofrece servicio de delivery/mensajería"`.

### Detalle: Cancelación de venta con devolución parcial y merma (feature 34) — `9b19004`, `c722f66`

La cancelación de venta dejó de ser todo-o-nada. El `CancelSaleDialog` ([src/components/sales/cancel-sale-dialog.tsx](../src/components/sales/cancel-sale-dialog.tsx)) permite **devolver solo parte** de cada línea: por cada item se indica cuántas unidades vuelven al stock; la diferencia respecto a la cantidad vendida la registra el backend como **pérdida (`LOSS`)**. El payload pasó de `{ cancellationReason }` a `{ cancellationReason, items?: CancelSaleItemInput[] }` donde cada item lleva `itemId`, `quantity?` (si se omite, vuelven todas) y `cancellationReason?` ([src/lib/types/sales.ts](../src/lib/types/sales.ts)). Ausencia de `items` = cancelación total (compatibilidad).

El historial de inventario distingue el nuevo tipo de movimiento con su estilo propio ([inventory-action-type-style.ts](../src/components/inventory/inventory-action-type-style.ts)), y el detalle de venta muestra lo devuelto vs. la merma. La iteración `1.20.0` (`c722f66`) afinó el manejo de cantidades por línea en el diálogo.

### Detalle: Delivery / mensajería por negocio (feature 35) — `4e4e6bb`, `3b9e3e6`

Dos capas que cierran el bloqueador de delivery de la suite Multimoneda:

- **Datos de entrega en la venta** (`1.16.6`, `4e4e6bb`): cuando la venta es `delivery`, el carrito ([sale-cart-panel.tsx](../src/components/sales/sale-cart-panel.tsx)) pide dirección y datos de contacto, validados antes de enviar.
- **Flag por negocio** (`1.18.0`, `3b9e3e6`): el tipo `Business` gana `acceptsMessaging` ([src/lib/types/business.ts](../src/lib/types/business.ts)); se configura al crear el negocio y en el formulario de detalles ([business-details-form.tsx](../src/components/business/business-details-form.tsx)), y el `switcher`/carrito **deshabilitan** la opción de delivery cuando el negocio no la ofrece. La tarjeta de ajustes de notificación ([notification-settings-card.tsx](../src/components/business/notification-settings-card.tsx)) y las validaciones de negocio se ampliaron en consecuencia.

### Detalle: Rebranding a Negora (feature 36) — `685aef5`

Cambio de marca de **PManage → Negora** en toda la app y documentación: nuevo componente de logo ([src/components/brand/negora-logo.tsx](../src/components/brand/negora-logo.tsx)), favicon migrado a `src/app/icon.svg`, copy en pantallas de auth (login/registro/verificación/aceptar invitación), sidebar y página de planes. Se añadió el [docs/landing-brief.md](landing-brief.md) con el brief de la landing.

### Detalle: Módulo de Caja / cuentas en divisa (feature 37) — `7221bee`

Primer paso del **flujo de caja**: una foto del saldo del negocio por moneda y consolidado en CUP. Spec y contrato propuesto al backend en [docs/flujo-de-caja.md](flujo-de-caja.md).

**Frontend (Fase 1, visual):** página `/dashboard/business/currency-accounts` con tabla de saldos por moneda ([balances-table.tsx](../src/components/currency-account/balances-table.tsx)), **tarjeta de saldo consolidado** en CUP ([consolidated-balance-card.tsx](../src/components/currency-account/consolidated-balance-card.tsx)), **widget de caja** en el dashboard ([cash-balance-widget.tsx](../src/components/currency-account/cash-balance-widget.tsx)) y diálogo para **inicializar presupuestos** ([initialize-budgets-dialog.tsx](../src/components/currency-account/initialize-budgets-dialog.tsx)). Capa de datos en [src/lib/api/currency-account.ts](../src/lib/api/currency-account.ts), [src/hooks/use-currency-account.ts](../src/hooks/use-currency-account.ts), [src/lib/types/currency-account.ts](../src/lib/types/currency-account.ts) y la utilidad [src/lib/cash-flow.ts](../src/lib/cash-flow.ts).

**Pendiente (roadmap, ver [flujo-de-caja.md](flujo-de-caja.md) y `ROADMAP.md`):** libro de movimientos de caja (`GET /currency-accounts/movements/{businessId}`), ajustes manuales (depósito/retiro/transferencia entre monedas) y flujo por período en base caja.

### Detalle: Desactivación / reactivación de cuenta (feature 38) — `8b11178`, `829ad64`

"Zona de peligro" en el perfil para darse de baja con **15 días de gracia** antes del borrado permanente. La tarjeta [deactivate-account-card.tsx](../src/components/account/deactivate-account-card.tsx) confirma con motivo opcional y checkbox, y envía `{ deletionReason }` (`1.22.3`, `829ad64`, renombrado desde el payload anterior). Tras desactivar, el usuario va a `/cuenta-desactivada` ([src/app/cuenta-desactivada/page.tsx](../src/app/cuenta-desactivada/page.tsx)), única ruta accesible.

**Doble barrera (cookie rápida + verdad fresca):** el `middleware.ts` bloquea por la cookie `user_deactivated` (sin parpadeo) y el [ReactivationGuard](../src/components/auth/reactivation-guard.tsx) revalida contra `/auth/me` (`deactivatedAt`), sembrando o limpiando la cookie. Capa de datos en [src/hooks/use-user.ts](../src/hooks/use-user.ts), [src/lib/api/user.ts](../src/lib/api/user.ts), [src/lib/session.ts](../src/lib/session.ts) y validación en [src/lib/validations/user.ts](../src/lib/validations/user.ts).

**Verificar en backend:** que `GET /auth/me` devuelva `deactivatedAt`, que exista el endpoint de reactivación dentro de la gracia y que el borrado definitivo se ejecute al expirar el plazo.

### Detalle: Selección de plan self-service + trial Pro + reconciliación (feature 39) — `8311d4d`, `1b4a255`

Reemplaza el flujo manual (redirección a WhatsApp) por uno self-service. El registro pasa a ser un **trial de 15 días con alcance Pro**; al expirar, el usuario elige **Básico** (1 negocio, sin equipo) o **Pro** (hasta 3 negocios, equipo, features Pro). **Principio: "conservar y bloquear, nunca borrar"** — el exceso se archiva y se restaura al volver a Pro. Contrato completo para backend en [docs/análisis-planes/backend-cambios.md](análisis-planes/backend-cambios.md) y comparativa en [docs/análisis-planes/comparativa-planes.md](análisis-planes/comparativa-planes.md).

**Frontend completo:**
- **Paywall de selección** `/seleccionar-plan` ([page.tsx](../src/app/seleccionar-plan/page.tsx)): elegir plan + periodo (mensual/anual) y llamar a `POST /plans/select` vía `selectPlan()` ([src/lib/api/plans.ts](../src/lib/api/plans.ts), [src/hooks/use-plans.ts](../src/hooks/use-plans.ts)). Datos de planes centralizados en [src/lib/plans-data.ts](../src/lib/plans-data.ts).
- **Reconciliación** `/seleccionar-plan/reconciliar` ([page.tsx](../src/app/seleccionar-plan/reconciliar/page.tsx)): si al bajar a Básico hay más negocios activos que el tope del plan, el usuario elige cuál `keepBusinessId` conservar; el resto se archiva.
- **Guards.** [PlanGuard](../src/components/auth/plan-guard.tsx) consulta `/auth/me`: si `expiredPlan`/`hasNeverHadPlan` → siembra cookie y redirige al paywall; si el plan está vigente, sincroniza el plan real a sessionStorage + cookie `user_plan_type` ([plan-session.ts](../src/lib/plan-session.ts)) y, si hay exceso de negocios para el plan (`getMaxBusinesses` en [pro-gates.ts](../src/lib/pro-gates.ts)), fuerza la reconciliación. El `middleware.ts` hace el bloqueo rápido por cookies (`user_plan_expired`, `user_needs_reconciliation`).
- **Negocios archivados.** `Business` gana `status: "active" | "archived"` y `archivedReason`; el switcher ([business-switcher.tsx](../src/components/sidebar/business-switcher.tsx)) y el `business-context` separan activos vs archivados (solo lectura).

**Pendiente (backend) — bloquea la promoción:** `POST /plans/select` transaccional (con `KEEP_BUSINESS_REQUIRED`), asignación automática del trial Pro al registrar, campos `status`/`archivedReason` en `GET /businesses/my-businesses`, suspensión de trabajadores e invitaciones al hacer downgrade, y **enforcement server-side** (límite de negocios, gestión de equipo solo Pro, escritura bloqueada en negocios `archived`). Marcadores `TODO(backend):` en el código; tabla de contratos y códigos de error en [backend-cambios.md](análisis-planes/backend-cambios.md).

### Detalle: Stats del dashboard por moneda (feature 40) — `1b4a255`

Las tarjetas de Ventas y Gastos del dashboard ([stats-card.tsx](../src/components/dashboard/stats-card.tsx)) dejaron de asumir una sola moneda (antes `Intl.NumberFormat` con `COP` hardcodeado). Ahora reciben `today`/`yesterday` como arrays `DashboardCurrencyTotal[]` ([src/lib/types/business.ts](../src/lib/types/business.ts)) y renderizan **una línea por moneda** con `formatMoney`, más un contador de transacciones (`totalTransactions`/`totalCount`). Si no hay datos, muestra `0` en la moneda base (CUP).

### Detalle: `RouteGuard` cliente para rutas Pro/admin (feature 41) — `1b4a255`

En el build estático (`output: "export"`) el `middleware.ts` **no se ejecuta**, así que el gateo de URL queda inerte en producción. [RouteGuard](../src/components/auth/route-guard.tsx) es la barrera real de cliente: redirige fuera de rutas Pro (`isProRoute`/`getProRedirect` de [pro-gates.ts](../src/lib/pro-gates.ts)) a usuarios no-Pro y fuera de `/dashboard/admin/*` a no-admins. Solo redirige cuando plan/rol ya están resueltos (evita expulsar durante la hidratación). El backend sigue siendo la autoridad (responde `403`); esto es UX para no mostrar páginas inoperables.

### Detalle: Alertas de stock bajo (feature Pro) — `3eaf9c3`, `22f6a12`, `b1e1a93`

El frontend está completo. Permite configurar un umbral por producto (`stockAlertThreshold`) al asignarlo al negocio o desde el diálogo en la tabla de inventario; si no hay umbral personalizado se usa un valor por defecto. Muestra badges por fila ("Sin stock" / "Stock bajo") y un banner-resumen en la página de inventario.

**Lado de emisión de alertas:** el backend ya entregó **Business Settings** (`/businesses/{businessId}/settings`) con 4 tipos de alerta multi-canal: `lowStockAlert`, `outOfStockAlert`, `dailyClosingAlert`, `monthlyClosingAlert` (email para todos los planes; SMS/WhatsApp solo Pro). Ver [docs/API.md](API.md) y [docs/notificaciones-alertas.md](notificaciones-alertas.md).

**Sigue pendiente** (spec en [docs/backend-alertas-stock.md](backend-alertas-stock.md)):
- `GET /businesses/:id/stock-alerts` — lista productos con alerta activa
- `PATCH /businesses/:businessId/products/:productId/stock-alert` — actualiza umbral

### Detalle: Sistema de notificaciones — `f0ddcb4`, `52b0159`, `3b12632`

Dos piezas:
1. **Ajustes de notificación por negocio (multi-canal):** tarjeta de configuración (`notification-settings-card.tsx`) que consume el contrato de Business Settings ya entregado por backend (4 alertas × 3 canales, gateado por plan).
2. **Bandeja in-app (campana):** `notification-bell.tsx` + `notification-item.tsx` + hook `use-notifications.ts`. El scaffolding del frontend está listo, **a la espera de que backend exponga la Parte 2** del contrato: canal `in_app`, estado `readAt` (leído/no leído) y endpoints para listar, contar no leídas y marcar como leídas.

Spec completa del contrato in-app en [docs/notificaciones-internas.md](notificaciones-internas.md).

> **Notificaciones de soporte (feature 32):** la campana y la página `/dashboard/notifications` ya **fusionan** un segundo origen de notificaciones — las de tickets de soporte (por usuario, endpoints `/support-tickets/my-notifications`) — con contador combinado y, en la página, una pestaña "Soporte" con paginador propio. A diferencia de las notificaciones generales (por negocio, aún bloqueadas), las de soporte **sí** tienen su contrato entregado por backend.

### Detalle: `expenseCategoryId` en gastos — bug de backend (bloqueador)

El frontend está completo y **envía `expenseCategoryId` en el payload** sin workarounds: tipos ([src/lib/types/expenses.ts](../src/lib/types/expenses.ts)), validación ([src/lib/validations/expenses.ts](../src/lib/validations/expenses.ts)), formulario ([src/components/expenses/expense-form.tsx](../src/components/expenses/expense-form.tsx)) y API ([src/lib/api/expense.ts](../src/lib/api/expense.ts)).

Al crear un gasto, el backend responde **HTTP 500** con un error de sintaxis SQL:

```
POST /api/v2/expenses → 500
"You have an error in your SQL syntax; ... near ':categoryId' at line 1"
```

**Diagnóstico:** el backend usa un parámetro nombrado `:categoryId` en una query que nunca se enlaza al valor; el literal llega crudo a MySQL y rompe la sintaxis. Es un bug del backend, no del frontend.

**Lo que debe hacer el backend:**
1. Columna/migración: `expenseCategoryId` (FK nullable) en la entidad `Expense`.
2. `POST /expenses`: aceptar y persistir `expenseCategoryId` (UUID o `null`) — **corregir el binding del parámetro `:categoryId`**.
3. `PATCH /expenses/:id`: aceptar/actualizar el campo, permitiendo `null` (des-asignar).
4. `GET /expenses` y `GET /expenses/:id`: **devolver** `expenseCategoryId` (idealmente con la categoría embebida) para que la edición precargue la selección.

**Verificación:** crear un gasto con categoría y reabrirlo en edición; si la categoría aparece seleccionada, el punto queda resuelto.

### Detalle: Gastos filtrados por negocio activo (feature 23)

Antes, la página de Gastos llamaba a `getAllExpenses` **sin `businessId`**, mezclando los gastos de todos los negocios del usuario. Ahora filtra por el **negocio activo** por defecto, alineándose con Ventas y Categorías.

- **API/hook:** `getAllExpenses` ([src/lib/api/expense.ts](../src/lib/api/expense.ts)) acepta `businessId` como query param opcional; `useGetAllExpensesQuery` ([src/hooks/use-expenses.ts](../src/hooks/use-expenses.ts)) lo incluye en el `queryKey` (sin riesgo de cache leak entre negocios). Backend ya soporta el query param — ver [spec-tecnicas.md](extra/análisis-planes/spec-tecnicas.md).
- **Reporte consolidado (Pro):** un toggle "Todos los negocios" ([src/app/dashboard/business/expenses/page.tsx](../src/app/dashboard/business/expenses/page.tsx)) omite el `businessId` para ver los gastos de todos los negocios juntos. Gateado a plan Pro siguiendo [docs/extra/pro-gating.md](extra/pro-gating.md): el switch va deshabilitado con `<ProBadge />` + tooltip para usuarios free/básico. Nuevo componente `src/components/ui/switch.tsx` (shadcn).

**Sin bloqueador de backend** — el contrato del query param ya está disponible.

---

## Reversiones — implementado y revertido a la espera de backend

Trabajo de frontend completado pero **revertido en `develop`** porque depende de una definición de backend aún no entregada. El historial conserva los commits para re-aplicarlos sin re-investigar.

| Feature | Commit original | Revert | Notas |
|---|---|---|---|
| Categorías de producto globales por usuario (Opción A) | `27af9af` | `9288ffa` | Backend debe definir el modelo. Diff completo y plan de re-aplicación en [docs/PENDIENTE-categorias-producto-globales.md](PENDIENTE-categorias-producto-globales.md) |
| Sistema de gestión de divisas con conversión dinámica | `348fbaa` | `0d3375d` | Revertido tras merge de PR #10. **Superado por la Suite Multimoneda (feature 33)**, que adopta otro enfoque: moneda por venta + pagos con tasa congelada, en vez de conversión dinámica global. Esta fila ya no requiere re-aplicación. |

---

## En curso — ramas no mergeadas

| Rama | Qué hace | Bloqueador |
|---|---|---|
| `feature/auth-google` | OAuth con Google (popup) | Endpoint backend `/auth/google` |
| `move-to-spa` | Migración a SPA (conversión a estático) | Ver [docs/conversion-a-estatico.md](conversion-a-estatico.md) |

> `fix/cors-error` ya está mergeado: `src/app/api/` fue eliminado y el problema de CORS al deployar está resuelto.

---

## Proyecciones de desarrollo

### Próximo — Variante A: "Más datos, mismas operaciones" (est. 2–3 semanas)

No requiere entidades nuevas. Todo es agregación sobre datos ya capturados.

| Feature | Estado frontend | Endpoint backend necesario |
|---|---|---|
| Alertas de stock bajo/agotado | ✅ Implementado · emisión multi-canal entregada | Pendiente: `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` |
| Notificaciones in-app (bandeja) | ✅ Scaffolding listo | Pendiente: canal `in_app` + `readAt` + endpoints (listar/contar/marcar) |
| Rentabilidad por producto (margen = venta − costo entrada × cantidad) | Por hacer | `GET /products/profitability?from=&to=` |
| Comparativas de periodos (este mes vs. anterior) | Por hacer | `GET /analytics/period-compare?range=` |
| Métricas de ventas por trabajador | Por hacer | `GET /sales/by-worker` |

Spec técnica detallada: [docs/extra/análisis-planes/spec-tecnicas.md](extra/análisis-planes/spec-tecnicas.md).

### Medio plazo — Variante B: "Gestión integral" (est. 6–8 semanas)

| Feature | Estado |
|---|---|
| Presupuestos mensuales | Solo idea, sin spec técnica |
| Historial de precios Fase 2 (forecasts, gráficos de evolución temporal) | Spec parcial en [docs/extra/price-history-fase-2.md](extra/price-history-fase-2.md) |

### Largo plazo — Núcleo contable (est. ~55 días)

Requiere cambio arquitectónico significativo. No comenzar sin alineación del equipo.

| Fase | Descripción |
|---|---|
| 1 | Plan de cuentas + asientos contables (doble entrada) |
| 2 | Periodos fiscales con bloqueo de transacciones pasadas |
| 3 | COGS y margen bruto capturado al momento de la venta |
| 4 | AR/AP, tipo de cambio por transacción, conciliación bancaria CSV |

Spec completa: [docs/extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md).

### Sin fecha definida

| Feature | Notas |
|---|---|
| OAuth con Google | Rama existe (`feature/auth-google`), falta backend |
| Categorías de producto globales | Frontend hecho y revertido; espera definición de backend ([docs/PENDIENTE-categorias-producto-globales.md](PENDIENTE-categorias-producto-globales.md)) |
| Gestión de divisas (conversión dinámica) | Frontend hecho y revertido; pendiente de re-alineación |
| Migración a SPA (`move-to-spa`) | Rama en curso; ver [docs/conversion-a-estatico.md](conversion-a-estatico.md) |
| Tests automatizados | Cero cobertura actualmente — riesgo alto para releases futuros |

---

## Deuda técnica

### Resuelta

| Problema | Resolución |
|---|---|
| `console.log` en código de producción | ✅ Eliminados — cero ocurrencias en `src/` (commit en develop) |
| Tipos duplicados entre `lib/types/` e inline | ✅ Las interfaces inline son props de componentes (práctica estándar React); tipos de dominio centralizados en `src/lib/types/` |
| JWT en sessionStorage | ✅ Trade-off documentado e intencional — cookies solo sirven al middleware; la sesión expira al cerrar la pestaña (ver `docs/extra/AUDIT.md`) |
| Query keys con riesgo de cache leak entre negocios | ✅ Todos los hooks incluyen `businessId` en la key (`["entity", businessId, ...]`); la invalidación cruzada está controlada |

### Pendiente

| Problema | Impacto | Prioridad |
|---|---|---|
| Sin tests automatizados (ni unitarios ni e2e) | Regresiones no detectadas en CI | Alta |
| Sin Prettier configurado | Inconsistencia de estilo entre archivos | Baja |
| Query keys no centralizados en un archivo de constantes | Renombrar una key requiere buscar en todos los hooks | Baja |

---

## Promoción a producción v2

Runbook para liberar la v2 (`develop` → `main`). Detalle de build/estático en
[docs/conversion-a-estatico.md](conversion-a-estatico.md) y [docs/extra/build-output-config.md](extra/build-output-config.md).

**Lo único que cambia para producción es `public/.htaccess`.** `next.config.ts` y el
workflow ya son branch-aware: el `basePath`/`assetPrefix` se leen de
`NEXT_PUBLIC_BASE_PATH`, que **solo** se inyecta en el job `deploy-dev`. En `main` la
variable no existe → build a la raíz, sin `/dev`. No hay que tocarlos.

| Archivo | ¿Cambia para main? |
|---|---|
| `next.config.ts` | ❌ No — branch-aware vía `NEXT_PUBLIC_BASE_PATH` |
| `.github/workflows/deploy-workflow.yml` | ❌ No — el job `deploy-main` ya es correcto |
| **`public/.htaccess`** | ✅ **Sí — sin prefijos `/dev/`** (targets a `/...` y fallback a `/index.html`) |
| `package.json` | ✅ Sí — versión a `2.0.0` |

**Rutas dinámicas y `.htaccess` (verificado):** las reglas cubren workers, products,
products/catalog, providers, expenses y reset-password. `categories/[kind]` **no**
necesita regla porque usa `generateStaticParams` con valores reales (`expenses`,
`products`) y genera carpetas físicas en `out/`. Al añadir cualquier `[param]` nuevo,
hay que añadir su regla aquí (sin `/dev/` en main, con `/dev/` en develop).

**Pasos:**

1. `release/v2.0.0` desde `develop`: `.htaccess` sin `/dev/` + regla de `providers`, y `package.json` a `2.0.0`. *(Hecho en la rama.)*
2. Build de producción local **sin** la env var (`pnpm run build`) y confirmar que `out/index.html` referencia `/_next/...` (no `/dev/_next/...`); `pnpm test` + `tsc --noEmit` en verde.
3. PR `release/v2.0.0 → main`. Al resolver, asegurar que gana el `.htaccess` **sin** `/dev/`.
4. Push a `main` → job `deploy-main` (build a la raíz, preserva `.htaccess`/`api`/`dev`/`.well-known`, sube `out/`).
5. **Verificar el `.htaccess` de la raíz por SSH** en `~/psearch.dveloxsoft.com/`: el clean preserva el remoto y el `scp` de `out/**` puede no transferir dotfiles; confirmar que es el nuevo y completo. Subirlo a mano si hace falta.
6. Smoke test en `https://psearch.dveloxsoft.com/`: chunks `/_next/...` con `Content-Type: application/javascript`; recarga dura sobre rutas dinámicas (no 404); login → venta multimoneda → cancelación parcial → gating Pro. Confirmar que `/dev/` sigue intacto.
7. Mover el bloque de features de `sdd-develop.md` a `sdd-main.md` y actualizar este snapshot.

---

## Siguiente acción recomendada

**Orden sugerido:**

1. **Coordinar con backend** los contratos que bloquean la promoción:
   - **Corregir el bug SQL de `expenseCategoryId`** en `POST/PATCH /expenses` (parámetro `:categoryId` sin enlazar) — ver detalle arriba.
   - **Notificaciones in-app** — Parte 2 del contrato: canal `in_app`, `readAt`, y endpoints para listar/contar/marcar ([docs/notificaciones-internas.md](notificaciones-internas.md)).
   - Endpoints de alertas de stock: `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` ([docs/backend-alertas-stock.md](backend-alertas-stock.md)).
   - **Migración de categorías** a nivel de `BusinessProduct` y paginación de `GET /category` ([docs/category.md](category.md), feature 27).
   - **Decimales en `add-stock`**: confirmar que el backend persiste cantidades fraccionarias para unidades de peso/volumen (feature 30).
   - **Multimoneda (feature 33)**: corregir el bug de conversión de pagos con base ≠ CUP ([docs/bug-conversion-pagos-multimoneda.md](bug-conversion-pagos-multimoneda.md)) y aceptar `currency` en `POST/PATCH /expenses`. (La regla de delivery por negocio ya quedó resuelta con `acceptsMessaging`, feature 35.)
   - **Selección de plan self-service / trial Pro (feature 39)**: implementar `POST /plans/select` transaccional, asignación automática del trial Pro al registrar, `status`/`archivedReason` en `GET /businesses/my-businesses`, suspensión de trabajadores/invitaciones en downgrade y enforcement server-side ([docs/análisis-planes/backend-cambios.md](análisis-planes/backend-cambios.md)).
   - **Desactivación de cuenta (feature 38)**: confirmar `deactivatedAt` en `getMe`, endpoint de reactivación dentro de la gracia y borrado definitivo al expirar el plazo.
2. **Crear PR `develop → main`** con los commits acumulados — la deuda de promoción sigue creciendo. Mover bloques del `sdd-develop.md` al `sdd-main.md` en el mismo PR.
3. **Re-aplicar la reversión** de categorías globales cuando backend confirme el modelo (el diff está conservado en el historial). La reversión de "divisas" quedó superada por la Suite Multimoneda (feature 33) y ya no requiere re-aplicación.
4. Continuar con Variante A del roadmap (rentabilidad, comparativas, métricas por worker).

---

*Fuentes: `git log`, [docs/sdd/sdd-develop.md](sdd/sdd-develop.md), [docs/sdd/sdd-main.md](sdd/sdd-main.md), [docs/extra/AUDIT.md](extra/AUDIT.md), [docs/extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md), estructura de `src/`.*
