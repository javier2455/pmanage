# Núcleo Contable — Especificación Técnica

**Proyecto:** pmanage  
**Versión de referencia:** 0.20.8-beta  
**Audiencia:** Equipo de Backend + Equipo de Frontend  
**Objetivo:** Escalar el sistema actual de gestión de ventas y gastos a un **sistema financiero-contable completo** que guíe el crecimiento del negocio.

---

## Contexto actual

El sistema ya maneja ventas, gastos, inventario y un cierre contable básico (diario y mensual). Sin embargo, estos módulos funcionan de forma aislada: una venta suma ingresos, un gasto resta dinero, pero **no hay un registro contable estructurado** que relacione ambos lados de cada operación. Esto limita la capacidad de generar estados financieros reales (P&L, Balance General, Flujo de Caja) y de auditar el negocio con precisión.

La base ya existe: hay `entryPrice` en inventario para calcular costos, hay `exchange-rate` para multi-moneda, y hay cierre diario/mensual como punto de partida. Lo que falta es el **esqueleto contable** que conecta todo.

---

## 2.1.A — Plan de Cuentas (Chart of Accounts)

### ¿Qué es?

Un catálogo jerárquico de todas las cuentas contables del negocio, organizadas en cinco grupos universales:

```
Activos          → Lo que el negocio TIENE (caja, inventario, cuentas por cobrar)
Pasivos          → Lo que el negocio DEBE (deudas, cuentas por pagar)
Patrimonio       → Lo que queda para el dueño (capital inicial + utilidades acumuladas)
Ingresos         → Entradas de dinero (ventas de productos, servicios)
Egresos/Gastos   → Salidas de dinero (compras, sueldos, alquiler, gastos operativos)
```

Cada venta, gasto o movimiento de inventario genera automáticamente un **asiento contable de doble partida**: por cada peso que entra a una cuenta, un peso sale de otra. Esto garantiza que el Balance siempre cuadre.

**Ejemplo — Al registrar una venta de $100:**
| Cuenta | Débito | Crédito |
|---|---|---|
| Caja / Banco (Activo) | $100 | — |
| Ingresos por Ventas (Ingreso) | — | $100 |

**Ejemplo — Al registrar un gasto de alquiler de $30:**
| Cuenta | Débito | Crédito |
|---|---|---|
| Gasto de Alquiler (Egreso) | $30 | — |
| Caja / Banco (Activo) | — | $30 |

### ¿Por qué implementarlo?

Sin un plan de cuentas, el sistema solo puede decir "vendiste X y gastaste Y". Con él, puede responder:
- ¿Cuánto efectivo tiene el negocio ahora mismo?
- ¿Cuánto vale el inventario?
- ¿Cuál es la utilidad neta del mes?
- ¿Cuánto debo a proveedores?

Es el cimiento de todos los reportes financieros estándar (P&L, Balance, Flujo de Caja).

### Responsabilidad Backend

- **Nuevo modelo `Account`:**
  ```
  id, code (ej: "1.1.01"), name, type (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE),
  parentId (para jerarquía), businessId, isSystem (true = creada por el sistema, no borrable),
  active, createdAt
  ```
- **Nuevo modelo `JournalEntry` (Asiento contable):**
  ```
  id, businessId, date, description, reference (ej: "SALE-123"), createdBy,
  periodId (ejercicio fiscal al que pertenece), createdAt
  ```
- **Nuevo modelo `JournalLine` (Línea de asiento):**
  ```
  id, journalEntryId, accountId, debit (decimal), credit (decimal), description
  ```
  Regla: la suma de todos los débitos de un asiento debe ser igual a la suma de todos los créditos. El backend valida esto antes de persistir.

- **Generación automática de asientos** al crear/cancelar una venta, al registrar un gasto, al agregar stock (compra de inventario). El asiento se genera en la misma transacción de base de datos que la operación original.

- **Endpoints necesarios:**
  - `GET /accounts?businessId=` — Listar plan de cuentas del negocio.
  - `POST /accounts` — Crear cuenta personalizada.
  - `PUT /accounts/:id` — Editar nombre o jerarquía.
  - `GET /journal?businessId=&startDate=&endDate=` — Libro diario.
  - `GET /journal/:id` — Detalle de un asiento con sus líneas.

