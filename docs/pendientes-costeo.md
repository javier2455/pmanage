# Vistas de costeo retiradas — pendientes de reponer

> **Estado:** retiradas de la interfaz el **8 de agosto de 2026** a petición del equipo.
> El backend sigue calculando y enviando todos los datos; lo único que se quitó es el
> render. Reponerlas es volver a pintar, no volver a implementar.

Este documento existe para que el trabajo no se pierda: qué se quitó, por qué se había
puesto, qué aportaba y qué hace falta para que vuelva a tener sentido mostrarlo.

---

## Contexto: por qué existía este bloque

Las tres piezas retiradas son la cara visible del **costeo FIFO por capas**
(features 42–45 del [estado del proyecto](estado-proyecto.md), backend `143`, `145`,
`146`, `147`). Todo ese trabajo respondía a una sola pregunta del dueño:

> **"¿cuánto gané de verdad con esto?"**

Antes, el costo de un producto era un único `entryPrice` que **cada compra sobrescribía**.
Una compra más cara borraba el costo real de lo que aún quedaba de la compra anterior, y
el margen salía mal. El costeo por capas convirtió el costo en lotes: cada entrada de
inventario crea una capa con su cantidad y su costo, cada venta consume capas en orden de
llegada y **congela** el costo de lo que consumió. Aunque la tasa de cambio o el precio de
compra cambien después, el margen histórico ya no se mueve.

Las vistas retiradas eran las tres formas de leer ese dato.

---

## 1. Card "Costo de la mercancía vendida" — cierre diario y mensual

**Dónde estaba:** componente `GrossProfitBlock` dentro de
[closing-financial-summary.tsx](../src/components/accounting-close/closing-financial-summary.tsx),
renderizado en las páginas de cierre
[daily](../src/app/dashboard/accounting-close/daily/page.tsx) y
[monthly](../src/app/dashboard/accounting-close/monthly/page.tsx).

**Qué mostraba:** Ingresos → Costo de lo vendido → **Ganancia bruta**, con el porcentaje
de margen en un badge, la conversión a la moneda elegida en el selector del consolidado, y
un aviso cuando había líneas vendidas sin costo registrado.

**Qué aportaba:** es la diferencia entre *facturar* y *ganar*. El balance del cierre
(ventas − gastos) puede salir positivo mientras el negocio pierde dinero en cada unidad
que vende, y sin esta card no había forma de verlo desde la aplicación.

**Por qué iba en su propia card y no sumada al balance:** son dos criterios contables
distintos y **no se suman**. El balance sigue la caja (una compra pesa el día que se paga)
y este bloque el devengo (el costo pesa el día que la mercancía se vende). Restar el costo
dos veces —una como gasto de la compra, otra como costo de lo vendido— es el error clásico
al juntar ambos criterios. La nota al pie de la card lo explicaba, y esa separación hay que
conservarla si se repone.

**Qué sigue funcionando hoy:**

- El backend calcula `costSummary` en `getClosingData` y lo devuelve en los cuatro
  contratos de cierre.
- **El PDF y el Excel del cierre siguen mostrando la sección completa**
  ([closing-pdf.service.ts](../../psearch-back/src/common/closing-pdf.service.ts),
  `costSummarySection`, y el bloque "COSTO DE LA MERCANCÍA VENDIDA" del Excel en
  `sale.controller.ts`). **Hay divergencia deliberada entre pantalla e informes.**
- El tipo `ClosingCostSummary` sigue declarado en
  [accounting-close.ts](../src/lib/types/accounting-close.ts) y las páginas siguen usando
  `costSummary.inventoryValue` para la tarjeta de valor de almacén.

**Cómo reponerla:** recuperar `GrossProfitBlock` del historial de git, volver a declarar
el prop `costSummary?: ClosingCostSummary | null` en `ClosingFinancialSummaryProps` y
pasarlo desde las dos páginas con `costSummary={data?.costSummary}`.

---

## 2. Columna "Costo medio" — inventario actual

**Dónde estaba:** columna `averageCost` en
[current-inventory-table-columns.tsx](../src/components/inventory/current-inventory-table-columns.tsx).

