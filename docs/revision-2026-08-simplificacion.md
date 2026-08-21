# Revisión de simplificación sección por sección — 2026-08

> **Inicio:** 2026-08-20 · **Versión base:** `2.3.11` (rama `main`)
> Revisión funcionalidad por funcionalidad buscando redundancia, código muerto,
> lógica simplificable e inconsistencias de patrón entre secciones.
> Criterio de juicio: las cinco reglas de [CLAUDE.md](../CLAUDE.md).
>
> Complementa a [revision-integral-2026-07.md](revision-integral-2026-07.md), que
> revisó arquitectura y huecos funcionales, no redundancia línea a línea.

## Método

Por cada sección: leer las 5 capas del dominio (`types` → `routes` → `api` →
`validations` → `hooks` → `components`), pasar las comprobaciones mecánicas
(módulos sin importador, props sin lectura, helpers repetidos), reportar hallazgos
numerados, aplicar **solo** los aprobados y verificar con
`pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm test` + `pnpm build`.

**Qué cuenta como hallazgo:** módulo/tipo/prop sin consumidor · misma lógica en 3+
archivos · estado o efecto derivable · capa que solo reenvía · dos secciones
resolviendo lo mismo de forma distinta · bugs reales (se reportan aparte).

**Qué no se toca:** duplicación de solo 2 copias que exigiría inventar una
abstracción · estilo y formato · componentes parecidos con contenido distinto ·
comentarios existentes · mejoras no pedidas.

## Balance acumulado

> Se actualiza al cerrar cada sección. Medida única y comprobable:
> `git diff 9d687ce --stat -- src`, donde `9d687ce` es el último commit anterior a esta
> revisión (v2.3.11). Excluye documentación y `package.json`.

### Líneas — 16 secciones cerradas

| | Archivos | Añadidas | Eliminadas | Neto |
|---|---:|---:|---:|---:|
| **Total en `src/`** | **132** | **+942** | **−3585** | **−2643 líneas** |

Desglose por sección (neto):

| Sección | Neto |
|---|---:|
| 1 · Panel Principal | −109 |
| 2 · Negocio → Detalles | −90 |
| 3 · Categorías | −123 |
| 4 · Productos | −212 |
| 5 · Inventario | −59 |
| 6 · Ventas | −70 |
| 7 · Gastos | −164 |
| 8 · Proveedores | −116 |
| 9 · Trabajadores e invitaciones | −248 |
| 10 · Caja y tasas de cambio | −39 |
| 11 · Cierres contables | −82 |
| 12 · Analíticas (sección retirada) | −1164 |
| 13 · Notificaciones | −25 |
| 14 · Perfil y planes | −34 |
| 15 · Soporte | −120 |
| 16 · Admin | −200 |
| Debounce unificado (adelanta trabajo de §4, §8 y §16) | −18 |
| `lib/types/business.ts` (compartido §1–§2) | −3 |

### Archivos eliminados (20)

| Archivo | Líneas | Motivo |
|---|---:|---|
| `components/dashboard/recent-activity-table.tsx` | 73 | Sin ningún importador |
| `components/products/products-table-skeleton.tsx` | 66 | Sin importadores; lo sustituyó `SimpleTableSkeleton` |
| `app/dashboard/business/expenses/[expenseId]/edit/expense-edit-client.tsx` | 89 | Sin importadores: su `page.tsx` hermano solo hace `redirect()` |
| `app/dashboard/business/workers/[workerId]/edit/worker-edit-client.tsx` | 55 | Mismo caso |
| `lib/validations/business-settings.ts` | 22 | Sin importadores |
| `lib/validations/expense-category.ts` | 24 | Fusionado en `validations/category.ts` |
| `lib/validations/product-category.ts` | 24 | Sin importadores; fusionado en `validations/category.ts` |
| `app/dashboard/analytics/_page-disabled.tsx` | 251 | Versión anterior de la página, desactivada con un `_` delante |
| `components/analytics/sales-trend-chart.tsx` + `-filter.tsx` | 221 | Solo los usaba la página desactivada |
| `components/analytics/top-products-chart.tsx` + `-filter.tsx` | 234 | Ídem |
| `components/analytics/kpi-card.tsx` + `kpis-grid.tsx` | 222 | Ídem |
| `components/analytics/period-filter.tsx` | 46 | Ídem |
| `hooks/use-analytics.ts` | 61 | Tres de sus cuatro hooks solo los usaba la página desactivada; el cuarto se movió a `use-workers` |
| `hooks/use-menu.ts` | 28 | Cadena del menú *runtime*: el sidebar migró a `GET /section` y nadie volvió a llamarla |
| `lib/api/menu.ts` | 21 | Ídem |
| `lib/types/menu.ts` | 35 | Ídem |
| `lib/routes/menu.ts` | 5 | Ídem |

### Archivos creados (7)

| Archivo | Líneas | Sustituye a |
|---|---:|---|
| `lib/dates.ts` | 92 | `formatRelativeTime` ×5 y `formatDate` local ×17 |
| `components/data-table/column-meta.ts` | 20 | `function columnMeta` ×17 y `type XColumnMeta` ×16 |
| `components/data-table/table-loading-overlay.tsx` | 27 | El overlay "Cargando…" ×16 |
| `lib/validations/category.ts` | 25 | Los dos esquemas de categoría espejo |
| `hooks/use-debounced-value.ts` | 19 | El debounce de búsqueda ×5 |
| `components/business-providers/detail-row.tsx` | 25 | El markup de fila etiqueta/valor, repetido 6 veces en el diálogo |
| `components/accounting-close/closing-page-skeleton.tsx` | 15 | El esqueleto de carga, idéntico en las páginas de cierre diario y mensual |

A los que se suman, dentro de archivos ya existentes: `toastApiError` en `lib/toast.ts`,
`PRODUCT_UNITS` en `lib/types/product.ts`, `BUSINESS_TYPE_LABELS` y `DEFAULT_MAP_LAT/LNG`
en `lib/types/business.ts`, y `DASH` + `getInitials` en `lib/utils.ts`.

### Bugs corregidos (12)

Ninguno era el objetivo de la revisión; todos salieron al leer el código.

