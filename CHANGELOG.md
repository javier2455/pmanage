# Changelog

Todas las cambios notables del proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y el proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.10.0-beta] - 2026-03-24

### Agregado

#### Productos (negocio y catálogo)
- Botón **Agregar producto** de nuevo en la parte superior de `products/page.tsx` (enlace con `Button` + `Plus`).
- Búsqueda y tabla siguen en los componentes de tabla; sin filtro por categoría en la UI (la columna categoría permanece visible u ordenable donde aplica).

#### Asignar planes (admin)
- Tabla de usuarios con **TanStack Table**, columnas ordenables, búsqueda por nombre/correo integrada en la tabla, paginación con `DataTablePaginationNav`, estados vacíos y de carga.
- Nuevos archivos: `assign-plans-table-columns.tsx`; `assign-plans-table.tsx` reescrito; `page.tsx` sin estado `searchQuery` local y `handlePlanSelect` con `useCallback`.

#### Cierre contable diario
- Tres **data tables**: productos vendidos (sin canceladas), ingresos de inventario del día y stock en almacén — con ordenación, filtro por nombre de producto, paginación y totales al pie (ingresos/gastos/valor inventario según bloque).
- Helper `formatClosingCurrency` en `components/accounting-close/format-closing-currency.ts`.
- Componentes: `daily-close-sortable-header.tsx`, `daily-close-sold/entry/stock-columns.tsx`, `daily-close-sold/entry/stock-table.tsx`, `daily-close-table-layout.ts` (anchos fijos `table-fixed` para evitar solapamiento: producto ~28 %, columnas numéricas con `min-width`).
- Página `daily/page.tsx`: import de formato como `formatCurrency` (alias de `formatClosingCurrency`) para compatibilidad con el runtime.

### Cambiado

#### Cierre diario — UI
- Cards en grid de dos columnas con `lg:items-start` y `Card` con `gap-4 py-4` en bloques de tablas para reducir altura fantasma cuando una columna tiene poco contenido.
- Estado vacío (`Empty`) con `flex-none` y padding acotado para anular el `flex-1` por defecto del componente que estiraba la card.
- Tablas con `table-fixed`, `w-full`, `min-w-0` y reparto de anchos documentado en `daily-close-table-layout.ts`.

#### Cierre diario — Hidratación
- Primer render unificado: estado `mounted` + `useEffect` y skeleton `DailyClosePageSkeleton` hasta montar el cliente, luego `isLoading` u otras ramas — evita mismatch SSR/cliente entre skeleton, error sin negocio y contenido (contexto React Query / negocio activo).

### Corregido

- Errores de consola por identificadores ausentes tras refactors (`searchQuery`, `formatCurrency`) al alinear estado/imports con el código actual y caché de desarrollo cuando aplica.

---

## [0.5.0-beta] - 2026-03-16

### Agregado

#### Tipo de cambio — Formulario de actualización
- Nuevo componente `ExchangeRateForm` (`components/exchange-rate/exchange-rate-form.tsx`) con:
  - Inputs para USD, EUR y Transferencia usando `InputGroup` con icono de prefijo
  - Lógica create/update: llama a `useCreateExchangeRateMutation` si no hay datos previos, o `useUpdateExchangeRateMutation` si ya existen
  - Pre-rellena los campos con los valores actuales vía `useEffect` + `reset()`
  - Tras guardar, actualiza los campos inmediatamente con la respuesta del servidor (`response.data`) sin esperar el refetch
  - Notificaciones `sileo.success` / `sileo.error` y manejo de errores con `axios.isAxiosError`
  - Muestra "Valor actual: X MN" debajo de cada campo cuando hay datos existentes
- Nuevo schema de validación `exchangeRateSchema` en `lib/validations/exchange-rate.ts`
- Tipo `UpdateExchangeRatePayload` (`Omit<ExchangeRatePayload, 'idbusiness'>`) en `lib/types/exchange-rate.ts`
- Función `updateExchangeRate` en `lib/api/exchange-rate.ts`
- Ruta `updateExchangeRate` en `lib/routes/exchange-rate.ts`
- Hook `useUpdateExchangeRateMutation` en `hooks/use-exchange.ts`
- `ExchangeRateTypeOne` exportado desde `lib/types/exchange-rate.ts`

