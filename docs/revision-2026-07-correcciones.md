# Correcciones de la revisión — julio 2026

> **Fecha:** 2026-07-26 · **Proyectos:** `pmanage` (frontend) y `psearch-back` (backend, `src/v2`)
> Registro de la implementación de los cinco ajustes surgidos de la revisión del
> sistema, fase por fase: qué se pidió, qué estaba mal, qué se hizo y qué
> resuelve.
>
> Documento hermano: [revision-integral-2026-07.md](revision-integral-2026-07.md),
> la revisión de código previa. Los cambios de backend están además documentados
> en `psearch-back/src/v2/migration_doc/139`, `140` y `141`, como exige el
> `AGENTS.md` de ese proyecto.

---

## Tabla de contenidos

1. [Resumen](#resumen)
2. [Fase 1 — Panel Principal: estados de carga](#fase-1)
3. [Fase 2 — Saldos por moneda: retirar presupuestos](#fase-2)
4. [Fase 3 — Desempeño de ventas: período y multimoneda](#fase-3)
5. [Fase 4 — Historial de inventario: fecha, tipo y exportación](#fase-4)
6. [Fase 5 — PDF de cierre: rediseño de la maquetación](#fase-5)
7. [Añadido — Factura PDF: el mismo defecto, en otro sitio](#fase-6)
8. [Defectos de fondo corregidos de paso](#defectos)
9. [Qué quedó fuera](#fuera)

---

<a name="resumen"></a>
## 1. Resumen

Las cinco correcciones pedidas están entregadas. Al mapear cada una contra el
código aparecieron **siete defectos de fondo** en esas mismas rutas, que se
corrigieron en el mismo paso porque de otro modo el arreglo pedido habría quedado
montado sobre datos incorrectos: un rango de fechas que perdía un día entero, un
total que sumaba monedas distintas, un historial que mostraba pesos colombianos.

El orden de ejecución fue de menor a mayor riesgo, entregando y verificando cada
fase antes de pasar a la siguiente.

| Fase | Qué | Dónde | Estado |
|---|---|---|---|
| 1 | Estados de carga del Panel Principal | Frontend | Entregada |
| 2 | Retirar presupuestos de Saldos por moneda | Frontend | Entregada |
| 3 | Filtro de período y multimoneda en Desempeño de ventas | Ambos | Entregada |
| 4 | Filtros y exportación del historial de inventario | Ambos | Entregada |
| 5 | Rediseño del PDF de cierre | Backend | Entregada |
| + | Factura PDF migrada al mismo motor (añadido, no pedido) | Backend | Entregada |

**Verificación global.** Frontend: typecheck, lint sin errores nuevos, 144 tests
(15 nuevos) y build estático correcto. Backend: typecheck, **330 tests** en 21
suites (40 nuevos) y build correcto.

**Decisiones acordadas antes de empezar:** se puede tocar backend y frontend; el
historial de inventario amplía alcance a tipos de movimiento y exportación; al
retirar "Presupuesto inicial" el estado pasa a calcularse solo por saldo; el
cálculo multimoneda del desempeño se corrige ahora.

---

<a name="fase-1"></a>
## 2. Fase 1 — Panel Principal: estados de carga

### Qué se pidió

> «Que las cards de Ventas y Gastos carguen como hace la carga la card de Caja o
> las tablas de ventas recientes, y que no muestre los valores en 0 mientras se
> cargan.»

### Qué estaba mal y por qué

La página descartaba el estado de carga por completo
([`app/dashboard/page.tsx:13`](../src/app/dashboard/page.tsx)) y rellenaba los
huecos con `?? []` y `?? 0`. `StatsCard` recibía entonces un array vacío que **no
podía distinguir de "hoy no hubo ventas"**, así que caía en su rama de estado
vacío y pintaba `0,00 CUP` y un `0.00%` de tendencia como si fueran datos reales.

Las tablas de ventas y gastos recientes, que la revisión daba por correctas,
tenían el mismo defecto en otra forma: mostraban *«Aún no hay datos que
mostrar»* **antes de saber si los había**. Se percibía como aceptable porque no
enseñaba un número falso, pero afirmaba algo que aún no podía saber.

Detalle que habría dejado el arreglo a medias: el hook lleva
`enabled: !!businessId`, y en React Query v5 una query deshabilitada reporta
`isLoading === false`. Mientras el contexto resuelve el negocio activo no hay ni
datos ni carga en curso; usar `isLoading` a secas habría dejado una ventana sin
skeleton.

### Qué se hizo

| Archivo | Cambio |
|---|---|
| [`app/dashboard/page.tsx`](../src/app/dashboard/page.tsx) | Leer el estado de carga y propagarlo a los cuatro hijos. Se usa `isPending \|\| !activeBusinessId` para cubrir la ventana de la query deshabilitada. |
| [`components/dashboard/stats-card.tsx`](../src/components/dashboard/stats-card.tsx) | Prop `isLoading`. Skeleton en los cuatro puntos que caían a cero: importe de hoy, badge de tendencia, importe de ayer y contador de transacciones. |
| [`components/dashboard/recent-list-skeleton.tsx`](../src/components/dashboard/recent-list-skeleton.tsx) | **Nuevo.** Filas de carga que replican la rejilla real, para que la tarjeta no salte de alto al resolverse. |
| [`components/dashboard/recent-sales-table.tsx`](../src/components/dashboard/recent-sales-table.tsx) · [`recent-expenses-table.tsx`](../src/components/dashboard/recent-expenses-table.tsx) | Prop `isLoading` y distinción entre cargando y vacío. |
| [`components/currency-account/cash-balance-widget.tsx`](../src/components/currency-account/cash-balance-widget.tsx) | Cerrar el mismo hueco de la query deshabilitada en la card de Caja, que era la referencia. |

### Qué soluciona

El panel deja de afirmar cosas que todavía no sabe. Ya no aparecen importes en
cero ni un `0.00%` de tendencia que luego cambian de golpe, ni las listas dicen
que no hay datos mientras los están pidiendo.

### Cómo comprobarlo

`pnpm dev` → `/dashboard`, con la red limitada a *Slow 3G* en DevTools (si no, la
carga pasa demasiado rápido para verlo). Recargar también con el negocio sin
seleccionar aún, para cubrir la ventana de `enabled`.

---

<a name="fase-2"></a>
## 3. Fase 2 — Saldos por moneda: retirar presupuestos

### Qué se pidió

> «De la sección de flujo de caja por ahora quitar el botón Inicializar
> presupuestos y la columna con nombre presupuesto inicial.»

### Nota de ubicación

La vista se titula **«Saldos por moneda»**
(`/dashboard/business/currency-accounts`). «Flujo de caja» es la etiqueta del
menú, que se sirve desde la base de datos a través del módulo `menu` del backend;
no existe ese literal en el repositorio.

### Qué se hizo

| Archivo | Cambio |
|---|---|
| [`app/dashboard/business/currency-accounts/page.tsx`](../src/app/dashboard/business/currency-accounts/page.tsx) | Retirar el diálogo y ajustar el subtítulo, que prometía establecer presupuestos. |
| [`components/currency-account/balances-table.tsx`](../src/components/currency-account/balances-table.tsx) | Eliminar la columna. `balanceStatus` se simplifica a `Sin saldo` / `Disponible`. |
| `components/currency-account/initialize-budgets-dialog.tsx` | **Eliminado**, junto con su cadena completa: hook de mutación, función de API, ruta y esquema de validación. |
| [`consolidated-balance-card.tsx`](../src/components/currency-account/consolidated-balance-card.tsx) · [`cash-balance-widget.tsx`](../src/components/currency-account/cash-balance-widget.tsx) | Reescribir los textos que invitaban a pulsar un botón inexistente. |

El badge «Estado» pasa a calcularse solo por saldo, como se acordó: mantener
«Saldo bajo» habría dejado una etiqueta que el usuario no puede explicarse desde
la pantalla, porque su referencia —el presupuesto— ya no se ve.

**`initialBudget` no se toca en el backend.** Sigue en la entidad y lo usa
`reconcileBusiness` para calcular `expected = initialBudget + Σ deltas`. Se
retira de la vista, no del modelo.

### Qué soluciona

Además de lo pedido, desaparece un falso positivo: el endpoint
`POST /currency-accounts/initialize` devuelve `[]` sin hacer nada si el negocio ya
tiene cualquier cuenta creada, mientras la interfaz mostraba un toast de éxito.
El botón solo funcionaba de verdad la primera vez.

Los textos nuevos explican lo que el backend hace en realidad: la cuenta de cada
moneda se crea sola con su primer movimiento (`upsertAccount`).

### Cómo comprobarlo

`/dashboard/business/currency-accounts`: no hay botón, la tabla es Moneda / Saldo
actual / Estado, y un negocio sin cuentas ve el estado vacío con el texto nuevo.

---

<a name="fase-3"></a>
## 4. Fase 3 — Desempeño de ventas: período y multimoneda

### Qué se pidió

> «No queda claro qué semana, mes o trimestre se analiza. Propongo que por
> defecto cargue la semana actual […] luego un pequeño filtro donde pueda
> seleccionar la semana, mes, trimestre o año […] siempre el usuario debe poder
> decidir los rangos de fechas.»

### Qué estaba mal y por qué

**El filtro no decía nada.** Eran tres botones (`Semana`, `Mes`, `Trimestre`) sin
ninguna indicación de qué fechas cubrían. La respuesta del backend ya incluía el
rango efectivo en `period: { startDate, endDate }` y el frontend lo ignoraba.

Al ir a implementarlo aparecieron dos defectos que lo habrían hecho inútil:

**1. El rango personalizado perdía el último día.** `resolveDateRange` hacía
`new Date("2026-05-31")`, que la especificación parsea como medianoche **UTC**, y
después `end.setHours(23,59,59,999)` en la zona del proceso. Con el servidor en
`America/Havana` (UTC−4), el fin del rango caía en el día 30 a las 23:59 local:
**un día entero de ventas desaparecía del informe**. Es el mismo fallo de zona
horaria que ya se había corregido en los cierres contables.

**2. `week` no era la semana.** Era una ventana rodante de siete días, así que un
martes el rango se metía en la semana anterior y nunca coincidía con la semana que
se ve en un calendario.

**3. El total mezclaba monedas.** `getSalesByWorker` agrupaba solo por trabajador
y hacía `SUM(sale.total)`, sumando CUP + USD + MLC en una sola cifra sin
significado. El frontend agravaba el error pintándola con un `$` fijo.

### Qué se hizo

**Backend** (detalle en `migration_doc/139`):

| Archivo | Cambio |
|---|---|
| `v2/analytics/analytics.service.ts` | Parseo de fechas por componentes locales, de modo que ambos extremos cubren días completos. `week` pasa a ser la semana calendario de lunes a domingo. Preset `year` nuevo. Rangos inválidos o invertidos caen al preset en vez de consultar algo imposible. |
| `v2/analytics/analytics.service.ts` | `getSalesByWorker` agrupa también por `sale.currency` y devuelve `totalsByCurrency`, con `totalSales` redefinido como el consolidado en CUP y `unconvertedCurrencies` a nivel de respuesta. |
| `common/currency-code.util.ts` | `normalizeCurrencyKey()` centralizada; `sale.service.ts` pasa a delegar en ella y desaparece la tabla de alias duplicada. |

**Frontend**:

| Archivo | Cambio |
|---|---|
| [`lib/date-range.ts`](../src/lib/date-range.ts) | **Nuevo.** Cálculo de rangos por preset como funciones puras, serializando siempre con componentes locales. |
| [`testing/suites/date-range.suite.ts`](../src/testing/suites/date-range.suite.ts) | **Nuevo.** 15 casos, incluidos los bordes: semanas a caballo entre meses y años, febrero bisiesto, último trimestre. Registrada en `testing/registry.ts`, así que corre en `pnpm test` y en el runner de `/dashboard/admin/test`. |
| [`components/analytics/date-range-filter.tsx`](../src/components/analytics/date-range-filter.tsx) | **Nuevo.** Presets Semana / Mes / Trimestre / Año / Personalizado, con rótulo del rango vigente. Reutiliza el `DateRangePicker` que ya existía. |
| [`app/dashboard/business/workers/page.tsx`](../src/app/dashboard/business/workers/page.tsx) | Semana en curso por defecto. Manda fechas explícitas, no `period`. Aviso cuando hay monedas sin tasa. |
| [`components/analytics/sales-by-worker-columns.tsx`](../src/components/analytics/sales-by-worker-columns.tsx) | `formatMoney` compartido en lugar del `$` fijo, con el desglose por moneda bajo el consolidado. |

Dos decisiones de diseño:

- **El filtro manda `startDate`/`endDate`, nunca `period`.** Así lo que se lee
  rotulado y lo que se consulta son lo mismo, sin depender de cómo el servidor
  interprete cada preset. El rótulo usa el rango que **devuelve** el backend.
- **`AnalyticsPeriod` no se amplió.** Ese tipo lo consume
  `PERIOD_LABEL: Record<AnalyticsPeriod, string>` en `kpis-grid.tsx`; añadirle
  `"year"` habría obligado a tocar analytics entero. El filtro usa un tipo propio
  que se resuelve a fechas en el cliente.
- **`totalSales` conserva su nombre** aunque cambie de significado, para que un
  cliente sin actualizar siga funcionando y además pase a leer una cifra correcta.

### Qué soluciona

Al entrar se ve la semana en curso y **se lee cuál es**: *«Mostrando del 20 de
julio al 26 de julio de 2026»*. El usuario puede elegir cualquier preset o un
rango libre. Las ventas del último día del rango ya no se pierden. Y la cifra de
"Ventas totales" pasa a ser comparable entre trabajadores, con el detalle por
moneda debajo y un aviso si alguna se queda fuera del consolidado por no tener
tasa.

### Cómo comprobarlo

`/dashboard/business/workers` → pestaña Desempeño. Cambiar entre presets y
comprobar que el rótulo y los datos se actualizan sin parpadeo. **Probar con una
venta creada el último día del rango, por la noche** — es lo que antes se perdía.
Con ventas en dos monedas, verificar el desglose y que el orden usa el
consolidado.

---

<a name="fase-4"></a>
## 5. Fase 4 — Historial de inventario: fecha, tipo y exportación

### Qué se pidió

> «Añadir al historial de inventario un buscador por fecha y ver si hay alguna
> funcionalidad implementada que permita hacerlo, en caso de que no
> implementarla.»

**No había nada reutilizable:** el endpoint no aceptaba fechas, no existía DTO ni
parámetro de query. Sí estaba hecha la mitad difícil — el servicio usa
QueryBuilder y la entidad ya tenía los índices `["business", "createdAt"]` y
`["product", "createdAt"]`, exactamente los que un filtro por rango necesita, así
que **no hizo falta migración de esquema**.

Se amplió el alcance, como se acordó, a tipos de movimiento y exportación.

### Qué estaba mal y por qué

Además de la ausencia del filtro de fechas, la vista de negocio tenía
`stockIncrease: true` **fijo en el código** del frontend
(`lib/api/inventory.ts`). Solo podía enseñar entradas de stock: las ventas,
mermas y ajustes existían en la base de datos pero eran inalcanzables sin
seleccionar un producto concreto.

El enum del frontend tenía **cuatro de los seis** tipos que registra el backend
(faltaban `adjustment` y `sell`), así que esos movimientos se habrían pintado sin
etiqueta ni color.

### Qué se hizo

**Backend** (detalle en `migration_doc/140`):

| Archivo | Cambio |
|---|---|
| `common/date-range.util.ts` | **Nuevo.** Parseo de días locales extraído de la Fase 3, para no repetir el fallo de zona horaria. `analytics.service.ts` pasa a usarlo. |
| `v2/products/inventory.service.ts` | Filtros `startDate`, `endDate` y `actionType` en ambos endpoints de historial, con rango abierto por cualquiera de los dos extremos. |
| `v2/products/inventory.controller.ts` | Parámetros de query y documentación Swagger. |

**Frontend**:

| Archivo | Cambio |
|---|---|
| [`lib/types/inventory.ts`](../src/lib/types/inventory.ts) | Completar el enum con `ADJUSTMENT` y `SELL`, sus etiquetas, y el campo `currency` en `InventoryEntry`. |
| [`lib/api/inventory.ts`](../src/lib/api/inventory.ts) | Retirar el `stockIncrease` fijo; pasar los filtros nuevos. |
| [`components/inventory/inventory-history-filters.tsx`](../src/components/inventory/inventory-history-filters.tsx) | **Nuevo**, sustituye al filtro de solo producto. Producto + rango de fechas + tipo de movimiento, este último disponible siempre. |
| [`lib/inventory-history-export.ts`](../src/lib/inventory-history-export.ts) | **Nuevo.** Exportación a CSV. |
| [`components/inventory/inventory-action-type-style.ts`](../src/components/inventory/inventory-action-type-style.ts) | Estilos de los dos tipos que faltaban. |

Dos detalles de implementación que conviene conocer:

- **Los valores desconocidos de `actionType` se descartan, no se rechazan.** Un
  400 rompería a un cliente que mande un tipo nuevo antes de tiempo; devolver
  todo sería peor, porque el usuario creería estar filtrando.
- **La exportación está acotada a 1000 filas** y lo dice cuando se alcanza el
  tope, en vez de dejar creer que el archivo está completo. Lleva BOM porque
  Excel sin él destroza los acentos de los nombres de producto.

### Qué soluciona

Se puede acotar el historial por rango de fechas y por tipo de movimiento, y por
primera vez **ver las salidas** (ventas, mermas, ajustes) sin tener que elegir un
producto. El resultado filtrado se puede exportar.

### Cómo comprobarlo

`/dashboard/business/inventory/history`: filtrar por rango sin producto
seleccionado; elegir «Venta» o «Pérdida» y comprobar que aparecen movimientos que
antes eran invisibles; verificar que el CSV respeta los filtros.

---

<a name="fase-5"></a>
## 6. Fase 5 — PDF de cierre: rediseño de la maquetación

### Qué se pidió

> «Mejorar el documento pdf de exportación de Cierre diario y mensual, pues para
> números muy grandes se colapsan con otras columnas y no se entiende nada.»

**No había dos PDFs.** Diario y mensual llaman al mismo endpoint
(`GET /sales/closing/range/:businessId/pdf`) y usan el mismo generador; lo único
que cambia es el rango de fechas y el nombre del archivo.

### Qué estaba mal y por qué

Dos causas distintas, ambas en `common/closing-pdf.service.ts`:

**1. Un solape escrito a mano.** El resumen por moneda se dibujaba con
coordenadas absolutas sobre una caja de 350 pt: `TOTAL GASTOS` ocupaba de 182 a
282 y `RESULTADO` arrancaba en **272**. Diez puntos de solape en todos los casos,
no solo con números grandes, más 12 pt muertos al final. Las filas tenían alto
fijo de 22 pt, así que cualquier texto que hiciera wrap invadía la fila siguiente.

**2. Anchos de columna como porcentaje fijo del ancho de página.** «Unitario» y
«Total» disponían de unos 64 pt útiles a cuerpo 10,5; un importe de siete cifras
mide más que eso, y PDFKit lo partía en dos líneas.

Había además un **tercer defecto silencioso**: la sección «Consolidado en CUP y
tasas aplicadas» imprimía siempre guiones y ceros. El servicio esperaba
`exchangeRateSnapshot` y `consolidatedBase`, el cierre ya los calculaba, pero el
controlador no los reenviaba.

### Qué se hizo

Detalle completo en `migration_doc/141`.

| Archivo | Cambio |
|---|---|
| `common/pdf-table.ts` | **Nuevo.** Motor de tablas con tres reglas: anchos medidos con `widthOfString`, reducción de cuerpo antes que partir un número, y alto de fila calculado. Texto largo truncado con elipsis. |
| `common/closing-pdf.service.ts` | Las tres tablas reescritas sobre el motor. Fuera la columna «Moneda» (redundante con el título de sección). Fila de subtotal al pie de cada tabla. Sección consolidada con alto medido y tasas dinámicas. |
| `v2/sale/sale.controller.ts` | Reenviar los tres campos que faltaban al generador. |
| `src/scripts/generate-sample-closing-pdf.ts` | **Nuevo.** PDF de muestra con datos extremos para revisión visual. |

**Decisión sobre v1.** `src/v1/` también importa este servicio, pero le llega por
la rama de conversión, que produce la misma estructura que consume v2. Se modificó
el servicio compartido en vez de duplicarlo, con un test específico del formato v1
que deja constancia de que sigue funcionando. Duplicar 880 líneas habría repetido
el error que ya existe en `factura-pdf.service.ts`, un gemelo copy-paste de 824
líneas.

### Qué soluciona

Ningún importe se parte ni invade la columna vecina, por grande que sea. Cada
tabla cierra con su subtotal, que antes había que ir a buscar al resumen final. Y
la sección consolidada muestra por fin las tasas y los totales reales.

### Cómo comprobarlo

La maquetación se verifica con **aserciones sobre la geometría** en
`pdf-table.spec.ts`: que la suma de anchos nunca exceda el ancho útil y que dos
celdas de la misma fila no se pisen. Aplicadas al código anterior, fallarían.

Para revisión visual:

```bash
cd psearch-back
npx ts-node src/scripts/generate-sample-closing-pdf.ts   # → tmp/cierre-muestra.pdf
```

Genera un cierre con importes de nueve cifras, nombres de 75 caracteres, ocho
monedas, 320 filas y campos nulos. Después, exportar un cierre real con importes
de siete cifras o más y uno de un negocio multimoneda.

---

<a name="fase-6"></a>
## 7. Añadido — Factura PDF: el mismo defecto, en otro sitio

### Por qué se hizo

No estaba en la revisión. Salió al terminar la Fase 5: `factura-pdf.service.ts`
era una **copia literal** del generador de cierres —mismos márgenes, misma
paleta, mismo motor de tablas de anchos fijos—, así que arrastraba exactamente el
defecto que se acababa de corregir. Las facturas con importes grandes iban a
fallar igual.

### Qué es y dónde se usa

Genera la **factura en PDF de una venta**. La cadena completa:

```
"Ver factura" en el diálogo de detalles de una venta   (sales/details-dialog.tsx)
  → GET /api/v2/sales/:saleId/factura
  → InvoiceController.descargarFactura
  → InvoiceService.generar
  → FacturaPdfService.generateFacturaPdf
```

El PDF se abre en una pestaña nueva. Solo se genera para ventas **completamente
pagadas**; en caso contrario el endpoint responde 400 y la interfaz lo explica.

El documento tiene cabecera con número y estado, datos del negocio y del cliente,
tabla de productos, sección de mensajería, bloque de totales y tabla de pagos
multimoneda.

### Qué estaba mal y por qué

Los tres bloques con importes tenían el problema, y uno era **peor que en el
cierre**:

1. **Tabla de productos.** "Precio Unit." y "Subtotal" tenían unos 92 pt útiles,
   pero cada celda no renderizaba solo el importe: metía el código de moneda
   dentro (`CUP 1,234,567.89`). En el cierre la moneda tenía columna propia; aquí
   competía por el espacio del propio número.
2. **Tabla de pagos.** Cinco columnas de ancho fijo, con "Monto" y "Equivalente"
   por debajo de lo que un importe largo necesita.
3. **Bloque de totales.** Filas de 22 pt fijos, con la etiqueta y el importe
   dibujados en la misma coordenada: la etiqueta con la mitad del ancho y el
   importe con el ancho **completo**, alineado a la derecha. Los dos rangos se
   pisaban. En la barra verde TOTAL, la palabra y la cifra podían solaparse.

### Qué se hizo

| Archivo | Cambio |
|---|---|
| `common/factura-pdf.service.ts` | Las dos tablas migradas al motor compartido. `totals` reescrito con altos medidos y ajuste de cuerpo. Eliminada su copia privada del motor antiguo (62 líneas idénticas a las ya sustituidas en el cierre). |
| `common/factura-pdf.service.spec.ts` | **Nuevo.** 8 smoke tests, incluidos importes de nueve cifras, pagos multimoneda y paginación con 150 líneas. |
| `scripts/generate-sample-closing-pdf.ts` | Genera también `tmp/factura-muestra.pdf`. |

**El código de moneda pasa al encabezado de la columna** (`Precio unit. (CUP)`,
`Subtotal (CUP)`, `Equivalente (CUP)`). Libera el ancho que el importe necesitaba
y quita una redundancia: en una factura todos los importes comparten moneda, así
que repetirla en cada fila gastaba espacio sin informar de nada.

### Qué soluciona

Las facturas con importes grandes se leen bien, igual que los cierres. Ambos
generadores comparten ahora un solo motor de tablas, así que el próximo arreglo
de maquetación se hace una vez y sirve para los dos.

### Cómo comprobarlo

```bash
cd psearch-back
npx ts-node src/scripts/generate-sample-closing-pdf.ts   # → tmp/factura-muestra.pdf
```

Después, abrir la factura de una venta real desde el diálogo de detalles, y
probar una con pagos en varias monedas y referencias largas.

Detalle completo en `migration_doc/142`.

---

<a name="defectos"></a>
## 8. Defectos de fondo corregidos de paso

Ninguno estaba en el encargo; todos aparecieron al abrir las rutas que había que
tocar de todos modos, y todos afectaban a la corrección de los datos mostrados.

| Defecto | Dónde | Fase |
|---|---|---|
| El rango de fechas personalizado **perdía el último día** por parseo UTC combinado con normalización local | `analytics.service.ts` | 3 |
| El total por trabajador **sumaba CUP + USD + MLC** en una sola cifra | `analytics.service.ts` | 3 |
| `week` eran los últimos 7 días rodantes, no la semana calendario | `analytics.service.ts` | 3 |
| El historial de inventario mostraba **todos los importes en pesos colombianos** | `inventory-history-item.tsx` | 4 |
| La vista de negocio del historial **no podía mostrar salidas** (`stockIncrease` fijo) | `lib/api/inventory.ts` | 4 |
| El enum de tipos de movimiento tenía **4 de los 6** del backend | `lib/types/inventory.ts` | 4 |
| La sección consolidada del PDF **imprimía siempre guiones y ceros** | `sale.controller.ts` | 5 |
| El resumen por moneda del PDF tenía **10 pt de solape** entre dos columnas | `closing-pdf.service.ts` | 5 |
| La factura arrastraba el mismo defecto, agravado por meter la moneda dentro de cada celda de importe | `factura-pdf.service.ts` | Añadido |
| El bloque de totales de la factura dibujaba etiqueta e importe en rangos que se pisaban | `factura-pdf.service.ts` | Añadido |
| «Inicializar presupuestos» **daba éxito sin hacer nada** si ya existía alguna cuenta | `currency-account.service.ts` | 2 (se elimina) |
| Las listas del panel **afirmaban «no hay datos»** mientras cargaban | `recent-*-table.tsx` | 1 |
| La tabla de desempeño **parpadeaba** al cambiar de filtro | `use-analytics.ts` | 3 |
| La normalización de códigos de moneda estaba **duplicada** | `sale.service.ts` | 3 |

---

<a name="fuera"></a>
## 9. Qué quedó fuera

Se deja anotado para que no haya que redescubrirlo.

1. **`downloadBlob` duplicado.** Las páginas de cierre diario y mensual definen
   cada una su copia local existiendo ya `lib/download.ts`. Cinco minutos, no se
   tocó por no ampliar el diff de la Fase 5.

2. **Cinco `formatCurrency` locales con locale `es-CO`.** Conviven con el
   `formatMoney` compartido, que formatea en `en-US`: el mismo importe se ve
   distinto según la pantalla (`1.234,50` frente a `1,234.50`). Los dos que
   caían en las rutas tocadas se corrigieron (Fases 3 y 4); quedan en
   `business-products-table-columns.tsx`, `edit-business-product-dialog.tsx`,
   `details-dialog.tsx`, `provider-details-dialog.tsx` y
   `provider-products-table.tsx`.

3. **Los filtros no se persisten en la URL.** Ni en el historial de inventario ni
   en el desempeño de ventas. Hacerlo haría los enlaces compartibles y
   sobreviviría al refresco; conviene resolver el patrón una vez y aplicarlo
   también a la tabla de ventas, donde ya figura pendiente en el ROADMAP.

4. **El Excel de cierre puede arrastrar el mismo problema de números.** Define
   sus propias columnas y anchos en `sale.controller.ts` sin reutilizar nada del
   PDF. No se revisó.

5. **`APP_TIMEZONE` sigue sin aplicarse de forma transversal.** Los rangos de
   fecha asumen que el proceso corre en la zona del negocio, que es la convención
   que ya seguían los cierres. Endurecer las tres rutas con `Intl.DateTimeFormat`
   y `APP_TIMEZONE` es un cambio transversal que merece su propia entrada.

6. **La sección de desempeño sigue en Trabajadores.** Como se indicó, en el
   futuro se moverá a Análisis; por ahora se dejó donde estaba.

---

*Fases implementadas y verificadas una a una entre el 25 y el 26 de julio de
2026. Cambios de backend documentados en
`psearch-back/src/v2/migration_doc/139-142`.*
