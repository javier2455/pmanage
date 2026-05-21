# Performance & Mejoras — Registro de Cambios

Documento interno para registrar los cambios de rendimiento, UX y nuevas funcionalidades aplicados al proyecto **pmanage**. Cada entrada incluye contexto, archivos modificados y mejora esperada.

---

## Versión de referencia: 0.20.8-beta

---

## Punto 1.1 — Invalidación de cache con scope por negocio

**Fecha:** 2026-05-14

### ¿Por qué se hizo?

TanStack Query mantiene un cache de datos en el cliente. Cuando se crea o cancela una venta, el sistema necesita "invalidar" (marcar como desactualizados) los datos relacionados para que se refresquen desde el servidor.

El problema era que las invalidaciones no tenían **scope**: se invalidaban todas las entradas de una query key sin importar a qué negocio pertenecían. Por ejemplo, `["all-sales-by-business-id"]` sin un `businessId` en la clave hacía que React Query refrescara los datos de **todos los negocios** del usuario al mismo tiempo, aunque solo se hubiera tocado uno.

Con varios negocios en la cuenta, una sola venta disparaba hasta **7-8 peticiones simultáneas** al servidor de forma innecesaria.

### ¿Qué se cambió?

Todas las invalidaciones de cache en las mutations ahora incluyen el `businessId` como segundo segmento del `queryKey`, limitando el refetch exclusivamente al negocio que realizó la operación.

Adicionalmente:
- `useCancelSaleMutation` recibió un nuevo campo `businessId` en sus parámetros para poder aplicar el scope.
- `["sale-by-id"]` al cancelar ahora se invalida con el `saleId` específico en lugar de invalidar todas las ventas del cache.
- `useUpdateBusinessProductPriceMutation` recibió `businessId` y elimina la invalidación innecesaria de `["all-products"]` (catálogo global) al actualizar el precio de un producto en un negocio.
- `useDeleteProductInBusinessMutation` aplica scope con `variables.businessId` que ya tenía disponible.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| [src/hooks/use-sales.ts](src/hooks/use-sales.ts) | `useCreateSaleMutation` y `useCancelSaleMutation`: invalidaciones con `businessId` como scope. `useCancelSaleMutation` recibe `businessId` en sus parámetros. |
| [src/hooks/use-product.ts](src/hooks/use-product.ts) | `useUpdateBusinessProductPriceMutation` recibe `businessId`, invalida solo el negocio activo. `useDeleteProductInBusinessMutation` invalida solo el negocio del producto eliminado. |
| [src/components/sales/table-of-sales.tsx](src/components/sales/table-of-sales.tsx) | Agrega `useBusiness()` para obtener `activeBusinessId` y lo pasa al llamar `cancelSaleMutation.mutateAsync`. |
| [src/components/products/edit-product-form.tsx](src/components/products/edit-product-form.tsx) | Pasa `businessId: activeBusinessId` al llamar `updateBusinessProductPriceMutation.mutateAsync`. |

### ¿Qué mejora?

- **Antes:** crear o cancelar una venta disparaba 7-8 refetches globales que tocaban todos los negocios del usuario.
- **Después:** cada mutación dispara exactamente los refetches del negocio activo. Los datos de los demás negocios permanecen en cache intactos.
- Reducción estimada del **70-80% del tráfico de red** post-mutación en usuarios con múltiples negocios.
- Menor carga en el servidor backend y respuesta percibida más rápida tras registrar transacciones.

---

## Punto 1.2 — Dashboard bloqueante sin streaming

**Estado:** Pendiente de implementación.

### ¿Por qué se hará?

La página principal del dashboard ([src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)) está marcada como `"use client"` y llama a `useDashboardSummary()` de forma bloqueante. Esto significa que React no puede renderizar **nada** de la página hasta que la API responda con los datos (KPIs, últimas ventas, últimos gastos).

El resultado visible para el usuario es una pantalla en blanco desde que navega al dashboard hasta que llega la respuesta del servidor. Si la API tarda 800ms, el usuario ve 800ms de nada.

### ¿Qué se planea hacer?

- Migrar la página a Server Component con `<Suspense>` boundaries por sección.
- Cada `StatsCard` (ventas/gastos de hoy) tendrá su propio Suspense con un skeleton cargado de inmediato, sin esperar al resto.
- Los skeletons ya existen en el proyecto; solo falta conectarlos a los boundaries correctos.
- Evaluar `prefetchQuery` en el layout para que los datos críticos lleguen antes del primer paint.

---

## Punto 1.3 — Componentes gigantes sin memoización

**Fecha:** 2026-05-14

### ¿Por qué se hizo?