- **Plan de cuentas predeterminado:** Al crear un nuevo negocio, el sistema genera automáticamente un plan de cuentas básico con las cuentas más comunes (Caja, Bancos, Inventario, Cuentas por Cobrar, Ingresos por Ventas, Costo de Ventas, Gastos Operativos, etc.).

### Responsabilidad Frontend

- **Pantalla de Plan de Cuentas** (`/dashboard/accounting/accounts`): tabla jerárquica expandible con código, nombre, tipo y saldo actual.
- **Vista de Libro Diario** (`/dashboard/accounting/journal`): tabla de asientos con filtro por fecha y búsqueda por referencia. Al hacer clic en un asiento se despliegan sus líneas de débito/crédito.
- Ningún formulario de ventas, gastos o inventario cambia — los asientos se generan en el backend de forma invisible para el usuario.

### Tiempo estimado

| Equipo | Tarea | Estimado |
|---|---|---|
| Backend | Modelos + migraciones de DB | 3 días |
| Backend | Lógica de generación automática de asientos en ventas/gastos/inventario | 4 días |
| Backend | Endpoints de consulta (accounts, journal) | 2 días |
| Backend | Plan de cuentas predeterminado al crear negocio | 1 día |
| Frontend | Pantalla plan de cuentas | 2 días |
| Frontend | Vista libro diario | 2 días |
| **Total** | | **~14 días** |

---

## 2.1.B — Ejercicios Fiscales y Cierre de Períodos

### ¿Qué es?

Un **ejercicio fiscal** es el período formal (normalmente un mes o un año) durante el cual se registran transacciones contables. Al "cerrar" un período, se congela su información: ninguna transacción puede modificarse retroactivamente.

Hoy el sistema tiene un "cierre contable" diario y mensual, pero es solo un reporte: no impide editar ventas o gastos de días anteriores.

### ¿Por qué implementarlo?

- **Integridad contable:** los estados financieros de períodos pasados no deben cambiar.
- **Cumplimiento:** cualquier auditoría requiere que los registros históricos sean inmutables.
- **Prevención de errores:** evita que un trabajador modifique accidentalmente una venta de hace un mes que ya fue reportada.

### Responsabilidad Backend

- **Nuevo modelo `FiscalPeriod`:**
  ```
  id, businessId, year, month, status (OPEN/CLOSED), closedAt, closedBy
  ```
- Al intentar crear/editar/cancelar una transacción (venta, gasto, movimiento de inventario), el backend valida que la fecha de la transacción pertenezca a un período `OPEN`. Si el período está `CLOSED`, devuelve error `423 Locked`.
- **Endpoint de cierre:** `POST /fiscal-periods/:id/close` — cierra el período, calcula saldos finales y los guarda como saldos iniciales del siguiente período.
- El cierre del período actual puede hacerse manual (el usuario lo decide) o automático (primer día del mes siguiente).

### Responsabilidad Frontend

- **Panel de períodos** (`/dashboard/accounting/periods`): lista los últimos 12 meses con su estado (Abierto / Cerrado) y botón "Cerrar período".
- **Diálogo de confirmación** antes de cerrar: mostrar resumen de ventas, gastos y utilidad del período que se va a cerrar.
- Al intentar editar una venta/gasto de un período cerrado, mostrar un mensaje claro: "Este registro pertenece a un período cerrado y no puede modificarse."

### Tiempo estimado

| Equipo | Tarea | Estimado |
|---|---|---|
| Backend | Modelo FiscalPeriod + validación en transacciones | 3 días |
| Backend | Endpoint de cierre + cálculo de saldos | 2 días |
| Frontend | Panel de períodos + diálogo de cierre | 2 días |
| Frontend | Mensajes de error en formularios al editar período cerrado | 1 día |
| **Total** | | **~8 días** |

---

## 2.1.C — Costo de Venta (COGS) y Margen Real

### ¿Qué es?

El **Costo de Venta (COGS, Cost of Goods Sold)** es cuánto le costó al negocio el producto que vendió. La diferencia entre el precio de venta y el costo es el **margen bruto real**.

