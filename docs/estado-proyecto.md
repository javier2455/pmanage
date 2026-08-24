# Estado del proyecto — pmanage

> Documento de referencia del estado real del proyecto. Incluye lo implementado, lo que está en curso y las proyecciones de desarrollo.
> Última actualización: **2026-08-08** — **vuelto y propina en el cobro de ventas**
> (el cliente ya puede pagar de más: se reparte el excedente entre lo que se devuelve y lo
> que queda a favor del negocio, con integridad de caja y renglón propio en el cierre),
> **retirada temporal de las vistas de costeo** (card de ganancia bruta en los cierres y
> columnas de costo medio/margen en inventario — ver [pendientes-costeo.md](pendientes-costeo.md)),
> **retirada de los tipos de venta a domicilio y para recoger** del mostrador, que no tenían
> operación detrás (ver [pendientes-tipos-de-venta.md](pendientes-tipos-de-venta.md))
> y **suite de tests del frontend** con Vitest, que este documento daba por inexistente.
> Ver [features 53–54](#implementado-en-develop--pendiente-de-promover-a-producción).
> Anterior — 2026-07-28: bloque de **costeo e inteligencia de inventario**
> (costeo **FIFO por capas**, ganancia bruta y costo de lo vendido en los cierres, margen por
> producto y **rentabilidad lote a lote**), **importación masiva de productos** desde Excel/CSV,
> **gestión de navegación** (secciones/menús/submenús con reordenado), **motor de tablas PDF**
> reescrito (cierre + factura), la **revisión de julio** (5 fases de correcciones) y el
> **arreglo del estado de leída de las notificaciones** + resúmenes de ingresos con cifras
> reales. Ver [features 42–52](#implementado-en-develop--pendiente-de-promover-a-producción).
> Anterior — 2026-07-12: (migración de **producción** a la subruta
> **`https://negora.dveloxsoft.com/manager/`** — ver [Promoción a producción v2](#promoción-a-producción-v2)
> y [despliegue-negora-manager.md](despliegue-negora-manager.md); además, limpieza
> de ESLint/TypeScript a **cero** errores y advertencias). Anterior — 2026-06-24: (trial Pro de 15 días + **selección de plan self-service** y **reconciliación de negocios** al hacer downgrade; **desactivación/reactivación de cuenta** con gracia de 15 días; **módulo de Caja / cuentas en divisa** (flujo de caja Fase 1); cancelación de venta con **devolución parcial y merma**; **delivery/mensajería por negocio** (`acceptsMessaging`); **rebranding a Negora**; stats del dashboard agrupadas por moneda; `RouteGuard` cliente para rutas Pro/admin en build estático — ver features 34–41). Anterior — 2026-06-20: suite **Multimoneda** (ventas con moneda + pagos multimoneda con factura PDF, compras de inventario y asignación de producto con costo en divisa, tipo de venta + entrega, y gastos con moneda; ver feature 33).

---

## Snapshot general

| | |
|---|---|
| **Versión actual** | `2.3.3` (`package.json`) |
| **Versión en producción** | `1.0.0` (rama `main`) — pendiente de promover a `2.x` |
| **Último commit** | `5bc8fe8` — 2026-06-27 *(el trabajo de julio no está reflejado aquí; el repo local no es un checkout de git, así que las features 42–52 se documentan desde las fuentes citadas en cada fila)* |
| **PR `develop → main`** | **En preparación** — rama `release/v2.0.0` lista (ver [Promoción a producción v2](#promoción-a-producción-v2)) |
| **Bloqueadores para promover** | (1) Backend con bug al guardar gasto con `expenseCategoryId` (error SQL `:categoryId`); (2) ~~contrato de **notificaciones in-app**~~ ✅ **resuelto** (2026-07-28) — **requiere redesplegar el backend**; (3) **migración de categorías** a nivel de `BusinessProduct` en backend (ver feature 27); (4) **multimoneda — backend**: bug de conversión de pagos con base ≠ CUP y `currency` no aceptado en gastos (ver feature 33); (5) **selección de plan self-service / trial Pro**: contrato `POST /plans/select`, campos `Business.status`/`archivedReason`, suspensión de trabajadores y enforcement server-side aún por entregar (ver feature 39 y [análisis-planes/backend-cambios.md](análisis-planes/backend-cambios.md)) |

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
| 42 | **Costeo de inventario FIFO por capas** — el costo deja de ser un número que cada compra sobrescribe y pasa a ser lotes con lo vivo de cada uno; cada venta congela el costo de lo que consumió | BE `143` | — |
| 43 | **Ganancia bruta y costo de lo vendido en los cierres** (diario y mensual) + corrección del **valor de inventario**, que se calculaba a precio de venta | BE `145` | — |
| 44 | **Exports de cierre con costo** (PDF y Excel) + **costo medio y margen por producto** en el listado de stock actual | BE `146` | — |
| 45 | **Rentabilidad lote a lote** — por cada compra: unidades vendidas, qué costaron, qué se cobró y su margen | BE `147` | — |
| 46 | **Importación masiva de productos** desde Excel/CSV con plantilla fija, validación previa y reporte accionable de errores | rama `feat-upload-products` | Ver [importacion-masiva-productos.md](importacion-masiva-productos.md) (MVP; pendientes listados ahí) |
| 47 | **Gestión de navegación** — CRUD de secciones/menús/submenús desde `/dashboard/admin/menus`, con reordenado drag-and-drop | rama `feat-menus-management` | **Backend**: los endpoints `/reorder` (batch por grupo) están en la rama del backend, **sin mergear a `main`** |
| 48 | **Motor de tablas para PDF** (`pdf-table.ts` + `pdf-report.ts`) — anchos calculados en vez de fijos; se reescribe el PDF de cierre y se migra la factura al mismo motor | BE `141`, `142` | — |
| 49 | **Desglose por moneda en los cierres** (`daily`, `monthly`, `range`) alineado en pantalla, PDF y Excel | BE `138` | — |
| 50 | **Revisión de julio 2026 — 5 fases de correcciones**: estados de carga del panel, retirada de presupuestos en saldos por moneda, desempeño de ventas por período y multimoneda, filtros de fecha/tipo + exportación en historial de inventario, y maquetación del PDF de cierre | BE `139`, `140`, `141` | — · detalle en [revision-2026-07-correcciones.md](revision-2026-07-correcciones.md) |
| 51 | **Refactor de transacciones financieras** a 4 tipos con monto y moneda originales + fix de duplicados en cancelación multimoneda | BE `136`, `137` | — |
| 52 | **Cron de cierres** (diario/mensual por hora de cierre del negocio, idempotente) + **datos enriquecidos** en el correo de cierre | BE `087`, `088` | — |
| 53 | **Vuelto y propina en el cobro** — el cliente puede pagar de más; el excedente se reparte entre lo devuelto (en la moneda que se elija) y lo que queda a favor del negocio, con salida de caja propia y renglón en el cierre | BE `150` | **Migración `20260806120000` sin aplicar** en producción (ver detalle) |
| 54 | **Suite de tests del frontend** (Vitest, 15 suites, 212 casos sobre lógica pura: moneda, cierres, planes, validaciones, permisos) | — | — |
| 55 | **Rentabilidad del producto** (V3-116) — vista nueva en Inventario que cruza el desembolso acumulado de un producto con lo cobrado: invertido, recuperado (facturado y cobrado), pendiente con barra de cuatro tramos, proyección del stock al precio de hoy y desglose lote a lote en orden FIFO. Incluye unidades que faltan por vender, variación de costo entre lotes y alerta de margen negativo antes de vender | BE `158` | Sobre datos anteriores al costeo muestra el aviso de stock sin costo: depende del backfill pendiente (V3-119) |

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
  compartido `AmountCurrencyField` ([amount-currency-field.tsx](../src/components/products/amount-currency-field.tsx)).
- **Precio de venta multimoneda:** el precio se fija en la moneda en que se cobra y
  el backend lo persiste convertido a CUP (migraciones 148 + 149), con
  `priceCurrency` y `priceExchangeRateApplied` como referencia de cómo se fijó —
  mismo patrón que el costo. Detalle y límite conocido (deriva de la tasa) en
  [docs/moneda-precio-venta.md](moneda-precio-venta.md).
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

### Detalle: Costeo FIFO por capas y su cascada (features 42–45) — BE `143`, `145`, `146`, `147`

Es el bloque de trabajo más grande de julio y responde a una sola pregunta del dueño:
**"¿cuánto gané de verdad con esto?"**. Antes el costo de un producto era un único
`entryPrice` que **cada compra sobrescribía**, así que una compra más cara borraba el
costo real de lo que aún quedaba de la compra anterior y el margen salía mal.

- **Capas de costo (42).** Cada entrada de inventario crea un lote (`InventoryCostLayer`)
  con su cantidad y su costo. Cada venta consume lotes en orden de llegada (**FIFO**) y
  registra qué consumió (`SaleItemCostConsumption`), congelando el costo de esa venta.
  Aunque la tasa de cambio o el precio de compra cambien después, el margen histórico
  no se mueve.
- **Cierres con ganancia bruta (43).** El cierre diario y el mensual pasan a mostrar
  **costo de la mercancía vendida** y **ganancia bruta**. De paso se corrigió el **valor
  de inventario**, que se calculaba a precio de venta (inflaba el activo).
- **Exports y margen por producto (44).** El PDF y el Excel del cierre incluyen el costo;
  el listado de stock actual gana **costo medio** y **margen** por producto.
- **Rentabilidad por lote (45).** Por cada compra: unidades vendidas, qué costaron, qué se
  cobró y el margen resultante. Es la vista que cierra la línea de trabajo.

> **Nota de moneda** (ver [multimoneda-productos.md](../../psearch-back/docs/multimoneda-productos.md)):
> `businessProduct.entryPrice` se guarda **convertido a CUP** porque de él dependen margen,
> valor de inventario y consolidados. En cambio `inventoryHistory`, `providerProduct.price`
> y `expense.amount` conservan la **moneda original** + la tasa aplicada, que es el dato que
> el usuario reconoce. Al leer estos datos hay que mirar siempre a qué importe describe el
> campo `currency`.
>
> `businessProduct.price` (precio de venta) también se guarda en CUP, pero **sin ninguna
> columna que diga en qué moneda se fijó**: la conversión la hace el frontend al enviar y
> se pierde el origen. Consecuencias y qué haría falta en el backend, en
> [docs/moneda-precio-venta.md](moneda-precio-venta.md).

### Detalle: Tipos de venta retirados del mostrador (2026-08-08)

El selector **"Tipo de venta"** del carrito se retiró: todas las ventas nuevas se registran
como `in_store`. Con él se fueron las opciones **A domicilio** y **Para recoger**, el bloque
de datos de entrega (dirección, contacto, precio de mensajería) y el desglose
Productos/Mensajería del total.

**Por qué:** ninguno de los dos tipos tenía flujo detrás. Marcar una venta como delivery
guardaba una dirección y una tarifa, y ahí se acababa — no hay reparto, ni estado de
entrega, ni asignación, ni aviso al cliente. Era un campo que el cajero respondía en cada
venta sin que la respuesta cambiara nada, y que además hacía parecer que existía una
operación de delivery inexistente.

**Lo que se pierde mientras tanto:** la tarifa de mensajería era la única forma de cobrar un
extra que no fuera un producto del catálogo, y los datos de contacto de entrega ya no se
guardan. Las ventas antiguas conservan su tipo y su detalle sigue mostrándose; el backend,
el `deliveryFee` y el flag `acceptsMessaging` del negocio quedan intactos.

Qué se quitó, qué aportaba y las cuatro decisiones a tomar antes de reponerlo (estado de
entrega, asignación del reparto, el `deliveryFee` que hoy no llega al cierre, y si `pickup`
aporta algo sobre `in_store`) están en
**[pendientes-tipos-de-venta.md](pendientes-tipos-de-venta.md)**.

### Detalle: Vistas de costeo retiradas de la interfaz (2026-08-08)

Tres piezas de las features 43–44 se **quitaron de la pantalla** a petición del equipo. El
backend sigue calculando y enviando todo; lo retirado es solo el render:

1. La card **"Costo de la mercancía vendida"** (ingresos → costo → ganancia bruta) de los
   cierres diario y mensual.
2. La columna **"Costo medio"** del inventario actual.
3. La columna **"Margen"** del inventario actual.

**El PDF y el Excel del cierre siguen mostrando la sección de costo**, así que hoy hay
divergencia deliberada entre pantalla e informes. La **rentabilidad lote a lote**
(feature 45), la tarjeta de valor de inventario y la notificación de margen negativo
quedan intactas.

**Dato de fondo que conviene resolver antes de reponerlas:** de 208 líneas de venta en
`dveloxso_psearch_develop` solo **6** tienen costo registrado, porque el backfill del
costeo histórico nunca llegó a ejecutarse. Con esa cobertura, las tres vistas mostraban
mayoritariamente guiones y una ganancia bruta bastante más alta que la real.

Qué aportaba cada una, dónde vivía el código, cómo reponerlo y las tareas previas
(reconciliar migraciones → ejecutar el backfill → comprobar cobertura) están en
**[pendientes-costeo.md](pendientes-costeo.md)**.

### Detalle: Vuelto y propina en el cobro de ventas (feature 53) — BE `150`

Hasta ahora era **imposible registrar un cobro que superara el total de la venta**: el
backend rechazaba cualquier pago que pasara del total en más de un centavo. Eso bloqueaba
el caso más corriente de un mostrador —venta de 978 CUP y el cliente paga con un billete de
1000— y el más frecuente al cobrar en divisa: una venta de 34 525 CUP a tasa 675 son
51,15 USD, y el cliente que no tiene centavos entrega 55. El cajero tenía que teclear el
importe exacto, así que el sistema registraba un dinero que no coincidía con el del cajón.

**El modelo.** En `Payment` se separó lo **entregado** (`amount`) de lo **aplicado a la
venta** (`amountInBaseCurrency`), que antes eran siempre el mismo número. Sobre ese eje,
cuatro columnas nuevas guardan el reparto del excedente. Sin vuelto ni propina ambos
importes coinciden, así que el histórico no cambia y la migración no necesita backfill.

**Tres decisiones que conviene conocer:**

- **El vuelto lleva su propia moneda y su propia tasa congelada.** Se paga en USD y se
  devuelve en CUP porque no circulan centavos de dólar; sin esto la función no serviría.
- **La propina se guarda en la moneda de la VENTA, no en la del pago.** No es un billete
  concreto sino una diferencia de valor. En la moneda del pago se perdería precisión de
  forma inaceptable: sobre una venta de 34 525 CUP pagada con 55 USD donde solo se
  devuelven 2 500 CUP, el sobrante real son 100 CUP, pero `100/675` redondea a 0,15 USD =
  101,25 CUP y el cierre dejaría de cuadrar con la caja.
- **El excedente hay que declararlo siempre**, aunque sea con un objeto vacío. Es lo que
  atrapa un 5500 tecleado en vez de 55; sin esa puerta, el importe de más se registraría
  como propina en silencio.

**Frontend.** El diálogo de cobro
([payment-dialog.tsx](../src/components/sales/payment-dialog.tsx)) muestra un bloque de
excedente **solo cuando el cliente entrega de más**: selector de moneda del vuelto, importe
ya relleno con el excedente convertido, atajo *"Dejar como propina"* y la línea viva *"Queda
a favor del negocio"*. El resumen final pasó de dos líneas a tres — **Entrega el cliente /
Se aplica a la venta / Quedaría pendiente**. El detalle de la venta
([details-dialog.tsx](../src/components/sales/details-dialog.tsx)) añade un bloque
*"Detalle del cobro"* solo si en algún pago sobró dinero, y el resumen del cierre un bloque
**"Propinas y sobrantes de cobro"**, separado de Ventas y de la ganancia bruta porque no
vendió mercancía.

**Caja y cierre.** El vuelto sale del cajón con un movimiento propio (`change_given`) en su
moneda, y al cancelar una venta el cliente devuelve el vuelto (`change_returned`) — sin eso,
cancelar dejaba la caja descuadrada. Las propinas se agregan al cierre por la **fecha del
pago** (una venta de ayer cobrada hoy deja su propina en el cajón de hoy) y **no** se suman
al ingreso, para no inflar el margen bruto con un importe de costo cero.

**Corrección del 2026-08-08 — "Pagar todo" dejaba la venta pendiente.** Al cobrar en otra
moneda, el botón redondeaba al centavo **más cercano**: 1000 CUP a tasa 675 son 1,4814… USD
→ 1,48 USD = **999 CUP**, un peso corto, y la venta quedaba `partially_paid` pese a estar
cobrada. El backend ya redondeaba hacia arriba en su sugerencia; el frontend no. Arreglado
con `amountToCoverBase` ([currency.ts](../src/lib/currency.ts)) y un test de propiedad que
recorre importes y comprueba que el equivalente nunca se queda corto. En el mismo paso, el
diálogo dejó de abrir en USD (usaba `summary.sugerencia`, que para una venta en CUP propone
dólares) y el atajo "Dejar como propina" pasó a ser un par de **radio buttons** con
*Entregar el vuelto* marcado por defecto.

**Verificado:** 475 tests en backend (11 nuevos, incluidas las cuatro trazas de mostrador
con sus importes exactos) y 212 en frontend, todos en verde.

Documento completo, con el algoritmo y la comprobación del cuadre de caja caso por caso:
[150-sale-payment-change-and-tips.md](../../psearch-back/src/v2/migration_doc/150-sale-payment-change-and-tips.md).

> ⚠️ **Bloqueador de despliegue:** la migración `20260806120000-AddChangeAndTipToPayments`
> **no está aplicada en producción**. En desarrollo el esquema se actualizó solo porque
> `NODE_ENV=development` activa `synchronize`; en producción eso está apagado y el cobro
> fallará hasta aplicarla. Ver la deuda técnica de migraciones más abajo.

### Detalle: Importación masiva de productos (feature 46) — rama `feat-upload-products`

Un negocio con 100+ productos no puede darlos de alta de uno en uno. Se carga un
**Excel (`.xlsx`) o CSV** a partir de una **plantilla fija**; el sistema valida la
estructura **antes** de confirmar y devuelve qué está mal y cómo arreglarlo, fila por fila.
Página en `/dashboard/business/products/import`.

Fuente de la verdad (plantilla, contrato de API, reglas y pendientes del MVP):
[importacion-masiva-productos.md](importacion-masiva-productos.md).

### Detalle: Gestión de navegación (feature 47) — rama `feat-menus-management`

CRUD completo de la jerarquía **Sección → Menú → Submenú** (tres niveles fijos) desde
`/dashboard/admin/menus`, con reordenado **drag-and-drop**. Modelo de datos, reglas y mapa
de archivos en [extra/NAVIGATION_MANAGEMENT_GUIDE.md](extra/NAVIGATION_MANAGEMENT_GUIDE.md).

> ⚠️ **Bloqueador:** los endpoints `/reorder` (batch por grupo) viven en la rama
> `feat-menus-management` del **backend** y **no están mergeados a `main`**. El reordenado
> no funcionará contra un backend de producción hasta que se mergeen.

### Detalle: Notificaciones — estado de leída y resúmenes (2026-07-28)

Tres defectos reales del módulo de notificaciones, corregidos hoy:

1. **La ruta de "marcar una notificación como leída" no existía.** Estaba declarada como
   `@Patch("{id}/read")` en vez de `@Patch(":id/read")`. Con NestJS 11 → Express 5 →
   path-to-regexp 8, `{...}` ya **no** es un parámetro sino un grupo opcional literal, así
   que `PATCH /notifications/<uuid>/read` devolvía **404**: al pulsar una notificación su
   `readAt` nunca se guardaba y al reabrir sesión volvía a salir como no leída. Además el
   frontend no enviaba el `businessId` que el backend exige — también corregido.
2. **Filtros `readAt: null` que TypeORM descartaba.** En TypeORM 0.3 la opción por defecto
   `invalidWhereValuesBehavior.null = "ignore"` **elimina la condición entera** del WHERE
   (hay que usar `IsNull()`). Consecuencia: `?unreadOnly=true` devolvía todo, y
   `markAllAsRead` seleccionaba **todas** las notificaciones del negocio —leídas incluidas—
   y les reescribía la fecha de lectura.
3. **Resúmenes semanal/mensual con cifras reales.** `buildSummary` devolvía `revenue: 0`
   fijo. Ahora calcula ingresos delegando en `SaleService.getClosingByDateRange`, la misma
   fuente que los cierres contables, comparando el tramo transcurrido contra el mismo tramo
   del periodo anterior.

> Los resúmenes **siguen sin verse en la UI**: nada dispara la notificación, y los tipos
> `weekly_summary` / `monthly_summary` están excluidos de `DEFAULT_NOTIFICATION_TYPES`
> (backend) y `VISIBLE_NOTIFICATION_TYPES` (frontend). Activarlos de punta a punta está
> planificado como **V3-040..043** en [v3/V3-MASTER.md](v3/V3-MASTER.md) §8.

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
| `feat-upload-products` | Importación masiva de productos (feature 46) | MVP funcional; pendientes en [importacion-masiva-productos.md](importacion-masiva-productos.md) |
| `feat-menus-management` | Gestión de navegación (feature 47) | **Los `/reorder` del backend siguen en su rama, sin mergear a `main`** |

> `fix/cors-error` ya está mergeado: `src/app/api/` fue eliminado y el problema de CORS al deployar está resuelto.

---

## Proyecciones de desarrollo

### Próximo — Variante A: "Más datos, mismas operaciones" (est. 2–3 semanas)

No requiere entidades nuevas. Todo es agregación sobre datos ya capturados.

| Feature | Estado frontend | Endpoint backend necesario |
|---|---|---|
| Alertas de stock bajo/agotado | ✅ Implementado · emisión multi-canal entregada | Pendiente: `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` |
| Notificaciones in-app (bandeja) | ✅ **Completo y en funcionamiento** — contrato entregado; estado de leída corregido 2026-07-28 | — |
| Rentabilidad por producto (margen real, costeo FIFO) | ✅ **Hecho** — features 42–45 (margen por producto y rentabilidad por lote) | — (BE `143`, `146`, `147`) |
| Comparativas de periodos (este mes vs. anterior) | ⚠️ **Parcial** — el cálculo existe en los resúmenes semanal/mensual (`/notifications/summaries/*`), pero **no hay pantalla** que lo consuma | Planificado como V3-040..043 |
| Métricas de ventas por trabajador | ✅ **Hecho** — `GET /analytics/sales-by-worker/:businessId` con multimoneda y rango de fechas | — (BE `139`) |

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
| **Reponer las vistas de costeo** (card de ganancia bruta en cierres, costo medio y margen en inventario) | Retiradas el 2026-08-08. El backend sigue enviando los datos; falta ejecutar el backfill del costeo histórico antes de volver a mostrarlas — ver [pendientes-costeo.md](pendientes-costeo.md) |
| **Venta a domicilio con flujo real** (estado de entrega, asignación del reparto, mensajería en el cierre) | El selector de tipo de venta se retiró el 2026-08-08 por no tener operación detrás; el backend sigue soportando los tres tipos — ver [pendientes-tipos-de-venta.md](pendientes-tipos-de-venta.md) |
| **Persistir el método de pago** (`metodo`) | El DTO lo exige, se valida… y se descarta: `Payment` no tiene la columna. Sin él no se puede auditar si un vuelto se dio en efectivo (feature 53) |
| **Cierre por devengo vs. caja por caja** | El cierre cuenta como ingreso toda venta no cancelada aunque nadie haya pagado; `currency_accounts` solo se mueve al cobrar. Con ventas a crédito ambos divergen |
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
| Frontend sin tests automatizados | ✅ **Resuelto** — suite Vitest con 15 archivos en `src/testing/suites/` y 209 casos (`pnpm test`) sobre la lógica pura: moneda y conversión, errores multimoneda, cierres, planes, permisos, validaciones y formatos. Sigue sin haber tests de componentes ni e2e |

### Pendiente

| Problema | Impacto | Prioridad |
|---|---|---|
| **Las migraciones del backend nunca se han ejecutado.** La base `dveloxso_psearch_develop` **no tiene siquiera tabla `migrations`**: todo el esquema se ha ido creando con `synchronize`, que solo está activo fuera de producción. Consecuencias: (1) en producción el esquema **no** se actualiza solo y cada columna nueva rompe su endpoint —es lo que provocó el `Unknown column 'price_exchange_rate_applied'`—; (2) correr `migration:run` hoy intentaría aplicar las 31 desde cero, fallando en las que crean tablas ya existentes y **duplicando las capas de costo** con el backfill, cuyo `up()` no limpia antes de insertar | Despliegues rotos en producción y riesgo de corromper el costeo si alguien lanza las migraciones a ciegas | **Alta** |
| **Sin tests de componentes ni e2e en el frontend** — la suite Vitest cubre lógica pura, pero no hay render de componentes ni flujos de navegación | Regresiones de UI no detectadas en CI | Media |
| **Errores de TypeScript en `psearch-back/src/v1/menu/menu.service.spec.ts`** — falta `@jest/globals` y hay `as` sobre tipos que ya no encajan (`order`, `permissions`) | `tsc --noEmit` no está limpio en el backend; enmascara errores nuevos | Media |
| **Entidad `Notification` desalineada con su tabla** — `isSent`, `sendError` y `sentAt` no declaran `name`, así que TypeORM espera `isSent`/`sendError`/`sentAt` mientras la migración creó `is_sent`/`send_error`/`sent_at` (y `findUnsent` consulta las snake_case en SQL crudo). Funciona solo si `synchronize` creó las columnas duplicadas | Columnas duplicadas y datos que pueden divergir según por dónde se lean | Media |
| Sin Prettier configurado | Inconsistencia de estilo entre archivos | Baja |
| Query keys no centralizados en un archivo de constantes | Renombrar una key requiere buscar en todos los hooks | Baja |

---

## Promoción a producción v2

Runbook para liberar la v2 (`develop` → `main`). Detalle de build/estático en
[docs/conversion-a-estatico.md](conversion-a-estatico.md) y [docs/extra/build-output-config.md](extra/build-output-config.md).

> **Actualización 2026-07-12 — cambio de URL de producción.** Producción ya **no**
> va a la raíz de `psearch.dveloxsoft.com`, sino a la subruta
> **`https://negora.dveloxsoft.com/manager/`** (mismo dominio que la landing). El
> job `deploy-main` del workflow **fue reescrito** para esto: construye con
> `NEXT_PUBLIC_BASE_PATH=/manager` (+ `NEXT_PUBLIC_API_URL`), **regenera
> `out/.htaccess`** con los destinos de rewrite prefijados a `/manager`, y despliega
> **solo** a `~/negora.dveloxsoft.com/manager` **sin tocar la landing** del
> directorio padre. `develop` sigue igual (`psearch.dveloxsoft.com/dev`). Guía
> completa y tareas de backend/cPanel en
> [despliegue-negora-manager.md](despliegue-negora-manager.md).

`next.config.ts` sigue siendo branch-aware (lee `NEXT_PUBLIC_BASE_PATH`); lo que
cambió es qué valor inyecta cada job.

| Archivo | ¿Cambia para main? |
|---|---|
| `next.config.ts` | ❌ No — branch-aware vía `NEXT_PUBLIC_BASE_PATH` |
| `.github/workflows/deploy-workflow.yml` | ✅ **Ya cambiado** — job `deploy-main` reescrito para `/manager` (build + regenera `.htaccess` + destino `negora.dveloxsoft.com/manager`) |
| `public/.htaccess` | ❌ No para main — el workflow **regenera** `out/.htaccess` con prefijos `/manager` en el build. (El del repo se usa tal cual en `develop`.) |
| `package.json` | ✅ Sí — versión a `2.0.0` |

**Rutas dinámicas y `.htaccess` (verificado):** las reglas cubren workers, products,
products/catalog, providers, expenses y reset-password. `categories/[kind]` **no**
necesita regla porque usa `generateStaticParams` con valores reales (`expenses`,
`products`) y genera carpetas físicas en `out/`. Al añadir cualquier `[param]` nuevo,
hay que añadir su regla **en dos sitios**: en `public/.htaccess` (para `develop`, con
`/dev/`) y en el heredoc del job `deploy-main` del workflow (para `main`, con `/manager/`).

**Pasos:**

1. `release/v2.0.0` desde `develop`: `package.json` a `2.0.0`. (Para `main` no hay que
   editar `public/.htaccess`: lo regenera el workflow con prefijos `/manager`.)
2. **Backend (bloqueante):** `CORS_ORIGINS` debe incluir `https://negora.dveloxsoft.com`
   (origen exacto, sin barra ni ruta) y reiniciar/redesplegar. Ver
   [despliegue-negora-manager.md](despliegue-negora-manager.md) §5.
3. Confirmar el `NEXT_PUBLIC_API_URL` del job `deploy-main` (apunta a la API de
   producción); si la API aún no migró a `negora`, ajustar ese valor.
4. Build local de producción con `NEXT_PUBLIC_BASE_PATH=/manager` y confirmar que
   `out/index.html` referencia `/manager/_next/...`; `pnpm test` + `tsc --noEmit` +
   `pnpm run lint` en verde.
5. PR `release/v2.0.0 → main`. Push a `main` → job `deploy-main` (build `/manager`,
   regenera `.htaccess`, sube `out/` a `negora.dveloxsoft.com/manager` sin tocar la
   landing).
6. Smoke test en `https://negora.dveloxsoft.com/manager/login`: assets `/manager/_next/...`
   con `Content-Type: application/javascript`; login sin errores CORS; recarga dura
   sobre rutas dinámicas (no 404); un 401 redirige a `.../manager/login`; correos de
   reset e invitación llevan a `.../manager/...`; y la **landing** en `/` sigue intacta.
7. Mover el bloque de features de `sdd-develop.md` a `sdd-main.md` y actualizar este snapshot.

---

## Siguiente acción recomendada

**Orden sugerido:**

0bis. **Reconciliar el historial de migraciones del backend** — es ahora el bloqueador de
   despliegue más urgente. Ninguna base tiene tabla `migrations`, así que en producción el
   esquema no se actualiza y cada columna nueva rompe su endpoint (ya pasó con
   `price_exchange_rate_applied`, y volverá a pasar con las cuatro columnas del vuelto de la
   feature 53). Registrar como aplicadas las migraciones que el esquema ya tiene **sin
   ejecutarlas**, y solo después correr las que faltan de verdad. Cuidado con
   `BackfillInventoryCostLayers`: su `up()` no limpia antes de insertar y duplicaría las
   capas de costo.

0. **Desplegar el backend** con el arreglo de notificaciones del 2026-07-28 (la ruta
   `:id/read` es un cambio de servidor: hasta que no se redespliegue, marcar una
   notificación como leída seguirá devolviendo 404 en producción). Y **mergear los
   `/reorder`** de `feat-menus-management` en el backend, o el reordenado del sidebar
   no funcionará (feature 47).
1. **Coordinar con backend** los contratos que bloquean la promoción:
   - **Corregir el bug SQL de `expenseCategoryId`** en `POST/PATCH /expenses` (parámetro `:categoryId` sin enlazar) — ver detalle arriba.
   - ~~**Notificaciones in-app** — Parte 2 del contrato~~ ✅ **Entregado y en funcionamiento** (2026-07-28).
   - Endpoints de alertas de stock: `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` ([docs/backend-alertas-stock.md](backend-alertas-stock.md)).
   - **Migración de categorías** a nivel de `BusinessProduct` y paginación de `GET /category` ([docs/category.md](category.md), feature 27).
   - **Decimales en `add-stock`**: confirmar que el backend persiste cantidades fraccionarias para unidades de peso/volumen (feature 30).
   - **Multimoneda (feature 33)**: corregir el bug de conversión de pagos con base ≠ CUP ([docs/bug-conversion-pagos-multimoneda.md](bug-conversion-pagos-multimoneda.md)) y aceptar `currency` en `POST/PATCH /expenses`. (La regla de delivery por negocio ya quedó resuelta con `acceptsMessaging`, feature 35.)
   - **Selección de plan self-service / trial Pro (feature 39)**: implementar `POST /plans/select` transaccional, asignación automática del trial Pro al registrar, `status`/`archivedReason` en `GET /businesses/my-businesses`, suspensión de trabajadores/invitaciones en downgrade y enforcement server-side ([docs/análisis-planes/backend-cambios.md](análisis-planes/backend-cambios.md)).
   - **Desactivación de cuenta (feature 38)**: confirmar `deactivatedAt` en `getMe`, endpoint de reactivación dentro de la gracia y borrado definitivo al expirar el plazo.
2. **Crear PR `develop → main`** con los commits acumulados — la deuda de promoción sigue creciendo. Mover bloques del `sdd-develop.md` al `sdd-main.md` en el mismo PR.
3. **Re-aplicar la reversión** de categorías globales cuando backend confirme el modelo (el diff está conservado en el historial). La reversión de "divisas" quedó superada por la Suite Multimoneda (feature 33) y ya no requiere re-aplicación.
4. ~~Continuar con Variante A del roadmap~~ — **prácticamente cerrada**: rentabilidad (features 42–45) y métricas por trabajador (BE `139`) están hechas. Queda solo **comparativas de periodos**, que ya tiene el cálculo hecho en los resúmenes pero **sin pantalla** (V3-040..043).
5. Arrancar la **v3** por el orden acordado en [v3/V3-MASTER.md](v3/V3-MASTER.md) §3: Caja N1 → Descuentos → CRM → Nóminas → Caja N2, con **V3-041..043** (resúmenes automáticos) como entrada de bajo riesgo para estrenar el ciclo.

---

*Fuentes: `git log`, [docs/sdd/sdd-develop.md](sdd/sdd-develop.md), [docs/sdd/sdd-main.md](sdd/sdd-main.md), [docs/extra/AUDIT.md](extra/AUDIT.md), [docs/extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md), estructura de `src/`.*