| # | Qué pasaba | Sección |
|---|---|---|
| 1 | **Los precios de productos se mostraban en pesos colombianos** (`currency: "COP"`, locale es-CO) en la tabla del negocio, las tarjetas del catálogo y el historial de precios. El historial además redondeaba a entero: 1234,50 CUP se leía como `$ 1.235` | §4 |
| 2 | Los importes del inventario (capas de coste y rentabilidad por lote) usaban separadores es-ES: `"1234,50 CUP"` frente al `"1,234.50 CUP"` del resto de la app | §5 |
| 3 | **Eliminar un negocio con la red caída cerraba el diálogo en silencio**: sin toast ni aviso, el negocio parecía borrado | §2 |
| 4 | El mismo `catch` ciego en 11 formularios más — productos (4), stock, gastos (2), proveedores, trabajadores (crear/editar) y tasas de cambio | §4, §5, §7, §8, §9, §10 |
| 5 | **Seis toasts de error pintados de verde**: usaban los estilos de éxito (`fill:""` + título blanco) al fallar el borrado de una categoría, un producto, un gasto, un trabajador, una invitación, o la cancelación de una venta | §3, §4, §6, §7, §9 |
| 6 | En el formulario de categorías, un error sin `message` solo escribía el texto al pie: invisible si el diálogo estaba scrolleado | §3 |
| 7 | La lista de categorías de **gastos** se habría quedado en "0 categorías" si el backend omite los campos de paginación; la de productos ya lo cubría | §3 |
| 8 | Los toasts de horario y de notificaciones salían sin los estilos del sistema, con un aspecto distinto al resto | §2 |
| 9 | `product-grid-card` definía un `formatMoney` propio que **sombreaba al helper global del mismo nombre haciendo algo distinto** | §6 |
| 10 | `SUCCESS_TOAST_STYLES` **redefinido** en 3 componentes pese a estar exportado en `lib/toast.ts` | §3, §7, §9 |
| 11 | Las fichas de proveedor mostraban `"--"` (dos guiones) donde el resto del sistema usa `"—"` | §8 |
| 12 | Las iniciales de avatar se calculaban con `.split(" ")`, que produce iniciales vacías con nombres que llevan doble espacio | §9 |

### Cambios visibles para el usuario

Lo que cambia en pantalla respecto a antes de la revisión. Todo lo demás
(código muerto, catálogos unificados, `columnMeta`, overlay, debounce…) es invisible.

| Qué | Antes | Ahora | Dónde |
|---|---|---|---|
| Precios de producto | `$ 1.234,50` | `1,234.50 CUP` | Tabla de productos del negocio, tarjetas del catálogo, historial de precios |
| Precio en el historial | `$ 1.235` (redondeado) | `1,234.50 CUP` | Historial de precios |
| Importes de inventario | `1234,50 CUP` | `1,234.50 CUP` | Capas de coste, rentabilidad por lote |
| Fecha corta | `05 ago 2026` / `05 de ago de 2026` / `5 ago 2026` | `05/08/26` | Capas de coste, rentabilidad por lote, fecha de trabajadores, fecha de gastos del cierre diario, historial de planes |
| Fecha larga del perfil | `5 de agosto de 2026` | `05 de agosto de 2026` | Página de perfil (día con cero delante) |
| Toasts de error | Fondo verde (estilos de éxito) | Rojo | 6 sitios de borrado y cancelación |
| Toasts sin estilo | Aspecto por defecto de sileo | Estilo del sistema | Horario, notificaciones, "Revisa el formulario" de varios formularios |
| Toasts del panel de administración | Estilo propio (`text-foreground` / `text-muted-foreground`) | Estilo del sistema | Crear plan, editar plan, asignar/extender/remover plan |
| Fallos de red | Sin ningún aviso | Toast de error | 11 formularios y el borrado de negocio |
| Guiones de "sin dato" | `--` | `—` | Fichas de proveedor |
| Filas del modal de proveedor | Sin separación | `gap-4` entre etiqueta y valor | Diálogo de detalle de proveedor |

Verificado carácter por carácter que **no** cambian: `formatDateTimeShort`,
`formatDateTimeLong` y `formatRelativeTime` respecto a las funciones locales que
sustituyeron.

### Duplicación: antes y ahora

| Patrón duplicado | Copias al empezar | Restantes |
|---|---:|---:|
| Llamada a `sileo` con estilos copiados inline | 38 archivos | 3 |
| `function columnMeta` | 17 | 1 |
| Overlay "Cargando…" | 16 | 2 |
| `function formatDate` local | 17 | 2 |
| Bloque `isAxiosError` de dos ramas | 43 | 29 |
| `Array.isArray(...message).join()` a mano | 6 | 0 ✅ |
| `downloadBlob` local pese a existir en `lib/download.ts` | 2 | 0 ✅ |
| `SUCCESS_TOAST_STYLES` redefinido | 8 | 0 ✅ |
| `getInitials` / `productInitials` | 5 | 0 ✅ |
| `formatRelativeTime` | 5 | 0 ✅ |
| Catálogo de unidades de producto | 7 | 0 ✅ |
| Catálogo de tipos de negocio | 3 | 0 ✅ |
| Debounce de búsqueda | 5 | 0 ✅ |

### Verificación

Cada sección se cierra con `pnpm exec tsc --noEmit` sin errores, `pnpm lint` con 0 errores
(quedan 2 warnings **preexistentes**, anotados para §17), `pnpm test` con 231/231 pasando y
`pnpm build` correcto.

---

## Estado por sección

| # | Sección | Estado |
|---|---|---|
| 1 | Panel Principal | ✅ Cerrada (2026-08-20) |
| 2 | Negocio → Detalles | ✅ Cerrada (2026-08-20) |
| 3 | Categorías | ✅ Cerrada (2026-08-20) |
| 4 | Productos | ✅ Cerrada (2026-08-20) |
| 5 | Inventario | ✅ Cerrada (2026-08-20) |
| 6 | Ventas | ✅ Cerrada (2026-08-20) |
| 7 | Gastos | ✅ Cerrada (2026-08-20) |
| 8 | Proveedores | ✅ Cerrada (2026-08-20) |
| 9 | Trabajadores e invitaciones | ✅ Cerrada (2026-08-20) |
| 10 | Caja y tasas de cambio | ✅ Cerrada (2026-08-20) |
| 11 | Cierres contables | ✅ Cerrada (2026-08-20) |
| 12 | Analíticas | ✅ Cerrada — sección retirada (2026-08-20) |
| 13 | Notificaciones | ✅ Cerrada (2026-08-20) |
| 14 | Perfil y planes | ✅ Cerrada (2026-08-20) |
| 15 | Soporte | ✅ Cerrada (2026-08-21) |
| 16 | Admin | ✅ Cerrada (2026-08-21) |
| 17 | Transversales (sidebar, auth, axios, tour, ui) | Pendiente |

---

## Sección 1 — Panel Principal ✅

Superficie revisada: `src/app/dashboard/page.tsx`, los 5 componentes de
`src/components/dashboard/`, `src/components/currency-account/cash-balance-widget.tsx`,
`src/hooks/use-business.ts` y `src/lib/types/business.ts`.

### Hallazgos aplicados