Dos componentes concentraban cientos o miles de líneas sin ninguna estrategia de memoización ni carga diferida:

**`map.tsx` (1844 líneas):** El mapa interactivo (maplibre-gl) se encontraba en un único archivo monolítico sin `React.memo`. Cada vez que el componente padre actualizaba cualquier estado (formulario, loading flag, etc.), React re-ejecutaba todo el árbol del mapa completo, incluyendo la inicialización costosa de `maplibre-gl`. Además, la librería `maplibre-gl` pesa ~400 KB comprimido y se incluía en el bundle principal, cargándose en **todas las páginas**, incluso en las que no tienen mapa.

**`business/details/page.tsx` (715 líneas):** La página de detalles del negocio tenía todo el formulario en un solo componente. Al editar cualquier campo de React Hook Form se re-renderizaba el árbol completo de 700+ líneas, incluyendo secciones que no cambiaban (cabecera, mapa, información secundaria).

### ¿Qué se cambió?

**`map.tsx`:**
- Al revisar el código, el archivo ya estaba bien estructurado internamente con sub-componentes (`Map`, `MapMarker`, `MarkerContent`, `MapControls`, etc.) y solo es importado por `location-map-impl.tsx`.
- `location-map-impl.tsx` se carga a través de `LocationMap` que ya usa `next/dynamic({ ssr: false })`, por lo que `maplibre-gl` ya estaba excluido del bundle principal. No requirió cambios.

**`business/details/page.tsx`:**
- Todo el estado del formulario (5 `useState`, `useForm`, 4 `watch()`, 3 `useEffect`, 4 handlers, 3 queries) vivía directamente en el componente de página.
- Cada keystroke en cualquier campo del formulario re-renderizaba la página completa, incluyendo el título, la cabecera y otros elementos estáticos que no cambian.
- Se extrajo toda esa lógica y el JSX de las tres secciones (datos del negocio, mapa, zona de peligro) al nuevo componente `BusinessDetailsForm`.
- La página quedó como una shell estática de 15 líneas que nunca vuelve a renderizarse mientras el usuario edita el formulario.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| [src/app/dashboard/business/details/page.tsx](src/app/dashboard/business/details/page.tsx) | Reducido de 715 líneas a 15. Ahora es una shell estática que renderiza el título y delega a `BusinessDetailsForm`. |
| [src/components/business/business-details-form.tsx](src/components/business/business-details-form.tsx) | Nuevo componente creado con toda la lógica del formulario, estado, queries y JSX de las tres secciones. |

### ¿Qué mejora?

- El título de la página y su shell exterior dejan de re-renderizarse en cada keystroke del formulario.
- React puede reconciliar de forma mucho más selectiva: solo re-renderiza el sub-árbol de `BusinessDetailsForm` cuando el estado del formulario cambia.
- El formulario está aislado como una unidad independiente, lo que lo hace más fácil de optimizar en el futuro (memoización de secciones individuales, lazy load de la sección del mapa, etc.).
- La página `page.tsx` pasó de 715 líneas a 15, eliminando complejidad innecesaria en la capa de routing.

---

## Punto 1.5 — staleTime global mal calibrado

**Estado:** Resuelto dentro del Punto 1.4.

### Nota

El punto 1.5 (calibrar el `staleTime` por dominio en lugar de usar un único valor global) fue implementado directamente dentro del Punto 1.4. Al reescribir `query-provider.tsx` con `setQueryDefaults`, se abordaron ambos problemas en la misma sesión de trabajo. Ver la entrada del Punto 1.4 para el detalle completo.

---

## Punto 1.6 — Imágenes sin optimizar (`next/image`)

**Fecha:** 2026-05-20

### ¿Por qué se hizo?

Varios componentes usaban el tag `<img>` nativo de HTML en lugar de `next/image`. Esto significaba que las imágenes de productos, historial de inventario y el carrito de ventas se descargaban siempre en su tamaño y formato original (JPEG/PNG), sin ninguna de las optimizaciones de Next.js:

- Sin conversión automática a **WebP/AVIF** (formatos hasta 40% más livianos).
- Sin **lazy loading** gestionado por el framework.
- Sin adaptación de resolución al tamaño real del contenedor (`sizes`).
- Sin el beneficio del CDN de imágenes de Next.js.

Adicionalmente, dos formularios (`edit-catalog-product-form`, `new-product-form`) ya usaban `next/image` pero con `unoptimized` forzado siempre, lo que desactivaba todas las optimizaciones incluso cuando la imagen venía del CDN.

### ¿Qué se cambió?

