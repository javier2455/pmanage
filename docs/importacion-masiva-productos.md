# Importación masiva de productos — fuente de la verdad

Documento de referencia de la funcionalidad de **importación masiva de productos**
(bulk import) implementada en `pmanage` (frontend) y `psearch-back` (backend v2).
Describe qué hace, cómo funciona, la plantilla, el contrato de API, las reglas y
datos importantes a tener en cuenta, y lo que queda pendiente respecto a esta
primera versión (MVP).

> Rama de trabajo: `feat-upload-products` (en ambos repos).

---

## 1. Para qué sirve

Un negocio que empieza de cero registra sus productos uno a uno sin problema.
Pero un negocio que ya opera con **100+ productos** tendría que insertarlos de
uno en uno (formulario individual + asignación por negocio): lento y tedioso.

Esta funcionalidad permite **cargar una masa de productos de una sola vez** desde
un archivo **Excel (`.xlsx`) o CSV** que el usuario rellena a partir de una
**plantilla única y fija**. El sistema los registra automáticamente, validando la
estructura y avisando —de forma clara y accionable— qué está mal y cómo
arreglarlo antes de confirmar.

---

## 2. Conceptos del dominio (importante)

El sistema **separa dos cosas** y la importación toca ambas:

| Concepto | Entidad | Qué es | Alcance |
|---|---|---|---|
| **Catálogo** | `Product` | Ficha del producto: nombre, descripción, unidad, imagen | **Por usuario** (dueño). Único por `(name, userId)` |
| **A la venta** | `BusinessProduct` | El producto puesto a la venta en un negocio: precio, stock, costo, categoría, mayorista… | **Por negocio**. Único por `(business, product)` |
| **Categoría** | `Category` | Agrupación de productos | **Por negocio**. Se referencia por nombre en el import |

Consecuencias que hay que tener presentes:

- El **catálogo pertenece al dueño del negocio**, no a quien importa. Si un
  trabajador importa, los `Product` se crean bajo el `userId` del **dueño**
  (consistente con cómo el resto del sistema lista los productos del negocio).
- La **categoría se resuelve por nombre** dentro del negocio (el usuario escribe
  "Granos", no un UUID). Si no existe, **se crea automáticamente**.
- Un mismo `Product` de catálogo puede estar a la venta en varios negocios; por
  eso el import distingue "crear catálogo" de "poner a la venta".

---

## 3. Cómo funciona (flujo end-to-end)

### 3.1 Frontend — asistente `/dashboard/business/products/import`

La UI tiene **dos tarjetas**: la 1.ª para **cargar los datos** y la 2.ª para
**configurar y revisar** (las opciones aparecen ahí, ya con el archivo cargado).

1. **Cargar los datos** (tarjeta 1) — tres vías, todas terminan en el mismo grid:
   - **Descargar la plantilla** (un botón con menú desplegable: **Excel `.xlsx`** o
     **CSV**; ambas salen de la misma fuente `templateRows`) y **subir el archivo**
     completado como `.xlsx` o CSV: CSV con `papaparse` (auto-detecta `,`/`;`); Excel
     con **SheetJS** (carga diferida), cuya primera hoja se convierte a la misma tabla
     `{ fields, data }` (`matrixToTable`).
   - **Copiar de otro negocio**: trae los productos a la venta de otra sucursal del
     usuario y precarga el grid (el stock se carga en 0). Ver §9.
2. **Configurar** (tarjeta 2, tras cargar): aquí se eligen las opciones —así el usuario
   decide **después** de ver sus datos. Todas re-validan el grid al instante:
   - **Destino**: `catalog+sale` (crea/reutiliza en el catálogo **y** pone a la venta
     con precio+stock) o `catalog` (solo catálogo). Si el archivo no trae precio/stock,
     se cambia a "Solo al catálogo" aquí mismo (por eso la opción vive tras la carga).
   - **Estrategia ante duplicados** (solo con venta): **Omitir** o **Actualizar**. Ver §7.
   - **Registrar como gasto** (solo con venta): checkbox de reposición de stock. Ver §7.
3. **Validación de estructura** (encabezados): si faltan columnas obligatorias **para
   el destino elegido**, se avisa con el detalle; el grid de revisión no aparece hasta
   resolverlo (cambiando el destino o el archivo). Columnas desconocidas se avisan con
   sugerencia ("¿quisiste decir `precio`?").
4. **Vista previa editable** (grid, en la tarjeta 2): valida **cada celda** y resalta
   en rojo los errores con el motivo; el usuario **corrige inline** y se re-valida al
   instante. Contadores: total / válidas / con error / duplicadas.
5. **Continuar → confirmación (dry-run integrado)**: al pulsar **Continuar** se
   ejecuta un `dryRun` en el servidor (comprueba categorías, duplicados ya a la
   venta y cupo del plan **sin persistir nada**) y se muestra un **panel de
   revisión** con los conteos proyectados (a crear, a poner a la venta, a
   actualizar, categorías nuevas, gastos, cupo restante). Cualquier edición posterior
   invalida esa revisión y obliga a re-confirmar.
