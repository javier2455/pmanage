# SDD — pmanage (`main` / Producción)

> **Documento de especificación del sistema** que describe **pmanage tal como está hoy en producción**, lista para clientes reales.
> Para lo que viene en la siguiente versión, ver [sdd-develop.md](./sdd-develop.md).

| | |
|---|---|
| **Rama** | `main` |
| **Versión en `package.json`** | `2.0.0` |
| **Último commit documentado** | promoción `release/v2.0.0` — *chore(release): prepare v2.0.0 promotion (develop → main)* |
| **Entorno** | Producción (clientes reales) |
| **URL backend** | `https://psearch.dveloxsoft.com/api/v2` |
| **Marca** | **Negora** (rebranding desde PManage) |
| **Fecha del documento** | 2026-06-27 |

> **v2.0.0** es el primer release mayor desde `1.0.0`: promueve **todo el delta acumulado en `develop`** (features 1–41 del changelog). El catálogo completo y las specs por feature están en la [§5b — Cambios incluidos en v2.0.0](#5b-cambios-incluidos-en-v200-respecto-a-v100). Algunas features embarcan su frontend pero quedan **inertes hasta que el backend entregue su contrato** (marcadas ⚠️); ver [sdd-develop.md](./sdd-develop.md) §3 para el seguimiento de esos contratos.

---

## 1. Visión del producto

**pmanage** es un SaaS de gestión para pequeños negocios. Permite a emprendedores y pymes administrar **inventario, ventas, gastos, equipo y cierres contables diarios**, con soporte **multi-negocio** (varios negocios bajo un mismo usuario) y **multi-moneda** (USD, EUR, CUP, MXN, CAD, GBP, CHF, JPY).

**A quién sirve.** Comerciantes y emprendedores con 1–3 negocios pequeños que necesitan reemplazar planillas de Excel por un sistema centralizado y compartible con su equipo.

**Modelo de negocio.** Dos planes de suscripción:

| Plan | Precio | Límites |
|---|---|---|
| Básico | USD $5 / mes (anual: $3/mes) | 1 negocio, 100 productos, cierre diario, sin exportaciones |
| Pro | USD $15 / mes (anual: $12/mes) | 3 negocios, 500 productos, cierre mensual, exportaciones, equipo |

> Nota: la estructura de precios en USD y el selector mensual/anual están **ya en producción** (PR #6 mergeado a `main`).

**Onboarding self-service (v2.0.0).** El registro abre un **trial de 15 días con alcance Pro**; al expirar, el usuario elige Básico o Pro desde un paywall (`/seleccionar-plan`), sin pasar por WhatsApp. Si baja a Básico con más negocios de los permitidos, una pantalla de **reconciliación** archiva el exceso bajo el principio "conservar y bloquear, nunca borrar" (se restaura al volver a Pro). ⚠️ El enforcement server-side de este flujo depende de contrato de backend pendiente (ver §5b feature 39 y [sdd-develop.md](./sdd-develop.md) §3.4).

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, `output: "export"`) | 16.2.1 |
| Lenguaje | TypeScript / React | 5.x / 19.2.4 |
| UI base | shadcn/ui (estilo "New York"), Tailwind CSS, Radix UI | TW 4, Radix 1.x |
| Iconos | Lucide React | 0.562 |
| Estado cliente | Zustand | 5.0.11 |
| Estado servidor | TanStack React Query | 5.90 |
| Tablas | TanStack Table | 8.21 |
| Forms | React Hook Form + Zod | 7.71 / 4.3 |
| HTTP | Axios (interceptor JWT) | 1.13 |
| Charts | Recharts | 3.8 |
| Mapas | MapLibre GL | 5.24 |
| Date utils | date-fns | 4.1 |
| Compilador | Babel React Compiler | 1.0 |
| Lint | ESLint | 9 |

Configuración relevante en [next.config.ts](../../next.config.ts):

```ts
{
  reactCompiler: true,
  output: "export",          // ⇒ SPA estática
  trailingSlash: true,
  basePath: NEXT_PUBLIC_BASE_PATH || undefined,
  assetPrefix: NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
}
```

---

## 3. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│ Navegador del usuario                                       │
│  ↳ SPA estática (Next.js export) servida desde cPanel       │
│  ↳ JWT en sessionStorage  ·  Axios con interceptor          │
└──────────┬──────────────────────────────────────────────────┘
           │ HTTPS
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Apache (cPanel) + .htaccess                                 │
│  ↳ Rewrites SPA: 404 → /index.html                          │
│  ↳ Rutas dinámicas: /products/abc/edit → /__dynamic__.html  │
└──────────┬──────────────────────────────────────────────────┘
           │ XHR/Fetch
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend API (Node)                                          │
│  https://psearch.dveloxsoft.com/api/v2                      │
└─────────────────────────────────────────────────────────────┘
```

**Por qué SPA estática (output: "export").** El frontend no requiere SSR ni APIs en runtime: solo consume el backend ya existente. Esto permite hosting baratísimo en cPanel sin Node, y simplifica el ciclo de despliegue (subir carpeta `out/`).

**Rutas dinámicas en un sitio estático.** Como `next export` no produce rutas runtime, las páginas con `[id]` se generan con `generateStaticParams()` apuntando a un placeholder `__dynamic__`, y los parámetros reales se leen en cliente vía `useSearchParams()`. Las reescrituras Apache (`public/.htaccess`) traducen `/products/abc/edit` → `/products/__dynamic__/edit/index.html`. Detalle: [docs/extra/build-output-config.md](../extra/build-output-config.md).

---

## 4. Estructura del código fuente

```
src/
├── app/               ← Páginas (Next.js App Router)
│   ├── (auth)/        ← Login, register, verify, forgot-password
│   ├── dashboard/     ← App autenticada
│   ├── plans/         ← Página pública de planes
│   ├── layout.tsx     ← Layout raíz (theme, providers)
│   └── page.tsx       ← Landing
├── components/        ← Componentes organizados por dominio
├── context/           ← Providers React (BusinessContext, etc.)
├── hooks/             ← Hooks de dominio (1 por entidad)
├── lib/
│   ├── routes/        ← Definición de endpoints por entidad
│   ├── api/           ← Funciones que llaman al backend
│   ├── types/         ← Interfaces TypeScript
│   ├── validations/   ← Schemas Zod
│   ├── utils/         ← Helpers
│   ├── mocks/         ← Datos de prueba
│   ├── axios.ts       ← Cliente HTTP + interceptor JWT
│   ├── cookies.ts     ← Lectura/escritura de cookies
│   └── pro-gates.ts   ← Gating de plan Pro
└── fonts/             ← Tipografías locales
```

---

## 5. Módulos funcionales (en producción)

| Módulo | Rutas | Hook(s) | Definición API | Plan |
|---|---|---|---|---|
| Autenticación | `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password/[token]`, `/accept-invitation` | [use-auth.ts](../../src/hooks/use-auth.ts) | [auth.ts](../../src/lib/routes/auth.ts) | — |
| Dashboard inicial | `/dashboard` | [use-user.ts](../../src/hooks/use-user.ts) | [user.ts](../../src/lib/routes/user.ts) | Básico+ |
| Analytics | `/dashboard/analytics` | [use-analytics.ts](../../src/hooks/use-analytics.ts) | [analytics.ts](../../src/lib/routes/analytics.ts) | Básico+ |
| Negocios (multi-tenancy) | `/dashboard/business/create`, `/dashboard/business/details` | [use-business.ts](../../src/hooks/use-business.ts) | [business.ts](../../src/lib/routes/business.ts) | Básico (1) / Pro (3) |
| Productos | `/dashboard/business/products`, `…/create`, `…/[id]/edit`, `…/asign-to-business` | [use-product.ts](../../src/hooks/use-product.ts) | [product.ts](../../src/lib/routes/product.ts) | Básico+ |
| Historial de precios | Dentro de la vista de producto | [use-product-price-history.ts](../../src/hooks/use-product-price-history.ts) | [product.ts](../../src/lib/routes/product.ts) | Básico+ |
| Inventario | `/dashboard/business/inventory`, `…/create` | [use-inventory.ts](../../src/hooks/use-inventory.ts) | [inventory.ts](../../src/lib/routes/inventory.ts) | Básico+ |
| Ventas | `/dashboard/business/sales`, `…/create` | [use-sales.ts](../../src/hooks/use-sales.ts) | [sales.ts](../../src/lib/routes/sales.ts) | Básico+ |
| Gastos | `/dashboard/business/expenses` | [use-expenses.ts](../../src/hooks/use-expenses.ts) | [expenses.ts](../../src/lib/routes/expenses.ts) | Básico+ |
| Equipo | `/dashboard/business/workers` | [use-workers.ts](../../src/hooks/use-workers.ts), [use-invitations.ts](../../src/hooks/use-invitations.ts) | [invitations.ts](../../src/lib/routes/invitations.ts) | Pro |
| Tipos de cambio | `/dashboard/exchange-rate` | [use-exchange.ts](../../src/hooks/use-exchange.ts) | [exchange-rate.ts](../../src/lib/routes/exchange-rate.ts) | Básico+ |
| Cierre contable diario | `/dashboard/accounting-close/daily` | [use-accounting-close.ts](../../src/hooks/use-accounting-close.ts) | [accounting-close.ts](../../src/lib/routes/accounting-close.ts) | Básico+ |
| Cierre contable mensual | `/dashboard/accounting-close/monthly` | mismo hook | mismo file | **Pro** |
| Planes | `/plans`, `/dashboard/profile/plans-change`, `…/plans-history` | [use-plans.ts](../../src/hooks/use-plans.ts) | [plans.ts](../../src/lib/routes/plans.ts) | — |
| Admin: asignar planes | `/dashboard/admin/assign-plans`, `…/create` | [use-plans.ts](../../src/hooks/use-plans.ts) | [plans.ts](../../src/lib/routes/plans.ts) | Admin |
| Búsqueda global | usable desde cualquier vista | [use-search.ts](../../src/hooks/use-search.ts) | [search.ts](../../src/lib/routes/search.ts) | Básico+ |
| Menú/permisos | sidebar dinámico | [use-menu.ts](../../src/hooks/use-menu.ts) | [menu.ts](../../src/lib/routes/menu.ts) | — |
| Rol y plan del usuario | (utilidad) | [use-user-role-plan.ts](../../src/hooks/use-user-role-plan.ts) | — | — |
| **Proveedores** | `/dashboard/business/providers`, `…/create`, `…/[providerId]/edit`, `…/details` | [use-provider.ts](../../src/hooks/use-provider.ts) | [provider.ts](../../src/lib/routes/provider.ts) | Básico+ |
| **Categorías** (gastos/productos) | `/dashboard/business/categories`, `…/[kind]` | [use-expense-categories.ts](../../src/hooks/use-expense-categories.ts) | — | Básico+ |
| **Caja / cuentas en divisa** (flujo de caja F1) | `/dashboard/business/currency-accounts` | [use-currency-account.ts](../../src/hooks/use-currency-account.ts) | [currency-account.ts](../../src/lib/api/currency-account.ts) | Básico+ |
| **Tickets de Soporte** | `/dashboard/support`, `/dashboard/admin/support` | [use-support-ticket.ts](../../src/hooks/use-support-ticket.ts) | [support-ticket.ts](../../src/lib/routes/support-ticket.ts) | — |
| **Notificaciones** (campana + página) | `/dashboard/notifications` | [use-notifications.ts](../../src/hooks/use-notifications.ts), [use-support-notification.ts](../../src/hooks/use-support-notification.ts) | [notification.ts](../../src/lib/routes/notification.ts) | — (soporte ✅ / generales ⚠️ backend) |
| **Cuenta — desactivación/reactivación** | `/dashboard/profile`, `/cuenta-desactivada` | [use-user.ts](../../src/hooks/use-user.ts) | [user.ts](../../src/lib/api/user.ts) | — |
| **Selección de plan self-service** | `/seleccionar-plan`, `…/reconciliar` | [use-plans.ts](../../src/hooks/use-plans.ts) | [plans.ts](../../src/lib/api/plans.ts) | — (⚠️ enforcement backend) |

---

## 5b. Cambios incluidos en v2.0.0 (respecto a v1.0.0)

> Bloque movido desde `sdd-develop.md` al promover el delta a producción. Catálogo de las features 1–41 y sus specs. **Leyenda de estado:** ✅ funcional en producción · ⚠️ frontend embarcado pero **inerte hasta contrato de backend** (seguimiento en [sdd-develop.md](./sdd-develop.md) §3) · 🔵 no incluida (sigue en rama).

| # | Feature / cambio | Estado en v2.0.0 | PR / commit |
|---|---|---|---|
| 1 | Historial de precios — iteración final (`EditPriceDialog` → `EditBusinessProductDialog`) | ✅ | #8 |
| 2 | Refactor de rutas dinámicas con query params | ✅ | `a18f6c7` |
| 3 | Despliegue en subdirectorio (`basePath` + `.htaccess`) | ✅ | `8051f30`, `964c4c7` |
| 4 | Limpieza del workflow de cPanel viejo | ✅ | `efdf04e` |
| 5 | Sección **Categorías** + endpoints `expense-categories` | ✅ | — |
| 6 | Selector de categoría en formulario de gasto | ⚠️ backend (bug SQL `:categoryId`) | `0dad138`, `fbfff42` |
| 7 | **Módulo de Proveedores** completo (CRUD, detalle, productos) | ✅ | #9, `50a959d` |
| 8 | Tabla de productos por proveedor (`ProviderProductsTable`) | ✅ | `8ef2b3d` |
| 9 | Auto-completar precio de entrada desde proveedor | ✅ | `25e2b6a` |
| 10 | Refactor sidebar con secciones y visibilidad por rol | ✅ | `a5a2a03` |
| 11 | Gestión de submenús (admin navigation) | ✅ | `4c579ce` |
| 12 | Historial de inventario con timeline + back navigation | ✅ | `3138a7e` |
| 13 | Página de edición catálogo con back navigation | ✅ | `3138a7e` |
| 14 | Validación y estilado de `phone-input` | ✅ | `636a506` |
| 15 | Comparador multi-producto en historial de precios (Pro) | ✅ | `485ae8b` |
| 16 | **Exportación a PDF y Excel** en cierre diario y mensual (Pro) | ✅ | — |
| 17 | OAuth con Google | 🔵 rama `feature/auth-google` | — |
| 18 | Fix CORS / limpieza `src/app/api/` | ✅ | `5aae8d7` (PR #2) |
| 19 | **Alertas de stock bajo/agotado** (Pro) | ⚠️ backend (endpoints stock-alerts) | `3eaf9c3`, `22f6a12`, `b1e1a93` |
| 20 | **Config de notificaciones externas** (correo/SMS/WhatsApp, multi-canal, plan-gated) | ✅ | — |
| 21 | **Notificaciones internas (in-app)** — campana + dropdown + página | ⚠️ backend (canal `in_app` + `readAt`) | `f0ddcb4`, `52b0159` |
| 22 | **Fila de producto cliqueable** abre el detalle (se quita "Ver detalles") | ✅ | — |
| 23 | **Gastos filtrados por negocio activo** + toggle "Todos los negocios" (Pro) | ✅ | — |
| 24 | **Fila de venta cliqueable** + acción de cancelar simplificada | ✅ | — |
| 25 | **Búsqueda de productos en servidor** + estados de carga | ✅ | `02117cb` (1.4.3) |
| 26 | **Logout funcional** (`POST /auth/logout`) | ✅ | `101828a` (1.5.0) |
| 27 | **Categoría a nivel de `BusinessProduct`** + paginación de categorías | ⚠️ backend (migración de datos) | `2a13ebe` (1.6.0) |
| 28 | **Horario de atención del negocio** (config por día) | ✅ | `16d42a6` (1.7.0) |
| 29 | **Refactor de permisos de trabajador a secciones** (payload 3 capas) | ✅ | `de7e16a` (1.8.0) |
| 30 | **Stock con cantidades decimales** (peso/volumen) | ✅ | `c771e5e` (1.8.1) |
| 31 | **Editar la categoría de un producto dentro del negocio** | ⚠️ backend (`PATCH .../category`) | `22ee005` (1.13.0) |
| 32 | **Módulo de Tickets de Soporte** + notificaciones de soporte | ✅ | `c4b0801`→`da56ce3` (1.14.0–1.15.4) |
| 33 | **Suite Multimoneda** (ventas + pagos + factura + inventario + gastos) | ⚠️ backend (conversión base ≠ CUP, `currency` en gastos) | `be2fec8`→`18b503a` (1.16.x) |
| 34 | **Cancelación de venta con devolución parcial + merma** (`LOSS`) | ✅ | `9b19004`, `c722f66` (1.20.0) |
| 35 | **Delivery / mensajería por negocio** (`acceptsMessaging`) | ✅ | `4e4e6bb` (1.16.6), `3b9e3e6` (1.18.0) |
| 36 | **Rebranding a Negora** (logo, `icon.svg`, copy, landing) | ✅ | `685aef5` (1.19.0) |
| 37 | **Módulo de Caja / cuentas en divisa** (flujo de caja F1) | ✅ F1 (movimientos/ajustes 🔵 roadmap) | `7221bee` |
| 38 | **Desactivación / reactivación de cuenta** (gracia 15 días) | ✅ | `8b11178` (1.22.0), `829ad64` (1.22.3) |
| 39 | **Selección de plan self-service + trial Pro + reconciliación** | ⚠️ backend (`POST /plans/select`, enforcement) | `8311d4d` (1.23.0), `1b4a255` (1.24.0) |
| 40 | **Stats del dashboard por moneda** (`DashboardCurrencyTotal`) | ✅ | `1b4a255` (1.24.0) |
| 41 | **`RouteGuard` cliente** para rutas Pro/admin en build estático | ✅ | `1b4a255` (1.24.0) |
| 42 | **Base de tests** (11 suites / 84 tests de lógica pura) + UI admin | ✅ | `9461260`→`5bc8fe8` (1.28.x) |

> Ajustes menores 1.3.8–1.8.1: eliminación del menú estático de fallback, hover en filas, fix `markAllAsRead`, límites de notificaciones, botones `outline`.
> Ajustes menores 1.16.6–1.24.0: moneda nacional `MN → CUP` (`059bc2e`), eliminación de la regeneración de factura (`4a45bd6`), precios anuales (`c722f66`), ruta Pro adicional para trabajadores (`1501574`), doc comparativo de planes (`c722dd0`).

### Specs por feature

#### Historial de precios — versión refinada (PR #8)

Cada cambio de precio de un `BusinessProduct` registra un `PriceHistoryEntry` (precio anterior/nuevo, moneda, usuario, fecha). El usuario edita el precio inline desde la fila vía `EditBusinessProductDialog` (renombrado desde `EditPriceDialog` en la feature 31; ahora edita **precio + categoría**), ve el historial en página dedicada y compara múltiples productos en paralelo (Pro, `485ae8b`). `price`/`previousPrice` viajan como **string** para precisión decimal. Archivos: [src/hooks/use-product-price-history.ts](../../src/hooks/use-product-price-history.ts), [src/components/products/](../../src/components/products/).

#### Rutas de edición con query params (`a18f6c7`, `3ba032e`)

Las páginas de edición leen el id con `useSearchParams()` en vez del segmento dinámico; se mantiene `generateStaticParams()` con el placeholder `__dynamic__`. Los links usan `?id=...`. (Ver el detalle de la trampa `__dynamic__` en [docs/conversion-a-estatico.md](../conversion-a-estatico.md).)

#### Despliegue en subdirectorio (SPA `basePath`)

[next.config.ts](../../next.config.ts) lee `NEXT_PUBLIC_BASE_PATH` y aplica `basePath` + `assetPrefix`; [public/.htaccess](../../public/.htaccess) maneja rewrites en raíz (main) o subdirectorio (`/dev`). El env var solo se inyecta en el job `deploy-dev`. Detalle en [docs/extra/build-output-config.md](../extra/build-output-config.md).

#### Sección **Categorías**

Sección `/dashboard/business/categories` con CRUD de categorías propias (gastos y productos). Hub con grid de cards + detalle `/[kind]` con tabla paginada. `[kind]` usa `generateStaticParams` con valores reales (`expenses`, `products`), por lo que genera carpetas físicas y **no** necesita regla en `.htaccess`. Archivos: [src/components/categories/](../../src/components/categories/), [src/hooks/use-expense-categories.ts](../../src/hooks/use-expense-categories.ts).

#### Selector de categoría en formulario de gasto (`0dad138`, `fbfff42`)

[expense-form.tsx](../../src/components/expenses/expense-form.tsx) expone un selector de categorías del negocio activo y persiste `expenseCategoryId`. ⚠️ **Bloqueador backend:** `POST /expenses` responde 500 por un parámetro SQL `:categoryId` sin enlazar; el frontend ya envía el campo.

#### Módulo de Proveedores (PR #9, `50a959d` → `25e2b6a`)

Gestión completa de proveedores: listado paginado, alta con validación de teléfono, edición, detalle, tabla de productos del proveedor (`ProviderProductsTable`, `8ef2b3d`) y auto-completado del precio de entrada en `UpdateStockForm` (`25e2b6a`). Archivos: [src/components/business-providers/](../../src/components/business-providers/), [src/hooks/use-provider.ts](../../src/hooks/use-provider.ts), [src/lib/api/provider.ts](../../src/lib/api/provider.ts), [src/lib/routes/provider.ts](../../src/lib/routes/provider.ts), [src/lib/types/provider.ts](../../src/lib/types/provider.ts).

#### Sidebar con secciones + submenús (`a5a2a03`, `4c579ce`)

El sidebar organiza items en secciones con visibilidad por rol (consume `GET /menu/` con más granularidad). Los admins gestionan submenús desde `/dashboard/admin/menus` (`SubmenuFormDialog`).

#### Historial de inventario + back navigation (`3138a7e`)

Timeline completo de movimientos en `/dashboard/business/inventory/history` con estilos por tipo de acción; links "Volver" en historial y edición de catálogo; afinado de `phone-input`.

#### Exportación a PDF y Excel en cierres contables

Usuarios Pro descargan el cierre (diario/mensual) como PDF o Excel; el backend devuelve un `Blob` (axios `responseType: "blob"`). Botones deshabilitados con tooltip si `!isProPlan`. Archivos: [use-accounting-close.ts](../../src/hooks/use-accounting-close.ts) (`useExportToPdf`/`useExportToExcel`), [accounting-close.ts](../../src/lib/api/accounting-close.ts).

#### Config de notificaciones externas (`business-settings`)

Config por negocio de 4 alertas (cierre diario/mensual, stock bajo, agotado) por canal (`email`/`sms`/`whatsapp`); email en todos los planes, SMS/WhatsApp solo Pro con teléfono válido. GET para cargar, PATCH para persistir. Archivos: [business-settings.ts (api)](../../src/lib/api/business-settings.ts), [use-business-settings.ts](../../src/hooks/use-business-settings.ts), [notification-settings-card.tsx](../../src/components/business/notification-settings-card.tsx). Contrato en [docs/API.md](../API.md).

#### Fila de producto cliqueable (tablas de Productos)

Cada fila de las tablas Catálogo y Productos a la venta abre `ProductDetailsDialog` (modo controlado opcional); se elimina "Ver detalles" del menú de acciones y se hace `stopPropagation` en la celda de acciones. Archivos: [details-dialog.tsx](../../src/components/products/details-dialog.tsx), [table.tsx](../../src/components/products/table.tsx), [business-products-table-columns.tsx](../../src/components/products/business-products-table-columns.tsx).

#### Fila de venta cliqueable + cancelar simplificado

Cada fila de Ventas abre el "Resumen de venta" (`DetailsDialog` controlado); se elimina el dropdown y queda una única acción-icono fantasma (`XCircle`) con tooltip "Cancelar venta", oculta en ventas ya canceladas. Archivos: [details-dialog.tsx](../../src/components/sales/details-dialog.tsx), [table-of-sales.tsx](../../src/components/sales/table-of-sales.tsx), [sales-table-columns.tsx](../../src/components/sales/sales-table-columns.tsx).

#### Módulo de Tickets de Soporte (`c4b0801` → `da56ce3`)

Canal de soporte: el usuario crea tickets y conversa (chat); el admin gestiona, responde, cierra/reabre (`PATCH /:id/status`) y se asigna tickets (`PATCH /:id/assign`, auto-asignación por menor carga; solo el admin asignado responde). Notificaciones de soporte **por usuario** fusionadas en la campana y en `/dashboard/notifications` (pestaña "Soporte"). Archivos: [src/components/support-tickets/](../../src/components/support-tickets/), [use-support-ticket.ts](../../src/hooks/use-support-ticket.ts), [use-support-notification.ts](../../src/hooks/use-support-notification.ts). Contrato en [docs/funtion.md](../funtion.md).

#### Suite Multimoneda (`be2fec8` → `18b503a`)

Lleva la divisa a todo el flujo: ventas en cualquier moneda configurada, pagos parciales/mixtos con **tasa congelada**, factura PDF, compras de inventario y asignación de producto con costo en divisa (tasa **no editable**, `exchangeRateApplied`), tipo de venta + entrega y gastos con moneda. Usa `formatMoney` y `getAvailableCurrencies` (monedas derivadas de `MonetaryExchange`). ⚠️ **Bloqueadores backend:** conversión de pagos con base ≠ CUP invertida ([docs/bug-conversion-pagos-multimoneda.md](../bug-conversion-pagos-multimoneda.md)) y `currency` rechazado en `POST/PATCH /expenses`. Guía completa en [docs/guia-implementacion-multimoneda.md](../guia-implementacion-multimoneda.md).

#### Cancelación con devolución parcial y merma (`9b19004`, `c722f66`)

Por cada línea se indica cuántas unidades vuelven al stock; la diferencia se asienta como pérdida (`LOSS`). Payload `{ cancellationReason, items?: CancelSaleItemInput[] }` (sin `items` = cancelación total). Archivos: [sales.ts (types)](../../src/lib/types/sales.ts), [cancel-sale-dialog.tsx](../../src/components/sales/cancel-sale-dialog.tsx), [inventory-action-type-style.ts](../../src/components/inventory/inventory-action-type-style.ts).

#### Delivery / mensajería por negocio (`4e4e6bb`, `3b9e3e6`)

El carrito pide dirección y contacto cuando la venta es `delivery`; `Business` gana `acceptsMessaging` (config al crear/editar el negocio), y el switcher/carrito deshabilitan delivery si el negocio no lo ofrece. Cierra el bloqueador de delivery de la suite Multimoneda.

#### Módulo de Caja / cuentas en divisa — Fase 1 (`7221bee`)

Foto del saldo por moneda + consolidado en CUP: página `/dashboard/business/currency-accounts`, tabla de saldos, tarjeta consolidada, widget en el dashboard y diálogo de inicializar presupuestos. Archivos: [currency-account.ts (api)](../../src/lib/api/currency-account.ts), [use-currency-account.ts](../../src/hooks/use-currency-account.ts), [cash-flow.ts](../../src/lib/cash-flow.ts). 🔵 **Roadmap:** libro de movimientos, ajustes manuales y flujo por período ([docs/flujo-de-caja.md](../flujo-de-caja.md)).

#### Desactivación / reactivación de cuenta (`8b11178`, `829ad64`)

"Zona de peligro" en el perfil: baja con **15 días de gracia** (`{ deletionReason }`), redirección a `/cuenta-desactivada`. Doble barrera: cookie `user_deactivated` en `middleware.ts` + [ReactivationGuard](../../src/components/auth/reactivation-guard.tsx) revalidando `/auth/me` (`deactivatedAt`). ⚠️ Verificar en backend `deactivatedAt`, endpoint de reactivación y borrado al expirar.

#### Selección de plan self-service + trial Pro (`8311d4d`, `1b4a255`)

Registro = **trial de 15 días con alcance Pro**; al expirar, paywall `/seleccionar-plan` (`POST /plans/select`) con Básico/Pro; `/seleccionar-plan/reconciliar` archiva el exceso de negocios al bajar a Básico (`keepBusinessId`). [PlanGuard](../../src/components/auth/plan-guard.tsx) + [plan-session.ts](../../src/lib/plan-session.ts) + cookies (`user_plan_expired`/`user_needs_reconciliation`); `Business.status`/`archivedReason` separan activos vs archivados. ⚠️ **Bloqueador backend:** `POST /plans/select` transaccional, trial Pro automático, `status`/`archivedReason` en `my-businesses`, suspensión de workers/invitaciones y enforcement server-side ([docs/análisis-planes/backend-cambios.md](../análisis-planes/backend-cambios.md)).

---

## 6. Entidades de dominio

| Entidad | Propósito | Notas |
|---|---|---|
| **User** | Cuenta humana con email, contraseña, perfil | JWT corto, datos en sessionStorage |
| **Business** | Negocio que un user posee o donde colabora | Un user puede tener varios; uno activo a la vez |
| **Product** | Ítem del catálogo maestro | Reusable entre negocios |
| **BusinessProduct** | Mapeo Product↔Business con precio de entrada y de venta locales | El precio de venta es por negocio, no por producto global |
| **Sale** | Transacción de venta: fecha, ítems, total, **moneda + pagos multimoneda con tasa congelada**, tipo de venta (`in_store`/`delivery`/`pickup`) y datos de entrega, `paymentStatus`, cancelación parcial con merma (`LOSS`) | Carrito multi-ítem; factura PDF en ventas `paid` |
| **Expense** | Gasto del negocio: título, monto, **moneda**, descripción, `expenseCategoryId`, adjunto opcional | ⚠️ `expenseCategoryId` y `currency` dependen de fixes de backend |
| **InventoryMovement** | Entrada/salida de stock: tipo, cantidad (**decimal** para peso/volumen), unidad, **moneda + `exchangeRateApplied`**, motivo | Histórico completo; tipo `LOSS` para merma |
| **Provider** | Proveedor del negocio: nombre, contacto, teléfono, productos ofertados con precio | Auto-completa precio de entrada en compras |
| **Category** | Nomenclador propio del negocio (gastos y productos) | Categoría de producto vive en `BusinessProduct` ⚠️ (migración backend) |
| **SupportTicket** | Ticket de soporte con conversación, estado, admin asignado | Notificaciones por usuario |
| **Notification** | Aviso in-app (general por negocio ⚠️ + soporte por usuario ✅) | Campana + página, deep-link por `metadata` |
| **CurrencyAccount** | Saldo de caja por moneda + consolidado en CUP | Flujo de caja Fase 1 (visual) |
| **BusinessSettings** | Config de alertas multi-canal (email/SMS/WhatsApp) por negocio | SMS/WhatsApp solo Pro |
| **PriceHistoryEntry** | Audit trail de cambios de precio por producto | Almacena precio anterior y nuevo |
| **ExchangeRate** | Tipo de cambio manual por negocio (USD, EUR, CUP, MXN, CAD, GBP, CHF, JPY) | Editable desde la app |
| **AccountingClose** | Cierre diario o mensual: ventas, gastos, balance, valor de stock | Mensual solo en plan Pro |
| **Plan** | Catálogo de planes y sus características | Básico / Pro |
| **PlanAssignment** | Suscripción activa de un user a un plan | Histórico + plan vigente |
| **TeamWorker** | Miembro del equipo de un negocio con roles y permisos granulares | Asociado por menuId |
| **Invitation** | Invitación por email a colaborar en un negocio | Token expirable, marca de uso |

---

## 7. Autenticación y multi-tenancy

**Flujo de login.**
1. El usuario envía email/contraseña a `POST /auth/login` (o usa OAuth Google, ver nota abajo).
2. El backend devuelve un JWT.
3. El frontend guarda el token en `sessionStorage` (también copia a cookie).
4. El interceptor de [src/lib/axios.ts](../../src/lib/axios.ts) anexa `Authorization: Bearer <token>` a cada request.

**Tenancy.** [BusinessContext](../../src/context/business-context.tsx) carga las business del usuario al montar el dashboard, fija `activeBusinessId` (persistido en `sessionStorage`) y expone un switcher de negocios en la sidebar. Todos los hooks de dominio (`use-product`, `use-sales`, etc.) filtran por el negocio activo.

> **Nota.** OAuth con Google existe como rama remota `feature/auth-google` pero **no está en `main`**. En producción solo hay email/contraseña.

---

## 8. Gating de plan Pro

Tres piezas trabajan juntas:

- [src/lib/pro-gates.ts](../../src/lib/pro-gates.ts) — define `PRO_ROUTES` y `isProPlan()` (acepta variantes "pro", "profesional", "premium", "plus", insensible a tildes y mayúsculas).
- [src/hooks/use-user-role-plan.ts](../../src/hooks/use-user-role-plan.ts) — expone `isProPlan: boolean`.
- `<ProBadge>` — marca visualmente features Pro en sidebar y formularios.

**Rutas / features bloqueadas a Pro hoy:**
- `/dashboard/accounting-close/monthly`
- Tener más de 1 negocio (limitado en backend y reforzado en UI)
- Exportaciones a PDF/Excel en cierres contables
- Equipo / invitaciones (módulo workers)
- Comparador multi-producto en historial de precios
- Reporte consolidado de gastos ("Todos los negocios")
- Alertas de stock por SMS/WhatsApp (email disponible en todos los planes)

> **`RouteGuard` cliente (feature 41).** En build estático el `middleware.ts` no se ejecuta, así que el gateo por URL queda inerte. [RouteGuard](../../src/components/auth/route-guard.tsx) es la barrera real de cliente para rutas Pro/admin (el backend sigue siendo la autoridad con `403`).

Detalle: [docs/extra/pro-gating.md](../extra/pro-gating.md).

---

## 9. Despliegue

**Build local.**
```bash
npm install
npm run build         # genera /out
```

**Variable de entorno.**
```
NEXT_PUBLIC_BASE_PATH=/pmanage   # si se hospeda en subdirectorio; vacío si en raíz
```

**Hosting.** Subir el contenido de `/out` al `public_html` del cPanel (o subcarpeta). El archivo [public/.htaccess](../../public/.htaccess) gestiona:
- Rewrite SPA: cualquier 404 → `/index.html`.
- Rewrite de rutas dinámicas: `/products/{id}/edit` → `/products/__dynamic__/edit/index.html`.

> El workflow `.github/workflows/deploy-workflow.yml` automatiza el deploy a cPanel vía FTP.

---

## 10. Decisiones técnicas (ADRs comprimidos)

| Decisión | Razón |
|---|---|
| `output: "export"` (SPA estática) | Hosting económico, sin Node runtime, deploy simple |
| JWT en sessionStorage | Trade-off conocido (no httpOnly cookie); razones: simplicidad de integración con el backend actual. Riesgos auditados en [docs/extra/AUDIT.md](../extra/AUDIT.md) |
| Zustand **+** React Query | Zustand para estado de UI puramente client-side; RQ para caché del servidor |
| Multi-business como contexto del frontend | El backend filtra por business, pero el frontend mantiene el "activo" en sessionStorage para evitar reautenticar |
| `__dynamic__` placeholder en rutas | Permite rutas dinámicas en un export estático sin SSR |
| shadcn/ui + Tailwind 4 | Componentes copy-paste editables; sin lock-in de librería UI |

---

## 11. Deuda técnica

### Resuelta (ya en producción con v2.0.0)

- **`console.log` en producción** — eliminados; cero ocurrencias en `src/`.
- **Tipos duplicados** — las interfaces inline son props de componentes (estándar React); tipos de dominio están centralizados en `src/lib/types/`. No es deuda real.
- **JWT en sessionStorage** — trade-off intencional y documentado. Cookies sirven solo al middleware de Next.js; la sesión expira al cerrar la pestaña.
- **Query keys con riesgo de cache leak** — todos los hooks incluyen `businessId` en la key; la invalidación cruzada entre negocios está controlada.
- **Tests automatizados** — se añadió una base de **11 suites / 84 tests** de lógica pura (dinero, stock, gating, validaciones) que corre en `pnpm test` (Vitest) y en una UI admin. Ver [docs/testing.md](../testing.md).

### Pendiente

- **Subir la pirámide de tests**: faltan componentes/integración (Testing Library + MSW) y E2E (Playwright) sobre los caminos críticos. Ver [docs/testing.md](../testing.md) §5.
- Sin Prettier configurado.
- Query keys no centralizados en un archivo de constantes (el patrón es correcto, falta solo la centralización).

---

## 12. Documentos relacionados (archivo histórico)

Toda la documentación previa al SDD vive en [docs/extra/](../extra/):

- [PRODUCT_SUMMARY.md](../extra/PRODUCT_SUMMARY.md) — visión del producto y pricing original.
- [AUDIT.md](../extra/AUDIT.md) — auditoría de calidad del código.
- [CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md) — especificación del núcleo contable (planeado, no implementado).
- [build-output-config.md](../extra/build-output-config.md) — detalles del export estático y `.htaccess`.
- [pro-gating.md](../extra/pro-gating.md) — guía del sistema de gating.
- [cambios-planes.md](../extra/cambios-planes.md) — referencia de commits para la actualización de planes.
- [PERFORMANCE_LOG.md](../extra/PERFORMANCE_LOG.md) — métricas de build/runtime.
- [análisis-planes/](../extra/análisis-planes/) — análisis de variantes A/B y specs técnicas.
- [AGENTS.md](../extra/AGENTS.md) — nota mínima para agentes (leer docs de Next.js antes de codear).

---

## 13. Glosario

| Término | Significado |
|---|---|
| **BasicRoute** | Constante `BASIC_ROUTE` en [src/lib/routes/index.ts](../../src/lib/routes/index.ts); base URL del backend. |
| **BusinessProduct** | Relación N:M entre Product y Business; almacena precio de entrada y de venta por negocio. |
| **MenuId** | Identificador del módulo (suppliers, sales, products…) usado por el sistema de permisos para workers. |
| **Pro-gating** | Bloqueo de features para usuarios no-Pro mediante `PRO_ROUTES` + `isProPlan()`. |
| **Cierre contable** | Snapshot diario o mensual de ventas, gastos, stock y balance del negocio. |
| **`__dynamic__`** | Placeholder textual usado por Next.js export para rutas dinámicas; el `.htaccess` reescribe la URL real a este HTML pre-generado. |
| **Plan Básico / Pro** | Niveles de suscripción definidos en [src/lib/pro-gates.ts](../../src/lib/pro-gates.ts) y [src/hooks/use-user-role-plan.ts](../../src/hooks/use-user-role-plan.ts). |
| **Tenancy** | Cada Business es un tenant lógico; el frontend mantiene el "activo" en sessionStorage. |

---

## 14. Mantenimiento de este documento

Este SDD se actualiza **cuando una feature se promueve de `develop` a `main`**.

- El PR `develop → main` debe incluir el diff que mueve el bloque correspondiente desde [sdd-develop.md](./sdd-develop.md) hacia este archivo.
- La versión de `package.json` y el hash del último commit documentado se actualizan en la cabecera.
- Si un módulo, entidad o ADR cambia, edita la sección correspondiente en el mismo PR que introduce el cambio.

**No editar este archivo para describir features que aún no están en producción.** Para eso existe [sdd-develop.md](./sdd-develop.md).