#### Detalles del negocio — Campo tipo de negocio editable
- "Tipo de negocio" ahora es editable al activar el modo edición, usando un `Select` con las opciones MiPyme, Agromercado y Mercado
- Campo `type` añadido al schema `updateBusinessSchema` y al payload del `onSubmit`
- Componente `EditableFieldWrapper` interno: envuelve los campos editables en modo lectura con un ring sutil (`ring-1 ring-primary/25`) y un icono de lápiz pequeño (`Pencil h-3 w-3 text-primary/50`) en la esquina derecha como indicador visual; los campos de solo lectura (Provincia, Municipio) no tienen este wrapper

### Corregido

#### Tipo de cambio
- `TypeError: Cannot read properties of null (reading 'USD')`: añadido guard `data?.data` en la page; las cards solo se renderizan si hay datos, y al formulario se le pasa `data?.data ?? null`
- Schema Zod: `invalid_type_error` reemplazado por `error` para compatibilidad con Zod v4
- Interfaces `ExchangeRateData` y `ExchangeRateFormProps` locales del formulario eliminadas y reemplazadas con `ExchangeRateTypeOne` importada desde tipos
- Corregido `invalidateQueries` en `useCreateExchangeRateMutation`: ahora invalida `["exchange-rate", idbusiness]` en vez de queries de productos

#### Detalles del negocio — Select de tipo de negocio
- Valor seleccionado aparecía centrado: icono y `SelectValue` agrupados en un `div flex` para que formen un bloque a la izquierda junto al chevron a la derecha
- Dropdown del select se abría centrado: `SelectContent` cambiado a `align="start"` y `position="popper"` para alinearse al inicio del trigger y heredar su ancho

### Eliminado
- Proxies Next.js de productos (`src/app/api/products/route.ts`, `src/app/api/products/[productId]/route.ts`, `src/app/api/products/business/[businessId]/route.ts`) — no se utilizaban; las rutas en `lib/routes/product.ts` apuntan directamente al backend externo

---

## [0.4.0-beta] - 2026-03-12 / 2026-03-14

### Agregado

#### Cierre contable diario — Filtro de fechas
- Tipo `DateRangeParameters` en `lib/types/accounting-close.ts`
- Función `getDailyAccountingClose` acepta parámetro opcional `params?: DateRangeParameters` y construye la URL con `URLSearchParams` según si hay rango de fechas
- Hook `useDailyAccountingClose` incluye `params` en el `queryKey` para que TanStack Query refetch automáticamente al cambiar las fechas
- Nuevo componente `DateFilter` (`components/accounting-close/date-filter.tsx`): calendario shadcn en un Popover con botones "Confirmar" y "Limpiar", y botón `X` en el trigger para limpiar directamente
- Integración del `DateFilter` en la página de cierre diario con estado local `selectedDate`

#### Ventas — Cancelación con razón
- Nuevo componente `CancelSaleDialog` (`components/sales/cancel-sale-dialog.tsx`) con:
  - Input obligatorio para la razón de cancelación (`cancellationReason`)
  - Botón de confirmar deshabilitado si el input está vacío o está cargando
  - Estado de carga con spinner (`Loader2`)
  - Limpieza automática del input al cerrar el diálogo
  - Soporte para confirmar con `Enter`
  - Tooltip opcional en el trigger
- Botón de cancelar deshabilitado en `TableOfSales` si la venta ya está cancelada (`sale.isCancelled`)

#### Página de detalles del negocio
- Nueva página `/dashboard/business/details` que muestra los datos del negocio activo con la misma estructura y estilos que la página de crear negocio (campos de solo lectura)

#### Proxies Next.js para CORS
- `/api/businesses/my-businesses` — proxy GET para obtener negocios del usuario
- `/api/businesses/[businessId]/products` — proxy GET para productos de un negocio
- `/api/auth/login`, `/api/auth/register`, `/api/auth/activate` — proxies POST para autenticación
- `/api/auth/send-confirmation-token/[email]` — proxy POST para reenvío de código
- `/api/auth/me` — proxy GET con reenvío del header `Authorization`
- `/api/products` y `/api/products/[productId]` — proxies GET/POST/PUT/DELETE para productos generales

### Corregido