**Qué mostraba:** el costo medio ponderado de las unidades vivas en almacén, más un
subtexto con las unidades sin costo conocido cuando las había.

**Qué aportaba:** responde a *"¿cuánto me costó lo que tengo guardado?"*. No coincide con
el último precio pagado al proveedor cuando todavía queda mercancía de una compra anterior
más barata — y esa discrepancia era justamente el punto: es el número real, no el último.

**Qué sigue funcionando:** el backend envía `costing.averageCost` y
`costing.uncostedQuantity` en cada entrada de inventario; el tipo
`CurrentInventoryCosting` sigue declarado en
[inventory.ts](../src/lib/types/inventory.ts).

---

## 3. Columna "Margen" — inventario actual

**Dónde estaba:** columna `margin` en el mismo archivo.

**Qué mostraba:** el porcentaje que queda del precio de venta después de pagar la
mercancía, calculado sobre el costo medio del stock. En **rojo** cuando era negativo.

**Qué aportaba:** el rojo era la alarma. Un margen negativo es vender por debajo del costo
—una pérdida por cada unidad que sale— y esta columna era la única forma de detectarlo de
un vistazo sobre todo el catálogo. Existe una notificación de `negative_margin` que avisa
al vender, pero avisa *después* de la venta; la columna permitía corregir el precio antes.

**Qué sigue funcionando:** el backend envía `costing.marginPct`.

---

## Qué NO se retiró

| Vista | Estado |
|---|---|
| **Rentabilidad lote a lote** ([product-lot-profitability.tsx](../src/components/inventory/product-lot-profitability.tsx)) | ✅ Intacta — por cada compra: unidades vendidas, qué costaron, qué se cobró y el margen |
| Sección de costo en el **PDF del cierre** | ✅ Intacta |
| Bloque de costo en el **Excel del cierre** | ✅ Intacto |
| Tarjeta de **valor del inventario** en los cierres | ✅ Intacta (usa `costSummary.inventoryValue`) |
| Notificación de **margen negativo** al vender | ✅ Intacta |
| Todo el cálculo de backend (capas, consumos, COGS) | ✅ Intacto |

---

## Antes de reponerlas: el dato de fondo

Diagnóstico sobre `dveloxso_psearch_develop` el **8 de agosto de 2026**:

| Métrica | Valor |
|---|---|
| Líneas de venta con costo registrado | **6** |
| Líneas de venta totales | **208** |
| Capas de costo vivas | 4 |
| Consumos registrados | 7 |

**El backfill del costeo histórico nunca se ejecutó.** La migración existe
(`20260727130000-BackfillInventoryCostLayers.ts`) pero esa base no tiene siquiera tabla
`migrations`: su esquema se ha ido creando con `synchronize`. Solo tienen costo las ventas
posteriores a la implementación del costeo.

Con esa cobertura, las tres vistas retiradas mostraban mayoritariamente guiones (`—`) y una
ganancia bruta bastante más alta que la real, avisada con la nota de *"202 líneas vendidas
no tienen costo registrado"*. **Reponerlas sin resolver antes el backfill devolvería el
mismo problema.**

### Tareas previas

1. **Reconciliar el historial de migraciones** de las bases existentes (registrar como
   aplicadas las que el esquema ya tiene, sin ejecutarlas) para poder correr
   `migration:run` sin riesgo. Ver
   [150-sale-payment-change-and-tips.md](../../psearch-back/src/v2/migration_doc/150-sale-payment-change-and-tips.md)
   § *Lo que NO cubre*.
2. **Ejecutar el backfill** una sola vez y verificar que `sale_items.unit_cost` se rellena
   para el histórico. Ojo: su `up()` **no limpia antes de insertar**, así que ejecutarlo dos
   veces duplica las capas.
3. **Comprobar la cobertura** (`SELECT COUNT(*) FROM sale_items WHERE unit_cost IS NOT NULL`
   frente al total) antes de volver a mostrar nada.
4. Reponer las tres vistas y contrastar los números de pantalla con los del PDF del cierre,
   que hoy son la única fuente visible de esta información.