6. **Confirmar e importar** → persiste. Muestra un **reporte** final (creados,
   reutilizados, puestos a la venta, actualizados, categorías creadas, gastos,
   omitidos, errores y cupo restante del plan).

### 3.2 Backend — `importProductsIntoBusiness` (transacción única)

Todo ocurre dentro de **una transacción** (`queryRunner`):

1. **Carga el negocio** y verifica **acceso** (dueño, trabajador o admin `rol.id === 5`).
2. **Clasifica las filas** (puro, sin BD): valida nombre/precio/stock según destino
   y **deduplica por nombre** dentro del archivo (la 2.ª aparición se omite).
3. **Aplica el límite del plan** (`maxProducts`): cuenta el catálogo existente del
   dueño + los nuevos a crear; si excede → `ForbiddenException` y **no persiste
   nada** (all-or-nothing).
4. **Categorías por nombre**: precarga las del negocio y **crea las faltantes**
   (find-or-create, case-insensitive, con caché por request).
5. **Catálogo**: precarga los `Product` existentes por `(name, userId)` y **crea
   los faltantes en lote** (sin imagen). El DTO del backend **aún acepta** un campo
   `imageUrl` (URL http/https, solo al crear) pero la plantilla actual **no** envía
   esa columna: quedó como campo **latente** (ver §9, decisión de quitar `imagen_url`).
6. **A la venta** (solo `catalog+sale`): crea los `BusinessProduct` (precio, stock,
   costo, mayorista, categoría) y escribe el **`InventoryHistory` inicial
   (`INITIAL_STOCK`) en la misma transacción**. El **costo** se **convierte a CUP**
   con la tasa del negocio si la fila trae una `moneda` distinta de CUP (las tasas
   se cargan una sola vez; una moneda sin tasa hace fallar solo esa fila). Para los
   que **ya están a la venta**, según `duplicateStrategy`:
   - `skip` (por defecto) → se **omiten** (no se toca su precio/stock).
   - `update` → se **actualizan** precio y stock (los campos opcionales solo se
     pisan si la fila los trae, para no borrar configuración previa) y se registra
     un **`InventoryHistory` de tipo `ADJUSTMENT`** con el delta de stock.
7. **Gasto opcional** (si `registerAsExpense`): por cada alta nueva con costo y stock
   > 0, crea un `Expense` de "Reposición de stock" en la misma transacción (sin
   eventos). Ver §7 y §9.
8. `dryRun` → **rollback** devolviendo los conteos proyectados; si no, **commit**.

> **Clave de rendimiento y correctitud:** el import **NO emite** el evento
> `business-product.changed` por fila. Ese evento, en el alta individual, dispara
> listeners que crean inventario **y notificaciones externas** (SMS/WhatsApp/email
> vía DveloxSoft cuando `stock === 0`). Con 100+ filas eso serían cientos de
> llamadas externas y, además, los eventos se emiten *pre-commit* desde otra
> conexión (riesgo de filas huérfanas si hay rollback). Por eso el import escribe
> el inventario **directamente dentro de la transacción** y sin eventos.

---

## 4. La plantilla

**Una sola plantilla fija** (no por negocio). Se descarga en **Excel (`.xlsx`)** por
defecto —o en CSV— y puede completarse y subirse como **Excel o CSV**. Encabezados en
español:

| Columna | Campo backend | Obligatoria | Tipo / valores | Notas |
|---|---|---|---|---|
| `nombre` | `productName` | **Sí** | texto (máx. 255) | Único; no repetir |
| `descripcion` | `productDescription` | No | texto | |
| `unidad` | `productUnit` | **Sí** | `kg, lb, g, L, mL, ud` | Se normaliza (`l`→`L`, `ml`→`mL`, `unidad`→`ud`) |
| `categoria` | `categoryName` | No | texto | Se crea si no existe |
| `precio` | `price` | **Sí\*** | número > 0 (CUP) | \*Solo requerido si destino = a la venta. Siempre en CUP |
| `costo` | `entryPrice` | No | número ≥ 0 | Para calcular ganancias. En la moneda de `moneda` |
| `moneda` | `currency` | No | `CUP, USD, EURO, MLC, …` | Moneda del **costo** (por defecto CUP). Ver §7 (multimoneda) |
| `stock` | `stock` | **Sí\*** | número ≥ 0 | \*Solo requerido si destino = a la venta |
| `umbral_alerta_stock` | `stockAlertThreshold` | No | entero ≥ 1 | Función **Pro** |

> **Columnas retiradas de la plantilla** (ver §9 para el detalle y cómo reactivar):
> `imagen_url` (el usuario no conoce las URLs) y las de **mayoreo/modelo de venta**
> —`precio_mayorista`, `cantidad_minima_mayorista`, `modelo`— porque la **venta
> mayorista automática aún no está implementada** en el punto de venta, así que pedir
> esos datos solo confundía. El backend los sigue aceptando (latentes).