#### ExchangeRatePage
- `TypeError: Cannot read properties of undefined (reading 'data')`: añadido guard `if (!data?.data)` y fallbacks `?? '-'` en los valores pasados a `ExchangeCard`

#### ComboboxCollection en ventas e inventario
- Error `Type 'Element[]' is not assignable to type '(item: any, index: number) => ReactNode'`: `ComboboxCollection` requiere una función render como children, no un array; reemplazado `products.map()` por función render directa en `sales/create/page.tsx` y `update-stock-form.tsx`

#### Rutas de productos
- Corregido path del backend de plural `/products` a singular `/product` en los proxies `api/products/route.ts` y `api/products/[productId]/route.ts`
- Todas las rutas de productos, businesses y auth en `lib/routes/*.ts` apuntan ahora a los proxies locales (`/api/*`) en vez del backend externo directamente

#### Proxies — Parsing robusto
- Reemplazado `response.json()` por `response.text()` + `try { JSON.parse(text) } catch { data = { message: text } }` en todos los proxies para evitar crash cuando el backend devuelve HTML o respuesta vacía

### Cambiado

#### Almacenamiento de sesión
- Migración completa de `localStorage` a `sessionStorage` para `token`, `refresh_token`, `user` y `activeBusinessId` en: `login/page.tsx`, `business-context.tsx`, `nav-user.tsx` y todos los archivos de `lib/api/*.ts`

#### Cancelación de venta
- `cancelSale` en `lib/api/sale.ts` ahora recibe `cancellationReason: string` y lo envía en el body del POST
- `useCancelSaleMutation` en `hooks/use-sales.ts` ahora acepta `{ saleId, cancellationReason }` en lugar de solo `saleId`
- `TableOfSales` usa `CancelSaleDialog` en lugar del `DeleteDialog` genérico

### Resuelto
- Merge conflict en `src/lib/routes/index.ts`: mantenida la URL `https://psearch.dveloxsoft.com/apiv1`

---

## [0.3.0-beta] - 2026-03-05

### Agregado

#### Productos
- Tabs en página crear producto: "Crear nuevo producto" y "Asignar producto a negocio" (igual que entradas)
- Tabla de "otros productos" (productos no asociados al negocio activo)
- Campo "Precio de entrada" en formulario de crear producto
- Proxy `/api/products` en Next.js para evitar CORS (backend redirige OPTIONS)

#### Inventario
- Tabla de historial de entradas (`TableOfInventory`) con columnas: Producto, Cantidad, Precio unitario, Stock anterior, Stock nuevo, Fecha, Acciones
- Diálogo de detalles de entrada (`InventoryDetailsDialog`) con misma estructura que ventas
- Skeleton durante carga y refetch en página de inventario
- Contador de total de entradas

#### Sidebar
- Icono `Boxes` para Inventario (reemplaza ArrowDownToLine)
- Versión de la app en el menú de opciones del usuario

### Corregido

#### Inventario
- Hook renombrado `useAllSalesByBusinessId` → `useAllInventoryByBusinessId` en `use-inventory.ts`
- Invalidación de `["all-inventory-by-business-id"]` al agregar stock

#### Productos
- Tipo `imageUrl` en `edit-product-form`: `?? null` para evitar `undefined` en `EditProductProps`

### Cambiado
- Página de productos: dos tablas (productos del negocio + otros productos), carga paralela de queries

---

## [0.2.0-beta] - 2026-03-03

### Agregado

#### Productos
- Componente `ProductsTableSkeleton` para mostrar estado de carga con estructura de tabla (shadcn)
- Skeleton en página de productos durante carga inicial (`isLoading`) y refetch tras crear/editar/eliminar (`isFetching`)

### Corregido

#### Crear producto
- Combobox de unidad no sincronizaba con react-hook-form (usaba estado local); ahora usa `watch("unit")` y `setValue` para mantener el valor del formulario
- Backend rechazaba `imageUrl`: eliminado del payload en `lib/api/product.ts` y del schema de validación
- Toast de feedback cuando falla la validación del formulario (campos requeridos)

#### StatusBadge
- Badges no mostraban color de fondo: la variante `default` del Badge aplicaba `bg-neutral-900` y sobrescribía las clases personalizadas; ahora usan `variant="ghost"` para que `bg-destructive` y `bg-emerald-500` se apliquen correctamente