```
Margen bruto = Precio de venta − Costo del producto
Margen % = (Precio de venta − Costo) / Precio de venta × 100
```

El sistema ya guarda `entryPrice` (precio de costo) en cada movimiento de inventario. Falta calcular y persistir el costo exacto en el momento de cada venta usando el método **Promedio Ponderado** (el más simple y adecuado para micro-empresas).

**Método Promedio Ponderado:**
```
Costo promedio = Valor total del inventario / Unidades totales en stock
Al vender: costo de la venta = costo promedio × unidades vendidas
```

### ¿Por qué implementarlo?

Hoy el negocio sabe que vendió $100, pero no sabe si ganó $80 o $20. Sin el costo de venta, el P&L no tiene sentido y el dueño no puede tomar decisiones de precio.

### Responsabilidad Backend

- Agregar campo `unitCost` (costo unitario al momento de la venta, calculado con promedio ponderado) en el modelo `SaleItem`.
- Al crear una venta, calcular el costo promedio del producto con el inventario actual y guardarlo en `SaleItem.unitCost`.
- Exponer `totalCost` y `grossMargin` en el response de ventas y en el dashboard.
- En el endpoint de `daily-accounting-close` y `monthly-accounting-close`, incluir `totalCOGS`, `grossProfit` y `grossMarginPercent`.

### Responsabilidad Frontend

- **Dashboard:** agregar card de "Margen bruto" junto a las de ventas y gastos.
- **Cierre contable:** agregar columna de costo y margen en las tablas de ventas.
- **Detalle de venta:** mostrar `Costo: $X | Margen: Y%` por cada ítem.

### Tiempo estimado

| Equipo | Tarea | Estimado |
|---|---|---|
| Backend | Cálculo de promedio ponderado al crear venta | 2 días |
| Backend | Exponer COGS en endpoints de ventas y cierres | 1 día |
| Frontend | Card de margen en dashboard | 1 día |
| Frontend | Columnas de costo/margen en cierre y detalle de venta | 2 días |
| **Total** | | **~6 días** |

---

## 2.1.D — Cuentas por Cobrar y por Pagar (AR/AP)

### ¿Qué es?

- **Cuentas por Cobrar (AR — Accounts Receivable):** ventas realizadas pero que el cliente aún no pagó (ventas a crédito).
- **Cuentas por Pagar (AP — Accounts Payable):** gastos registrados que el negocio aún no pagó (deudas con proveedores).

Actualmente todas las ventas se asumen como pagadas en el momento. Esto impide llevar control de clientes que compran fiado.

### ¿Por qué implementarlo?

El crédito informal es muy común en micro-empresas. Sin este módulo, el negocio no sabe cuánto dinero le deben ni a quién le debe, lo que puede llevar a problemas de flujo de caja serios. El **reporte de antigüedad de deuda (Aging Report)** muestra cuántas deudas llevan 0-30 días, 31-60, 61-90 y más de 90 días vencidas.

### Responsabilidad Backend

- **Nuevo campo `paymentStatus`** en `Sale`: `PAID | CREDIT | PARTIAL`.
- **Nuevo campo `dueDate`** en `Sale`: fecha límite de pago cuando es a crédito.
- **Nuevo modelo `Payment`**: registro de cobros parciales o totales sobre una venta a crédito (`saleId, amount, paymentDate, method`).
- **Endpoint Aging Report:** `GET /ar/aging?businessId=` — agrupa deudas por rango de días vencidos.
- Similar para AP en gastos (campo `paid: boolean` + `dueDate` en `Expense`).

### Responsabilidad Frontend

- En el formulario de nueva venta, agregar toggle "Venta a crédito" con campo de fecha de pago.
- **Pantalla de Cuentas por Cobrar** (`/dashboard/accounting/receivables`): tabla de ventas pendientes de cobro con días vencidos destacados en rojo/amarillo/verde.
- **Aging Report:** gráfico de barras con los cuatro rangos de vencimiento.
- Botón "Registrar cobro" en cada venta pendiente.

### Tiempo estimado

