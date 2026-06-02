# SDD — pmanage (`main` / Producción)

> **Documento de especificación del sistema** que describe **pmanage tal como está hoy en producción**, lista para clientes reales.
> Para lo que viene en la siguiente versión, ver [sdd-develop.md](./sdd-develop.md).

| | |
|---|---|
| **Rama** | `main` |
| **Versión en `package.json`** | `1.0.0` |
| **Último commit documentado** | `ad85de6` — *refactor(price-history): remove previous stock display from PriceHistoryItem* |
| **Entorno** | Producción (clientes reales) |
| **URL backend** | `https://psearch.dveloxsoft.com/api/v2` |
| **Fecha del documento** | 2026-05-23 |

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

---

## 6. Entidades de dominio

| Entidad | Propósito | Notas |
|---|---|---|
| **User** | Cuenta humana con email, contraseña, perfil | JWT corto, datos en sessionStorage |
| **Business** | Negocio que un user posee o donde colabora | Un user puede tener varios; uno activo a la vez |
| **Product** | Ítem del catálogo maestro | Reusable entre negocios |
| **BusinessProduct** | Mapeo Product↔Business con precio de entrada y de venta locales | El precio de venta es por negocio, no por producto global |
| **Sale** | Transacción de venta: fecha, ítems, total, moneda, motivo de cancelación si aplica | Soporta carrito multi-ítem |
| **Expense** | Gasto del negocio: título, monto, descripción, adjunto opcional | En `main` aún no hay categorías |
| **InventoryMovement** | Entrada/salida de stock: tipo, cantidad, unidad, motivo | Histórico completo |
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
- Exportaciones (cuando se agreguen)
- Equipo / invitaciones (módulo workers)

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

### Resuelta (en `develop`, pendiente de promover a `main`)

- **`console.log` en producción** — eliminados; cero ocurrencias en `src/`.
- **Tipos duplicados** — las interfaces inline son props de componentes (estándar React); tipos de dominio están centralizados en `src/lib/types/`. No es deuda real.
- **JWT en sessionStorage** — trade-off intencional y documentado. Cookies sirven solo al middleware de Next.js; la sesión expira al cerrar la pestaña.
- **Query keys con riesgo de cache leak** — todos los hooks incluyen `businessId` en la key; la invalidación cruzada entre negocios está controlada.

### Pendiente

- Sin tests automatizados (ni unitarios ni e2e).
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