#### Invalidación de cache (productos)
- `useEditProductMutation` no invalidaba la lista de productos; ahora invalida `["all-product-of-my-businesses"]` además de la query del producto individual
- La tabla de productos se actualiza correctamente tras crear, editar o eliminar

#### Otros (sesiones anteriores)
- `DeleteDialog`: no se cerraba tras confirmar eliminación; añadido estado `open` controlado y `setOpen(false)` tras `onConfirm` exitoso
- `BusinessProvider`: token expirado causaba 401, lista de negocios vacía y redirección incorrecta; añadido manejo de `isError`, retry sin reintentos en 401, redirección a login y limpieza de localStorage
- `cancelSale`: mismo fix de headers en body (orden de argumentos en `axios.post`)

### Eliminado
- Campo `imageUrl` del schema `createProductSchema` y del formulario de crear producto (el backend no lo acepta)
- `console.log` de debug en `lib/api/product.ts`

---

## [0.1.0-beta] - 2026-03-01

### Funcionalidades del sistema

#### Autenticación
- Registro de usuario con verificación por correo electrónico
- Login con validación de credenciales
- Verificación de código enviado al correo
- Reenvío de código de verificación
- Cierre de sesión con limpieza de localStorage
- Verificación de plan activo al hacer login (redirige a `/plans` si no tiene plan)

#### Gestión de negocios
- Creación de negocios con formulario completo (nombre, tipo, dirección, provincia, municipio, descripción, teléfono, correo)
- Selects dependientes de provincia → municipio (municipio se habilita al seleccionar provincia)
- Tipos de negocio soportados: MiPyme, Agromercado, Mercado
- Redirección automática a crear negocio si el usuario no tiene ninguno registrado
- Loading state mientras se cargan los negocios (evita flash de contenido)
- Cambio de negocio activo desde el sidebar (BusinessSwitcher)
- Persistencia del negocio activo en localStorage

#### Productos
- Listado de productos por negocio
- Creación de productos (nombre, descripción, categoría, unidad, precio, stock)
- Edición de productos existentes
- Eliminación de productos con diálogo de confirmación

#### Ventas
- Registro de ventas con selector de producto y cantidad
- Validación de stock disponible
- Cálculo automático de total
- Resumen de venta en tiempo real
- Listado de ventas por negocio

#### Entradas (Inventario)
- Actualización de stock de productos existentes

#### Cierre contable
- Cierre diario
- Cierre mensual

#### Tipo de cambio
- Consulta de tipo de cambio

#### UI/UX
- Sidebar colapsable con navegación por secciones
- Dark mode con toggle
- Diseño responsivo (móvil y escritorio)
- Notificaciones con Sileo (éxito y error)
- Componentes shadcn/ui + Tailwind CSS

### Stack técnico
- **Framework**: Next.js (App Router)
- **UI**: shadcn/ui, Tailwind CSS, Lucide icons
- **Formularios**: react-hook-form + Zod
- **Estado servidor**: TanStack Query (React Query)
- **HTTP**: Axios
- **Notificaciones**: Sileo

---

### Cambios realizados en esta sesión

#### Corregido
- Fix en la función `register` de `lib/api/auth.ts`: eliminado `try/catch` que tragaba errores silenciosamente e impedía la navegación a `/verify` después del registro

#### Agregado
- Tipo `CreateBusinessPayload` en `lib/types/business.ts`
- Schema de validación `createBusinessSchema` en `lib/validations/business.ts`
- Ruta `createBusiness` en `lib/routes/business.ts`
- Función API `createBusiness` en `lib/api/business.ts`
- Hook `useCreateBusinessMutation` en `hooks/use-business.ts` con invalidación de cache
- Página `/dashboard/business/create` con formulario completo
- Selects dependientes de provincia/municipio usando `useGetAllProvinces` y `useGetAllMunicipalitiesByProvinceId`
- Redirección automática en `BusinessProvider` cuando el usuario no tiene negocios
- Loading state en `BusinessProvider` para evitar flash del dashboard
- Botón "Agregar negocio" funcional en el `BusinessSwitcher` del sidebar
- Notificaciones con Sileo en éxito y error al crear negocio
- Botón de cancelar en el formulario de crear negocio