| Equipo | Tarea | Estimado |
|---|---|---|
| Backend | Campos paymentStatus/dueDate en Sale + modelo Payment | 2 días |
| Backend | Lógica de cobros parciales y actualización de estado | 2 días |
| Backend | Aging report endpoint | 2 días |
| Backend | AP en gastos (campo paid/dueDate) | 1 día |
| Frontend | Toggle "a crédito" en formulario de venta | 1 día |
| Frontend | Pantalla de cuentas por cobrar + aging report | 3 días |
| **Total** | | **~11 días** |

---

## 2.1.E — Multi-moneda con Historial de Tipo de Cambio

### ¿Qué es?

El sistema ya tiene una tabla de tipos de cambio (USD/EUR). El problema es que el tipo de cambio se aplica al momento de la consulta, no al momento de la transacción. Si el tipo de cambio cambia, los registros históricos muestran valores incorrectos.

La solución es **persistir el tipo de cambio vigente en el momento exacto** en que se registra cada transacción.

### ¿Por qué implementarlo?

Una venta de $50 USD registrada cuando el cambio era 1 USD = 240 CUP debe seguir mostrando 12.000 CUP aunque hoy el cambio sea 1 USD = 300 CUP. Sin esto, los cierres históricos son matemáticamente incorrectos.

### Responsabilidad Backend

- Agregar campo `exchangeRateSnapshot` en `Sale` y `Expense`: guarda el tipo de cambio vigente al momento de la creación.
- Al crear una transacción en moneda extranjera, consultar el tipo de cambio actual y guardarlo en `exchangeRateSnapshot`.
- Los endpoints de reportes usan siempre el snapshot, nunca el tipo de cambio actual para calcular equivalencias históricas.

### Responsabilidad Frontend

- En el formulario de nueva venta/gasto, mostrar el tipo de cambio vigente como referencia (solo lectura).
- En el detalle de una venta histórica, mostrar el tipo de cambio con el que fue registrada.
- En reportes, aclarar "Los valores en CUP se calcularon con el tipo de cambio vigente al momento de cada transacción."

### Tiempo estimado

| Equipo | Tarea | Estimado |
|---|---|---|
| Backend | Campo exchangeRateSnapshot en Sale y Expense | 1 día |
| Backend | Migración de datos existentes (rellenar con tipo de cambio aproximado o nulo) | 1 día |
| Frontend | Mostrar tipo de cambio snapshot en detalles y reportes | 1 día |
| **Total** | | **~3 días** |

---

## 2.1.F — Conciliación Bancaria

### ¿Qué es?

La conciliación bancaria es el proceso de comparar los movimientos registrados en el sistema contra el extracto real del banco, para identificar discrepancias (pagos no registrados, transferencias pendientes, errores).

### ¿Por qué implementarlo?

Es uno de los controles contables más básicos. Sin él, el saldo en el sistema puede diferir del saldo real en el banco sin que el negocio lo sepa hasta que sea tarde.

### Responsabilidad Backend

- **Nuevo modelo `BankStatement`**: representación de un extracto bancario importado.
- **Nuevo modelo `BankTransaction`**: cada línea del extracto (`date, description, amount, type: DEBIT/CREDIT, matched: boolean, matchedWith: saleId | expenseId`).
- **Endpoint de importación:** `POST /bank-statements` — acepta CSV o JSON con las transacciones.
- **Endpoint de conciliación:** `PUT /bank-transactions/:id/match` — vincula una transacción bancaria con una venta o gasto del sistema.
- **Reporte de diferencias:** transacciones del banco sin match y transacciones del sistema sin respaldo bancario.

### Responsabilidad Frontend

- **Pantalla de Conciliación** (`/dashboard/accounting/reconciliation`): dos columnas, izquierda el extracto importado, derecha las transacciones del sistema. El usuario arrastra o selecciona para hacer match.
- Botón de importación de CSV con preview antes de confirmar.
- Indicador visual de qué porcentaje del período está conciliado.

### Tiempo estimado

