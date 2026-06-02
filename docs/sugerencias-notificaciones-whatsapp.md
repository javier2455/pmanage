# Sugerencias de notificaciones por WhatsApp

> Propuestas de notificaciones a emitir vía la API de WhatsApp, **ordenadas por prioridad** (de más a menos importante).
> Cada una indica qué la dispara, por qué importa y de qué dato del sistema se obtiene.

| | |
|---|---|
| **Fecha** | 2026-06-01 |
| **Contexto** | Backend ya trabaja en: (1) resultados del cierre diario y (2) alerta de stock bajo umbral configurable. |
| **Objetivo** | Identificar qué otras notificaciones aportarían valor al usuario con la información que ya manejamos. |

---

## Resumen del modelo de datos disponible

Las sugerencias se apoyan en entidades que el sistema ya captura:

- **Ventas** — total, ítems (producto, cantidad, precio), `createdBy`/`userName`, `isCancelled`, `cancelledReason`, `createdAt`.
- **Inventario** — stock actual por producto, `entryPrice`, `price`, e historial de movimientos (`purchase`, `cancel_sale`, `initial_stock`) con `previousStock`/`newStock`.
- **Productos** — catálogo, categorías, unidad, precio de venta, precio de entrada, activo/inactivo.
- **Gastos** — `title`, `amount`, categoría, `createdBy`/`userName`.
- **Cierre contable** — ventas, gastos, `totalIncome`, `totalExpense`, `total` por fecha.
- **Proveedores** — productos que ofrecen con sus precios (`ProviderProduct.price`).
- **Tipo de cambio** — USD, EURO, CUP_TRANSFERENCIA, CLASICA, MLC, etc. con `updatedAt`.
- **Trabajadores** — con permisos y ventas atribuibles.
- **Historial de precios** — cambios de precio de productos (precio anterior, nuevo, usuario).
- **KPIs / Analytics** — `revenue`, `profit`, `avgTicket`, `cancellationRate`, `inventoryValue`, top products, sales trend (cada KPI ya incluye su `change`).

---

## 🔴 Prioridad alta — dinero en riesgo / acción inmediata

### 1. Producto agotado (stock = 0)
Distinto del "stock bajo": aquí ya se están perdiendo ventas *ahora mismo*. El umbral avisa "se acaba"; este avisa "se acabó". Conviene tratarlo como notificación aparte y más urgente.

- **Dispara:** `stock` llega a 0.
- **Dato:** `stock` en `CurrentInventoryEntry`.
- **Esfuerzo:** bajo — dato ya disponible.

### 2. Venta cancelada
El evento que más necesita supervisión del dueño: posible error o fraude de un trabajador. La notificación puede incluir **quién** la canceló y el **motivo**.

- **Dispara:** una venta pasa a `isCancelled = true`.
- **Dato:** `isCancelled`, `cancelledReason`, `userName`, `total` en `SaleWithProductAndBusiness`.
- **Esfuerzo:** bajo — todos los datos ya existen.

### 3. Venta por debajo del costo (margen negativo)
Cuando el precio de un ítem vendido queda por debajo de su `entryPrice` → pérdida directa, casi siempre por error de tecleo o descuento no autorizado. Alto valor porque se detecta sola y es difícil de ver manualmente.

- **Dispara:** `precio` del ítem < `entryPrice` del producto.
- **Dato:** `precio` del ítem de venta vs `entryPrice` del producto.
- **Esfuerzo:** medio — requiere que el backend compare ambos al registrar la venta.

### 4. Gasto elevado o inusual registrado
Contraparte de las ventas: avisar cuando se registra un gasto por encima de un umbral (o muy por encima del promedio de su categoría). Control de egresos en tiempo real.

- **Dispara:** `amount` supera un umbral configurable o el promedio histórico de su categoría.
- **Dato:** `amount`, `expenseCategoryName`, `userName` en `Expense`.
- **Esfuerzo:** bajo a medio.

---

## 🟡 Prioridad media — supervisión y estrategia

### 5. Cambio de precio de un producto
Ya se registra `PriceHistoryEntry` (precio anterior, nuevo, usuario). Notificar al dueño cuando alguien cambia un precio cierra el ciclo de control sin que tenga que entrar a revisar el historial.

- **Dispara:** se crea un nuevo `PriceHistoryEntry`.
- **Dato:** historial de precios ya implementado.
- **Esfuerzo:** bajo.

### 6. Resumen semanal / mensual con comparativa
El cierre *diario* ya existe; el salto de valor es el **agregado con tendencia**: "esta semana vendiste 12% más que la anterior, gastos −5%". Convierte datos en decisión.

- **Dispara:** cierre de semana/mes (programado).
- **Dato:** `KPIsResponse` ya trae `change` por KPI.
- **Esfuerzo:** medio — agregación programada.

### 7. Producto estancado (capital inmovilizado)
Producto con stock pero sin ventas en N días → dinero parado, riesgo de obsolescencia/vencimiento. Complementa al de stock bajo (el otro extremo del problema de inventario).

- **Dispara:** producto con `stock > 0` sin ítems de venta en los últimos N días.
- **Dato:** cruce de `stock` actual con ausencia de ventas recientes.
- **Esfuerzo:** medio — requiere endpoint/consulta nueva.

### 8. Recordatorio de tasa de cambio desactualizada
Con múltiples monedas (USD, EURO, CUP_TRANSFERENCIA, CLASICA, MLC), una tasa vieja distorsiona todos los cálculos. Avisar si no se actualiza en X tiempo es barato y evita errores silenciosos.

- **Dispara:** `updatedAt` de la tasa supera un umbral de antigüedad.
- **Dato:** `updatedAt` en `ExchangeRateTypeOne`.
- **Esfuerzo:** bajo.

---

## 🟢 Prioridad baja — informativo / engagement

### 9. Meta de ventas diaria alcanzada
Motivacional para el equipo. Requiere configurar una meta.

- **Dato:** total de ventas del día vs meta configurada.

### 10. Oportunidad de reabastecimiento / cambio de precio en proveedor
Ya se guarda el precio de cada producto por proveedor. Útil al cruzarlo con productos en stock bajo: "el producto X está bajo y el proveedor Y lo tiene a Z".

- **Dato:** `ProviderProduct.price` cruzado con stock bajo.

### 11. Nuevo trabajador / invitación aceptada
Notificación de seguridad de acceso: alguien nuevo entró al negocio.

- **Dato:** alta de `Worker` / aceptación de invitación.

---

## Recomendación de implementación

Las **#1, #2 y #4** son las de mejor relación valor/esfuerzo: salen 100% de datos que ya existen, son eventos discretos (no requieren cálculos batch) y son justo las que un dueño quiere saber sin estar mirando la app.

La **#3 (margen negativo)** es la de mayor valor diferencial, pero necesita lógica nueva en el backend.

### Orden sugerido de adopción
1. Eventos discretos sobre datos existentes → #1, #2, #4, #5, #8.
2. Lógica nueva de alto valor → #3.
3. Agregaciones programadas → #6, #7.
4. Engagement / extras → #9, #10, #11.