#### Corregido (edición de productos)
- Fix en `lib/api/product.ts`: función `edit` enviaba los headers como parte del body en vez de como config de axios (segundo vs tercer argumento de `axios.put`)
- Fix en `lib/validations/products.ts`: campo `active` en `editProductSchema` era requerido pero el formulario no lo incluía, causando que la validación fallara silenciosamente y el submit nunca se ejecutara. Ahora es `.optional()`

#### Cambiado
- Icono del botón de actualizar producto: `Save` reemplazado por `RefreshCw`
- Eliminado efecto hover del `SelectTrigger` en `components/ui/select.tsx`

#### Eliminado
- Código muerto de `getMyBusinesses` en el login (no se usaba la respuesta)
- Import sin usar de `businessRoutes` en login

---

## Resumen del sistema (estado actual), recomendaciones y mejoras sugeridas

*Actualizado: 2026-03-19 — complementa las notas de versiones anteriores; no sustituye el historial por release.*

### Resumen breve del sistema actual

**pmanage** (v0.9.0-beta) es un panel web (**Next.js 16**, App Router) orientado a la gestión de negocios: autenticación (login, registro, verificación por correo), multi-negocio con negocio activo, **productos**, **ventas** (incl. cancelación con motivo), **inventario / entradas**, **cierre contable** (diario y mensual), **tipo de cambio** y página pública de **planes**. La UI usa **shadcn/ui**, **Tailwind CSS 4**, **TanStack Query**, **Axios**, formularios con **react-hook-form + Zod**, tema claro/oscuro y toasts con **Sileo**.

La sesión se basa en **sessionStorage** (token, usuario, negocio activo) y **cookies de auth** sincronizadas para que el **middleware** pueda proteger rutas: exige token en `/dashboard` y `/plans`, restringe `/dashboard/admin/*` a rol admin y el cierre **mensual** a planes tipo “Pro” (premium/profesional/plus, etc.). El sidebar filtra ítems según rol y plan.

**Admin**: flujo de **asignar planes** a usuarios, creación de planes con tipos `free | basic | premium | enterprise`, estadísticas por plan y estilos visuales por tipo de plan (`getPlanStyle`). Parte de las llamadas a API pasan por **proxies `/api/*`** en Next para mitigar CORS en auth y negocios.

### Funcionalidades que se podrían agregar

- **Refresh token automático** o reintento controlado antes de expulsar al usuario en 401.
- **Auditoría / historial** de cambios en productos, planes asignados y cierres contables.
- **Exportación** (CSV/PDF) de ventas, inventario y cierres.
- **Notificaciones in-app** o recordatorios (vencimiento de planes, stock bajo).
- **Roles intermedios** (p. ej. solo lectura) si el backend lo soporta.
- **Tests** (Vitest/Playwright o similares): hoy no hay suite automatizada visible en el repo.
- **Documentación de API / `.env.example`** para onboarding de desarrolladores.

### Mejoras sugeridas (UX, consistencia, mantenimiento)

- **Unificar estilos de toasts Sileo** en toda la app (`text-foreground` / `text-muted-foreground` / `text-destructive`) para modo claro/oscuro, no solo en assign-plans.
- **Tipado estricto de `PlanResponse.type`** frente a `string` si el backend garantiza el enum.
- **Revisión de proxies vs llamadas directas** al backend: documentar qué rutas usan proxy y cuáles no, para evitar duplicidad y confusiones de CORS.
- **Accesibilidad**: foco en diálogos, `aria-*` en tablas complejas y contraste en badges.
- **i18n** si se prevé otro idioma además del español actual en UI.

### Errores, riesgos o puntos a corregir / vigilar

- **Cookies + sessionStorage**: si una cookie queda desincronizada del storage (pestaña antigua, limpieza parcial), el middleware y el cliente podrían discrepar; conviene una única función de “logout total” y revisar edge cases.
- **`PlanType` vs nombres en BD**: `getPlanStyle` también mira `name` y palabras como `custom`/`personalizado`; alinear contrato API para que `type` sea la fuente de verdad y reducir heurísticas por nombre.
- **Changelog histórico**: entradas muy antiguas mencionan `localStorage` en planes/login; el sistema actual usa **sessionStorage** — al leer documentación antigua, contrastar con el código vigente.

*Esta sección es orientativa; priorizar según negocio y capacidad del backend.*