**Formato del archivo:**
- La plantilla se genera con **BOM UTF-8** para que Excel muestre bien los acentos.
- Se aceptan **coma decimal** (formato ES: `600,50`) y punto decimal (`600.50`).
- CSV: el parser **auto-detecta el separador** (`,` o `;`), lo que cubre el CSV que
  guarda Excel en configuración regional en español.
- Excel: se lee la **primera hoja**; la 1.ª fila debe ser la de encabezados. Las
  celdas se leen ya formateadas a texto (`raw:false`), respetando los mismos
  encabezados/aliases que el CSV.
- Aliases de encabezado aceptados (además del canónico): p. ej. `producto`,
  `descripción`, `unit`, `categoría`, `precio_venta`, `existencia`, etc.
  (ver `IMPORT_COLUMNS` en `src/lib/products-import.ts`).

---

## 5. Validación

### 5.1 Estructura (encabezados) — estricta
Si falta una columna **obligatoria**, el archivo se **rechaza** y se listan las
columnas faltantes con su ayuda. Las columnas **desconocidas** se avisan (con
sugerencia por cercanía) y se ignoran. La comparación normaliza acentos,
mayúsculas y espacios.

### 5.2 Por fila — con corrección
Cada celda se valida con **mensajes accionables** ("qué está mal y cómo
arreglarlo"), p. ej.:
- `Fila · unidad: "Kg" no es una unidad válida. Usa una de: kg, lb, g, L, mL, ud.`
- `precio: debe ser mayor que 0.`
- `Falta el stock (requerido para poner a la venta).`

El usuario **corrige en la vista previa** y se re-valida al vuelo. Solo se envían
al backend las filas **sin errores de campo**. El backend, además, deduplica y
omite las que ya están a la venta o repetidas en el archivo.

### 5.3 Valores no reconocidos: categoría, unidad y moneda (¡importante!)

Los tres se comportan **distinto** cuando el valor no existe en el sistema:

| Campo | Si el valor NO existe en el sistema | ¿Se crea solo? |
|---|---|---|
| **`categoria`** | Se **crea automáticamente** una categoría nueva (por negocio) con ese nombre (find-or-create, case-insensitive). No es error. | ✅ Sí |
| **`unidad`** | **Error de fila** (la unidad es un catálogo **fijo** del sistema: `kg, lb, g, L, mL, ud`). Se aceptan alias/normalización (`l`→`L`, `unidad`→`ud`), pero un valor fuera de la lista marca la celda en rojo y **no se importa** hasta corregirlo. | ❌ No |
| **`moneda`** | **Error de fila**. La moneda debe (a) ser un código conocido y (b) tener **tasa configurada** en el negocio (`MonetaryExchange`). Si el código no se reconoce, lo marca el **frontend**; si el código es válido pero el negocio **no tiene esa tasa**, lo rechaza el **backend** (visible en el dry-run/reporte) y esa fila no entra; el resto continúa. | ❌ No |

**Por qué esta diferencia:** la **categoría** es un dato libre y propio de cada
negocio (tiene sentido crearla al vuelo, como al dar de alta un producto suelto). La
**unidad** es un enum cerrado del dominio (permitir "cajas" o "paquete" rompería
cálculos de inventario/venta). La **moneda** depende de una **tasa de cambio** que el
dueño configura aparte; el import **no inventa tasas** (convertir con una tasa
inexistente falsearía los costos), así que exige que exista primero.

> Consejo para el usuario: si vas a usar monedas extranjeras en el `costo`, configura
> antes las tasas del negocio (Tasas de cambio). Las categorías, en cambio, puedes
> escribirlas libremente: se crean al importar.

---

## 6. Contrato de API

### Endpoint
```
POST /v2/businesses/:id/products/bulk        (?dryRun=1 para validar sin persistir)
```
- **Guards:** `JwtAuthGuard`, `PlanActiveGuard`, `BusinessArchivedGuard`.
- **Acceso:** dueño del negocio, trabajador con acceso, o admin (`rol.id === 5`).

### Body
```jsonc
{
  "items": [
    {
      "productName": "Arroz Blanco",     // requerido
      "productUnit": "kg",               // requerido (kg|lb|g|L|mL|ud)
      "productDescription": "…",         // opcional
      "categoryName": "Granos",          // opcional (find-or-create)
      "price": 150,                      // requerido si target = catalog+sale (CUP)
      "stock": 100,                      // requerido si target = catalog+sale
      "entryPrice": 120,                 // opcional (en la moneda de `currency`)
      "currency": "USD",                 // opcional (moneda del costo; default CUP)
      "stockAlertThreshold": 5           // opcional (Pro)
      // El DTO también acepta wholesalePrice, minimumWholesaleQuantity y productModel
      // (latentes): el front NO los envía porque se retiraron de la plantilla (§9).
    }
  ],
  "target": "catalog+sale",       // "catalog" | "catalog+sale" (default catalog+sale)
  "mode": "tolerant",             // "strict" | "tolerant" (el front envía tolerant)
  "duplicateStrategy": "skip",    // "skip" | "update" (default skip; solo aplica con venta)
  "registerAsExpense": false      // opcional; registra la entrada como gasto (solo con venta, altas nuevas)
}
```
> El body usa un DTO anidado con `@ValidateNested()` + `@Type()`; es obligatorio
> por el `ValidationPipe` global (`whitelist + forbidNonWhitelisted`): cualquier
> campo extra se rechaza.
>
> El DTO **aún declara** un campo opcional `imageUrl` (URL http/https, solo al
> crear), pero el frontend ya **no lo envía** (columna retirada, §9). Queda
> latente por si se reactiva.

### Respuesta — `ImportResult`
```jsonc
{
  "message": "Importación completada",
  "data": {
    "dryRun": false,
    "target": "catalog+sale",
    "totalRows": 120,
    "productsCreated": 100,          // Product de catálogo creados
    "productsReused": 20,            // ya existían en el catálogo
    "businessProductsCreated": 118,  // puestos a la venta (nuevos)
    "businessProductsUpdated": 0,    // actualizados (duplicateStrategy = update)
    "businessProductsSkipped": 2,    // ya estaban a la venta y se omitieron (strategy = skip)
    "categoriesCreated": 5,
    "expensesCreated": 100,          // gastos de reposición creados (si registerAsExpense)
    "planLimit": 200,                // null = ilimitado
    "remainingQuota": 80,            // cupo restante tras el import
    "skipped": [{ "row": 7, "productName": "…", "reason": "…" }],
    "errors":  [{ "row": 3, "productName": "…", "reason": "…" }]
  }
}
```

### Errores relevantes
- `403 PRODUCT_LIMIT_REACHED: …` — el archivo excede el `maxProducts` del plan
  (rechazo total, no persiste nada).
- `403 No tienes acceso a este negocio`.
- `404 Business … not found`.

---

## 7. Reglas y datos importantes a tener en cuenta

- **Atomicidad (all-or-nothing).** Todo se hace en una transacción. Si algo falla
  (límite de plan, conflicto de unicidad), **no queda nada escrito**.
- **Límite de plan.** Se aplica `Plan.maxProducts` (free 10 / basic 50 / premium
  200 / enterprise `null` = ilimitado). **Antes** no se validaba en ningún punto
  del sistema; el import es el primer lugar donde se enforce. Un archivo que
  exceda el cupo se rechaza completo e informa cuánto puedes añadir.
- **Moneda (multimoneda del costo).** El **precio de venta** siempre se interpreta
  y guarda en **CUP**. El **costo** (`costo`/`entryPrice`) puede venir en otra moneda
  vía la columna `moneda` (`USD`, `EURO`, `MLC`, `CLASICA`, `CUP_TRANSFERENCIA`,
  `CAD`, `GBP`, `CHF`, `MXN`, `JPY`); el backend lo convierte a CUP con la **tasa
  configurada del negocio** (`MonetaryExchange`) y guarda el valor en CUP en
  `BusinessProduct.entryPrice`, dejando la moneda original en el historial de
  inventario. Si una fila usa una moneda **sin tasa configurada**, esa fila **no se
  importa** (error de fila; el resto continúa). No hay override de tasa por fila:
  se usa la tasa vigente del negocio al momento de importar.
- **Sin imágenes en la carga.** La importación **no** gestiona imágenes (la columna
  `imagen_url` se retiró, §9). Cada producto se crea sin imagen; se le añade luego
  desde su edición individual.
- **Sin notificaciones ni fan-out.** El import no emite `business-product.changed`,
  así que no dispara notificaciones de stock ni historial de precios por fila. El
  inventario inicial sí se registra (dentro de la transacción).
- **Gasto opcional (reposición de stock).** Si se marca `registerAsExpense`, cada
  producto **nuevo** a la venta con costo y stock > 0 genera un gasto de "Reposición
  de stock" (`costo × stock`, moneda original), dentro de la misma transacción. **No**
  se crea gasto para filas que solo se actualizan (merge), para no duplicar. Pensado
  para el **inventario inicial**; deja la contabilidad cuadrada (entra el inventario y
  queda registrado el egreso).
- **Deduplicación:**
  - Catálogo: por `(name, userId)` — se reutiliza el existente; nombres repetidos
    dentro del archivo se colapsan (1.ª aparición) y el resto se omite.
  - A la venta: por `(business, product)`. Si ya está a la venta, el resultado
    depende de `duplicateStrategy`: `skip` lo **omite** (no pisa precio/stock) o
    `update` **reemplaza** precio/stock (y registra un ajuste de inventario). Los
    campos opcionales solo se actualizan si la fila los trae.
- **Tope de 500 filas** por importación (validado en front y backend).
- **Dueño del catálogo.** Los `Product` se crean bajo el `userId` del **dueño del
  negocio**, aunque quien importe sea un trabajador.

---

## 8. Mapa del código

### Frontend (`pmanage`)
| Archivo | Rol |
|---|---|
| `src/app/dashboard/business/products/import/page.tsx` | Ruta del asistente |
| `src/components/products/import-products-client.tsx` | Asistente completo: subida (CSV + Excel), **copiar de otro negocio**, preview, confirmación (dry-run) y reporte. Contiene `matrixToTable` (Excel→tabla) y `handleCopyFromBusiness` |
| `src/lib/api/business.ts` | `getAllProductOfMyBusinesses` — fuente de datos de "copiar de otro negocio" (reutilizado) |
| `src/lib/products-import.ts` | **Núcleo**: columnas, normalización de encabezados, validación por celda, plantilla (`templateRows` → `buildTemplateCsv`/`downloadTemplateCsv` y `downloadTemplateXlsx`) |
| `xlsx` (SheetJS) | Dependencia para leer `.xlsx` en el cliente; se importa con `await import("xlsx")` (carga diferida). Instalada desde el CDN oficial parcheado |
| `src/lib/products-import.test.ts` | Tests de validación de estructura y filas |
| `src/lib/api/product.ts` | `importProducts(businessId, payload, dryRun)` |
| `src/lib/routes/product.ts` | `importProductsInBusiness(businessId)` |
| `src/hooks/use-product.ts` | `useImportProductsMutation()` (invalida catálogo, inventario, alertas) |
| `src/lib/types/product.ts` | `ImportProductItem`, `ImportResult`, etc. |
| `src/app/dashboard/business/products/page.tsx` | Botón **"Importar"** |

### Backend (`psearch-back`)
| Archivo | Rol |
|---|---|
| `src/v2/business/business.controller.ts` | Endpoint `POST :id/products/bulk` |
| `src/v2/business/business.service.ts` | `importProductsIntoBusiness`, `assertBusinessAccess`, `resolveMonetaryRate` (costo→CUP), `findOrCreateExpenseCategory` (gasto de reposición); fixes en `associateProducts` |
| `src/v2/business/dto/import-products.dto.ts` | DTO anidado (incluye `currency`, `duplicateStrategy`) + tipos `ImportResult` |
| `src/v2/products/business-product-inventory.listener.ts` | Referencia del `InventoryHistory` replicado en la transacción |

---

## 9. Decisiones de diseño (por qué así)

- **Vista previa con corrección** en vez de "rechazar todo si no cumple": con 100+
  filas, un rechazo opaco es inusable. Se mantiene estricto con la **estructura**
  (columnas), pero por **fila** se guía al usuario a corregir.
- **Inventario dentro de la transacción, sin eventos**: evita el fan-out de
  notificaciones externas y el race pre-commit del listener.
- **Categoría por nombre (find-or-create)**: el usuario escribe nombres, no UUIDs.
- **`maxProducts` se aplica aquí**: el import es la vía natural para saltarse el
  tope implícito del plan; se cierra ese hueco.
- **Dry-run como confirmación obligatoria** (Fase 2): antes de persistir se muestra
  la proyección real calculada por el backend (misma transacción, con rollback),
  no una estimación del cliente. Editar el grid invalida la revisión.
- **Merge = reemplazo, con ajuste de inventario** (Fase 2): actualizar pisa
  precio/stock (consistente con el alta individual) y registra un `ADJUSTMENT`
  para no perder la trazabilidad del cambio de stock. Sumar stock (restock) se
  deja como posible variante futura.
- **Excel `.xlsx` + CSV, misma tubería** (Fase 2): el `.xlsx` se lee en el cliente
  con **SheetJS** (`await import("xlsx")`, carga diferida para no engordar el bundle
  inicial) y su primera hoja se convierte con `matrixToTable` al mismo
  `{ fields, data }` que produce papaparse. Así **una sola** ruta de validación y
  vista previa sirve para ambos formatos. Se eligió leer en el navegador (no en el
  servidor) para conservar la vista previa editable y no subir binarios. La **plantilla
  también se genera en `.xlsx`** con SheetJS (escritura en el cliente, misma carga
  diferida); la descarga por defecto es Excel, con CSV como alternativa. Ambas salen
  de una fuente única (`templateRows`), así que no hay riesgo de que diverjan.
- **Multimoneda solo del costo** (Fase 3): se convierte a CUP únicamente el
  **costo** (`entryPrice`), no el precio de venta, replicando la semántica del alta
  individual (`products.service.createWithBusiness`). La conversión usa la **tasa
  configurada del negocio** (`MonetaryExchange`), cargada **una sola vez** por
  importación; **no** se acepta override de tasa por fila (a diferencia del alta
  individual, que sí admite `exchangeRateApplied`) para mantener el CSV simple y una
  fuente de verdad única. Una moneda sin tasa **falla solo esa fila** (no aborta el
  lote), y la conversión se valida en el `dryRun`, por lo que el usuario lo ve en la
  confirmación antes de persistir. La moneda original queda registrada en el
  `InventoryHistory` (campo `currency` + descripción con el valor original y el CUP).
- **Gasto masivo solo en altas nuevas, sin eventos** (Fase 3): `registerAsExpense`
  crea el gasto de "Reposición de stock" únicamente para productos **recién puestos a
  la venta** con costo y stock > 0, **no** para los que solo se actualizan (merge) —
  así una re-importación no duplica gastos. El monto va en la **moneda original** del
  costo (sin convertir), igual que el alta individual. Los `Expense` se crean **dentro
  de la misma transacción** con `manager.getRepository(Expense)` y **sin emitir
  eventos** (coherente con el principio del import: nada de fan-out; también el alta
  individual crea este gasto sin evento de transacción financiera). Es un **flag por
  importación** (checkbox), no una columna, porque aplica a todo el lote y su caso de
  uso es el **inventario inicial**.
- **Copiar catálogo = precargar el grid, sin endpoint nuevo** (Fase 3): "Copiar de
  otro negocio" **no** añade backend; usa el `GET /businesses/:id/products` existente
  para traer los productos de la sucursal origen, los mapea al mismo `{ fields, data }`
  canónico y entra por `loadParsed` — con lo que hereda validación, preview, dry-run,
  dedup, límite de plan y multimoneda **gratis**. Como el catálogo (`Product`) es del
  **mismo dueño**, al importar se **reutilizan** las fichas (no se duplican) y el
  límite de plan no se dispara. **El stock se precarga en 0** a propósito: cada negocio
  tiene su propio inventario, así que copiar el stock del origen sería inventar
  existencias; el usuario lo ajusta en el grid antes de importar.

### Dependencia `xlsx` (SheetJS): por qué desde el CDN y no desde npm

En `package.json`, `xlsx` **no** apunta a una versión del registro de npm sino a un
tarball del CDN oficial:

```jsonc
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

Esto es **intencional** y es lo que la propia documentación de SheetJS recomienda:

- **El `xlsx` del registro de npm está congelado en `0.18.5` (2022)** y ya no se
  actualiza. La versión mantenida (`0.20.3`) solo se publica en `cdn.sheetjs.com`.
- Esa `0.18.5` arrastra **vulnerabilidades conocidas sin fix en npm**: Prototype
  Pollution (**CVE-2023-30533**) y ReDoS (**CVE-2024-22363**), corregidas en
  `0.19.3+`/`0.20.x`. Instalar "normal" desde el registro traería la versión
  vulnerable y `npm audit` la marcaría *high severity* sin solución disponible.
- **No se pierde reproducibilidad ni verificación:** `pnpm-lock.yaml` fija la
  versión exacta y guarda un **hash de integridad** (`integrity: sha512-…`), las
  mismas garantías que un paquete del registro. No es una dependencia "flotante".

**Única contrapartida:** en tiempo de instalación hay que poder alcanzar
`cdn.sheetjs.com` (relevante en CI/Docker o entornos *air-gapped*). Si algún día eso
molesta, las salidas son: **espejar** el `.tgz` en un registro privado
(Artifactory/Verdaccio/Nexus) o **vendorizarlo** en el repo, o cambiar a una librería
publicada en npm como **`exceljs`** (más pesada; como aquí `xlsx` va con carga
diferida, no compensaba). Se decidió mantener el CDN oficial por ser la vía **segura
y pineada**.

### Decisiones revisadas de la Fase 2 (qué se quitó y por qué)

Durante la Fase 2 se probaron dos ideas que **se retiraron** antes de cerrarla. Se
documentan aquí para no reintroducirlas sin querer y para saber cómo reactivarlas.

- **`imagen_url` retirada de la plantilla.**
  - **Por qué:** el usuario **no conoce la URL** de las imágenes que sube (el bucket
    las guarda con nombres generados); pedir una URL en el CSV genera confusión y
    filas con error. Las imágenes se añaden mejor **por producto** desde su edición
    individual, donde se sube el archivo directamente.
  - **Estado:** se quitó del **frontend** (columna, validación, tipo `ImportProductItem`,
    plantilla y grid). En el **backend** el campo `imageUrl` del `ImportProductItemDto`
    y la lógica que lo asigna al crear el `Product` **se dejaron latentes** (no
    estorban: si la columna no llega, no se usa).
  - **Cómo reactivarla:** volver a añadir la entrada `imageUrl` en `IMPORT_COLUMNS`
    (`src/lib/products-import.ts`), su validación de URL en `validateRow`, el campo en
    el tipo `ImportProductItem` (`src/lib/types/product.ts`) y en `toImportItem`. El
    backend ya la acepta; no requiere cambios.
- **"Pegar desde Excel" (paste TSV) retirado.**
  - **Por qué:** con la **subida de `.xlsx`** ya implementada, pegar es redundante y
    añade una segunda vía que confunde (dos maneras de hacer lo mismo). Subir el
    archivo es más claro y menos propenso a errores de copia parcial.
  - **Estado:** se eliminó del frontend (área de pegado, `handlePaste`, estado
    `showPaste`/`pasteText` y sus imports). No dejó rastro en el backend.
  - **Cómo reactivarlo:** reintroducir un `<Textarea>` que reciba el texto pegado y
    pasarlo por `Papa.parse(text, { header: true })`, reutilizando la función
    `loadParsed` del componente (que ya es común a cualquier origen).
- **Columnas de mayoreo/modelo retiradas** (`precio_mayorista`,
  `cantidad_minima_mayorista`, `modelo`).
  - **Por qué:** `productModel` + `wholesalePrice` + `minimumWholesaleQuantity`
    definen la **venta mayorista** (B2B), pero **hoy el sistema no la aplica**: ni el
    servicio de ventas (v2) ni el carrito del frontend leen esos campos —la venta
    siempre usa `price` (o el precio de oferta). Son, por ahora, **metadatos** sin
    efecto en el punto de venta (ver la migración *063-business-wholesale-retail-model*
    para la intención original). Pedirlos en la plantilla solo confundía al usuario.
  - **Estado:** se quitaron del **frontend** (columnas, validación, tipos, plantilla,
    grid y el mapeo de "copiar de otro negocio"). En el **backend** el DTO y la lógica
    que los persiste en `BusinessProduct` **se dejaron latentes** (si la columna no
    llega, quedan en su default: `productModel = "retail"`, mayorista `null`).
  - **Cómo reactivarlas:** re-añadir las 3 entradas en `IMPORT_COLUMNS`, sus
    validaciones (`normalizeModel`, mayorista/entero) y los campos en `ImportProductItem`
    / `toImportItem` / el mapeo de copia. **Pero antes** conviene **implementar la venta
    mayorista de verdad** (que el carrito aplique `wholesalePrice` cuando la cantidad
    ≥ `minimumWholesaleQuantity`); reintroducir las columnas sin eso vuelve a crear el
    mismo dato-sin-efecto. Ver §10.

### Bugs corregidos de paso (en `associateProducts`, usado también al crear negocio)
- El catálogo se buscaba/creaba **sin `userId`**, inconsistente con el índice único
  `(name, userId)`. Ahora usa el `userId` del dueño.
- El evento de inventario enviaba el **`productId` como si fuera el nombre**
  (el `InventoryHistory` quedaba "Stock inicial del producto: `<uuid>`"). Corregido.

---

## 10. Pendiente respecto al MVP (roadmap)

### Fase 2 — usabilidad ✅ (implementada)
- **Dry-run integrado como confirmación**: al pulsar *Continuar* se ejecuta el
  `dryRun` y se muestra un panel de revisión antes de persistir.
- **Modo actualizar (merge)**: `duplicateStrategy = update` actualiza precio/stock
  de los productos ya a la venta (con ajuste de inventario) en vez de omitirlos.
- **Subir Excel `.xlsx` (además de CSV)**: se lee con SheetJS en el cliente y pasa
  por la misma validación/preview (adelantado desde la Fase 3).

> Alcance de la Fase 2: el merge **reemplaza** precio/stock (no suma stock).
>
> **Retirado en la Fase 2** (ver §9 para el detalle y cómo reactivar): la columna
> `imagen_url` (el usuario no conoce las URLs → confusión; la imagen se añade por
> producto) y el **"Pegar desde Excel"** (redundante con la subida de `.xlsx`).

### Fase 3 — alcance

**✅ Implementado**
- **Multimoneda del costo**: la columna `moneda` permite el `costo`/`entryPrice` en
  otra divisa; se convierte a CUP con la tasa del negocio (`MonetaryExchange`). El
  precio de venta sigue siendo CUP. Ver §7 y §9.
- **Registrar la entrada como gasto** (`registerAsExpense`): checkbox opcional en el
  asistente que crea un gasto de "Reposición de stock" (`costo × stock`, en la moneda
  original) por cada producto **nuevo** a la venta. Ver §7 y §9.
- **Copiar catálogo desde otro negocio**: botón "Copiar de otro negocio" que trae los
  productos a la venta de otra sucursal del usuario y precarga el grid (reutiliza el
  endpoint de import). Ver §9.

**❌ Descartado por ahora (con motivo)**

- **Importar desde el export de otro POS (mapeo de columnas).**
  - **Qué sería:** una UI donde el usuario empareja los encabezados de su archivo
    ajeno (`PVP`, `Existencias`, `Descripción del artículo`…) con nuestros campos.
  - **Por qué no ahora:** es la función **más compleja** (UI de mapeo, recordar
    perfiles, interpretar formatos ajenos de fecha/decimales/categorías). La decisión
    de diseño de tener una **plantilla fija** existe precisamente para **no** tener que
    interpretar formatos arbitrarios; esto reintroduce esa complejidad. Además, el
    valor es principalmente **comercial** (captar negocios que vienen de otro sistema):
    solo compensa cuando esa captación sea prioridad y haya volumen real de clientes
    migrando. Hoy no lo hay, así que el costo/beneficio no lo justifica.
  - **Camino si se retoma:** un paso previo de "mapeo" que produzca el mismo
    `{ fields, data }` canónico y siga entrando por `loadParsed` (el resto del motor no
    cambia). Empezar por importar un CSV con encabezados libres + selects de mapeo.

- **Override de tasa de cambio por fila (`exchangeRateApplied`).**
  - **Qué sería:** una columna `tasa` para fijar, por fila, la tasa CUP usada al
    convertir el costo, en vez de la tasa vigente del negocio.
  - **Por qué no ahora:** **complica la plantilla** con un concepto (tasa de cambio)
    que la mayoría de usuarios no necesita, y rompe la idea de "una sola fuente de
    verdad" para las tasas (la del negocio). El caso de uso (costos históricos a tasas
    distintas) es de **nicho**; mientras nadie lo pida, el ruido en la plantilla no
    compensa. El alta individual ya soporta `exchangeRateApplied`, así que quien
    necesite precisión puntual puede usarla ahí.
  - **Camino si se retoma:** columna opcional `tasa` → `exchangeRateApplied` por ítem;
    el backend ya sabe priorizar `exchangeRateApplied` sobre la tasa del negocio.

**⏳ Pendiente a futuro**

- **Venta mayorista (B2B) de verdad + sus columnas en la plantilla.** Los campos
  `productModel`, `wholesalePrice` y `minimumWholesaleQuantity` existen en el modelo
  (`BusinessProduct`) y en el backend, pero **hoy no tienen efecto**: la venta siempre
  cobra el `price`. Falta implementar que el **punto de venta** aplique el precio
  mayorista cuando la cantidad del carrito alcance el mínimo (y, quizá, filtrar por
  `businessModel`). **Cuando eso exista**, se re-añaden a la plantilla del import las
  columnas `precio_mayorista`, `cantidad_minima_mayorista` y `modelo` (ver §9, "Cómo
  reactivarlas"). Mientras tanto se retiraron para no pedir datos sin efecto.

### Deuda técnica / a vigilar
- **Enforcement global de `maxProducts`**: hoy solo se aplica en el import. El alta
  individual sigue sin validar el tope; convendría centralizarlo (guard o servicio).
- **Rendimiento del grid** con archivos cercanos a 500 filas (9 inputs por fila).
  Aceptable en MVP; si crece, virtualizar la tabla.
- **Historial de precios inicial**: el import no crea `ProductPriceHistory` por fila
  (se omitió junto con el fan-out de eventos). Evaluar si se necesita.

---

## 11. Cómo probar (verificación)

1. Backend: `cd psearch-back && npm run start:dev` (reiniciar para cargar el endpoint).
2. Frontend: `cd pmanage && pnpm dev`.
3. En **Productos → Importar**: elige destino, **descarga la plantilla en Excel**
   (y en otra prueba, en CSV con "o CSV"), llénala y súbela **como `.xlsx`** y luego
   como CSV: ambas deben comportarse igual.
4. Prueba: quitar la columna `precio` (rechazo por estructura), `unidad = Kg` mal,
   un nombre repetido, un archivo que exceda el plan (free = 10).
5. Prueba el **modo actualizar**: importa un producto que ya está a la venta con
   `duplicateStrategy = update` y verifica que cambia su precio/stock y aparece un
   `ADJUSTMENT` en el inventario.
6. Prueba **multimoneda**: en una fila pon `moneda = USD` con un `costo` (requiere
   que el negocio tenga tasa USD en `MonetaryExchange`). Verifica en el `dryRun`/reporte
   que la fila entra, y que el `InventoryHistory` guarda la moneda original y el costo
   en CUP. Con una moneda **sin tasa**, esa fila debe marcarse como error y el resto
   continuar.
7. Prueba el **gasto masivo**: marca "Registrar estas entradas como gasto", importa
   productos con costo y stock, y verifica que en **Gastos** aparece un "Entrada de
   producto: …" por cada uno (categoría "Reposición de stock"). Reimporta con
   `update`: **no** deben crearse gastos nuevos.
8. Prueba **copiar de otro negocio**: con al menos 2 negocios, pulsa "Copiar de otro
   negocio", elige la otra sucursal y verifica que el grid se llena con sus productos
   (stock en 0). Ajusta stock e importa.
9. Verifica que los productos aparecen en **Catálogo del almacén**, **Productos a la
   venta** e **Inventario**, y que **no** se disparan notificaciones externas.

**Estado de verificación (Fase 2 + Fase 3: multimoneda, gasto masivo, copiar
catálogo):** backend `typecheck` ✅; frontend `tsc --noEmit` ✅, `eslint` ✅,
`vitest` ✅ (129 tests). Falta cubrir con test la lectura de `.xlsx` (`matrixToTable`)
y el mapeo de "copiar de otro negocio". La prueba end-to-end contra MySQL queda para
el equipo.