| id | Hallazgo | Acción | Resultado |
|---|---|---|---|
| P1 | `components/dashboard/recent-activity-table.tsx` (74 líneas) sin ningún importador en todo `src/`. | Archivo eliminado. | −74 líneas |
| P2 | Al caer P1, `DashboardSummaryActivity` y el campo `recentActivity` de `DashboardSummaryResponse` quedaron sin lectores. El backend los sigue enviando; quitarlos del tipo no altera la respuesta. | Tipo y campo eliminados de `lib/types/business.ts`. | −17 líneas |
| P3 | `formatRelativeTime` (`formatDistanceToNow` + `locale: es` + `catch → ""`) estaba copiado **5 veces**: las dos tablas de recientes, `recent-activity-table`, y en línea dentro de `notification-item.tsx` y `support-notification-item.tsx`. | Helper único en `src/lib/dates.ts`; los 4 consumidores vivos lo importan. En los dos items de notificación el bloque `let` + `try/catch` pasó a un `const` de una línea. | −34 / +17 líneas |

Saldo: **−108 líneas netas**, 2 archivos menos (`recent-activity-table.tsx`), 1 nuevo
(`lib/dates.ts`, 17 líneas).

### Revisado y descartado (no reabrir)

- **`recent-sales-table` vs `recent-expenses-table`**: comparten el esqueleto Card +
  enlace "ver todas" + skeleton + estado vacío, pero difieren en columnas, formato de
  importe y estado de cancelación. Un shell común pediría ~6 props de configuración
  para ahorrar ~20 líneas: es la abstracción que CLAUDE.md §2 desaconseja.
- **`isPending || !businessId`** en `page.tsx:21` y `cash-balance-widget.tsx:25`: solo
  2 copias y cada una lleva su comentario explicando la ventana de carga que cubre
  (query deshabilitada reporta `isLoading === false`). Se deja como está.
- **Selectores del tour**: los 4 `data-tour="dashboard-*"` están referenciados desde
  `lib/tour/tours/sections.ts` y `full.ts`. Ninguno roto ni huérfano.
- **Bugs**: ninguno encontrado en esta sección.

### Anotado para secciones futuras

| Para | Nota |
|---|---|
| §4 Productos | `components/products/products-table-skeleton.tsx` no tiene importador. |
| §16 Admin | `hooks/use-menu.ts` (28 líneas) no tiene importador. |
| §17 Transversales | `lib/axios.ts:4` importa `BASIC_ROUTE` y no lo usa (warning de lint preexistente). Su único importador es ese, así que `lib/routes/index.ts` es huérfano de facto. Mismo caso: `authRoutes` sin usar en `app/(auth)/login/page.tsx:24`. |

### Verificación

`pnpm exec tsc --noEmit` sin errores · `pnpm lint` 0 errores (2 warnings preexistentes,
los de la tabla anterior) · `pnpm test` 231 tests en 7 archivos, todos pasan ·
`pnpm build` correcto.

---

## Sección 2 — Negocio → Detalles ✅

Superficie revisada: `app/dashboard/business/details/page.tsx`,
`app/dashboard/business/create/page.tsx` (641 líneas), los 9 componentes de
`components/business/`, `context/business-context.tsx`, `hooks/use-business-settings.ts`,
`hooks/use-business-schedule.ts`, `lib/api/business.ts` y `lib/validations/business.ts`.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| N1 | `addToCartSchema` + `AddToCartFormData` en `lib/validations/business.ts` sin ningún consumidor. | Eliminados. |
| N2 | `deleteBusiness` comprobaba `status >= 200 && < 300` y devolvía `{success:false}` en el else: axios ya lanza fuera de 2xx, así que esa rama era inalcanzable y nadie leía el retorno. | Reducido a un `await apiClient.delete(...)` con comentario del porqué. |
| N3 | `location-map.tsx`: `MapSkeleton` aceptaba `className` que `dynamic({loading})` nunca pasa; la interfaz existía solo para esa prop. | Prop, interfaz e import de `cn` eliminados. |
| N4 | El objeto de 10 `defaultValues` estaba escrito dos veces idéntico en `business-details-form` (el `useForm` y el `reset()` de "Editar"). Añadir un campo en uno solo dejaba al otro cargando datos viejos. | Extraído a `formValuesFrom(business)` en el mismo archivo. |
| N5 | El catálogo de tipos de negocio vivía en 3 formas: `businessTypes` (array, create), `businessTypeLabels` (record, details-form) y tres `<SelectItem>` literales en ese mismo details-form. | `BUSINESS_TYPE_LABELS` en `lib/types/business.ts`; ambos selects se renderizan desde él. |
| N6 | `HAVANA_LAT/LNG` duplicadas en create y details-form. | `DEFAULT_MAP_LAT/LNG` en `lib/types/business.ts`. |
| N8 | `notification-settings-card`: `const categories = CATEGORIES` era un alias sin propósito y `activeKeys` se recalculaba en cada render siendo constante. | Alias eliminado; `ACTIVE_KEYS` pasa a constante de módulo. |
| N9 | 6 archivos de la sección llamaban a `sileo` directo con los estilos copiados inline (11 bloques). `business-schedule-card` y `notification-settings-card` además lo hacían **sin** estilos, así que sus toasts se veían distintos al resto del sistema. | Todos pasan por `toastSuccess`/`toastError`/`toastApiError` de `lib/toast.ts`. Cero `sileo` directo en la sección. |
| B1 | **Bug**: en `business-danger-zone`, si el fallo al eliminar no era de axios (red caída, timeout) el `catch` no mostraba nada: el diálogo se cerraba en silencio y el negocio parecía eliminado. | `toastApiError` cubre ahora ambas ramas. |

### Transversal introducido aquí

`toastApiError(error, fallback)` en `lib/toast.ts`. Sustituye al bloque de ~14 líneas
(`isAxiosError` con sus dos ramas y los estilos inline) que se repite en **43 archivos**
del sistema. Se aplica sección por sección conforme avanza la revisión, no de una vez.

Efecto secundario asumido: donde las dos ramas tenían textos de fallback distintos
("Error al crear el negocio" / "…Intenta de nuevo."), ahora se usa uno solo. El mensaje
del backend, cuando llega, sigue teniendo prioridad.

### Revisado y descartado

- **N7 — `resolvedProvinceName` / `resolvedMunicipalityName` como estado**: en
  `business-details-form` son dos `useState` + dos `useEffect` para algo derivable con
  un `.find()`, y la pantalla hermana (`create/page.tsx`) ya lo hace derivado. Son ~25
  líneas y dos efectos menos. **Decisión del usuario: no aplicar por ahora** (toca el
  flujo de edición y pide prueba manual). Queda disponible si se retoma.
- `createBusinessSchema` vs `updateBusinessSchema`: se parecen, pero difieren en
  opcionalidad campo a campo (phone requerido vs opcional, description nullable vs
  optional). Derivar uno del otro con `.partial()` cambiaría validaciones reales.
- `toHHmm` en `business-schedule-card`: copia única, con su comentario explicando el
  formato `TIME` de MySQL. Se queda donde está.

---

## Sección 3 — Categorías ✅

Superficie revisada: `app/dashboard/business/categories/` (hub + `[kind]`), los 7
componentes de `components/categories/`, ambos hooks, ambas APIs, ambas validaciones y
`lib/category-selection.ts`.

