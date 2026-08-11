# Modo offline para Negora — plan de implementación

**Fecha:** 10 de agosto de 2026
**Estado:** propuesta para acordar entre frontend y backend. **No se ha escrito código todavía.**
**Repos afectados:** `pmanage` (Next.js) y `psearch-back` (NestJS)
**Relacionado:** `pmanage/ROADMAP.md` (líneas 150-152) y `pmanage/docs/revision-integral-2026-07.md`, ítem **V3-097**

> Las rutas de archivo de este documento van en formato `repo/ruta/archivo.ts`, relativas a la raíz
> del workspace que contiene ambos proyectos.

---

## Índice

- [Contexto](#contexto)
- [Decisiones ya tomadas](#decisiones-ya-tomadas)
- [Arquitectura](#arquitectura)
- [Resumen para el equipo de backend](#resumen-para-el-equipo-de-backend)
- [Parte A — Backend (`psearch-back`)](#parte-a--backend-psearch-back)
  - [A0. Prerrequisitos](#a0-prerrequisitos--arreglan-bugs-que-ya-existen-hoy)
  - [A1. Módulo de sincronización](#a1-módulo-de-sincronización--srcv2sync)
  - [A2. Ediciones de ventas y gastos ya sincronizadas](#a2-ediciones-de-ventas-y-gastos-ya-sincronizadas)
  - [A3. Integridad contable](#a3-integridad-contable)
  - [A4. Migraciones](#a4-migraciones-necesarias)
- [Parte B — Cliente (`pmanage`)](#parte-b--cliente-pmanage)
- [Parte C — APK Android con Capacitor](#parte-c--apk-android-con-capacitor)
- [Fases de entrega](#fases-de-entrega)
- [Riesgos aceptados](#riesgos-aceptados)
- [Verificación](#verificación)

---

## Contexto

Clientes potenciales están pidiendo que Negora siga funcionando sin conexión. Hoy eso es imposible:
la app es una SPA estática (`output: "export"`) que arranca con cuatro peticiones bloqueantes
(`/auth/me`, `/business/my-business`, `/navigation/sections`), guarda la sesión en `sessionStorage`
(cerrar la pestaña desloguea), no tiene service worker ni almacenamiento local, y cualquier fallo de
red en el interceptor de axios acaba en `window.location.href = /login` — una recarga dura que borra
todo lo que hubiera en memoria, incluido un carrito de venta a medias.

Del lado del servidor el problema es más profundo: **el backend es la autoridad sobre valores que
dependen del orden de llegada** — costo FIFO por capas, stock, total de la venta, número de factura,
saldos por moneda — y no tiene idempotencia, ni `updated_at` en la mitad de las tablas, ni forma de
propagar borrados, ni forma de saber que una venta ocurrió ayer.

**El objetivo:** el usuario trabaja sin conexión durante días, todo lo que hace se guarda en su
dispositivo, ve en todo momento el estado de la conexión y el número de cambios pendientes, y
**decide él cuándo subirlos** con un botón siempre visible. Al recuperar la conexión se le pregunta
si quiere sincronizar; nunca se sincroniza a sus espaldas.

---

## Decisiones ya tomadas

| Decisión | Elegido | Consecuencia principal |
|---|---|---|
| Alcance | **Altas de todo, ediciones acotadas** — ver el detalle justo debajo | Se evita el aparato de `updated_at` + soft-delete + pull delta sobre 13 tablas |
| Duración del corte | **Días completos** | La PWA sola no basta: se entrega también como APK Android |
| Dispositivos por negocio | **Uno solo** | Simplificación grande: sin conflictos de stock concurrente, sin merge de duplicados, sin lock por negocio |
| Facturas | **Comprobante interno** | La sincronización **no emite facturas**. La factura se emite después, online |
| Empaquetado | **PWA + APK Android (Capacitor)** | Mismo código, dos entregas. El APK es lo que hace creíble "días completos" |
| Cierres retroactivos | **Marcar y avisar** | Hay que persistir los cierres (hoy se calculan al vuelo) |
| Costo FIFO retroactivo | **Aproximado y marcado** | El costo se congela al entrar al servidor y no se revisa nunca |
| Comercial | **Para todos los planes** | Sin `ProPlanGuard` ni entradas nuevas en `plan-features.ts` |

### El alcance de ediciones y borrados, en detalle

La primera versión de este plan permitía editar y borrar cualquier entidad offline, y eso obligaba a
añadir `updated_at` a 13 tablas, soft-delete a 7, rehacer índices únicos y construir un `pull?since=`.
Al revisarlo apareció una distinción que reduce el coste drásticamente sin quitar valor real:

**Editar o descartar una operación que aún está en la cola no es una edición.** Es modificar algo que
nunca salió del dispositivo. El servidor jamás se entera: no hace falta `updated_at`, ni tombstones,
ni detección de concurrencia. Y ese es el caso que de verdad ocurre — si trabajaste toda la jornada
sin conexión y te equivocaste en una venta, esa venta está en tu cola, no en la base de datos.

Alcance acordado:

| Operación | ¿Offline? | Coste |
|---|---|---|
| Editar o descartar **cualquier operación aún pendiente en la cola**, de cualquier entidad | **Sí** | **Cero backend.** Es interfaz de la cola local |
| Crear ventas, gastos, productos, asignaciones producto→negocio, entradas de inventario, proveedores, trabajadores, categorías | **Sí** | El grueso del plan (A1 + B6) |
| Editar una venta **ya sincronizada** | **Sí** | Trivial: `sales` ya tiene `updated_at`; basta comparar `baseUpdatedAt`. Y `SaleService.update()` hoy solo toca descripción y datos de entrega — no ítems, ni precios, ni stock |
| Editar un gasto **ya sincronizado** | **Sí** | Trivial, por la misma razón |
| Cancelar una venta **ya sincronizada** | **Sí, pero se avisa** de que se aplica al sincronizar | Es la operación con efectos FIFO más complejos: devuelve unidades a las capas exactas de las que salieron |
| **Borrar** una venta | **No, nunca — ni offline ni online** | El endpoint actual está roto: ver [A0.5](#a05-delete-salesid-está-roto-hoy). La operación correcta es cancelar |
| Editar o borrar productos, catálogo, proveedores, trabajadores, categorías | **No** | Se ahorra el bloque A2 casi entero |

**Lo que se pierde:** no se podrá corregir sin conexión el precio de un producto ni los datos de un
proveedor. Son tareas de administración que se hacen con calma, no en medio de un apagón. Si en el
futuro hiciera falta, el camino está descrito en [A2](#a2-ediciones-de-ventas-y-gastos-ya-sincronizadas)
y se puede retomar sin rehacer nada.

**Lo que no se ahorra, y hay que asumir:** cada endpoint nuevo del sistema tendrá que decidir su
semántica offline a partir de ahora, para siempre. Ver el [riesgo 9](#riesgos-aceptados).

---

## Arquitectura

```
DISPOSITIVO (PWA en navegador  ·  APK Android con Capacitor)
┌──────────────────────────────────────────────────────────────┐
│  Service Worker  → app shell, chunks, HTML y .txt de RSC     │
│  IndexedDB (Dexie)                                           │
│    ├── queries    caché de lecturas de React Query           │
│    ├── entities   catálogo local (productos, stock, precios) │
│    ├── outbox     cola de operaciones + grafo de dependencias│
│    ├── blobs      imágenes de producto pendientes            │
│    └── profile    sesión offline cifrada con PIN             │
└──────────────────────────────────────────────────────────────┘
        │  el usuario pulsa "Subir cambios (N)"
        ▼
   POST /api/v2/sync/push   { batchId, operations[] ordenadas }
┌──────────────────────────────────────────────────────────────┐
│  SyncOrchestrator                                            │
│   1. reserva idempotente en sync_operations                  │
│   2. orden topológico por dependencias + seq                 │
│   3. por cada op → SERVICIO EXISTENTE + SyncContext          │
│      (SaleService.create, InventoryService.addStock, …)      │
│   4. drena eventos síncronamente (notificaciones en digest)  │
│   5. marca cierres afectados, reconcilia saldos              │
│   6. devuelve resultado POR OPERACIÓN                        │
└──────────────────────────────────────────────────────────────┘
        │  200 OK { applied, duplicate, failed, blocked }
        ▼
   El cliente marca cada op, no remapea nada (los UUID los pone él),
   y muestra los conflictos para que el usuario los resuelva.
```

**Principio rector, y no es negociable:** el cliente nunca calcula la verdad. Encola *intenciones*
("quiero registrar esta venta, a esta hora, con estos productos") y el servidor las reproduce con su
lógica actual. El costo FIFO, el stock definitivo, el total y los saldos los sigue calculando el
backend.

---

## Resumen para el equipo de backend

Con el contexto y la arquitectura de arriba en mente, esto es lo que hay que discutir y acordar,
ordenado por urgencia. El detalle completo está en la [Parte A](#parte-a--backend-psearch-back).

### 1. Un spike bloqueante, antes que nada (2-3 días)

**¿TypeORM respeta un `id` provisto en una entidad con `@PrimaryGeneratedColumn("uuid")`?**
Medio diseño se apoya en que sí. Si el cliente puede generar los UUID, desaparece por completo el
remapeo de IDs temporales, que es la parte más frágil de cualquier sistema offline. Si no, hay un
plan B (`localRef` + mapa de resolución en el orquestador) que funciona pero es estrictamente peor.

Junto con eso: medir el tamaño real de un lote de 200 ventas, y medir cuánto tarda ese lote contra
la base de datos real (los `FOR UPDATE` en serie son el cuello de botella).

### 2. Cuatro bugs que ya existen hoy y que el offline convierte en corrupción

Estos hay que arreglarlos **aunque el offline se cancelara mañana**:

| Bug | Dónde | Por qué importa |
|---|---|---|
| **`monetary_exchange` es una sola fila mutable, sin historial** | `psearch-back/src/v2/entities/monetary-exchange.entity.ts` | El cierre del mes pasado ya se valora hoy con la tasa de hoy. Con la tasa moviéndose a diario, toda venta offline en divisa se rechazaría al subirla |
| **Cero idempotencia en toda la API** | — | Un doble clic en "Subir", o un timeout tras un commit exitoso, duplica la venta, descuenta el stock dos veces y consume las capas FIFO dos veces |
| **La numeración de facturas es `COUNT(*) + 1 + attempt`** | `psearch-back/src/v2/invoice/invoice.service.ts` (~L241-251) | Se rompe si se borra una factura (número repetido) y es O(n) |
| **`DELETE /sales/:id` borra sin compensar nada** | `psearch-back/src/v2/sale/sale.service.ts` (~L695) | No devuelve stock, no restaura capas FIFO, no revierte pagos, y el `CASCADE` se lleva ítems, pagos y factura. Deja el inventario descuadrado en silencio. Ver [A0.5](#a05-delete-salesid-está-roto-hoy) |

### 3. El trozo de trabajo más grande, y hay que hacerlo de golpe

`sales.created_at` es `@CreateDateColumn`: una venta del lunes subida el miércoles queda fechada el
miércoles. Añadir una columna `occurred_at` es trivial; **migrar todos los informes a usarla es el
trabajo grande**, y si se hace gradualmente unos informes usarán un criterio y otros el contrario,
sin que nada cuadre y con un bug prácticamente indetectable. Tiene que ser **un solo PR**, con los
specs existentes verdes. Detalle en [A1.6](#a16-timestamps-del-cliente).

### 4. Lo que backend tiene que construir

Módulo nuevo `psearch-back/src/v2/sync/` con:
- Idempotencia en dos capas (UUID del cliente + tabla `sync_operations`).
- `POST /api/v2/sync/push` — lote de hasta 200 operaciones, commit por operación, orden topológico.
- `GET /api/v2/sync/bootstrap` — snapshot del catálogo (sin cambios de esquema).
- `GET /api/v2/sync/pull?since=` — delta incremental (fase 9).
- `GET /health` público, sin auth, barato — lo necesita el cliente para sondear conectividad.
- Endpoints de diagnóstico para soporte.

**Principio que no se negocia:** los handlers de sync son adaptadores delgados que llaman a los
servicios existentes (`SaleService.create`, `InventoryService.addStock`, …) pasando un `SyncContext`.
**Cero reimplementación de lógica de negocio.** Un `SyncSaleService` clonado divergiría en un
trimestre, y divergiría justo en el camino que menos se prueba a mano.

### 5. Dos gotchas de infraestructura que romperán el batch si se olvidan

- `psearch-back/src/main.ts` **no configura el body parser**, así que rige el default de Express de
  **100 KB**. Un lote de 200 ventas lo supera de largo y el cliente recibiría un 413 críptico.
- El **throttler global de 300 req/min/IP** hay que sobreescribirlo en la ruta de sync. Y siendo por
  IP, varios dispositivos tras el mismo NAT comparten cuota.

---

# Parte A — Backend (`psearch-back`)

## A0. Prerrequisitos — arreglan bugs que ya existen hoy

### A0.1 Historial de tasas de cambio · **bloqueante**

`psearch-back/src/v2/entities/monetary-exchange.entity.ts` es **una fila mutable por negocio**
(`@Unique(["business"])`). El cierre contable construye su `exchangeRateSnapshot` leyendo la fila
*actual*, así que **un cierre del mes pasado ya se valora hoy con la tasa de hoy**. Con la tasa
moviéndose a diario, el offline convierte ese bug latente en corrupción sistemática.

- Nueva tabla `monetary_exchange_history` con `business_id`, las 10 columnas de moneda,
  `effective_from DATETIME(3)`, índice `(business_id, effective_from)`.
- El servicio de actualización escribe una fila nueva en vez de solo mutar la actual.
- Nuevo helper `getRatesAt(businessId, at)` en `psearch-back/src/v2/monetary-exchange/`, usado por
  cierres, analítica y validación de precios.
- Persistir `exchange_rate_applied` en `sales` (los `payments` ya lo tienen).

### A0.2 Idempotencia · **bloqueante**

No hay ninguna hoy. Un doble clic en "Subir", o un timeout después de que MySQL confirmó el commit,
duplica la venta, descuenta el stock dos veces y consume las capas FIFO dos veces. Diseño en A1.1.

### A0.3 `occurred_at` separado de `created_at` · **bloqueante**

`sales.created_at` es `@CreateDateColumn` (`psearch-back/src/v2/entities/sale.entity.ts`). Una venta
del lunes subida el miércoles queda fechada el miércoles: rompe cierres, analítica y el orden FIFO.

**Nunca backdatear `created_at`.** Dos razones: TypeORM lo sobrescribe en el insert (habría que hacer
un `UPDATE` crudo posterior, frágil y fuera de la transacción), y se perdería la información forense
de cuándo llegó realmente el dato — que es justo lo que hace falta para diagnosticar.

### A0.4 Secuencia de facturas real

`psearch-back/src/v2/invoice/invoice.service.ts` calcula el correlativo como `COUNT(*) + 1 + attempt`.
Se rompe si se borra una factura (número repetido) y es O(n). Sustituir por tabla dedicada:

```sql
CREATE TABLE `invoice_sequences` (
  `business_id` VARCHAR(36) NOT NULL,
  `year`        SMALLINT    NOT NULL,
  `last_number` INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`business_id`,`year`)
) ENGINE=InnoDB;
-- backfill desde el COUNT actual por (business, año)
```

Reserva dentro de la misma transacción, atómica y sin bucle de reintentos:

```sql
INSERT INTO invoice_sequences (business_id, year, last_number) VALUES (?,?,1)
  ON DUPLICATE KEY UPDATE last_number = last_number + 1;
SELECT last_number FROM invoice_sequences WHERE business_id=? AND year=? FOR UPDATE;
```

**El año de la factura pasa a ser el de emisión (`issued_at`), no el de la venta.** Si no, una venta
del 31 de diciembre sincronizada el 2 de enero produciría un número del año anterior insertado en una
serie ya cerrada. El PDF debe mostrar ambas fechas: "Fecha de la operación" y "Fecha de emisión".

### A0.5 `DELETE /sales/:id` está roto hoy

Descubierto al acotar el alcance de borrados. `psearch-back/src/v2/sale/sale.service.ts` (~L695):

```ts
async remove(id: string): Promise<void> {
  const sale = await this.findOne(id);
  await this.saleRepository.remove(sale);   // borrado físico, sin compensar nada
}
```

**No devuelve el stock, no restaura las capas FIFO, no revierte los pagos**, y por `ON DELETE CASCADE`
se lleva por delante los `sale_items`, los `payments` y la `invoice`. Compárese con `cancel`
(~L736-1160), que sí hace todo eso correctamente con `restoreConsumptions()`.

**Es un problema que existe ahora mismo, independiente del offline.** Cualquiera que use ese endpoint
deja el inventario descuadrado en silencio y sin traza. Recomendación:

- Retirar el endpoint, o dejarlo solo para admin (rolId 5) y que internamente llame a `cancel`.
- Quitar el botón correspondiente del frontend si existe.
- Regla de producto: **las ventas no se borran, se cancelan.**

---

## A1. Módulo de sincronización — `src/v2/sync/`

### A1.1 Idempotencia en dos capas

**Capa 1 — UUID generado por el cliente como PK.** Todas las PK de v2 ya son
`@PrimaryGeneratedColumn("uuid")`; TypeORM respeta un `id` provisto y solo genera cuando es
`undefined`. Se añade `@IsOptional() @IsUUID() id?: string` a los DTO de creación (cambio aditivo, no
rompe nada). Esto elimina de golpe todo el remapeo de IDs temporales: la venta referencia
`productId: "8c2f…"` y ese es literalmente el PK que tendrá la fila.

> **Verificar en el spike antes de comprometerse.** Es el supuesto que sostiene medio diseño.

**Capa 2 — tabla `sync_operations`** como fuente de verdad de "esto ya se aplicó, aquí está tu
respuesta".

```sql
CREATE TABLE `sync_operations` (
  `id` VARCHAR(36) NOT NULL,
  `batch_id` VARCHAR(36) NULL,
  `business_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `device_id` VARCHAR(64) NULL,
  `client_operation_id` VARCHAR(64) NOT NULL,
  `operation_type` VARCHAR(48) NOT NULL,          -- 'sale.create', 'product.update', …
  `request_fingerprint` CHAR(64) NOT NULL,        -- sha256 del payload canonicalizado
  `status` ENUM('pending','applied','failed','blocked','skipped') NOT NULL DEFAULT 'pending',
  `entity_type` VARCHAR(48) NULL,
  `entity_id` VARCHAR(36) NULL,                   -- el UUID que envió el cliente
  `response_json` JSON NULL,                      -- respuesta REDUCIDA, no la entidad completa
  `error_code` VARCHAR(64) NULL,
  `error_json` JSON NULL,
  `warnings_json` JSON NULL,
  `occurred_at` DATETIME(3) NULL,
  `applied_at` DATETIME(3) NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `payload_json` JSON NULL,                       -- se anula a los 30 días
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_sync_op_business_client` (`business_id`,`client_operation_id`),
  KEY `IDX_sync_op_batch` (`batch_id`),
  KEY `IDX_sync_op_status` (`status`,`updated_at`),
  KEY `IDX_sync_op_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB;
```

El unique va sobre `(business_id, client_operation_id)` y no sobre `client_operation_id` solo: evita
que una clave mal generada en un dispositivo bloquee operaciones de otro negocio, y mantiene el
índice acotado por tenant.

`response_json` guarda una respuesta **reducida** (`{id, total, occurredAt, paymentStatus,
itemsCount}`), no la entidad serializada: con 200 ventas completas se llenaría 1 MB por lote.

**Flujo en `sync-idempotency.service.ts`:**

1. **Reserva** — `INSERT ... status='pending'`, en transacción propia committeada de inmediato.
2. Si `ER_DUP_ENTRY`, leer la fila y decidir:
   - huella distinta → `SYNC_CLAVE_REUTILIZADA` (protege de un cliente con bug que recicla claves;
     sin esto, devolvería silenciosamente la respuesta de otra venta).
   - `applied` → devolver `response_json` con `duplicate: true`. **Este es exactamente el caso
     "llegó, se procesó, el cliente no recibió la respuesta".**
   - `failed` reintentable (deadlock, lock timeout) → reintentar; si no lo es, devolver el error
     cacheado sin re-ejecutar (un `SYNC_STOCK_INSUFICIENTE` reintentado a ciegas no mejora nada).
   - `pending` reciente (< 120 s) → `SYNC_OPERACION_EN_CURSO` (409); más antiguo → *takeover* con
     guarda optimista `UPDATE ... WHERE id=? AND status='pending' AND updated_at=?`.
3. **Ejecución** — el handler corre el servicio existente en su transacción; al salir, `applied` +
   `response_json` + `entity_id`.

**La ventana peligrosa.** Entre el `COMMIT` de la venta y el `UPDATE` que la marca `applied` hay
milisegundos. Si el proceso muere ahí, la fila queda `pending` con el efecto ya committeado y un
takeover **duplicaría la venta**. Eso es corrupción de datos, no un inconveniente. Se cierra con una
**sonda de efecto ya aplicado** que cada handler implementa apoyándose en el UUID del cliente:

| Operación | Sonda antes de re-ejecutar |
|---|---|
| `sale.create` | `SELECT … FROM sales WHERE id = :clientEntityId AND business_id = :bid` |
| `expense.create` / `product.create` | ídem sobre su tabla |
| `inventory.add_stock` | `SELECT … FROM inventory_history WHERE id = :clientHistoryId` |
| `sale.cancel` | comparar `is_cancelled` contra lo que pide la op |

Si la sonda encuentra el efecto, se marca `applied` reconstruyendo la respuesta desde la BD y no se
re-ejecuta nada. Esto convierte el UUID del cliente en el mecanismo de recuperación ante caídas, no
solo en una comodidad.

> **Alternativa si se descarta el UUID del cliente:** que `SaleService.create` acepte un
> `EntityManager` opcional y el orquestador abra la transacción y marque la op dentro. Requiere mover
> el límite transaccional hacia fuera, lo que alarga la retención de los `FOR UPDATE` sobre
> `business_products`. Viable, pero es cirugía sobre el camino de dinero más crítico.

**TTL y limpieza:** metadatos 180 días; `payload_json`/`response_json` 30 días (son el 95 % del
volumen, luego `SET NULL`); purga total 400 días. Sin `@nestjs/schedule` en el proyecto, se sigue el
patrón existente: endpoint `POST /api/v2/cron/sync-cleanup` con `@Public()` + `x-cron-token`,
preferiblemente con un token propio separado del de cierres.

### A1.2 Endpoint batch

```
POST /api/v2/sync/push
Headers: Authorization, X-Device-Id, X-Client-Version, X-Sync-Protocol: 1
```

**Comparación honesta de las dos opciones:**

| Criterio | Endpoints existentes + `Idempotency-Key` | `POST /sync/push` |
|---|---|---|
| Reutilización de lógica | Total, cero riesgo de bifurcación | Alta si los handlers llaman a los servicios |
| Round trips | N (200 ventas = 200+ requests) | 1 por chunk |
| Throttler 300 req/min/IP | **Se rompe** con 3 días de operaciones | 1 hit por chunk, ajustable |
| Atomicidad de grupos | Imposible: si crear el producto falla, la venta sale igual y peta | El orquestador propaga `blocked` |
| Orden y dependencias | El cliente secuencia y espera cada respuesta; una desconexión a mitad deja estado ambiguo | Servidor ordena topológicamente |
| Timeouts | Cada request es corto, muy robusto ante red mala | Un lote grande puede pasarse del timeout del proxy |
| Diagnóstico | Disperso en logs | Un `batch_id` lo cuenta todo |

**Recomendación: batch**, porque el throttler y las dependencias son bloqueantes, no cosméticos.
**Y además** un interceptor `Idempotency-Key` en los endpoints individuales: es barato (reutiliza
`SyncIdempotencyService`), da valor inmediato al caso "estaba online y se cortó la respuesta", y es
la vía de escape si el batch da problemas.

```ts
// psearch-back/src/v2/sync/dto/sync-push.dto.ts
class SyncPushDto {
  @IsUUID() businessId: string;
  @IsUUID() batchId: string;
  @IsISO8601() clientSentAt: string;              // para calcular deriva de reloj
  @IsOptional() @IsInt() chunkIndex?: number;
  @IsOptional() @IsInt() chunkTotal?: number;
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true })
  @Type(() => SyncOperationDto) operations: SyncOperationDto[];
}

class SyncOperationDto {
  @IsString() @Length(1, 64) clientOperationId: string;
  @IsInt() seq: number;                            // orden local del dispositivo
  @IsEnum(SYNC_OP_TYPES) type: SyncOperationType;
  @IsISO8601() occurredAt: string;
  @IsOptional() @IsArray() @IsString({ each: true }) dependsOn?: string[];
  @IsOptional() @IsISO8601() baseUpdatedAt?: string;   // control de concurrencia (A2.3)
  @IsObject() payload: Record<string, unknown>;
}
```

`payload` va como `Record<string, unknown>` **a propósito**: el `ValidationPipe` global con
`forbidNonWhitelisted: true` rechazaría cualquier campo desconocido. La validación real la hace el
handler con `plainToInstance(CreateSaleDto, payload)` + `validate()`, **reutilizando los DTO
existentes**. Así no hay que relajar el pipe global ni tocar los DTO salvo por el `id?` opcional.

**Respuesta: HTTP 200 siempre** que el lote sea sintácticamente válido y el usuario esté autorizado.
Un 207 Multi-Status sería más correcto semánticamente, pero el interceptor de axios del front y
`HttpExceptionFilter` tratan todo lo no-2xx como fallo global.

```jsonc
{
  "batchId": "…",
  "serverTime": "2026-08-10T14:03:11.221Z",
  "clockDriftMs": -84000,
  "summary": { "total": 47, "applied": 44, "duplicate": 1, "failed": 1, "blocked": 1 },
  "results": [
    { "clientOperationId": "op-1", "status": "applied",
      "entity": { "type": "sale", "id": "9f1c…", "total": 1250.00,
                  "occurredAt": "2026-08-07T19:22:00.000Z" },
      "warnings": [{ "codigo": "SYNC_PRECIO_HISTORICO_APLICADO",
                     "mensaje": "…",
                     "detalles": { "precioActual": 130, "precioAplicado": 120 } }] },

    { "clientOperationId": "op-2", "status": "duplicate",
      "entity": { "type": "sale", "id": "3ab0…" } },

    { "clientOperationId": "op-3", "status": "failed",
      "error": { "codigo": "SYNC_STOCK_INSUFICIENTE", "mensaje": "…",
                 "detalles": { "productId": "…", "solicitado": 5, "disponible": 2 },
                 "retryable": false, "requiresUserDecision": true } },

    { "clientOperationId": "op-4", "status": "blocked",
      "error": { "codigo": "SYNC_DEPENDENCIA_FALLIDA",
                 "detalles": { "bloqueadaPor": "op-3" }, "retryable": true } }
  ]
}
```

**Semántica de errores parciales: commit por operación, con propagación por grupo de dependencia.**
Ni all-or-nothing por lote (3 días de ventas rechazadas porque a un producto le cambió el precio es
inaceptable operativamente), ni independencia total (una venta cuyo producto no se creó debe quedar
`blocked`, no `failed`; el cliente puede reintentarla tal cual tras arreglar la raíz).

**Límites:**
- 200 operaciones o 1 MB por lote, lo que llegue primero → 413 con `SYNC_LOTE_DEMASIADO_GRANDE` y
  `{maxOperations, maxBytes}` para que el cliente trocee.
- **Gotcha:** `psearch-back/src/main.ts` no configura el body parser → rige el default de Express de
  **100 KB**. Hay que añadir `app.use("/api/v2/sync", json({ limit: "2mb" }))`.
- `@Throttle({ default: { ttl: 60_000, limit: 20 } })` sobre el controlador. Evaluar un tracker por
  `userId` en vez de IP para esta ruta.
- `SYNC_BATCH_TIMEOUT_MS` = 45 s. Al agotarse, se marca el resto `skipped` y se devuelve 200 con lo
  hecho; el cliente reenvía y la idempotencia se encarga.

### A1.3 Orden y dependencias — `sync-graph.util.ts`

Función pura, testeable sin BD:

1. Un nodo por operación, con `seq` y `clientOperationId`.
2. Aristas explícitas desde `dependsOn`.
3. **Aristas implícitas** derivadas del payload contra los `entityId` que produce el propio lote:
   - `sale.create.items[].idproducto` → op que crea ese producto
   - `inventory.add_stock.productId` → ídem
   - `businessProduct.upsert.productId` → `product.create`
   - `sale.cancel.saleId` → `sale.create`
   - `expense.create.providerId` / `expenseCategoryId` → sus creaciones
   - `payment.create.saleId` → `sale.create`
4. **Orden topológico (Kahn)** con desempate por `seq` ascendente. El desempate es semánticamente
   importante: dos ventas del mismo producto deben aplicarse en el orden en que el cajero las hizo, o
   el FIFO asigna capas distintas.
5. Ciclo detectado → todas las ops del ciclo `failed` con `SYNC_DEPENDENCIA_CICLICA`; el resto sigue.
6. Al fallar `X`, sus descendientes transitivos quedan `blocked` con `detalles.bloqueadaPor = X`,
   sin ejecutarse.
7. Referencia a una entidad que no existe ni está en el lote → se deja pasar al handler; el servicio
   existente lanza `NotFoundException`, que se mapea a `SYNC_ENTIDAD_NO_ENCONTRADA`.

**El caso que justifica todo esto:** si offline el usuario registró una entrada de 20 unidades y
luego 3 ventas, y el servidor tiene 0 de stock, el orden topológico garantiza que la compra entra
primero. Sin ese orden, las 3 ventas fallarían por stock y el resultado dependería del azar.

### A1.4 `SyncContext` — políticas inyectadas, no servicios paralelos

```ts
// psearch-back/src/v2/sync/sync-context.ts
export interface SyncContext {
  batchId: string;
  deviceId: string | null;
  occurredAt: Date;
  isLateSync: boolean;
  pricePolicy: "strict" | "historical" | "override";
  stockPolicy: "reject" | "allow_negative";
  notifications: "realtime" | "digest" | "off";
  clientOperationId: string;
  warnings: SyncWarning[];   // el servicio empuja avisos aquí
}
```

Firma: `create(dto: CreateSaleDto, userId: string, authToken?: string, sync?: SyncContext)`.

**Por qué no duplicar.** `SaleService.create` son ~320 líneas con `FOR UPDATE`, revalidación de
stock, `consumeFifo`, congelado de costo e historial. Un `SyncSaleService` clonado diverge en un
trimestre, y divergirá justo en el camino que menos se prueba a mano. El coste de no duplicar es que
`create()` crece.

**Mitigación del crecimiento:** extraer las *políticas* (no el flujo) a objetos pequeños:
- `psearch-back/src/v2/sale/policies/sale-price.policy.ts` — la comparación de precio de
  `sale.service.ts` (~L257-289).
- `psearch-back/src/v2/products/policies/stock.policy.ts` — la revalidación de ~L375-380.

El cuerpo de la transacción sigue siendo único. **Riesgo honesto:** esta extracción toca el camino de
dinero más crítico del sistema; hacerla solo con `sale.service.spec.ts` e
`inventory-costing.service.spec.ts` verdes y tests nuevos por política.

### A1.5 Validaciones: precio y stock

**Precio.** Hoy el servidor rechaza cualquier desviación de más de 1 centavo respecto del catálogo
*actual*. Tres escalones, evaluados en orden:

1. **Precio actual** → acepta, `price_source = 'catalog'`.
2. **Precio histórico** (si `pricePolicy != 'strict'`) → consultar `product_price_history` buscando
   el precio vigente para ese `business_product` en `occurredAt`. Si coincide dentro de la misma
   tolerancia → **aceptar**, `price_source = 'historical_catalog'`, warning
   `SYNC_PRECIO_HISTORICO_APLICADO` con `{precioActual, precioAplicado, vigenteDesde}`.
   - *Limitación real:* esa tabla solo se escribe vía el listener de `business-product.changed`, así
     que puede haber huecos en datos antiguos. Sin cobertura, se cae al escalón 3.
3. **Fallo** → `SYNC_PRECIO_DESACTUALIZADO` con `{productId, precioEnviado, precioCatalogoActual,
   moneda}`. La operación queda pendiente en el cliente y la UI pregunta al usuario.
   - `priceOverride: true` **solo** si el solicitante es owner (rolId 4) o admin (rolId 5). Se
     persiste `sale_items.price_source = 'override'` + `price_override_by` y se emite una
     notificación agrupada.

La conversión de moneda para esta comparación debe usar `getRatesAt(businessId, occurredAt)` (A0.1),
no la tasa de hoy. **Sin eso, toda venta offline en divisa se rechaza cada vez que se mueve la tasa.**

**Stock.** Setting por negocio `business_settings.sync_stock_policy`:

- **`reject` (por defecto)** → `SYNC_STOCK_INSUFICIENTE` con `{productId, solicitado, disponible}` y
  `requiresUserDecision: true`. Con un solo dispositivo por negocio esto será poco frecuente.
- **`allow_negative` (opt-in explícito)** → se acepta. `consumeFifo` ya devuelve
  `uncostedQuantity > 0` y el código existente deja `unitCost` en `null` en vez de en cero
  (`sale.service.ts` ~L406-411) — el comportamiento correcto ya está. Además: `InventoryHistory` de
  tipo `ADJUSTMENT` con descripción explícita, flag `needs_reconciliation` en `business_products`, y
  notificación agrupada.
  - **Riesgo concreto:** `assertLayersMatchStock`
    (`psearch-back/src/v2/products/inventory-costing.service.ts` ~L441) empezará a detectar descuadre.
    Recomendación: no lanzar, registrar y exponer en un informe de reconciliación.

**Nunca ajustar automáticamente la cantidad**: cambia la venta que el cajero hizo de verdad y hace
irreconciliable la caja.

**Cuotas de plan.** Rechazar, sin gracia — un excedente concedido convierte el plan en decorativo.
Evaluar la cuota **una vez por lote** para el total de `product.create`, no op por op, y devolver
`SYNC_CUOTA_PLAN_EXCEDIDA` con `{limite, existentes, solicitados, aplicables}` en todas las ops de
producto afectadas. La comprobación real sigue dentro de la transacción de cada creación (como hoy)
para no abrir una carrera; el pre-chequeo del lote es solo para dar un mensaje decente.

### A1.6 Timestamps del cliente

Migración sobre `sales`, `expenses`, `inventory_history`, `payments`, `financial_transactions`:

```sql
ALTER TABLE `sales`
  ADD COLUMN `occurred_at` DATETIME(3) NULL AFTER `created_at`,
  ADD COLUMN `synced_at` DATETIME(3) NULL,
  ADD COLUMN `sync_batch_id` VARCHAR(36) NULL,
  ADD COLUMN `sync_device_id` VARCHAR(64) NULL,
  ADD COLUMN `is_late_sync` TINYINT(1) NOT NULL DEFAULT 0;

UPDATE `sales` SET `occurred_at` = `created_at` WHERE `occurred_at` IS NULL;
ALTER TABLE `sales` MODIFY `occurred_at` DATETIME(3) NOT NULL;

CREATE INDEX `IDX_sales_business_occurred`
  ON `sales` (`business_id`,`is_cancelled`,`occurred_at`);
```

`inventory_cost_layers` ya tiene `acquired_at` separado de `created_at` con exactamente esta
semántica — el diseño de costeo ya anticipó el problema, hay que aprovecharlo.

**Salvaguardas:**

| Regla | Comportamiento |
|---|---|
| Deriva de reloj | `drift = clientSentAt - serverTime`. Si `abs(drift) > 120 s`, se corrigen todos los `occurredAt` del lote y se guarda el original en `payload_json.occurredAtRaw`. Los Android baratos sin NTP tienen derivas de horas; sin esto los cierres salen mal y nadie sabe por qué |
| Antigüedad máxima | `SYNC_MAX_BACKDATE_DAYS`, por defecto **7**, tope duro 30, configurable por negocio en `business_settings`. Fuera → `SYNC_OCCURRED_AT_FUERA_DE_RANGO` |
| Futuro | `occurredAt > serverTime + 5 min` (tras corregir deriva) → rechazo, **no clamp**. Un clamp silencioso oculta un reloj roto |
| Suelo | No anterior a la creación del negocio ni a la del producto referenciado |
| Marca de tardío | `is_late_sync = 1` si `occurred_at` cae en un día local anterior al de `synced_at`. Filtrable en la UI |
| Forzado | `forceBackdate: true` solo para owner o admin; queda en `warnings_json` y en el log |

**El trozo grande de trabajo no es añadir la columna, es migrar el reporting a usarla.** Si no se
hace, una venta del día 7 sincronizada el día 10 aparece en el cierre del 10 y el usuario ve números
falsos. Sitios a cambiar, **todos en un solo PR** con los specs existentes verdes:

- `psearch-back/src/v2/sale/sale.service.ts` ~L1167-1176 (`sale.created_at` en `getClosingData`),
  ~L1183-1189 (`expense.createdAt` con `Between`), ~L1204-1206 (`payment.created_at` para propinas).
- `psearch-back/src/v2/dashboard/**` y `psearch-back/src/v2/analytics/analytics.service.ts` — todos
  los rangos.
- `psearch-back/src/common/date-range.util.ts` — centralizar el criterio en un helper
  `businessEventDateColumn()`.
- `psearch-back/src/v2/invoice/invoice.service.ts` ~L227 — `sale.createdAt.getFullYear()` (ver A0.4).

Hacerlo gradualmente produce informes que mezclan criterios y son imposibles de cuadrar.

**Impacto en FIFO (decisión ya tomada: costo aproximado).** Con `acquiredAt = occurredAt`, una compra
retroactiva inserta una capa **en medio** del orden FIFO:

- Las ventas **futuras** consumirán primero esa capa retroactiva. Correcto.
- Las ventas **pasadas** ya tienen su `unitCost` congelado y **no se recalculan nunca**. Recalcular
  reescribiría el margen de ventas ya reportadas en cierres enviados por correo.
- Efecto secundario aceptado: el margen del periodo no coincide con lo que habría salido registrando
  todo a tiempo. Las líneas afectadas llevan `cost_basis_approximate = 1` y son visibles en informes.
- Un job `POST /api/v2/cron/recost` queda **fuera de alcance y desactivado por defecto**: recalcular
  FIFO retroactivamente es la operación con mayor potencial de corrupción de todo el sistema.

---

## A2. Ediciones de ventas y gastos ya sincronizadas

Con el alcance acotado (ver [El alcance de ediciones y borrados](#el-alcance-de-ediciones-y-borrados-en-detalle)),
este bloque pasó de "tanto trabajo como A1 entero" a **casi nada**. Lo que queda es A2.1.

La razón: editar o descartar una operación que aún está en la cola no llega nunca al servidor, así
que no necesita ningún soporte de backend. Y para lo único que sí se edita estando ya en la base de
datos —ventas y gastos— **las dos tablas ya tienen `updated_at`**
(`sale.entity.ts` L77, `expense.entity.ts` L48).

### A2.1 Detección de edición concurrente

Con un solo dispositivo por negocio el riesgo baja mucho, pero sigue existiendo: el dueño edita una
venta desde la web mientras el trabajador la edita offline en el móvil.

- Cada op de tipo `update` envía `baseUpdatedAt` (el `updated_at` que tenía la entidad cuando el
  cliente la cacheó).
- El handler compara contra el `updated_at` actual. Si difiere → `SYNC_EDICION_CONCURRENTE` con
  `{campoServidor, campoCliente, actualizadoEn}` y `requiresUserDecision: true`.
- La UI muestra ambas versiones y el usuario elige. **Nunca merge automático ni last-write-wins
  silencioso** — perder un cambio sin que nadie se entere es peor que pedir una decisión.

Aplica a exactamente dos handlers: `sale.update` y `expense.update`. Ninguno de los dos toca stock ni
capas FIFO — `SaleService.update()` solo modifica descripción, tipo de venta, datos de entrega y
`deliveryFee` (recalculando el total si aplica).

Sin migración: las dos columnas ya existen.

### A2.2 Bajada de datos

**`GET /api/v2/sync/bootstrap?businessId=`** — snapshot completo del catálogo, **sin cambios de
esquema**, disponible desde la primera fase. Devuelve `products`, `business_products`, `categories`,
`expense_categories`, `providers`, `business_workers` + permisos, `monetary_exchange`,
`business_settings`, más `serverTime` y `snapshotVersion` (hash del conjunto). Son cientos de filas:
el cliente lo reemplaza entero. Simple, correcto y sin deuda.

**Un borrado en el servidor se propaga solo**: si el dueño elimina un producto, deja de venir en el
siguiente `bootstrap` y el cliente lo quita de su catálogo local. Eso es precisamente lo que hace
innecesarios los tombstones.

**No se implementa `pull?since=`.** Sería una optimización de ancho de banda, no un requisito, y su
coste real está en el bloque descartado de A2.3.

### A2.3 Descartado del alcance, documentado por si se retoma

Si en el futuro hiciera falta editar y borrar catálogo offline, o si el snapshot completo se volviera
demasiado pesado, esto es lo que habría que construir. **No forma parte de la entrega.**

**a) Columnas de tiempo que faltan.** Auditoría verificada — carecen de `@UpdateDateColumn`:
`products`, `businesses`, `sale_items`, `inventory_history`, `inventory_cost_layers`,
`sale_item_cost_consumptions`, `payments`, `invoices`, `financial_transactions`, `notifications`,
`product_price_history`, `business_schedules`, `business_delivery`, `monthly_closing`,
`user_search_log`.

`products` y `businesses` **tampoco tienen `created_at`** — hoy no hay forma de saber cuándo se creó
un producto. Eso sigue siendo una carencia real del modelo, aunque el offline ya no la necesite.

```sql
ALTER TABLE `products`
  ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP;
CREATE INDEX `IDX_products_updated` ON `products` (`updated_at`);
```

**b) Soft-delete para propagar borrados en un pull delta.** Una tabla genérica de tombstones
alimentada por un subscriber de TypeORM **no funciona**: la mayoría de los borrados relevantes
ocurren por `ON DELETE CASCADE` en MySQL y TypeORM nunca los ve. Las únicas opciones fiables son
triggers `AFTER DELETE` o soft-delete real (`@DeleteDateColumn` + `softRemove`) en `products`,
`business_products`, `expenses`, `providers`, `categories`, `expense_categories`, `business_workers`.

Dos trampas que habría que planificar, no descubrir:

1. **Índices únicos.** `business_products` tiene único `(business_id, product_id)`. Con soft-delete,
   reasignar un producto previamente borrado viola el índice. Habría que **resucitar** la fila
   (`deleted_at = NULL` + actualizar campos) en vez de insertar. Igual con `monetary_exchange` y
   `currency_accounts`.
2. **Consultas crudas.** El query builder de TypeORM añade `deleted_at IS NULL` automáticamente, pero
   los `queryRunner.query(...)` no. Habría que auditar todo el SQL crudo.

**c) `GET /api/v2/sync/pull?businessId=&since=&cursor=&limit=`** devolviendo
`{ changes: {…}, deletions: […], nextCursor, serverTime }`, con cursor por `(updated_at, id)` para
paginar de forma estable.

**Coste estimado de retomarlo:** ~15 columnas nuevas, ~7 índices únicos rehechos, cambio semántico de
borrado en 7 entidades y auditoría de todas las consultas crudas. Es tanto trabajo como las fases 6
y 7 juntas.

---

## A3. Integridad contable

### A3.1 Cierres persistidos

Hoy los cierres se calculan al vuelo (`sale.service.ts` ~L1162-1497) y `monthly_closing` es una tabla
muerta. Con datos retroactivos, **el PDF que el negocio recibió por correo el día 8 y lo que la app
muestra hoy para el día 8 son distintos, sin aviso ni traza.** Dos documentos contradictorios sobre el
mismo día es un problema de integridad, no de UX.

Nuevo módulo `psearch-back/src/v2/closings/`:

```sql
CREATE TABLE `accounting_closings` (
  `id` VARCHAR(36) NOT NULL,
  `business_id` VARCHAR(36) NOT NULL,
  `period_type` ENUM('daily','monthly') NOT NULL,
  `period_start` DATETIME(3) NOT NULL,
  `period_end` DATETIME(3) NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `totals_json` JSON NOT NULL,              -- snapshot de ClosingData
  `generated_at` DATETIME(3) NOT NULL,
  `sent_at` DATETIME(3) NULL,
  `needs_revision` TINYINT(1) NOT NULL DEFAULT 0,
  `revision_reason` VARCHAR(255) NULL,
  `superseded_by_id` VARCHAR(36) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_closing_period_version`
    (`business_id`,`period_type`,`period_start`,`version`)
) ENGINE=InnoDB;
```

`cron-closing.service.ts` guarda el snapshot al enviar (la idempotencia del envío ya está resuelta
con `last_daily_closing_sent_at` / `last_monthly_closing_sent_at` en `business_settings`).

Al entrar dato retroactivo, el orquestador calcula los periodos afectados por los `occurredAt` del
lote y:

1. Marca los cierres solapados `needs_revision = 1` con motivo.
2. **No reenvía nada automáticamente.** Emite una notificación agrupada:
   *"El cierre del 07/08 cambió tras una sincronización: +3 ventas, +4.500 CUP. Puedes regenerarlo."*
3. Registra los periodos en `sync_operations.warnings_json` (`SYNC_CIERRE_AFECTADO`).
4. `GET /api/v2/sales/closing?…&version=original|current` para ver ambas cifras. Regenerar crea
   `version = N+1` y marca la anterior con `superseded_by_id`.

Un `SYNC_MAX_BACKDATE_DAYS` bajo (7) limita cuántos cierres se pueden reabrir; con 30 días se reabren
cierres mensuales, lo cual es defendible pero mucho más molesto para el usuario.

### A3.2 Cuentas por moneda

`currency_accounts.current_balance` es un acumulador actualizado con SQL atómico
(`current_balance + :amt`) desde `currency-account.listener.ts`.

- **Un pago retroactivo simplemente suma al saldo de hoy, y eso es correcto**: el saldo es "cuánto
  hay en el cajón ahora", y el dinero entró físicamente cuando se hizo la venta.
- La distorsión está en los **desgloses por periodo**, que salen de `financial_transactions`. Por eso
  esa tabla también recibe `occurred_at` y los informes se filtran por él.

**La fragilidad real es preexistente:** los listeners financieros se tragan los errores. Un fallo
pierde el movimiento en silencio y el saldo queda desviado **para siempre**, porque nada lo
recalcula. Ya hay evidencia de que esto mordió antes (existe la migración
`20260703125000-MergeDuplicateCurrencyAccounts.ts`). Bajo carga de sincronización la ventana pasa de
milisegundos a minutos.

Tres mitigaciones, las tres obligatorias:

1. **Drenaje síncrono de eventos durante la sincronización.** El orquestador acumula los eventos de
   cada operación y los despacha con `await eventEmitter.emitAsync(...)` **antes** de responder, en
   vez del `setImmediate` actual (`sale.service.ts` ~L465-469). Más lento por lote, pero es la
   diferencia entre "los saldos cuadran" y "los saldos cuadran casi siempre".
2. Nuevo `POST /api/v2/currency-accounts/:businessId/reconcile` (owner/admin) que recalcula
   `current_balance` sumando `financial_transactions`, devuelve la deriva y opcionalmente la corrige
   dejando una transacción de ajuste con traza.
3. El orquestador ejecuta la reconciliación en modo lectura al final de cada lote y reporta la deriva
   en `warnings`.

### A3.3 Notificaciones: evitar la avalancha

Sincronizar 3 días ≈ 150 ventas puede generar `out_of_stock`, `low_stock`, `price_changed` y
`negative_margin` por cada cambio, y cada una se envía por **todos** los canales configurados.
Fácilmente **300+ emails y SMS**. Los SMS cuestan dinero real y el WhatsApp (OpenWA) se banea por
spam.

- **Contexto de despacho**: `syncBatchId` + `suppressExternal` propagados dentro del payload del
  evento. Ya existe precedente exacto en el proyecto (`skipInventoryHistory` en el evento
  `business-product.changed`, `sale.service.ts` ~L449), así que es idiomático aquí. Alternativa:
  `AsyncLocalStorage`.
- `in_app` **siempre se escribe** (es barato y el usuario debe ver el detalle). Los canales externos
  se acumulan en `notification_digest_items(sync_batch_id, business_id, type, metadata_json)`.
- **Un resumen por lote**: *"Sincronización del 10/08 (dispositivo «Caja 2»): 47 ventas y 6 gastos de
  los últimos 3 días. 3 productos agotados (Coca-Cola, Pan, Café). 2 ventas con margen negativo."*
  Un email, un SMS, un WhatsApp.
- **Deduplicación global** — útil más allá del sync, hoy no existe ninguna:

```sql
ALTER TABLE `notifications`
  ADD COLUMN `dedupe_key` VARCHAR(160) NULL,
  ADD COLUMN `suppressed` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `sync_batch_id` VARCHAR(36) NULL;
CREATE INDEX `IDX_notif_dedupe` ON `notifications` (`business_id`,`dedupe_key`,`created_at`);
```

`dedupe_key = type + ':' + (metadata.productId ?? metadata.saleId ?? '')`. Si existe la misma clave
en las últimas 6 h, se escribe la fila con `suppressed = 1` y no se envía.

- `negative_margin` durante sync: **suprimir siempre el canal externo**. Con FIFO afectado por capas
  retroactivas, ese margen es poco fiable y alertar por SMS es ruido con coste.
- Kill-switch: `SYNC_NOTIFICATIONS_MODE=digest|off|realtime` (def. `digest`) + override por negocio.

### A3.4 Contrato de conflictos

Nuevos códigos en `psearch-back/src/common/error-codes.ts`:

`SYNC_STOCK_INSUFICIENTE`, `SYNC_PRECIO_DESACTUALIZADO`, `SYNC_PRECIO_HISTORICO_APLICADO`,
`SYNC_EDICION_CONCURRENTE`, `SYNC_ENTIDAD_NO_ENCONTRADA`, `SYNC_DEPENDENCIA_FALLIDA`,
`SYNC_DEPENDENCIA_CICLICA`, `SYNC_OCCURRED_AT_FUERA_DE_RANGO`, `SYNC_OCCURRED_AT_FUTURO`,
`SYNC_CLAVE_REUTILIZADA`, `SYNC_OPERACION_EN_CURSO`, `SYNC_CUOTA_PLAN_EXCEDIDA`,
`SYNC_LOTE_DEMASIADO_GRANDE`, `SYNC_CIERRE_AFECTADO`.

**Arreglo aditivo de `psearch-back/src/common/filters/http-exception.filter.ts`:** hoy aplana la
respuesta (`message ← resp.message || resp.mensaje`, `error ← resp.error || resp.codigo`) y **pierde
`detalles`**, que es justo lo que la UI de conflictos necesita para poder decir "pediste 12, hay 5".
Añadir `codigo` y `detalles` como campos nuevos **sin quitar** `message`/`error`, para no romper el
contrato que ya consume el front.

### A3.5 Auditoría y observabilidad

```sql
CREATE TABLE `sync_batches` (
  `id` VARCHAR(36) NOT NULL,
  `business_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `device_id` VARCHAR(64) NULL,
  `client_version` VARCHAR(32) NULL,
  `protocol_version` INT NOT NULL DEFAULT 1,
  `operations_total` INT NOT NULL,
  `applied_count` INT NOT NULL DEFAULT 0,
  `failed_count` INT NOT NULL DEFAULT 0,
  `blocked_count` INT NOT NULL DEFAULT 0,
  `duplicate_count` INT NOT NULL DEFAULT 0,
  `oldest_occurred_at` DATETIME(3) NULL,
  `clock_drift_ms` INT NULL,
  `duration_ms` INT NULL,
  `status` ENUM('running','completed','partial','failed','timeout') NOT NULL,
  `started_at` DATETIME(3) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_sync_batch_bus_started` (`business_id`,`started_at`),
  KEY `IDX_sync_batch_device` (`device_id`,`started_at`)
) ENGINE=InnoDB;

CREATE TABLE `sync_devices` (
  `id` VARCHAR(36) NOT NULL,
  `business_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `device_id` VARCHAR(64) NOT NULL,
  `label` VARCHAR(80) NULL,
  `platform` VARCHAR(32) NULL,
  `app_version` VARCHAR(32) NULL,
  `first_seen_at` DATETIME(3) NOT NULL,
  `last_seen_at` DATETIME(3) NOT NULL,
  `last_batch_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_sync_device` (`business_id`,`device_id`)
) ENGINE=InnoDB;
```

**Trazabilidad en el propio dato:** `sales`, `expenses` e `inventory_history` llevan `sync_batch_id` y
`sync_device_id`, así que "¿de dónde salió esta venta?" se responde con un JOIN, no leyendo logs.

**Correlación de logs:** interceptor que mete `syncBatchId` en `AsyncLocalStorage` y un `Logger` que
lo prefija. Sin él, 200 operaciones producen logs intercalados irrecuperables.

**Endpoints de diagnóstico** (owner del negocio / admin):
- `GET /api/v2/sync/batches?businessId=&from=&to=&status=`
- `GET /api/v2/sync/batches/:batchId` → todas las ops con estado, código de error y detalles
- `GET /api/v2/sync/operations/:clientOperationId?businessId=` → el "¿qué pasó con mi venta?" que va
  a necesitar soporte
- `GET /api/v2/sync/devices?businessId=`

**Métricas** (a log estructurado; no hay stack de métricas): ops por lote, `duration_ms`,
distribución de `error_code`, distribución de antigüedad de `occurredAt`, incidencias de stock
negativo, deriva de reloj, y **tasa de `duplicate`** — si sube mucho, el cliente tiene un bug de
reintentos.

---

## A4. Migraciones necesarias

En `psearch-back/src/v2/migrations/`, nomenclatura `YYYYMMDDHHmmss-Nombre.ts`.

| # | Fichero | Contenido | Fase |
|---|---|---|---|
| M1 | `…-CreateMonetaryExchangeHistory.ts` | Historial de tasas + backfill de la fila actual | 1 |
| M2 | `…-AddOccurredAtToBusinessEvents.ts` | `occurred_at`/`synced_at`/`sync_batch_id`/`sync_device_id`/`is_late_sync` en `sales`, `expenses`, `inventory_history`, `payments`, `financial_transactions`; backfill; `NOT NULL`; índices | 1 |
| M3 | `…-CreateInvoiceSequences.ts` | `invoice_sequences` + backfill; `invoices.issued_at`, `invoices.provisional_number` | 1 |
| M4 | `…-CreateSyncTables.ts` | `sync_batches`, `sync_operations`, `sync_devices` + índices + FK a `businesses` | 6 |
| M5 | `…-AddSyncAuditToSaleItems.ts` | `price_source`, `price_override_by`, `catalog_price_at_sale`, `cost_basis_approximate` en `sale_items`; `exchange_rate_applied` en `sales` | 6 |
| M6 | `…-AddSyncSettingsToBusinessSettings.ts` | `sync_stock_policy`, `sync_price_policy`, `sync_max_backdate_days`, `sync_notifications_mode` | 6 |
| M7 | `…-AddNotificationDedupe.ts` | `dedupe_key`, `suppressed`, `sync_batch_id` + índice; tabla `notification_digest_items` | 6 |
| M8 | `…-CreateAccountingClosings.ts` | `accounting_closings`; opcionalmente eliminar `monthly_closing` | 8 |

**Ocho migraciones, ninguna en la fase 9.** Con el alcance acotado desaparecieron las dos más caras
—`AddMissingTimestamps` sobre 15 tablas y `AddSoftDeleteToSyncableEntities` con los índices únicos
rehechos—, que están documentadas en [A2.3](#a23-descartado-del-alcance-documentado-por-si-se-retoma)
por si algún día se retoman. La detección de edición concurrente no necesita migración: `sales` y
`expenses` ya tienen `updated_at`.

> **Recordatorio operativo:** `synchronize: NODE_ENV !== "production"` en
> `psearch-back/src/config/typeorm-v2.config.ts` aplicará los cambios de entidad automáticamente en
> dev — pero **todas** necesitan su migración para producción, y hay que verificar que `synchronize`
> no genere un DDL divergente del de la migración (típico con `ENUM` y `DATETIME(3)`).

---

# Parte B — Cliente (`pmanage`)

## B0. Cimientos y deudas que bloquean

Antes de tocar nada de offline:

- **Unificar la URL de la API.** `pmanage/src/lib/routes/index.ts` hardcodea
  `BASIC_ROUTE = 'https://negora.dveloxsoft.com/api/v2'` como URL absoluta, lo que **anula el
  `baseURL`** de `pmanage/src/lib/axios.ts`. Además el fallback del refresh apunta a `.../apiv1` (sin
  barra ni `/v2`). Con dos entregas (web y APK) apuntando a hosts distintos esto es insostenible.
- **Migrar `getMyBusinessesList()`** (`pmanage/src/lib/api/business.ts` ~L10) a `apiClient`: hoy usa
  `axios` crudo y queda fuera de todo interceptor.
- **El interceptor no debe expulsar al usuario por un fallo de red.** Hoy un 401 hace
  `window.location.href = /login` — una recarga dura que, offline, significa perderlo todo.
  Distinguir `!error.response` / `ERR_NETWORK` de un token realmente inválido. **Es el cambio de
  mayor relación riesgo/beneficio de todo el plan.**

## B1. Detección de conexión

`pmanage/src/lib/offline/connectivity.ts` — store con `zustand` (ya está en `package.json` sin usar)
expuesto por `useSyncExternalStore`, no Context: el interceptor de axios también lo necesita fuera del
árbol React.

```ts
type Connectivity = 'online' | 'offline' | 'checking' | 'degraded';  // degraded = red OK, servidor caído
```

Tres señales:

1. Eventos `online`/`offline` del navegador → **solo como disparador**. `offline` es fiable en
   negativo; `online` no significa nada (wifi sin salida, portal cautivo).
2. **Sonda activa** contra `GET <API>/health` — **hay que crear ese endpoint en el backend**: público,
   sin auth, barato. Con `cache: 'no-store'`, `AbortController` a 5 s y regla `NetworkOnly` explícita
   en el service worker para que nunca mida la caché.
3. **Fallos de la propia app**: en el interceptor de axios, cualquier error sin `response` marca
   `degraded` y dispara sonda. Es la señal más veraz que existe porque es tráfico real.

Reglas contra falsos positivos:

- **Histéresis:** dos sondas OK consecutivas para declarar `online`. Y **validar que la respuesta sea
  el JSON esperado**, no solo `res.ok` — un portal cautivo devuelve 200 con HTML.
- Una sonda fallida sola no declara `offline`: hace falta fallo + (evento `offline` o dos fallos
  seguidos).
- `>= 500` → `degraded`, no `offline`: la cola no debe machacar un servidor caído.
- `401`/`403` en la sonda → `online`: la red va, es problema de auth.
- Backoff 5 → 10 → 20 → 40 → 60 s con jitter ±20 %. Reinicio inmediato ante evento `online`,
  `visibilitychange` o clic del usuario. **Pausar el sondeo con `document.hidden`** (batería y datos
  móviles, que en el contexto de uso importan).

Conectar `onlineManager` de React Query a este store, o peleará usando `navigator.onLine`.

## B2. PWA y service worker

`output: "export"` genera **593 ficheros `.txt`** además de los `.html`: son los *segment payloads* de
RSC que el App Router pide en cada navegación cliente. **Si el service worker no los cachea, la
navegación offline se rompe aunque el HTML esté cacheado.** Eso descarta los plugins PWA estándar
(`next-pwa`, `@serwist/next`), cuyo manifiesto sale del grafo del bundler y no ve los artefactos del
export.

**Enfoque: service worker artesanal con manifiesto generado desde `out/`.** El directorio `out/` *es*
el grafo completo de assets; un script Node que lo recorra tras `next build` produce un manifiesto
exacto, inmune a los cambios de bundler de Next, y permite replicar las reglas de Apache.

- `pmanage/scripts/generate-sw.mjs` — recorre `out/`, calcula revisiones por hash, aplica `basePath`,
  emite `out/sw.js` desde `pmanage/src/sw/sw.template.js`.
- `pmanage/src/sw/route-resolver.js` — **función pura** `resolveRoute(url, ctx)`, testeable con Vitest.
- `pmanage/src/lib/dynamic-routes.ts` — **fuente única** de las 7 reglas `__dynamic__` que hoy solo
  viven en `pmanage/public/.htaccess`. De aquí se derivan la tabla del service worker y el propio
  `.htaccess`. Sin esto, divergen en silencio.
- `pmanage/public/manifest.webmanifest` + iconos 192/512/maskable (hoy no existen).
- `pmanage/package.json` → `"build": "next build && node scripts/generate-sw.mjs"`.

| Recurso | Estrategia |
|---|---|
| `_next/static/**` (6.1 MB) | CacheFirst, precache completo (hasheados e inmutables) |
| `**/index.html` (2.3 MB) | StaleWhileRevalidate, precache; normalizar `/x` → `/x/` → `/x/index.html` |
| `**/*.txt` (3.4 MB, RSC payloads) | StaleWhileRevalidate, precache — **imprescindible** |
| Navegación | NetworkFirst (3 s) → caché → reglas `__dynamic__` → `/index.html` |
| API | **NetworkOnly** — los datos offline viven en IndexedDB, no en el service worker |
| `/health` | NetworkOnly explícito, nunca debe medir la caché |
| Imágenes de producto | CacheFirst con LRU (200 ítems / 50 MB) |

**Precache en dos tiempos** (13 MB en `install` es demasiado en red mala): el shell crítico (~2 MB) en
`install`; el resto en segundo plano tras `activate` con concurrencia limitada, reportando progreso
por `postMessage` para poder mostrar "Preparando modo offline… 62 %".

**Actualizaciones:** nunca `skipWaiting()` automático. Toast con `sileo` ofreciendo actualizar, y
**bloqueo de la actualización si hay operaciones pendientes en la cola**.

Dos detalles que rompen el despliegue si se olvidan:
- La fuente Poppins se carga de `fonts.googleapis.com` en `pmanage/src/app/layout.tsx` (~L24-29) y hay
  que auto-hospedarla con `next/font/local`.
- `.htaccess` debe servir `sw.js` y los `.html` con `Cache-Control: no-cache`, o cPanel dejará a los
  usuarios atrapados en una versión vieja indefinidamente. **Es el fallo de despliegue más probable.**

## B3. Almacenamiento local — Dexie

**Dexie 4** sobre `idb`: aporta esquema declarativo versionado, índices compuestos, `bulkPut`,
migraciones y `useLiveQuery` — que resuelve gratis el badge reactivo de pendientes y las listas
mezcladas. ~28 KB gz frente a los 6 MB de chunks que ya se sirven.

**Una base de datos por usuario:** `negora-<userId>`. Aislamiento total en dispositivos compartidos
(una tablet, tres turnos), "olvidar este dispositivo" = borrar la base, y ningún índice necesita
`userId`. Más una base global `negora-app` para lo que debe existir antes de saber quién eres.

```ts
// pmanage/src/lib/offline/db.ts
// DB global: negora-app
offlineProfiles: '&userId, email, updatedAt'
appMeta:         '&key'

// DB por usuario: negora-<userId>
entities: '&pk, entity, [entity+businessId], [entity+businessId+updatedAt], syncState'
queries:  '&queryHash, queryKeyRoot, [businessId+queryKeyRoot], updatedAt'
outbox:   '++seq, &id, status, [businessId+status], [status+nextAttemptAt], entity, createdAt'
blobs:    '&id, outboxId'
syncMeta: '&key'
```

`queries` reproduce la pantalla tal cual estaba (respeta el `{data, meta}` paginado y
`keepPreviousData`); `entities` es el catálogo local que necesita el motor para validar stock y
detectar ediciones concurrentes. `blobs` guarda `File`/`Blob` nativos para las imágenes de producto
pendientes (structured clone los soporta).

Llamar `navigator.storage.persist()` al habilitar el modo offline y avisar si se deniega.

## B4. Sesión offline

Se distingue **autenticar** (probar identidad contra una autoridad — imposible offline) de
**desbloquear** (reabrir una sesión ya establecida en este dispositivo — viable, y es lo que se
necesita). **Nunca primer login offline:** un dispositivo que jamás se autenticó no puede entrar.

```ts
interface OfflineProfile {
  userId; email; name; avatar; role; roleId;
  planSnapshot: Plan;                 // para que los guards no llamen a /auth/me
  loginMode: 'owner' | 'worker';
  lastBusinessId: string | null;
  refreshTokenEnc: ArrayBuffer;       // AES-GCM, clave = PBKDF2(PIN, salt, 310_000)
  pinSalt; pinVerifier; pinAttempts;
  offlineExpiresAt: number;           // now + OFFLINE_GRACE_DAYS
  updatedAt: number;
}
```

El **access token no se persiste** (vida corta, se re-obtiene por refresh al volver la red). El
refresh token va cifrado con clave derivada del PIN, nunca en claro. Wipe tras 5 PIN fallidos. Botón
"Olvidar este dispositivo" en el perfil.

Al recuperar red: descifrar el refresh token → `POST /auth/refresh` → sesión real. Si está revocado,
**conservar la cola**, pedir login online, y **verificar que el `userId` coincide** antes de ofrecer
la subida (si no coincide, bloquear: la cola pertenece a otro usuario).

Se puede dejar de espejar `auth_token` en cookie (`pmanage/src/lib/cookies.ts`): `middleware.ts` está
inerte con `output: "export"`, así que esa cookie no cumple ninguna función y es superficie de ataque
gratis.

**Riesgo que hay que documentar sin adornos:** cualquiera con el dispositivo desbloqueado puede
operar el negocio offline y leer los datos cacheados. El PIN frena a un ladrón oportunista, no a uno
determinado con el dispositivo en la mano. Y el offline reduce el control de acceso: un trabajador
despedido puede seguir cobrando durante la ventana del TTL.

**La mitigación real, y es responsabilidad del backend:** el endpoint de sincronización revalida
permisos, estado del trabajador y plan **en el momento del replay**, y rechaza sus operaciones. El
dinero cobrado se pierde igual — pero eso también pasa con una libreta de papel.

**Postura defendible ante un cliente:** *"El sistema se desbloquea sin internet con tu PIN durante
hasta N días. Todo lo que registres se valida contra el servidor al reconectar: si tus permisos
cambiaron, esas operaciones se rechazan y verás por qué."* Es la verdad y es demostrable.

## B5. Lecturas offline

**`experimental_createQueryPersister`**, no `persistQueryClient`: persiste query a query de forma
perezosa en vez de serializar el cliente entero en un blob que crece sin control y bloquea el
arranque. Además fija `networkMode: 'offlineFirst'`, que es exactamente el comportamiento buscado.

Cambios en `pmanage/src/components/providers/query-provider.tsx`:

- `persister` + `networkMode: 'offlineFirst'`.
- `retry: (n, err) => connectivity.isOnline() && n < 2` (hoy hace 3 reintentos inútiles sin red).
- **`staleTime` se mantiene tal cual** — está bien afinado y gobierna el refetch *habiendo* red. Lo
  que hay que subir es **`gcTime`**, que gobierna la caché en memoria: con 5 min en lo transaccional,
  volver a una pantalla tras 6 minutos offline la deja vacía. `gcTime ≥ 24 h` para todo lo que deba
  verse offline; `maxAge` del persister a 7 días.
- **`refetchOnReconnect` se queda en `false`.** Refrescar automáticamente al reconectar produce una
  tormenta de peticiones y contradice el requisito de que el usuario decida. En su lugar, invalidar
  por negocio **tras un push exitoso**.

> **Nota:** React Query ya tiene soporte de mutaciones offline (mutaciones pausadas,
> `resumePausedMutations`). **No es suficiente aquí**: viven en memoria salvo que se persista el
> cliente entero, no hay grafo de dependencias, ni control por operación (reintentar / descartar /
> ver error), ni control del usuario sobre *cuándo* subir. Se construye la cola propia, pero se
> cablea `onlineManager` para que React Query no interfiera.

**Arranque del dashboard sin red** — es el trabajo mayor de este bloque. Hoy
`pmanage/src/app/dashboard/layout.tsx` encadena cuatro fetches bloqueantes. Nuevo
`pmanage/src/components/providers/offline-boot-provider.tsx` que hidrata desde IndexedDB antes de
montar los guards y expone `bootState: 'hydrating' | 'ready' | 'needs-online'`.

- `pmanage/src/context/business-context.tsx` (~L89-131) — **crítico**: hoy, si falla la red, deja
  `businesses: []` y hace `router.push('/dashboard/business/create')`. Offline **expulsa al usuario a
  crear un negocio**. Cambio: si el error no es 401 y hay negocios en caché, usarlos y no redirigir.
- `pmanage/src/components/auth/plan-guard.tsx` — `initialData` desde `planSnapshot`; offline no
  redirige a `/seleccionar-plan` (un plan "vencido" leído de un snapshot obsoleto no debe echar a
  nadie).
- `pmanage/src/components/sidebar/sidebar.tsx` + `pmanage/src/hooks/use-navigation.ts` — el menú
  entero viene de `GET /navigation/sections`. **Sin menú no hay app**, y es el punto de fallo más
  silencioso: `gcTime: Infinity` + persister + snapshot de respaldo en `syncMeta`.
- Nuevo `pmanage/src/components/offline/needs-online-screen.tsx` para el primer arranque sin caché.

## B6. Cola de operaciones

```ts
// pmanage/src/lib/offline/outbox.ts
type OutboxStatus = 'pending' | 'blocked' | 'inflight' | 'done'
                  | 'failed' | 'rejected' | 'discarded';

interface OutboxOp {
  seq: number;                    // ++autoincremento → FIFO estricto
  id: string;                     // UUID → viaja como clientOperationId
  userId; businessId; entity;
  operation: 'create' | 'update' | 'delete' | 'action';
  handler: OutboxHandlerId;       // 'sale.create' | 'product.update' | 'inventory.addStock' | …
  payload: unknown;               // DTO exacto del backend, ya normalizado
  entityId: string;               // UUID generado en el cliente = PK futura
  baseUpdatedAt?: string;         // para detectar edición concurrente
  dependsOn: string[];
  blobIds?: string[];
  status; attempts; nextAttemptAt;
  needsManualCheck: boolean;      // fallo de red en un create: pudo haberse aplicado
  lastError: { at; status?; codigo?; mensaje; detalles? } | null;
  label: string;                  // "Venta · 3 productos · 1 250 CUP"
  createdAt; updatedAt; occurredAt;
  schemaVersion: number;          // ver riesgo 9
}
```

Dos mecanismos de orden, complementarios:

1. **FIFO estricto por `seq`** dentro de un negocio, con push **secuencial** (nunca paralelo). Es la
   garantía base: el orden de creación ya es el orden correcto.
2. **Grafo `dependsOn`** para no bloquearlo todo: si falla "crear producto", quedan `blocked`
   "asignarlo a negocio" y "venderlo", pero **no** un gasto registrado después. FIFO puro bloquearía
   la cola entera por un fallo aislado.

**Los UUID generados en cliente eliminan el remapeo de IDs.** El caso que preocupaba —crear producto
→ asignarlo a negocio → venderlo, todo offline antes de sincronizar— se resuelve solo: las tres
operaciones referencian el mismo UUID desde el momento cero. Y si el spike invalidara el UUID del
cliente, el código no cambia de forma: se añade una capa de resolución `localRef` en el orquestador.

**Fábrica única de mutaciones** `pmanage/src/lib/offline/mutation-factory.ts`, generalizando el patrón
`onMutate` / `setQueryData` / rollback que **ya existe** en `pmanage/src/hooks/use-navigation.ts`
(~L158-188) — es la plantilla interna a reusar. Online llama al handler directamente (comportamiento
idéntico al actual); offline encola y resuelve con el UUID ya conocido. El bloque `invalidate` se
reutiliza literalmente del `onSuccess` de cada hook actual.

Esto mantiene funcionando `submitSale()` en
`pmanage/src/app/dashboard/business/sales/create/page.tsx` (~L172-226), que lee `response.id` — offline
ese id existe desde el primer momento. Lo que sí hay que cambiar es no abrir el modal de cobro si la
venta está pendiente.

**Mezcla cola + caché en las listas:** hook `useWithPending` que une en render la lista del servidor
con las operaciones de la cola vía `useLiveQuery`. Los pendientes siempre se ven, sobreviven a
refetches y desaparecen solos al confirmarse. La función de mezcla se extrae pura para testearla sin
DOM.

**Multi-pestaña:** `navigator.locks.request('negora-sync', …)` con fallback a lock en `syncMeta` con
heartbeat, y `BroadcastChannel('negora-sync')` para propagar estado entre pestañas. Dos pestañas
subiendo la misma cola serían doble envío.

### Editar y descartar operaciones de la cola

Es la pieza que sustituye a "editar y borrar offline" para casi todo el uso real, y **no toca el
backend en absoluto**: la operación nunca salió del dispositivo.

`pmanage/src/lib/offline/outbox-edit.ts`:

```ts
editOp(opId: string, nextPayload: unknown): Promise<EditResult>
discardOp(opId: string, cascade: 'block' | 'discard'): Promise<DiscardResult>
```

Reglas, y aquí está toda la dificultad:

- **Solo se puede editar en estado `pending`, `blocked`, `failed` o `rejected`.** Nunca en `inflight`
  (se está enviando) ni en `done` (ya está en el servidor — para eso está la edición normal, que se
  encola como una op nueva de tipo `update`).
- **Revalidar la cadena antes de confirmar, no después.** Si se edita "crear producto" y hay una
  venta encolada que lo referencia, hay que recalcular los descendientes transitivos y **mostrar al
  usuario qué va a pasar con ellos antes de que confirme**: *"Esta venta y 2 operaciones más dependen
  de este producto."*
- **Descartar con dependientes exige elegir**: `AlertDialog` con las dos salidas —dejar los
  dependientes bloqueados a la espera de que se recree la raíz, o descartarlos también en cascada—
  enumerando exactamente cuáles se verían afectados. Nunca decidir por el usuario.
- **Toda edición deja traza**: la versión anterior del payload se conserva en la propia operación
  (`previousPayloads[]`) hasta que se sincroniza con éxito. Si algo sale mal, se puede reconstruir
  qué había antes.
- El `entityId` (el UUID) **no cambia nunca** al editar. Solo cambia el payload. Así las referencias
  de los dependientes siguen siendo válidas y no hay que reescribir nada más.
- Al editar, `updatedAt` de la operación se refresca pero **`seq` se mantiene**: el orden de la cola
  sigue siendo el orden en que ocurrieron las cosas, no el orden en que se corrigieron.

La lógica de recálculo de la cadena se extrae pura (`recomputeChain(ops, editedId)`) para poder
testearla sin IndexedDB.

## B7. Interfaz de sincronización

Todo bajo `pmanage/src/components/offline/`:

| Componente | Base shadcn | Dónde y qué hace |
|---|---|---|
| `connection-indicator.tsx` | `Badge` + `Tooltip` | Barra superior del dashboard, junto a la campana. Verde / ámbar "Sin conexión" / azul girando "Sincronizando" / rojo "N con error" |
| `pending-changes-button.tsx` | `Button` + `Badge` | **El botón del requisito**: siempre visible, con contador reactivo. También en `nav-user.tsx` para móvil colapsado. Con 0 pendientes se atenúa pero **no desaparece** |
| `sync-drawer.tsx` | `Sheet` (existe) | Botón primario "Subir cambios (N)", "Última sincronización: hace X", `Tabs` Pendientes / Con error / Historial. Lista agrupada por entidad con `Collapsible`, cada fila con `DropdownMenu` [**Editar** / Reintentar / Ver detalle / Descartar]. **Las cadenas de dependencia se muestran anidadas** ("Venta · depende de: Producto «Coca-Cola»") para que se entienda por qué algo está bloqueado, y para que al editar o descartar se vea a quién afecta |
| `sync-reconnect-dialog.tsx` | `Dialog` (existe) | Se abre una vez al pasar offline → online: *"Volvió la conexión. Tienes N cambios sin subir. ¿Subirlos ahora?"* → [Subir ahora] [Más tarde] + casilla "Subir automáticamente a partir de ahora". **Nunca auto-subir por defecto.** Antirrebote de 10 min |
| `sync-result-dialog.tsx` | `Dialog` + `Progress` | "12 subidos · 2 fallaron", con el mensaje literal del servidor y acción sugerida |
| `conflict-resolver.tsx` | `Dialog` + `Table` | Ver B8 |
| `offline-banner.tsx` | — | Franja fina: "Trabajando sin conexión. Tus cambios se guardan en este dispositivo" |
| `pending-badge.tsx` | `Badge` | Marca por fila: `opacity-70` + borde ámbar; rojo si fue rechazada |
| `sync-diagnostics.tsx` | `Table` | **No es opcional**: tamaño de cola, operación más antigua, última sincronización correcta, espacio disponible, motivo de rechazo por operación, y **"Exportar operaciones pendientes" a fichero**. Es el paracaídas cuando un cliente diga "perdí mis ventas" |

Hook público `pmanage/src/hooks/use-sync.ts`:

```ts
{ status, pendingCount, blockedCount, failedCount, rejectedCount,
  lastSyncAt, progress,
  push(), retry(opId), retryAll(),
  edit(opId, nextPayload), discard(opId, cascade), previewImpact(opId) }
```

Faltan en `pmanage/src/components/ui/`: `alert-dialog` (confirmar descartes destructivos) y
`progress`. El resto (`sheet`, `dialog`, `tabs`, `collapsible`, `badge`, `tooltip`, `dropdown-menu`,
`scroll-area`, `table`, `skeleton`, `empty`) ya existe.

## B8. Conflictos

| Clase | Detección | Estado | Qué ve el usuario |
|---|---|---|---|
| Red / timeout | `!error.response` | `failed` + backoff | Nada, salvo si era un `create`: **no se reintenta automáticamente**, se marca `needsManualCheck` y se pregunta *"No sabemos si esta venta llegó a registrarse. Revísala."* |
| 401 | `status===401` | **pausa toda la cola** | "Tu sesión expiró. Inicia sesión para subir tus cambios." Nada se pierde |
| 403 | `status===403` | `rejected` | "Tu plan no permite esto" |
| Negocio | 400/409/422 | `rejected` | Flujo de resolución |
| 404 | `status===404` | `rejected` | "El producto ya no existe" → descartar o recrear |
| 5xx | `status>=500` | `failed`, backoff largo | "El servidor tuvo un problema; reintentaremos" |

**Stock insuficiente** → tarjeta roja con *"Venta del 10/08 14:32 — stock insuficiente de
«Coca-Cola» (pediste 12, hay 5)"*, y el resolutor ofrece, con el stock real recién consultado:
- **Ajustar cantidades** → reencola una operación nueva; la vieja pasa a `discarded` con traza.
- **Quitar el producto conflictivo** → recalcula y reencola.
- **Descartar la venta** → `AlertDialog` de confirmación.
- **Ver en la lista** → navega a la entidad implicada.

**Precio desactualizado** → *"El precio de «X» cambió de 100 a 120 CUP mientras estabas sin
conexión"* → [Usar el precio nuevo y reenviar *(muestra el nuevo total)*] [Descartar]. No se ofrece
"mantener mi precio": el servidor lo rechazaría igual.

**Edición concurrente** → se muestran ambas versiones campo a campo y el usuario elige. Es el
conflicto nuevo que introduce el alcance de CRUD completo.

**Nada se descarta automáticamente.** Una operación rechazada persiste con contador rojo hasta que el
usuario decida. Al terminar el push, **un solo** diálogo de resultados; las cadenas independientes
siguen subiendo pese al rechazo de una.

**Trade-off que hay que comunicar en la interfaz, no esconder:** offline el stock mostrado es una
estimación local. Se descuenta en el catálogo local al vender (evita sobrevender dentro de la misma
sesión) y se etiqueta "stock estimado" cuando hay pendientes de ese producto.

## B9. Qué NO se permite offline

`pmanage/src/lib/offline/offline-capabilities.ts` → `isAllowedOffline(handlerId)`. Un solo sitio que
la interfaz consulta para deshabilitar botones con `Tooltip` explicativo.

**Bloqueado, con razón:**

1. **Registro, recuperación de contraseña, aceptar invitación, verificar código** — el servidor de
   auth *es* la operación.
2. **Cambios de plan, pagos, reconciliación de negocios.**
3. **Crear un negocio** — el negocio es la raíz del particionado multi-tenant; un id provisional
   contaminaría todos los índices, el `activeBusinessId` y todas las URLs con path param.
4. **Administración** (`/dashboard/admin/*`) — datos globales, baja frecuencia, alto riesgo.
5. **Invitar trabajadores / cambiar permisos** — genera token y envía email desde el servidor.
   *(Crear la ficha del trabajador sí se encola.)*
6. **Cobrar venta / registrar pagos** — el servidor calcula resumen, recargo y vuelto multimoneda
   (`repartirCobro`, con reglas de excedente no declarado y vuelto). Replicarlo es riesgo directo de
   descuadre de caja. Offline se registra la venta como pendiente de cobro.
7. **Borrar una venta** — ni offline ni online. El endpoint actual deja el inventario descuadrado
   ([A0.5](#a05-delete-salesid-está-roto-hoy)). La operación correcta es cancelar.
8. **Cerrar caja / cierre contable** — y regla nueva: bloquearlo **incluso online** si el negocio
   tiene operaciones pendientes. Un cierre con ventas sin subir es un cierre falso.
9. **Exportar PDF/Excel generados por el servidor** — factura, cierres, historial de inventario.
   *(Lo que se genera en cliente con `xlsx` sobre datos cacheados sí funciona y sigue habilitado.)*
10. **Actualizar el tipo de cambio** — dato compartido que reprecia todo el negocio. *(Consultarlo
    sí, cacheado y etiquetado con su fecha.)*
11. **Importación masiva de productos** — N entidades de golpe multiplica el riesgo de conflicto.
12. **Tickets de soporte, avatar de usuario.**
13. **Analítica** — mostrar lo cacheado con "Datos al ⟨fecha⟩", **nunca recalcular en cliente**:
    daría cifras distintas a las oficiales, que es peor que no mostrar nada.

**Permitido con aviso explícito:**

- **Cancelar una venta ya sincronizada.** Se encola, pero la interfaz deja claro que *el stock y el
  costo no se devuelven hasta que sincronices*. Es la operación con efectos FIFO más complejos del
  sistema (restaura unidades a las capas exactas de las que salieron, en orden inverso), y el cliente
  no puede ni debe simularlo.
- **Editar una venta o un gasto ya sincronizados.** Solo metadata: descripción, tipo de venta y datos
  de entrega. Se encola con `baseUpdatedAt` para detectar edición concurrente.

**Degradado, no bloqueado** (se muestra cacheado con la antigüedad visible): cierres en consulta,
historial de precios, historial de inventario, notificaciones, listados en general.

**Notificaciones offline:** suspender el `refetchInterval` de 60 s de
`pmanage/src/hooks/use-notifications.ts` (si no, 60 errores por hora y batería), mostrar el último
conteo con la campana atenuada, y ser explícito en la UI: **las alertas de stock bajo las genera el
servidor al procesar la venta**, así que offline no llegan; aparecerán tras sincronizar.

---

# Parte C — APK Android con Capacitor

El navegador puede desalojar IndexedDB por su cuenta — Safari en iOS borra el almacenamiento tras ~7
días sin uso en sitios no instalados, y Android puede desalojar por falta de espacio. Eso significa
**perder días de ventas sin ningún aviso**. Para "días completos" hace falta almacenamiento nativo.

- Capacitor envuelve **la misma carpeta `out/`** que ya genera `next build`. Cero código duplicado,
  cero rama paralela.
- `@capacitor/preferences` + WebView con almacenamiento nativo: sin cuota ni evicción.
- `@capacitor-community/sqlite` **solo si** el volumen de datos lo justifica; empezar con IndexedDB
  sobre WebView, que ya no está sujeta a evicción dentro de la app.
- `deviceId` estable desde `@capacitor/device` (en web, UUID persistido) → alimenta `X-Device-Id` y la
  tabla `sync_devices`.
- Detección de conectividad con `@capacitor/network` como señal adicional a la sonda.
- **Actualización de la app**: `@capacitor/live-updates` o descarga del APK desde el propio dashboard.
  Es una responsabilidad operativa nueva — hay que decidir quién publica y cómo se avisa.
- La versión PWA sigue existiendo para escritorio y para quien no instale.

**Coste real que hay que presupuestar:** firma de APK, canal de distribución, versionado y soporte de
instalación. No es una casilla de configuración.

---

# Fases de entrega

Ordenadas para que haya algo demostrable a un cliente potencial mucho antes del final.

| Fase | Contenido | Esfuerzo | Qué se puede enseñar |
|---|---|---|---|
| **· Documento** | Acordar este plan entre frontend y backend. **Nada más empieza hasta cerrar el acuerdo** | — | El plan completo, revisable por ambos equipos |
| **0 · Spike** | Confirmar que TypeORM respeta un `id` provisto (**bloqueante**); medir tamaño real de un lote de 200 ventas; prototipo de `SyncContext` en `SaleService.create`; medir duración de un lote contra la BD real | 2-3 d | — |
| **1 · Prerrequisitos backend** | A0 completo: historial de tasas, `occurred_at` + migración del reporting en un solo PR, secuencia de facturas. **Arregla bugs que ya existen hoy** | 1,5 sem | Cierres de periodos pasados dejan de valorarse con la tasa de hoy |
| **2 · Cimientos cliente** | B0 (deudas de axios/rutas), B1 (conectividad + `/health`), indicador y banner | 1 sem | La app ya no expulsa al usuario cuando falla la red; se ve el estado de conexión |
| **3 · PWA** | B2 completo: manifest, generador de service worker, precache, actualizaciones, fuente auto-hospedada, `Cache-Control` en `.htaccess` | 1 sem | **La app abre sin red** e instala en el móvil |
| **4 · Lecturas offline** | B3 (Dexie) + B5 (persister, arranque del dashboard, `business-context`, sidebar) | 1,5 sem | **El salto perceptible: el dashboard entero navega y consulta sin conexión** |
| **5 · Sesión offline** | B4 completo | 1 sem | Se entra a la app sin conexión con PIN |
| **6 · Sincronización, altas** | A1 completo (idempotencia, batch, grafo, `occurredAt`, políticas) + A3.3 (digest de notificaciones) + B6/B7 limitados a **ventas, gastos, productos, asignaciones e inventario**. Incluye **editar y descartar operaciones de la cola**, que no toca backend | 3 sem | **El 80 % del valor: no se pierde una venta.** Demo completa a cliente potencial |
| **7 · Conflictos** | B8 completo + A3.4 (códigos y filtro de errores) + diagnóstico | 1,5 sem | Un rechazo deja de ser un callejón sin salida |
| **8 · Integridad contable** | A3.1 (cierres persistidos con revisión) + A3.2 (reconciliación de saldos) + A3.5 (auditoría) | 2 sem | Los cierres dejan de contradecirse |
| **9 · Resto de altas y ediciones** | Extensión del cliente a proveedores, trabajadores y categorías; A2.1 (edición concurrente de ventas y gastos ya sincronizadas, sin migración); cancelar venta sincronizada desde la cola | 1 sem | El alcance acordado, completo |
| **10 · APK Android** | Parte C | 1,5 sem | "Días completos" pasa a ser una promesa cumplible |

**Dependencias duras:** 0 → todo · 1 → 6 · 4 → 6 · 6 → 7, 9 · 3 es independiente de 4 y 5.

> La fase 9 bajó de 3 semanas a 1 al acotar el alcance de ediciones y borrados. El detalle de qué se
> descartó y qué costaría retomarlo está en
> [A2.3](#a23-descartado-del-alcance-documentado-por-si-se-retoma).

---

# Riesgos aceptados

Compromisos conscientes, no descuidos. Conviene que queden por escrito y acordados.

1. **El costo FIFO de operaciones tardías es aproximado.** Se congela al entrar al servidor y no se
   revisa. El margen del periodo no coincidirá con lo que habría salido registrando todo a tiempo. Se
   marca y se hace visible.
2. **`currency_accounts.current_balance` es el punto más frágil del sistema** bajo carga de
   sincronización: es un acumulador sin recálculo, alimentado por listeners que se tragan los
   errores. El drenaje síncrono y el endpoint de reconciliación son obligatorios, no opcionales.
3. **La ventana de no-atomicidad** entre commit y marca `applied` se cierra con la sonda por UUID. Si
   el spike invalida el UUID del cliente, hay que ir a la opción invasiva de propagar el
   `EntityManager` hacia fuera de `SaleService.create`.
4. **Migración parcial a `occurred_at`** — si unos informes usan `created_at` y otros `occurred_at`,
   nada cuadrará y el bug será casi indetectable. Todo en un PR, con los specs verdes.
5. **Editar una operación de la cola que ya tiene dependientes.** Si el usuario corrige "crear
   producto" cuando ya hay una venta encolada que lo referencia, o descarta esa operación, hay que
   revalidar la cadena entera: los dependientes pasan a `blocked` y hay que decirle qué va a pasar
   con ellos **antes** de confirmar, no después. Es el riesgo nuevo que introduce el poder editar la
   cola, y vive entero en el cliente.
6. **El `bootstrap` es un snapshot completo.** Con catálogos grandes puede volverse pesado en red
   mala. Hay que medirlo con datos reales; si un negocio con 1.000 productos genera un payload
   incómodo, la salida es el `pull?since=` descrito en
   [A2.3](#a23-descartado-del-alcance-documentado-por-si-se-retoma), con su coste.
7. **Nunca fusionar automáticamente productos duplicados.** Fusionar dos productos con stock y capas
   FIFO propias es irreversible.
8. **El offline reduce el control de acceso** durante la ventana del TTL. Se mitiga revalidando
   permisos en el replay, no se elimina.
9. **Impuesto perpetuo:** cada endpoint nuevo tendrá que declarar su semántica offline. Se necesita
   una lista blanca explícita de operaciones sincronizables y un ítem obligatorio en el checklist de
   PR, con regla por defecto **"online-only salvo demostración en contra"**.
10. **Versionado de payloads:** la app se actualizará con cola pendiente. Cada operación lleva
    `schemaVersion`, el store local tiene migraciones, y **el servidor debe aceptar las N versiones
    anteriores**. Un cambio de DTO que hoy es trivial pasa a requerir compatibilidad hacia atrás.
11. **Modo incógnito**: el almacenamiento es efímero. El modo offline debe deshabilitarse por completo
    y decirlo (es detectable).
12. **Relojes desincronizados**: offline, el reloj del dispositivo *es* la fuente de la hora del
    negocio. Se mide la deriva en cada petición exitosa y se corrige en el servidor; los casos
    extremos se rechazan en vez de silenciarse.

---

# Verificación

## Backend

- **Spike (bloqueante)**: test que inserta una entidad con `id` provisto y comprueba que TypeORM lo
  respeta. Si falla, replantear A1.1 antes de seguir.
- Suite de replay determinista en `psearch-back/src/v2/sync/__tests__/`: lote con dependencias en
  orden inverso, ciclo, operación duplicada, fallo en cadena, `occurredAt` fuera de rango, deriva de
  reloj de 3 h, stock insuficiente, precio cambiado, edición concurrente.
- `sync-graph.util.spec.ts` — orden topológico puro, sin BD.
- **Prueba de caída**: matar el proceso entre el commit y la marca `applied`, reiniciar, reenviar el
  lote y **verificar que no hay venta duplicada**.
- Los specs existentes (`sale.service.spec.ts`, `analytics.service.spec.ts`, `expense.service.spec.ts`,
  `inventory-costing.service.spec.ts`) deben seguir verdes tras la extracción de políticas y la
  migración a `occurred_at`.
- Reconciliación: sincronizar 50 ventas y comprobar que `current_balance` coincide con la suma de
  `financial_transactions`.
- Verificar que 3 días de ventas producen **un** email de resumen, no 300.

## Cliente

- Vitest en `node` para lógica pura: grafo de la cola, clasificador de errores, máquina de
  conectividad con `vi.useFakeTimers()` (histéresis, backoff con jitter, portal cautivo que devuelve
  200 con HTML, 5xx → `degraded`, 401 → `online`), función de mezcla cola+lista.
- `recomputeChain` — editar una operación con dependientes y verificar que se recalculan; descartar
  con `cascade: 'block'` vs `'discard'`; que `entityId` y `seq` no cambian al editar; que editar en
  estado `inflight` o `done` se rechaza. **Es la lógica nueva con más superficie de error.**
- `dynamic-routes.test.ts` — **lee `pmanage/public/.htaccess` del disco** y verifica que la tabla del
  service worker resuelve idénticamente. Es la única defensa real contra la divergencia entre Apache
  y el service worker.
- `fake-indexeddb` como devDependency para tests de integración del motor: encolar operaciones con
  dependencias, transporte falso, verificar estados finales y bloqueos.
- Inyección de dependencias en lugar de mockear `navigator.onLine`: `createSyncEngine({ transport })`
  y `createConnectivity({ probe })`.
- jsdom + Testing Library para `sync-drawer`, `connection-indicator`, `pending-badge`,
  `sync-reconnect-dialog`.
- Test que ejecuta `generate-sw.mjs` sobre un `out/` de fixture y comprueba que el manifiesto incluye
  `.txt`, `.html` y `_next/static` y respeta el `basePath`.

## Manual, no negociable

Con `pmanage/docs/offline-plan/offline-qa.md` como checklist:

- Android real con datos apagados **y** con wifi conectado sin salida (el caso que rompe
  `navigator.onLine`).
- Jornada completa offline: 30 ventas, 5 gastos, 3 productos nuevos con imagen, 2 entradas de stock
  → **corregir dos ventas y descartar una tercera desde la cola** → subir todo → verificar cifras
  contra la base de datos.
- Editar en la cola un producto del que ya cuelga una venta, y comprobar que se avisa del impacto
  antes de confirmar.
- Recarga dura en medio de una cola pendiente.
- Dos pestañas subiendo a la vez.
- Actualizar la app con cola pendiente.
- Cerrar la app 3 días y volver (APK) para confirmar que la cola sigue ahí.
- Subir una venta cuyo producto cambió de precio, y otra cuyo stock ya no alcanza; comprobar que
  ambos resolutores funcionan y que la venta corregida entra bien.