| Equipo | Tarea | Estimado |
|---|---|---|
| Backend | Modelos BankStatement/BankTransaction + parser de CSV | 3 días |
| Backend | Lógica de matching manual y automático (por monto+fecha) | 3 días |
| Backend | Reporte de diferencias | 1 día |
| Frontend | UI de conciliación (dos columnas + matching) | 4 días |
| Frontend | Importación de CSV con preview | 2 días |
| **Total** | | **~13 días** |

---

## Resumen de Estimados por Sub-punto

| Sub-punto | Descripción | Backend | Frontend | Total |
|---|---|---|---|---|
| 2.1.A | Plan de Cuentas + Libro Diario | 10 días | 4 días | **14 días** |
| 2.1.B | Ejercicios Fiscales y Cierre de Períodos | 5 días | 3 días | **8 días** |
| 2.1.C | Costo de Venta (COGS) y Margen | 3 días | 3 días | **6 días** |
| 2.1.D | Cuentas por Cobrar y por Pagar | 7 días | 4 días | **11 días** |
| 2.1.E | Multi-moneda con historial de tipo de cambio | 2 días | 1 día | **3 días** |
| 2.1.F | Conciliación Bancaria | 7 días | 6 días | **13 días** |
| | **TOTAL** | **34 días** | **21 días** | **~55 días hábiles** |

> Los tiempos son estimados para un desarrollador por equipo trabajando a tiempo completo en cada sub-punto. Con equipos paralelos el tiempo real se comprime.

---

## Roadmap de Implementación

El orden está determinado por **dependencias técnicas** (qué necesita estar listo antes) y **valor de negocio** (qué le da información útil al usuario más rápido).

```
FASE 1 — Cimiento (semanas 1-3)
├── 2.1.C: COGS y Margen ← Sin dependencias, impacto inmediato visible en dashboard
└── 2.1.E: Multi-moneda con historial ← Cambio pequeño, protege integridad histórica

        ↓ Fase 1 habilita tener datos de costo y moneda correctos antes de construir el núcleo

FASE 2 — Núcleo contable (semanas 4-7)
├── 2.1.A: Plan de Cuentas + Asientos automáticos
│   ← Depende de tener COGS (2.1.C) para que los asientos de venta incluyan costo
│   ← Es el cimiento de P&L, Balance y todos los reportes financieros futuros
└── 2.1.B: Ejercicios Fiscales
    ← Depende de que existan asientos (2.1.A) para poder cerrarlos con saldos correctos

        ↓ Fase 2 habilita el Libro Diario, el P&L real y el Balance General

FASE 3 — Control de deuda y liquidez (semanas 8-11)
└── 2.1.D: Cuentas por Cobrar y por Pagar
    ← Depende de 2.1.B (períodos) para no permitir modificar cobros en períodos cerrados
    ← Complementa el Flujo de Caja real (con CR y CR se puede proyectar caja)

        ↓ Fase 3 le da al negocio visibilidad de quién le debe y a quién le debe

FASE 4 — Auditoría y control externo (semanas 12-15)
└── 2.1.F: Conciliación Bancaria
    ← Depende de 2.1.A (asientos) para hacer match contra el libro contable
    ← Es el paso final que conecta el sistema con la realidad del banco
```

### Criterios de priorización utilizados

| Criterio | Peso |
|---|---|
| **Dependencia técnica** — no se puede construir sin el anterior | Obligatorio |
| **Valor inmediato** — le da información útil al usuario hoy | Alto |
| **Esfuerzo vs impacto** — máximo resultado con mínimo cambio | Medio |
| **Riesgo de migración** — afecta datos existentes en producción | Bajo (siempre al final) |

### Nota sobre datos existentes en producción

Los sub-puntos 2.1.A y 2.1.C implican **migración de datos**: las ventas y gastos existentes no tienen asientos ni `unitCost`. Al activar estos módulos habrá que decidir:

1. **Opción A (recomendada):** Las transacciones anteriores a la fecha de activación no generan asientos. El libro diario y el P&L parten desde cero a partir de esa fecha.
2. **Opción B:** Migración retroactiva calculando asientos aproximados desde los datos históricos. Más trabajo, útil si el negocio necesita comparar con períodos pasados.

Esta decisión es estratégica y debe tomarla el equipo antes de iniciar la Fase 2.