La sección ya estaba bien resuelta: `kind-config.ts` unifica gastos y productos en una
sola tabla, un formulario y un diálogo. Lo encontrado estaba en los bordes.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| C1 | `lib/validations/product-category.ts` no lo importaba nadie: el formulario validaba **ambos** tipos con el esquema de gastos. Los dos archivos eran idénticos salvo el nombre. | Un único `lib/validations/category.ts` (`createCategorySchema`/`updateCategorySchema`); los dos espejo eliminados. |
| C2 | `api/product-category.ts` normalizaba `total/page/limit` ausentes; `api/expense-category.ts` los daba por seguros y la tabla se quedaría en "0 categorías" si el backend los omite. | Igualada la normalización defensiva en gastos. |
| C3 | `category-form-dialog` **redefinía** `SUCCESS_TOAST_STYLES`, ya exportado en `lib/toast.ts`. Entre ese archivo y `categories-table` había 7 llamadas a `sileo` directo. | Todos por `toastSuccess`/`toastError`/`toastApiError`. |
| C4 | **Bug visual**: el toast de "Error al eliminar la categoría" usaba los estilos de **éxito** (`fill:""` + título blanco): un error pintado de verde. | Corregido al pasar por `toastApiError`. |
| C5 | **Bug**: en `category-form-dialog`, un error sin `data.message` solo escribía el texto al pie del formulario, sin toast: con el diálogo scrolleado no se veía nada. | `toastApiError` cubre ahora todos los casos; el pie mantiene el mensaje del backend cuando llega. |
| §2 | Huérfano que se escapó en la sección anterior: `lib/validations/business-settings.ts` (22 líneas) tampoco tenía importadores. | Eliminado. |

**Nota de método:** el primer barrido de huérfanos buscaba por *nombre de archivo* y daba
falsos negativos cuando el mismo nombre existe en `api/`, `types/` y `validations/`
(así se escaparon C1 y el de `business-settings`). Se repitió por **ruta completa**; los
únicos huérfanos que quedan en todo `src/` son los anotados abajo.

### Transversales introducidos aquí

Cuatro duplicaciones que atraviesan el sistema entero. Se crean los helpers ahora y cada
sección migra sus propias tablas al pasar por ella:

| Helper | Sustituye a | Copias |
|---|---|---|
| `components/data-table/column-meta.ts` — `columnMeta()` + `type ColumnMeta` | `function columnMeta` idéntica y `type XColumnMeta` con el mismo shape | **17** y **16** |
| `components/data-table/table-loading-overlay.tsx` | El overlay "Cargando…" copiado tal cual | **16** |
| `lib/dates.ts` — `formatDateTimeShort` / `formatDateTimeLong` | `function formatDate` local, 12 variantes del mismo formateo | **17** |

Migrado en esta sección: `categories-table`, `categories-table-columns`,
`category-details-dialog`. Quedan ~14 tablas por migrar en sus respectivas secciones.

### Revisado y descartado

- Las invalidaciones de `use-expense-categories` vs `use-product-categories` **no** son
  una inconsistencia: gastos invalida `all-expenses` + `expense`, productos invalida
  además el catálogo global y la tabla por negocio, porque tiene esas dos vistas y
  gastos no.
- `KIND_ORDER` en el hub duplica en apariencia las claves de `CATEGORY_KINDS`, pero
  fija el orden de presentación a propósito.

### Anotado para secciones futuras

| Para | Nota |
|---|---|
| §16 Admin | La cadena del menú *runtime* está muerta entera: `hooks/use-menu.ts` (28) → `lib/api/menu.ts` (21) → `lib/types/menu.ts` (35) + `lib/routes/menu.ts` (5). **89 líneas y 4 archivos**. El sidebar consume hoy `use-navigation`. Ojo: `lib/routes/navigation.ts:7` lleva un `NOTE` diciendo que ese shape "se queda intacto" — hay que confirmar que la migración terminó antes de borrarlo. |
| §4 Productos | `components/products/products-table-skeleton.tsx` sigue sin importadores. |
| §17 Transversales | `lib/axios.ts:4` importa `BASIC_ROUTE` sin usarlo y es el único importador de `lib/routes/index.ts`; `authRoutes` sin usar en el login. |

---

## Sección 4 — Productos ✅

Superficie revisada: las 9 páginas de `app/dashboard/business/products/`, los 21
componentes de `components/products/` (5.579 líneas), `hooks/use-product.ts`,
`lib/api/product.ts`, `lib/types/product.ts`, `lib/validations/products.ts` y
`lib/products-import.ts`.

### Bugs corregidos

| id | Bug | Corrección |
|---|---|---|
| P1 | **Los precios se mostraban en pesos colombianos.** `business-products-table-columns`, `product-catalog-card` y `price-history-item` definían su propio `formatCurrency` con `Intl.NumberFormat("es-CO", { currency: "COP" })`. Resultado: `$ 1.234,50` frente al `1,234.50 CUP` del resto del sistema — otra moneda y separadores invertidos. El historial además llevaba `maximumFractionDigits: 0`, así que **redondeaba**: 1234,50 se leía como `$ 1.235`. | Los tres pasan por `formatMoney(value, BASE_CURRENCY)` de `lib/currency.ts`. |
| P2 | `new-product-form`: el `catch` solo reaccionaba si el error era de axios **y** traía `data.message`. Con un fallo de red no salía toast ni se marcaba el formulario: al usuario no le pasaba nada en pantalla. Mismo patrón en `edit-catalog-product-form`, `edit-business-product-dialog` y `assign-product-to-business-form`. | `toastApiError` cubre las dos ramas en los cuatro formularios. |
| P2b | En ambas tablas, el toast del error genérico al eliminar usaba los estilos de **éxito** (`fill:""` + título blanco): error pintado de verde, igual que el C4 de categorías. | Corregido al pasar por `toastApiError`. |

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| P3 | `components/products/products-table-skeleton.tsx` (66 líneas) sin importadores; lo sustituyó `SimpleTableSkeleton`. | Eliminado. |
| P4 | Código comentado muerto en `new-product-form` (`// setSelectedProduct(null)`, `// handleCancel()`). | Eliminado. |
| P5 | `formatCurrency` en `edit-business-product-dialog` era un alias de una línea sobre `formatMoney`. | Eliminado; se llama a `formatMoney` directamente. |
| P6 | El catálogo de unidades `["kg","lb","g","L","mL","ud"]` estaba escrito **7 veces**: los dos formularios, `IMPORT_UNITS`, tres `z.enum` y el tipo `ProductUnit`. | `PRODUCT_UNITS` en `lib/types/product.ts`; de ahí derivan el tipo, los `z.enum`, `IMPORT_UNITS` y los selects. |
| P7 | 7 archivos con `sileo` directo y 22 bloques de estilos inline. | Todos a `lib/toast`. Cero `sileo` directo en la sección. En `import-products-client` cayó además un narrowing manual de 7 líneas que reimplementaba `isAxiosError`. |
| P8 | 2 `columnMeta`, 2 tipos `ColumnMeta` y 2 overlays "Cargando…" duplicados. | Migrados a `components/data-table/`. |