- Registrado el dominio del CDN (`bucket.dveloxsoft.com`) en `next.config.ts` bajo `images.remotePatterns`.
- Convertidos todos los `<img>` a `<Image>` de `next/image` con `fill` o dimensiones explícitas según el contexto.
- En `edit-catalog-product-form.tsx`: `unoptimized` cambiado a `unoptimized={!!imagePreview}` — solo se desactiva la optimización cuando el `src` es un blob local (preview de archivo subido); cuando muestra la imagen del CDN, aplican todas las optimizaciones.
- En `new-product-form.tsx`: sin cambios — el `src` siempre es un blob local, `unoptimized` es correcto.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| [next.config.ts](next.config.ts) | Añadido `images.remotePatterns` para `bucket.dveloxsoft.com`. |
| [src/components/products/product-image.tsx](src/components/products/product-image.tsx) | `<img>` → `<Image fill sizes="96px">`. |
| [src/components/inventory/inventory-history-item.tsx](src/components/inventory/inventory-history-item.tsx) | `<img>` → `<Image fill sizes="(max-width: 640px) 100vw, 160px">`. |
| [src/app/dashboard/business/sales/create/page.tsx](src/app/dashboard/business/sales/create/page.tsx) | `<img>` → `<Image width={40} height={40}>` en el carrito. |
| [src/components/auth/login-type-selection-modal.tsx](src/components/auth/login-type-selection-modal.tsx) | SVGs locales convertidos a `<Image width={160} height={160}>`. |
| [src/components/products/edit-catalog-product-form.tsx](src/components/products/edit-catalog-product-form.tsx) | `unoptimized` → `unoptimized={!!imagePreview}` + `sizes="256px"`. |

### ¿Qué mejora?

- Las imágenes de productos se sirven en WebP/AVIF en lugar de JPEG/PNG original, reduciendo el peso de cada imagen entre un 25% y un 40%.
- Next.js gestiona el lazy loading y solo descarga las imágenes visibles en el viewport.
- El atributo `sizes` le indica al browser exactamente qué resolución necesita para cada contenedor, evitando descargar imágenes más grandes de lo necesario.
- Las imágenes del CDN en formularios de edición ahora pasan por el optimizador de Next.js.

---

## Punto 1.4 — Cache persistente y staleTime por dominio

**Fecha:** 2026-05-14

### ¿Por qué se hizo?

El sistema tenía un único `staleTime` global de 5 minutos para todas las queries sin distinción. Esto causaba dos problemas opuestos:

- **Datos estáticos** como provincias, municipios o planes (que cambian 0 veces al día) se refetcheaban cada 5 minutos innecesariamente.
- **Datos transaccionales** como ventas, gastos o el dashboard (que cambian con cada operación) se quedaban en cache hasta 5 minutos, mostrando cifras desactualizadas al usuario.

Adicionalmente, la query de `businesses` en `BusinessProvider` usaba `axios` directamente con un token leído manualmente de `sessionStorage`, saltándose el interceptor centralizado de `apiClient`. Esto significaba que si el token expiraba durante una sesión, la petición de negocios fallaba silenciosamente sin intentar el refresh automático.

### ¿Qué se cambió?

**`query-provider.tsx`:**
- Se extrajo la creación del `QueryClient` a una función `makeQueryClient()` para mantener el código limpio.
- Se configuraron `setQueryDefaults` por dominio, reemplazando el `staleTime` global por tiempos calibrados según la frecuencia de cambio real de cada tipo de dato:

| Dominio | staleTime | gcTime |
|---|---|---|
| Catálogo (provincias, municipios, planes) | 24 horas | Infinity |
| Sesión (negocios, perfil, workers, invitaciones) | 30 minutos | 1 hora |
| Productos / tipo de cambio | 10 minutos | 30 minutos |
| Transaccional (ventas, gastos, inventario, dashboard, cierres) | 30 segundos | 5 minutos |

**`business-context.tsx`:**
- Reemplazado `axios.get(...)` con token manual por `apiClient.get(...)`, que pasa por el interceptor centralizado de `src/lib/axios.ts`.
- El interceptor maneja automáticamente el refresh del token y el header `Authorization`, eliminando código duplicado en el contexto.
- Ajustado el tipo de la función `retry` para evitar el cast de `any`.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| [src/components/providers/query-provider.tsx](src/components/providers/query-provider.tsx) | `setQueryDefaults` por dominio para 22 query keys. Extracción a `makeQueryClient()`. |
| [src/context/business-context.tsx](src/context/business-context.tsx) | Reemplazado axios crudo por `apiClient`. Import de `isAxiosError` como named import. |

### ¿Qué mejora?

