# Auditoría del Proyecto — pmanage (GeosGS) v0.16.2-beta

> Fecha: 2026-04-14 | Complementa al ROADMAP.md con hallazgos técnicos específicos

---

## 1. Limpieza de Código

### 1.1 console.log en producción (12 instancias)
| Archivo | Línea | Contenido |
|---------|-------|-----------|
| `src/lib/api/product.ts` | 21 | `console.log('response of create product', data)` |
| `src/lib/api/inventory.ts` | 11 | `console.log('credentials of create', credentials)` |
| `src/components/exchange-rate/exchange-rate-form.tsx` | 59, 69 | Debug logs en submit |
| `src/components/inventory/update-stock-form.tsx` | 92 | Error log en onSubmit |
| `src/app/dashboard/exchange-rate/page.tsx` | 15 | `console.log('data', data)` |
| `src/app/dashboard/profile/page.tsx` | 42 | `console.log('user data', user)` |
| `src/app/dashboard/business/sales/page.tsx` | 15 | `console.log(data)` |

### 1.2 Tipos duplicados
- `src/lib/api/auth.ts` redefine `Plan` y `Role` — ya existen en `src/lib/types/user.ts`
- `ProductUnit` tiene trailing space: `"mL "` en `src/lib/types/product.ts:3`
- `BusinessWithProducts.price` es `string` pero `BusinessProduct.price` es `number` — inconsistencia en `src/lib/types/business.ts`

### 1.3 Código muerto
- Imports comentados en `src/components/products/new-product-form.tsx`
- Código comentado en `src/app/(auth)/login/page.tsx:164-166`

---

## 2. Arquitectura

### 2.1 Query Keys dispersas
Las query keys son strings sueltos en 12+ archivos de hooks. Problemas:
- `["all-sales-by-business-id"]` se invalida sin businessId, purgando data de todos los negocios
- `["all-product-of-my-businesses"]` se invalida 7 veces en diferentes hooks sin contexto

**Acción**: Crear `src/lib/query-keys.ts` con factory centralizado.

### 2.2 Manejo de errores API inconsistente
- `deleteProduct`, `deleteBusiness` retornan `{ success, error }` custom
- `create`, `getAllSalesByBusinessId` hacen throw directamente
- No hay esquema de error centralizado

**Acción**: Estandarizar que todas las funciones API hagan throw. Manejar en hooks/componentes.

### 2.3 Auth state disperso
- Tokens en `sessionStorage` (axios interceptor) + cookies (middleware) + `localStorage` (register page)
- `src/context/business-context.tsx:47` usa axios directo en vez de `apiClient` con interceptores
- `src/app/(auth)/register/page.tsx:43` usa `localStorage`, el resto usa `sessionStorage`

**Acción**: Consolidar en un solo patrón de almacenamiento.

### 2.4 God components
- `src/app/dashboard/business/details/page.tsx` — 500+ líneas (edit + display + delete en uno)

**Acción**: Dividir en `BusinessDetailsView`, `BusinessEditForm`, `BusinessDeleteDialog`.

---

## 3. UI/UX — Hallazgos Específicos

### 3.1 Estados de error sin estilo
Estas páginas muestran `<div>Error al cargar...</div>` en texto plano, sin icono, sin retry:
- `src/app/dashboard/business/products/page.tsx`
- `src/app/dashboard/business/sales/page.tsx`
- `src/app/dashboard/exchange-rate/page.tsx`

Solo `src/app/dashboard/error.tsx` tiene un error state correcto con `AlertCircle` y botón retry.

**Acción**: Crear `<ErrorState message onRetry />` reutilizable usando los componentes `Empty` existentes.

### 3.2 Estado de carga inconsistente
- Exchange rate: `<div>Cargando...</div>` en texto plano
- Otras páginas: `SimpleTableSkeleton`

### 3.3 Empty states faltantes en tablas
Tablas que muestran headers vacíos con 0 filas (sin mensaje):
- Dashboard: ventas recientes, actividad reciente
- Accounting daily: tabla de productos vendidos
- Inventario

Los componentes `Empty`, `EmptyHeader`, `EmptyTitle` ya existen en `src/components/ui/empty`.

### 3.4 Breadcrumbs
No existe navegación jerárquica en ninguna página. Solo botones "volver" en create/edit.

### 3.5 Command Palette
`cmdk` v1.1.1 está instalado como dependencia pero no se usa en ningún lugar.

### 3.6 Paginación
Todas las tablas fijas a 5 items, sin selector. `DataTablePaginationNav` existe pero no permite cambiar el tamaño de página.

---

## 4. Accesibilidad

### aria-labels faltantes (25+ instancias)
- Botones de volver (`ArrowLeft`) en create/edit pages
- Botones de eliminar/editar en tablas
- Botón eliminar item del carrito de ventas
- Toggle de tema (Sun/Moon) en sidebar
- Botones de paginación en tablas
- Combobox triggers