### Revisado y descartado

- **`table.tsx` vs `table-of-other-products.tsx`**: comparten esqueleto (buscador,
  toggle grid/lista, paginación, estado vacío) pero operan sobre tipos distintos con
  columnas y acciones distintas. Un shell común pediría más de 10 props de
  configuración: justo la abstracción que CLAUDE.md §2 desaconseja.
- **`import-products-client.tsx`** (1.241 líneas): es UI pura; la lógica ya está
  extraída en `lib/products-import.ts` y cubierta por tests. Partirlo sería
  reorganizar, no simplificar.
- **`handleImageChange` + `clearImage` + `MAX_IMAGE_SIZE_BYTES`** idénticos en los dos
  formularios de producto (~25 líneas cada uno). **Decisión del usuario: no extraer** —
  son 2 copias y un `useProductImage` para dos usos añade indirección sin ganancia clara.
- El `Badge` local de `import-products-client` no duplica a `ui/badge`: aporta tonos
  semánticos (ok/warn/error) que el de UI no tiene.

### Anotado para secciones futuras

| Para | Nota |
|---|---|
| §12 Analíticas | `formatCurrencyShort` duplicado en `sales-trend-chart` y `top-products-chart`, ambos con `$` fijo — mismo problema de moneda que P1, pero en los ejes de los gráficos. |

---

## Sección 5 — Inventario ✅

Superficie revisada: las 4 páginas de `app/dashboard/business/inventory/`, los 13
componentes de `components/inventory/`, `hooks/use-inventory.ts`,
`hooks/use-stock-alerts.ts`, `lib/types/inventory.ts` y `lib/inventory-history-export.ts`.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| I1 | `formatAmount(value, currency)` local en `product-cost-layers` y `product-lot-profitability` formateaba con `Intl` en **es-ES**: `"1.234,50 CUP"` frente al `"1,234.50 CUP"` del resto del sistema. Además el nombre chocaba con el `formatAmount` de `lib/currency.ts`, que usa otro locale. | Ambos delegan en `formatMoney`. |
| I2 | `formatDate` idéntico en esos dos archivos, y una tercera variante en `current-inventory-table-columns`. | `formatDateShort` en `lib/dates.ts` para los dos idénticos. |
| I3 | `const DASH = "—"` declarado en 3 archivos. | `DASH` exportado desde `lib/utils.ts`. Ahorro de líneas casi nulo, pero deja un solo símbolo para "sin dato". |
| I4 | `update-stock-form`: 3 toasts con estilos inline, un `// handleCancel()` comentado muerto, y un `catch` que solo actuaba con errores de axios — con la red caída, actualizar stock fallaba sin ningún aviso. | Toasts por `lib/toast`; el `catch` cubre ahora las dos ramas apoyándose en que `mapCurrencyError` ya cae al texto genérico. |
| I5 | 1 `columnMeta` local, su tipo `CurrentInventoryColumnMeta` y 2 overlays "Cargando…". | Migrados a `components/data-table/`. |

`TableLoadingOverlay` ganó aquí una prop `className` opcional: el overlay del historial
ancla el aviso arriba (`items-start pt-8`) porque la lista es larga y centrado quedaba
fuera de vista. Es el único punto donde las 16 copias no eran idénticas.

### Revisado y descartado

- Los dos `TimelineSkeleton` (`components/inventory/timeline-skeleton.tsx` y el local de
  `price-history-timeline`) se parecen, pero uno va envuelto en `Card` y el otro no, y
  las filas tienen estructura distinta. Parecerse no es duplicarse.
- `formatEntryAmount` en `inventory-history-item` ya delega en `formatMoney`: solo añade
  el `Number()` y el guardarraíl de `NaN`. Se queda.

---

## Sección 6 — Ventas ✅

Superficie revisada: `app/dashboard/business/sales/` (lista y mostrador), los 8
componentes de `components/sales/` (2.620 líneas), `hooks/use-sales.ts`,
`lib/api/sale.ts`, `lib/types/sales.ts` y `lib/validations/payments.ts`.

Es la sección con más lógica de negocio (multimoneda, pagos parciales, vuelto,
cancelación total y parcial) y estaba bien resuelta: los tres diálogos grandes ya usaban
`lib/toast` y `formatMoney`, y los comentarios explican el *porqué* de cada conversión.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| S1 | **`product-grid-card` definía `function formatMoney` que sombreaba al helper global del mismo nombre y hacía algo distinto**: el global añade la moneda al importe, el local solo formateaba el número. Y era copia exacta de `formatAmount`, que ya existe en `lib/currency.ts`. | Usa `formatAmount(Number(...))`; el local desaparece. |
| S2 | `formatDate` en `sales-table-columns` era idéntico a `formatDateTimeShort`. | Migrado. |
| S3 | `columnMeta`, `SalesColumnMeta` y el overlay "Cargando…" duplicados. | A `components/data-table/`. |
| S4 | 3 toasts inline en `table-of-sales` (uno de ellos, el **tercer caso** del error pintado con estilos de éxito) y 2 en el mostrador, uno sin estilos. | A `lib/toast`. |
| S5 | El `catch` del mostrador llamaba `axios.isAxiosError` dos veces sobre el mismo error. | Un solo narrowing. |

`formatDateTimeShort` / `Long` / `formatDateShort` aceptan ahora `string | Date`: la tabla
de ventas trae `createdAt` como `Date` y la alternativa era un cast en cada llamada.

### Transversal introducido aquí

`hooks/use-debounced-value.ts`. El debounce de búsqueda (300 ms, `useState` +
`useEffect` + `clearTimeout`) estaba copiado en **5 archivos** de 4 secciones distintas,
con variantes solo cosméticas. Migrados los 5 de una vez, al ser idénticos: mostrador de
ventas, lista de proveedores, tabla de productos de proveedor, combobox de productos y
asignación de planes del admin.

### Revisado y descartado

- `details-dialog` calcula el pendiente como `total − totalPaid` mientras `payment-dialog`
  lo toma del `summary` del backend. Son dos orígenes para el mismo número, pero cada
  diálogo tiene datos distintos disponibles: no es código duplicado y unificarlo cambiaría
  comportamiento.
- `payment-dialog` (703 líneas) y `cancel-sale-dialog` (417) son grandes, pero resuelven
  flujos distintos (cobro multimoneda con vuelto vs. devolución por líneas) y no comparten
  bloques que se puedan extraer sin inventar una abstracción.

---

## Sección 7 — Gastos ✅