- Provincias y municipios (usados en formularios de creación/edición) dejan de hacer fetch durante toda la sesión activa: **elimina ~2 requests por cada apertura de formulario**.
- El dashboard y las ventas reflejan el estado real en 30 segundos sin esperar 5 minutos.
- La query de negocios se beneficia del refresh automático de token si este expira, eliminando errores silenciosos que dejaban el sidebar vacío.
- El código del contexto es más limpio y sin lógica duplicada de autenticación.

---

## Punto 1.7 — Invalidación innecesaria en asignación de producto a negocio

**Fecha:** 2026-05-14

### ¿Por qué se hizo?

`useCreateProductInBusinessMutation` en [src/hooks/use-product.ts](src/hooks/use-product.ts) invalidaba dos query keys al completarse:

1. `["all-product-of-my-businesses", businessId]` — correcto, el inventario del negocio cambió.
2. `["all-products"]` — **incorrecto**.

La función `createInBusiness` en la API (`src/lib/api/product.ts`) solo envía `{ productId, price, entryPrice, stock }` al backend. Es una operación de asignación: vincula un producto existente del catálogo a un negocio específico. El catálogo global de productos (`["all-products"]`) no cambia en absoluto con esta operación.

Invalidar `["all-products"]` causaba que el catálogo completo se recargara del servidor cada vez que un usuario asignaba un producto a su negocio, sin ningún motivo real.

### ¿Qué se cambió?

Eliminada la línea `queryClient.invalidateQueries({ queryKey: ["all-products"] })` de `useCreateProductInBusinessMutation`.

### Archivo modificado

| Archivo | Cambio |
|---|---|
| [src/hooks/use-product.ts](src/hooks/use-product.ts) | Eliminada invalidación innecesaria de `["all-products"]` en `useCreateProductInBusinessMutation`. |

### ¿Qué mejora?

- Asignar un producto a un negocio dejó de disparar una recarga del catálogo completo.
- La operación ahora solo invalida el cache del negocio afectado, que es lo único que realmente cambió.

---

---

## Punto 1.8 — Auth en sessionStorage + refresh sin deduplicación

**Estado:** Pendiente — requiere coordinación con backend.

### ¿Qué hay que hacer?

El token de acceso se guarda en `sessionStorage`, que es accesible desde cualquier script en la página (vulnerable a XSS). La solución ideal es migrar a `httpOnly cookies`, que el browser gestiona automáticamente y JavaScript no puede leer. También existe un riesgo de race condition si múltiples requests 401 disparan el refresh simultáneamente (aunque el interceptor en `axios.ts` ya tiene lógica de cola, merece revisión bajo carga).

**Requiere:** Que el backend devuelva el token en una cookie `httpOnly` al hacer login/refresh en lugar de en el body del response. Coordinar con el equipo de backend antes de implementar.

---

## Punto 1.9 — Paginación server-side consistente y virtualización

**Estado:** Pendiente.

### ¿Qué hay que hacer?

Algunas tablas de la app (historial de inventario, ventas, cierre contable) pueden crecer indefinidamente. Con paginación solo del lado cliente, el backend sigue enviando todos los registros aunque el usuario solo vea 10. Hay que:
- Asegurar que todos los endpoints aceptan `page` y `limit` y el frontend los usa correctamente.
- Para tablas con más de 200 filas, implementar virtualización con `@tanstack/react-virtual`.
- Persistir el estado de paginación y filtros en la URL con `useSearchParams` para que recargar la página no salte a página 1.

---

## Punto 1.10 — Bundle size: dependencias pesadas

**Estado:** Pendiente.

### ¿Qué hay que hacer?

Instalar `@next/bundle-analyzer`, correr `npm run analyze` y medir el First Load JS actual como baseline. Luego:
- Verificar que los imports de `date-fns`, `lucide-react` y `recharts` son puntuales (no barrel imports).
- Agregar `experimental.optimizePackageImports` en `next.config.ts` para las librerías que lo soporten.
- Medir el before/after con Lighthouse.

---

## Punto 1.11 — Server Actions para operaciones de escritura

**Estado:** Pendiente — evaluar con backend.

### ¿Qué hay que hacer?

Las mutaciones (crear venta, gasto, producto) actualmente van de cliente → API externa. Se podría interponer un Route Handler de Next.js como proxy con cache HTTP (`Cache-Control: s-maxage`) para lecturas frecuentes. Para escrituras, Server Actions eliminarían el JS del cliente asociado a los calls de axios. Requiere evaluar si el backend soporta headers de cache y si la latencia del proxy adicional compensa.

---

*Este archivo se actualiza al finalizar cada punto de mejora.*