### Otros
- Inputs numéricos sin `inputmode="numeric"`
- `opacity-50` en botones disabled puede fallar WCAG AA contraste
- Sin link `skip-to-main-content`

---

## 5. Seguridad

| Hallazgo | Archivo | Riesgo |
|----------|---------|--------|
| Tokens en sessionStorage (XSS) | `src/lib/axios.ts:35,79` | Alto |
| WhatsApp hardcodeado | `src/app/plans/page.tsx:53` | Bajo |
| API URL fallback a prod | `src/lib/axios.ts:6` | Medio |
| JSON.parse sin validación | `src/hooks/use-user-role-plan.ts:12,28` | Medio |
| Sin CSRF | Global | Medio |

---

## 6. Performance

| Hallazgo | Archivo | Impacto |
|----------|---------|---------|
| Array estático recreado en cada render | `src/app/plans/page.tsx:17-50` | Bajo |
| Pathname check en cada render | `src/context/business-context.tsx:99` | Bajo |
| Sin React.memo en filas de tabla | Global | Medio |
| Sin dynamic imports / code splitting | Global | Medio |
| QueryClient sin staleTime/gcTime | `src/components/providers/query-provider.tsx` | Medio |

---

## 7. Developer Experience

### 7.1 Sin testing
- Zero tests, zero cobertura
- Sin framework configurado (ROADMAP menciona Vitest)

### 7.2 Sin Prettier
Solo ESLint. Sin formateador automático.

### 7.3 CI/CD débil
`deploy.yml` solo hace build + deploy. No corre lint, tests, ni type-check.

### 7.4 Archivos faltantes
- Sin `.env.example` (solo `NEXT_PUBLIC_API_URL` existe como env var)
- README.md es boilerplate genérico de Next.js

### 7.5 Scripts faltantes en package.json
```
Actuales:  dev, build, start, lint
Faltan:    lint:fix, type-check, test, format
```

### 7.6 Dependencias desactualizadas
| Paquete | Actual | Última | Cambio |
|---------|--------|--------|--------|
| `lucide-react` | 0.562.0 | 1.8.0 | MAJOR |
| `@tanstack/react-query` | 5.90.20 | 5.99.0 | 9 minor |
| `axios` | 1.13.2 | 1.15.0 | 2 minor |
| `@base-ui/react` | 1.2.0 | 1.4.0 | 2 minor |
| `tailwindcss` | 4.1.18 | 4.2.2 | patch |

---

## 8. Resumen de Rutas del Proyecto (32 páginas)

### Auth
- `/login` — Login con email/password y Google OAuth
- `/register` — Registro con verificación email
- `/verify` — Código de 6 dígitos

### Dashboard
- `/dashboard` — Stats, ventas recientes, actividad
- `/dashboard/exchange-rate` — Tasas de cambio
- `/dashboard/profile` — Perfil con plan
- `/dashboard/profile/edit` — Editar avatar, nombre, teléfono
- `/dashboard/profile/plans-change` — Cambiar plan
- `/dashboard/profile/plans-history` — Historial de planes
- `/dashboard/admin/assign-plans` — Admin: asignar planes
- `/dashboard/admin/assign-plans/create` — Admin: crear asignación

### Business
- `/dashboard/business/details` — Detalles del negocio
- `/dashboard/business/create` — Crear negocio
- `/dashboard/business/products` — Listado de productos
- `/dashboard/business/products/create` — Crear producto
- `/dashboard/business/products/[id]/edit` — Editar producto
- `/dashboard/business/products/asign-to-business` — Asignar producto
- `/dashboard/business/sales` — Listado de ventas
- `/dashboard/business/sales/create` — Crear venta (carrito)
- `/dashboard/business/inventory` — Inventario
- `/dashboard/business/inventory/create` — Entrada de inventario

### Accounting
- `/dashboard/accounting-close/daily` — Cierre diario
- `/dashboard/accounting-close/monthly` — Cierre mensual (Pro)

### Public
- `/plans` — Precios y planes

---

## Orden de Prioridad para Ejecución

### Inmediato (Sprint 1)
1. Eliminar 12 console.log
2. Corregir tipos duplicados y trailing space `"mL "`
3. Crear `.env.example`
4. Agregar scripts `type-check` y `lint:fix`

### Corto plazo (Sprint 2-3)
1. Crear componente `<ErrorState />` y aplicar a todas las páginas
2. Estandarizar loading states
3. Agregar empty states a tablas
4. Crear `src/lib/query-keys.ts`
5. Agregar aria-labels faltantes

### Mediano plazo (Sprint 4-5)
1. Implementar breadcrumbs
2. Implementar command palette (cmdk)
3. Selector de items por página en tablas
4. Configurar Prettier
5. Agregar quality gates al CI/CD

### Largo plazo
1. Configurar Vitest + tests
2. Actualizar dependencias (lucide-react MAJOR)
3. Code splitting con dynamic imports
4. Consolidar auth state management