Superficie revisada: las 7 páginas de `app/dashboard/business/expenses/`, los 4
componentes de `components/expenses/`, `hooks/use-expenses.ts`, `lib/api/expense.ts`,
`lib/types/expenses.ts` y `lib/validations/expenses.ts`.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| E1 | `app/dashboard/business/expenses/[expenseId]/edit/expense-edit-client.tsx` (89 líneas) **no lo importa nadie**: el `page.tsx` de esa carpeta solo hace `redirect()`. El cliente real vive en `expenses/edit/` y es idéntico salvo que lee el id de `?id=` en vez del segmento de ruta. | Eliminado. |
| E2 | `formatDate` local en `expense-details-dialog` y `expenses-table-columns`: eran exactamente `formatDateTimeLong` y `formatDateTimeShort`. | Migrados a `lib/dates.ts`. |
| E3 | `expense-form` **redefinía** `SUCCESS_TOAST_STYLES` (tercera copia de esa constante) y su `catch` solo mostraba toast si el error traía `message`; en cualquier otro caso el fallo solo aparecía al pie del formulario. | Toasts por `lib/toast`; `toastApiError` cubre las dos ramas. |
| E4 | `table-of-expenses`: toasts inline (con el **cuarto caso** del error pintado de verde), `columnMeta`, `ExpensesColumnMeta` y el overlay duplicados. | Todo a los helpers compartidos. |

### Revisado y descartado

- **Las rutas `[expenseId]/edit`, `[providerId]/edit`, `[workerId]/edit`,
  `[businessProductId]/edit` y `catalog/[productId]/edit` se quedan.** Sus `page.tsx` son
  stubs de 9 líneas que solo hacen `redirect()` a la lista, con `generateStaticParams`
  devolviendo `__dynamic__`. Toda la UI enlaza a `/edit?id=`, así que a primera vista
  parecen muertas, pero existen para que una URL antigua o compartida con el id en la ruta
  no dé 404 en el export estático. Es una red de seguridad deliberada, no residuo.
- El `page.tsx` de `expenses/edit` y su cliente son la ruta viva; no se toca el patrón
  `?id=`, que es coherente con `output: export` (ver el comentario de
  `business-details-tabs.tsx` sobre los 308 de `trailingSlash`).

### Anotado para secciones futuras

| Para | Nota |
|---|---|
| §9 Trabajadores | `app/dashboard/business/workers/[workerId]/edit/worker-edit-client.tsx` (55 líneas) es el mismo caso que E1: su `page.tsx` solo redirige y nadie lo importa. |
| §12 Analíticas | `app/dashboard/analytics/_page-disabled.tsx` (**251 líneas**) es una versión anterior de la página, desactivada renombrándola con `_`. No la importa nadie y no entra en el build. |

**Nota de método:** el barrido de huérfanos original solo cubría `src/components`,
`src/hooks`, `src/lib` y `src/context`. Se repitió sobre `src/app` y de ahí salieron
estos tres.

---

## Sección 8 — Proveedores ✅

Superficie revisada: las 6 páginas de `app/dashboard/business/providers/`, los 8
componentes de `components/business-providers/`, `hooks/use-provider.ts`,
`lib/api/provider.ts`, `lib/types/provider.ts` y `lib/validations/providers.ts`.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| V1 | `formatDate` idéntico en `provider-details-dialog` y `provider-details-view` (mes en letra, sin hora): un formato que ningún helper cubría todavía. Ambos devolvían `"--"` donde el resto del sistema usa `"—"`. | `formatDateLong` en `lib/dates.ts`, con `DASH`. |
| V2 | `provider-form` y `providers-table` con toasts inline; el `catch` del formulario solo avisaba si la respuesta traía `message`. | Todo a `lib/toast`. |
| V3 | `columnMeta`, `ProvidersColumnMeta` y **dos** overlays "Cargando…". | A `components/data-table/`. |
| V4 | El diálogo de detalle **repetía a mano 6 veces** el markup de fila etiqueta/valor que la vista de página ya tenía como componente `DetailRow`. | `DetailRow` extraído a `business-providers/detail-row.tsx`; lo usan las dos vistas. El diálogo pasa de 229 a 188 líneas. |

### Mejora al helper transversal

`toastApiError` une ahora los arrays de mensajes. NestJS devuelve `message` como array
cuando fallan varias validaciones a la vez, y había **6 archivos** repitiendo ese
`Array.isArray(...).join(", ")` a mano. Las secciones que quedan (soporte, admin) heredan
el arreglo al migrar sus toasts.

### Revisado y descartado

- `components/providers/query-provider.tsx` **no** pertenece a esta sección pese al
  nombre: es el `QueryClientProvider` de React Query, y está en uso desde `app/layout.tsx`.
  El nombre choca con `business-providers`, pero renombrarlo sería un refactor sin ganancia.
- `formatPrice` está duplicado en `provider-details-dialog` y `provider-products-table`,
  pero son 5 líneas que ya delegan en `formatMoney` y solo añaden el guardarraíl de `NaN`.
  Dos copias no justifican un helper más; además cada archivo lleva una nota cruzada
  explicando el porqué del formato.

---

## Sección 9 — Trabajadores e invitaciones ✅

Superficie revisada: las 8 páginas de `app/dashboard/business/workers/`, los 5
componentes de `components/workers/`, los 3 de `components/invitations/`,
`hooks/use-workers.ts`, `hooks/use-invitations.ts` y `lib/worker-permissions.ts`.

La sección con más recorte de toda la revisión hasta ahora: **−248 líneas**.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| W1 | `app/dashboard/business/workers/[workerId]/edit/worker-edit-client.tsx` (55 líneas) sin importadores, igual que el de gastos. | Eliminado. |
| W2 | `getInitials` copiado **4 veces** (dos en trabajadores, dos en invitaciones), idéntico salvo el texto de reserva ("TR"/"IN"), y una quinta copia con otro nombre (`productInitials`) en inventario. | `getInitials(name, fallback)` en `lib/utils.ts`; los 5 lo usan. De paso pasa a `split(/\s+/)`, que ya no produce iniciales vacías con dobles espacios. |
| W3 | `formatDate` local ×3: dos eran `formatDateTimeLong` y uno `formatDateShort`. | Migrados a `lib/dates.ts`. |
| W4 | `worker-form` tenía la **cuarta** copia de `SUCCESS_TOAST_STYLES` y 8 llamadas a `sileo` directas; las dos tablas, otras 6 (con el error pintado de verde en ambas). | Todo a `lib/toast`. Cero `sileo` directo en la sección. |
| W5 | `columnMeta` ×2, sus tipos `WorkersColumnMeta` / `InvitationsColumnMeta` y 2 overlays. | A `components/data-table/`. |

### Revisado y descartado

- `worker-form.tsx` (492 líneas) es grande, pero la mayor parte es el árbol de permisos
  por menú/submenú, con su propia lógica de padres incompletos. No hay bloques repetidos
  que extraer sin inventar una abstracción.
