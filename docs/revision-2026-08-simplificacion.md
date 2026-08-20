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

### Líneas — 9 secciones cerradas

| | Archivos | Añadidas | Eliminadas | Neto |
|---|---:|---:|---:|---:|
| **Total en `src/`** | **79** | **+743** | **−1771** | **−1028 líneas** |

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
| Debounce unificado (adelanta trabajo de §4, §8 y §16) | −18 |
| `lib/types/business.ts` (compartido §1–§2) | −3 |

### Archivos eliminados (7)

| Archivo | Líneas | Motivo |
|---|---:|---|
| `components/dashboard/recent-activity-table.tsx` | 73 | Sin ningún importador |
| `components/products/products-table-skeleton.tsx` | 66 | Sin importadores; lo sustituyó `SimpleTableSkeleton` |
| `app/dashboard/business/expenses/[expenseId]/edit/expense-edit-client.tsx` | 89 | Sin importadores: su `page.tsx` hermano solo hace `redirect()` |
| `app/dashboard/business/workers/[workerId]/edit/worker-edit-client.tsx` | 55 | Mismo caso |
| `lib/validations/business-settings.ts` | 22 | Sin importadores |
| `lib/validations/expense-category.ts` | 24 | Fusionado en `validations/category.ts` |
| `lib/validations/product-category.ts` | 24 | Sin importadores; fusionado en `validations/category.ts` |

### Archivos creados (6)

| Archivo | Líneas | Sustituye a |
|---|---:|---|
| `lib/dates.ts` | 92 | `formatRelativeTime` ×5 y `formatDate` local ×17 |
| `components/data-table/column-meta.ts` | 20 | `function columnMeta` ×17 y `type XColumnMeta` ×16 |
| `components/data-table/table-loading-overlay.tsx` | 27 | El overlay "Cargando…" ×16 |
| `lib/validations/category.ts` | 25 | Los dos esquemas de categoría espejo |
| `hooks/use-debounced-value.ts` | 19 | El debounce de búsqueda ×5 |
| `components/business-providers/detail-row.tsx` | 25 | El markup de fila etiqueta/valor, repetido 6 veces en el diálogo |

A los que se suman, dentro de archivos ya existentes: `toastApiError` en `lib/toast.ts`
(sustituye al bloque `isAxiosError` de dos ramas, presente en 43 archivos),
`PRODUCT_UNITS` en `lib/types/product.ts` (el catálogo de unidades estaba escrito 7
veces), `BUSINESS_TYPE_LABELS` y `DEFAULT_MAP_LAT/LNG` en `lib/types/business.ts`, y
`DASH` + `getInitials` en `lib/utils.ts`.

El hook de debounce apenas mueve la aguja en líneas (unas 7 netas): su valor es dejar el
retardo de 300 ms y la limpieza del timer en un único sitio en vez de cinco.

### Bugs corregidos (12)

Ninguno era el objetivo de la revisión; todos salieron al leer el código.

| # | Qué pasaba | Sección |
|---|---|---|
| 1 | **Los precios de productos se mostraban en pesos colombianos** (`currency: "COP"`, locale es-CO) en la tabla del negocio, las tarjetas del catálogo y el historial de precios. El historial además redondeaba a entero: 1234,50 CUP se leía como `$ 1.235` | §4 |
| 2 | Los importes del inventario (capas de coste y rentabilidad por lote) usaban separadores es-ES: `"1.234,50 CUP"` frente al `"1,234.50 CUP"` del resto de la app | §5 |
| 3 | **Eliminar un negocio con la red caída cerraba el diálogo en silencio**: sin toast ni aviso, el negocio parecía borrado | §2 |
| 4 | El mismo `catch` ciego en 10 formularios más — productos (4), stock, gastos (2), proveedores y trabajadores (crear/editar): si el error no era de axios o no traía `message`, no pasaba nada en pantalla | §4, §5, §7, §8, §9 |
| 5 | **Seis toasts de error pintados de verde**: usaban los estilos de éxito (`fill:""` + título blanco) al fallar el borrado de una categoría, un producto, un gasto, un trabajador, una invitación, o la cancelación de una venta | §3, §4, §6, §7, §9 |
| 6 | En el formulario de categorías, un error sin `message` solo escribía el texto al pie: invisible si el diálogo estaba scrolleado | §3 |
| 7 | La lista de categorías de **gastos** se habría quedado en "0 categorías" si el backend omite los campos de paginación; la de productos ya lo cubría | §3 |
| 8 | Los toasts de horario y de notificaciones salían sin los estilos del sistema, con un aspecto distinto al resto | §2 |
| 9 | `product-grid-card` definía un `formatMoney` propio que **sombreaba al helper global del mismo nombre haciendo algo distinto** (el global añade la moneda, el local no): una llamada descuidada habría impreso el importe sin moneda | §6 |
| 10 | `SUCCESS_TOAST_STYLES` **redefinido** en 3 componentes pese a estar exportado en `lib/toast.ts` | §3, §7, §9 |
| 11 | Las fichas de proveedor mostraban `"--"` (dos guiones) donde el resto del sistema usa `"—"` | §8 |
| 12 | Las iniciales de avatar se calculaban con `.split(" ")`, que produce iniciales vacías con nombres que llevan doble espacio | §9 |

### Duplicación: antes y ahora

| Patrón duplicado | Copias al empezar | Restantes |
|---|---:|---:|
| Llamada a `sileo` con estilos copiados inline | 38 archivos | 12 |
| `function columnMeta` | 17 | 9 |
| Overlay "Cargando…" | 16 | 6 |
| `function formatDate` local | 17 | 6 |
| Bloque `isAxiosError` de dos ramas | 43 | 30 |
| `Array.isArray(...message).join()` a mano | 6 | 4 |
| `SUCCESS_TOAST_STYLES` redefinido | 4 | 0 ✅ |
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
| 10 | Caja y tasas de cambio | Pendiente |
| 11 | Cierres contables | Pendiente |
| 12 | Analíticas | Pendiente |
| 13 | Notificaciones | Pendiente |
| 14 | Perfil y planes | Pendiente |
| 15 | Soporte | Pendiente |
| 16 | Admin | Pendiente |
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
