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

*Este archivo se actualiza al finalizar cada punto de mejora.*