- `table-of-workers` y `table-of-invitations` comparten esqueleto, como todas las tablas
  del proyecto, pero ya comparten lo que se podía compartir (`columnMeta`, overlay,
  paginación, `PageSizeSelect`). El resto son columnas y acciones distintas.

---

## Sección 10 — Caja y tasas de cambio ✅

Superficie revisada: `app/dashboard/business/currency-accounts/`,
`app/dashboard/exchange-rate/`, los 6 componentes de `components/currency-account/`, los 3
de `components/exchange-rate/`, `lib/currency.ts`, `lib/cash-flow.ts`,
`lib/currency-errors.ts` y sus tres hooks.

**La sección más limpia de la revisión.** Toda la lógica de conversión y consolidación ya
vive en `lib/currency.ts` y `lib/cash-flow.ts` —ambas con suites de test— y los
componentes se limitan a pintarla. Solo salieron los patrones transversales:

| id | Hallazgo | Acción |
|---|---|---|
| X1 | `formatDate` en `transactions-table-columns` era exactamente `formatDateTimeShort`. | Migrado. |
| X2 | `columnMeta`, `TransactionsColumnMeta` y el overlay "Cargando…". | A `components/data-table/`. |
| X3 | `exchange-rate-form`: toasts inline y el `catch` que solo avisaba si la respuesta traía `message`. | A `lib/toast` con `toastApiError`. |

### Revisado y descartado

- `cash-balance-widget` (el del panel principal) llama a `consolidateBalances` sin
  `useMemo`, mientras `consolidated-balance-card` sí lo memoiza. La diferencia es
  irrelevante: la lista de monedas de un negocio son unas pocas filas.
- `balances-table` y `consolidated-balance-card` muestran los mismos saldos, pero uno como
  tabla plana por moneda y el otro consolidado a CUP con su equivalencia. No comparten
  markup que se pueda extraer.

---

## Sección 11 — Cierres contables ✅

Superficie revisada: `app/dashboard/accounting-close/daily/` y `monthly/`, los 13
componentes de `components/accounting-close/`, `lib/accounting-close-currency.ts`,
`lib/types/accounting-close.ts` y `hooks/use-accounting-close.ts`.

Cero llamadas a `sileo` y cero overlays duplicados: la sección ya estaba en buena forma,
con los anchos de columna extraídos en `daily-close-table-layout.ts` y una cabecera
ordenable compartida.

### Hallazgos aplicados

| id | Hallazgo | Acción |
|---|---|---|
| Y1 | `columnMeta` ×3 y sus tipos `DailyCloseExpense/Sold/StockColumnMeta`, uno por cada tabla del cierre diario. | A `components/data-table/`. |
| Y2 | `formatDate` en `daily-close-expense-columns`. | `formatDateShort` (ahora `05/08/26`). |
| Y3 | **`downloadBlob` copiado en las dos páginas de cierre pese a existir en `lib/download.ts`** — cuyo comentario dice literalmente "mismo enfoque que las exportaciones de cierre contable": el helper se escribió inspirándose en estas páginas y nunca se migraron. | Ambas usan `lib/download`. |
| Y4 | `DailyClosePageSkeleton` y `MonthlyClosePageSkeleton` eran **idénticos carácter por carácter**. | `ClosingPageSkeleton` compartido. |

### Revisado y descartado

- Las tres tablas del cierre diario (ventas, gastos, stock) comparten esqueleto, pero la
  de ventas arrastra toda la consolidación multimoneda (`consolidateClosing`,
  `hasUnconvertibleFor`) que las otras dos no tienen. Y lo compartible —anchos de columna
  y cabecera ordenable— ya estaba extraído antes de esta revisión.
- `daily/page.tsx` y `monthly/page.tsx` se parecen, pero difieren en el filtro (día vs
  mes), en el rango que envían y en el gating Pro del mensual.

---

## Sección 12 — Analíticas · sección retirada ✅

La sección ya estaba medio desmantelada antes de esta revisión:
`/dashboard/analytics/page.tsx` era un `redirect("/dashboard")` y el propio catálogo de
tours lo documentaba ("No hay guía de Analíticas: hoy `/dashboard/analytics` es un
redirect"). Lo que quedaba era una página completa guardada como `_page-disabled.tsx` y
todo su árbol de componentes colgando de ella.

**Decisión del usuario: retirar la sección.** Pero no se podía borrar entera —cuatro
piezas suyas las consumen secciones vivas—, así que se separó en dos:

### Eliminado (−1.164 líneas netas)

| Qué | Líneas |
|---|---:|
| `_page-disabled.tsx` | 251 |
| `sales-trend-chart` + `sales-trend-filter` | 221 |
| `top-products-chart` + `top-products-filter` | 234 |
| `kpi-card` + `kpis-grid` | 222 |
| `period-filter` | 46 |
| `use-analytics.ts` (3 de sus 4 hooks) | 61 |
| `api/analytics.ts`: `getKPIS`, `getSalesTrend`, `getTopProducts` | ~45 |
| `routes/analytics.ts`: 3 de sus 4 endpoints | 3 |
| `types/analytics.ts`: 12 tipos sin consumidor | ~55 |
| `query-provider.tsx`: 3 `setQueryDefaults` de claves que ya no existen | 3 |

### Movido a donde pertenece

`components/analytics/` **ya no existe**. Sus cuatro supervivientes se repartieron:

| Pieza | Nuevo hogar | Quién la usa |
|---|---|---|
| `date-range-picker.tsx` | `components/generic/` | Inventario (historial) y Productos (historial de precios) |
| `date-range-filter.tsx` | `components/generic/` | Trabajadores |
| `sales-by-worker-table.tsx` | `components/workers/` | Trabajadores |
| `sales-by-worker-columns.tsx` | `components/workers/` | Trabajadores |
| `useAnalyticsSalesByWorker` | `hooks/use-workers.ts` | Trabajadores |

De paso, la tabla de ventas por trabajador se migró a `columnMeta` y
`TableLoadingOverlay` compartidos.

`lib/api/analytics.ts`, `lib/routes/analytics.ts` y `lib/types/analytics.ts` **se
conservan**, reducidos a lo de ventas por trabajador: el endpoint del backend sigue
siendo `/analytics/sales-by-worker` y renombrarlos mentiría sobre la API real. Los tres
llevan ahora una nota explicando por qué siguen llamándose así.

### Conservado a propósito (decisión del usuario)

- **La ruta `/dashboard/analytics`** (5 líneas, `redirect("/dashboard")`). El menú se
  gestiona desde el backend: si alguna entrada apunta ahí, con el redirect sigue llevando
  al panel en vez de dar 404. Y las notificaciones `weekly_summary` / `monthly_summary`
  enlazan a esa ruta desde `notification-type-meta.ts`.
- **La capacidad de plan `analytics`** en `plan-features.ts` y su gate en `pro-gates.ts`,
  con su test en `pro-gates.suite.ts`. Es una capacidad que **conceden los planes del
  backend**: retirarla del frontend dejaría a los planes existentes con una capacidad que
  la app ya no reconoce, y desaparecería de la pantalla de asignación de planes.

---

## Sección 13 — Notificaciones ✅

Superficie revisada: `app/dashboard/notifications/page.tsx`, los 4 componentes de
`components/notifications/`, `hooks/use-notifications.ts`,
`hooks/use-support-notification.ts` y sus tipos.

Sección muy limpia: cero `sileo` directo, cero overlays, cero `columnMeta`. Sus dos
`formatRelativeTime` ya se habían unificado en §1.

| id | Hallazgo | Acción |
|---|---|---|
| N1 | `DOMAIN_LABEL` en `notification-type-meta.ts`: exportado y **sin ningún consumidor**, ni dentro del propio archivo. | Eliminado. |

### Revisado y descartado

- `notification-item` y `support-notification-item` comparten el esqueleto del botón,
  pero difieren en el tipo de notificación, el hook de marcado, cómo resuelven el icono y
  la etiqueta, el destino del clic y el color del icono. Un shell común pediría cinco
  props de configuración.
- La campana mezcla y ordena las dos listas; la página las separa en pestañas. Comparten
  el `.filter(isVisibleNotificationType)` pero la estructura difiere de verdad.
- **Comprobación tras retirar Analíticas**: los tipos `weekly_summary` y
  `monthly_summary` enlazan a `/dashboard/analytics`, pero **no están en
  `VISIBLE_NOTIFICATION_TYPES`**, así que hoy no se muestran al usuario. Aun así, con el
  redirect conservado, si se habilitaran llevarían al panel en vez de a un 404.

---

## Sección 14 — Perfil y planes ✅

Superficie revisada: las 4 páginas de `app/dashboard/profile/`, `app/seleccionar-plan/`
(y `reconciliar`), `app/plans/`, `components/plans/plan-form.tsx`,
`components/account/deactivate-account-card.tsx`, `lib/plan-features.ts`,
`lib/plan-catalog.ts`, `lib/plan-session.ts`, `lib/pro-gates.ts` y sus hooks.

| id | Hallazgo | Acción |
|---|---|---|
| Z1 | `formatDate` local ×2, cada uno con **un locale distinto**: `es-ES` en la página de perfil y `es-MX` en el historial de planes. Con estos, el proyecto llegaba a mezclar cuatro locales (`es-CO`, `es-ES`, `es-MX`, `es-CU`) para la misma tarea. | `formatDateLong` y `formatDateShort` de `lib/dates.ts`. |
| Z2 | `profile/edit`: toasts inline con las dos ramas del `isAxiosError`. | `toastApiError`. |

### Revisado y descartado

- Las cuatro pantallas que pintan planes (`profile/plans-change`, `seleccionar-plan`,
  `seleccionar-plan/reconciliar` y `plans`) **ya comparten** `lib/plan-catalog.ts`
  (`planToCatalogEntry`, `selectablePlans`), que además tiene su propia suite de tests.
  Lo que queda distinto en cada una es el copy y la acción del botón.
- `plan-form.tsx` (623 líneas) pertenece funcionalmente a §16 Admin: lo usan la creación
  de planes asignados y la edición de planes del panel de administración.

---

## Sección 15 — Soporte ✅

Superficie revisada: `app/dashboard/support/`, `app/dashboard/admin/support/` y los 9
componentes de `components/support-tickets/`.

| id | Hallazgo | Acción |
|---|---|---|
| S1 | **Cuatro copias más de `SUCCESS_TOAST_STYLES`** (van 8 en todo el proyecto), en `create-ticket-dialog`, `ticket-reply-form`, `ticket-status-dialog` y `admin-support-detail-client`. | Todas fuera; usan `lib/toast`. |
| S2 | Los cuatro repetían el bloque `isAxiosError` + `Array.isArray(message).join(", ")`, que `toastApiError` ya cubre desde §8. | `toastApiError`. |
| S3 | `columnMeta` ×2 (uno importaba su tipo desde el archivo de columnas del *otro* listado), `TicketsColumnMeta` y 2 overlays. | A `components/data-table/`. |

### Helper añadido

`apiMessage(error)` en `lib/toast.ts`. Varios formularios necesitan el texto del error
del backend **además** del toast, para rellenar `setError("root")`. Ese
`isAxiosError(...) ? ... : fallback` lo había escrito a mano seis veces durante esta
revisión; ahora sale de un sitio y `toastApiError` se apoya en él.

---

## Sección 16 — Admin ✅

Superficie revisada: `app/dashboard/admin/` (menús, planes, asignación de planes), los 11
componentes de `components/navigation-admin/`, los 6 de `components/assign-plans/`,
`components/plans/plan-form.tsx` y `hooks/use-navigation.ts`.

| id | Hallazgo | Acción |
|---|---|---|
| A1 | **La cadena del menú *runtime* estaba muerta entera**: `hooks/use-menu.ts` → `lib/api/menu.ts` → `lib/types/menu.ts` + `lib/routes/menu.ts`. Se confirmó comparando endpoints: el sidebar consume `GET /section` (`useGetAllSectionsQuery` → `navigationRoutes.getAllSections`), mientras la cadena muerta apuntaba a `GET /menu/`. | **89 líneas y 4 archivos eliminados.** El `NOTE` de `routes/navigation.ts` que decía que ese shape "se queda intacto" quedó obsoleto al terminar la migración: se actualizó. |
| A2 | `showApiError()` en `assign-plans/page.tsx`: una copia local de `toastApiError`, con su propia pareja de `SUCCESS_TOAST_STYLES` / `ERROR_TOAST_STYLES`. | Eliminada. |
| A3 | `normalizeApiMessage()` duplicada en `assign-plans/create` y `plans/edit` — la misma idea que `apiMessage`, con `". "` en vez de `", "` como separador. | Ambas usan `apiMessage`. |
| A4 | Los toasts de crear/editar plan usaban **una tercera paleta** (`text-foreground`, `text-muted-foreground`, `text-destructive`) distinta de las otras dos del sistema. | Al estilo estándar. **Cambio visible** en esas pantallas. |
| A5 | `columnMeta`, `AssignPlansColumnMeta` y el overlay de la tabla de asignación. | A `components/data-table/`. |

### Revisado y descartado

- `assign-plan-confirm-dialog.tsx` (600 líneas) concentra el flujo de asignar / extender /
  remover plan con sus tres modos y sus validaciones de fecha. Es grande, pero no repite
  bloques: cada rama hace algo distinto.
- `components/navigation-admin/` (11 archivos) está bien separado: `node-config.ts`,
  `role-badges`, `roles-field` y `role-multiselect` ya son piezas compartidas entre los
  tres diálogos de sección/menú/submenú.
