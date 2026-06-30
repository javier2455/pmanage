# Backend — Resumen mensual de flujo de caja + salud (V3-039)

> **Pertenece a:** [docs/v3/V3-MASTER.md](./V3-MASTER.md) §7.9 (Área 4 — Flujo de caja profesional).
> **Tier:** Enterprise. **Depende de:** V3-033 (flujo por período), V3-038 (estado exportable).
> **Estado:** especificada (contrato listo; sin implementar).
> **Backend base URL:** `https://psearch.dveloxsoft.com/api/v2`

Este documento describe **qué debe implementar el backend** para que el frontend pueda mostrar
un **resumen del flujo de caja mes a mes**, exportarlo (PDF/Excel) y emitir un **veredicto de
salud** (semáforo) que responda: *¿el negocio es rentable, está vivo a futuro o va por mal camino?*

---

## 1. Objetivo y fuente de datos

Producir, para un negocio y un rango de fechas, una **serie mensual** de:
- **Entradas** (`inflow`), **salidas** (`outflow`) y **neto** (`net = inflow − outflow`).
- **Saldo acumulado** (`cumulativeBalance`) a lo largo de los meses.
- Un bloque **`health`** con la interpretación (tendencia, *runway*, semáforo).

**Todo se reporta en moneda base (CUP).** La materia prima ya existe en el _ledger_ de
transacciones financieras (`GET /financial-transactions/business/:businessId`), donde cada
fila trae:
- `transactionType` — tipo de evento.
- `convertedAmount` — monto **ya convertido a CUP** (usar este, no `originalAmount`).
- `transactionDate` — fecha del evento (base del *bucket* mensual).

Si V3-030 (`CashMovement`) ya está implementado, puede usarse como fuente alternativa/
preferente (incluye `adjustment`, `transfer_in/out`, `payroll`). El contrato de salida es el mismo.

---

## 2. Clasificación de cada tipo en entrada / salida

Cobertura **completa** de los `transactionType` del ledger
([src/lib/types/financial-transaction.ts](../../src/lib/types/financial-transaction.ts)) más los
tipos extra de `CashMovement` (V3-030, [V3-MASTER §7.2](./V3-MASTER.md#7-caja)):

| `transactionType` | Dirección | Notas |
|---|---|---|
| `payment` | **inflow** | Cobro real de una venta (recomendado como entrada en base caja). |
| `sale` | **inflow** *(condicional)* | Ver §2.1: en **base caja** NO se cuenta (se cuenta `payment`); en **devengo** sí. |
| `inventory_return` | **inflow** | Devolución de inventario que reingresa valor. |
| `transfer_in` | **inflow** | Entrada de una transferencia entre monedas/cajas (V3-032). |
| `expense` | **outflow** | Gasto operativo. |
| `purchase` | **outflow** | Compra a proveedor. |
| `stock_purchase` | **outflow** | Reabastecimiento de inventario. |
| `sale_cancellation` | **outflow** | Reversa de una venta cobrada (devuelve dinero). |
| `payroll` | **outflow** | Pago de nómina (V3-024). |
| `transfer_out` | **outflow** | Salida de una transferencia (V3-032). |
| `adjustment` | **inflow u outflow** | Depósito/retiro manual (V3-031): según `operation` (`add`/`subtract`). |
| `inventory_adjustment` | **excluido (no-caja)** | Ajuste contable de inventario; no mueve caja. |

> **Regla:** si la fuente es `CashMovement`, usar su campo `operation` (`add`/`subtract`) como
> verdad de la dirección; la tabla de arriba es el mapeo por defecto cuando la fuente es el
> ledger de transacciones (que no trae `operation` explícito).

### 2.1 Decisión base caja vs devengo — **a confirmar con el backend**

Para un **flujo de caja** real (dinero que entra/sale de verdad) se recomienda **base caja**:
- Entrada = `payment` (el cobro efectivo), **no** `sale`.
- Esto evita **doble conteo** de ventas a crédito (una `sale` no cobrada no es caja).

Alternativa **devengo** (contar `sale` como ingreso al momento de la venta) sirve para
"rentabilidad contable", no para liquidez. **El frontend asume base caja**; si el backend
prefiere devengo, debe documentarlo y exponerlo (p. ej. `?basis=cash|accrual`).

> Punto abierto: confirmar qué `transactionType` representa el cobro efectivo en el modelo
> actual de ventas multimoneda (ver `PaymentHistoryItem` en
> [src/lib/types/sales.ts](../../src/lib/types/sales.ts)).

---

## 3. Endpoint principal

```
GET /currency-accounts/cashflow/monthly/{businessId}?from=&to=&currency=
```

| Query param | Tipo | Notas |
|---|---|---|
| `from` | `YYYY-MM-DD` | Inicio del rango (inclusive). Por defecto: hace 12 meses. |
| `to` | `YYYY-MM-DD` | Fin del rango (inclusive). Por defecto: mes actual. |
| `currency` | string \| omitido | Moneda de reporte. Por defecto la base (`CUP`). |

**Respuesta `200`:**

```jsonc
{
  "from": "2026-01-01",
  "to": "2026-06-30",
  "currency": "CUP",
  "months": [
    {
      "month": "2026-01",            // YYYY-MM
      "inflow": 52000.00,
      "outflow": 41000.00,
      "net": 11000.00,
      "cumulativeBalance": 11000.00, // acumulado desde el inicio del rango
      "byType": [
        { "type": "payment", "direction": "inflow", "amount": 50000.00 },
        { "type": "transfer_in", "direction": "inflow", "amount": 2000.00 },
        { "type": "expense", "direction": "outflow", "amount": 30000.00 },
        { "type": "stock_purchase", "direction": "outflow", "amount": 11000.00 }
      ]
    }
    // ... una entrada por mes del rango (incluidos los vacíos, ver §4)
  ],
  "totals": { "inflow": 312000.00, "outflow": 268000.00, "net": 44000.00 },
  "health": {
    "status": "green",                 // green | amber | red
    "netTrend": "up",                  // up | flat | down
    "positiveMonths": 5,
    "negativeMonths": 1,
    "consecutiveNegative": 0,          // racha actual de meses con net < 0 (desde el más reciente)
    "avgMonthlyNet": 7333.33,
    "currentCashBase": 86000.00,       // saldo de caja consolidado actual en CUP
    "runwayMonths": null,              // null = neto medio ≥ 0 (sin quema); número si quema caja
    "profitMarginCashBasis": 0.141,    // totals.net / totals.inflow (0..1); null si inflow = 0
    "signals": [
      "Tendencia de neto al alza",
      "5 de 6 meses en positivo"
    ]
  }
}
```

---

## 4. Algoritmo de agregación

1. **Filtrar** transacciones por `businessId` y `transactionDate ∈ [from, to]`.
2. **Convertir** cada monto a la moneda de reporte (usar `convertedAmount` si reporte = CUP;
   si `currency` ≠ CUP, reconvertir con la tasa correspondiente — `RATE_REQUIRED` si falta).
3. **Clasificar** cada transacción en `inflow`/`outflow` según §2 (excluir `inventory_adjustment`).
4. **Agrupar** por `YYYY-MM` de `transactionDate`; sumar `inflow`, `outflow` y `net` por mes,
   y acumular `byType` (tipo + dirección + monto).
5. **Saldo acumulado:** `cumulativeBalance[i] = cumulativeBalance[i-1] + net[i]`
   (parte de 0 en el primer mes del rango).
6. **Rellenar meses vacíos** del rango con `{ inflow: 0, outflow: 0, net: 0 }` (manteniendo el
   acumulado) para que la serie sea continua y el gráfico no tenga huecos.
7. **`totals`** = suma de los meses.

---

## 5. Cálculo del bloque `health`

Sobre los **últimos ≤12 meses** de la serie (los del rango):

- **`positiveMonths` / `negativeMonths`:** conteo de meses con `net > 0` y `net < 0`.
- **`consecutiveNegative`:** racha de meses con `net < 0` contando **desde el mes más reciente
  hacia atrás** (0 si el último mes es ≥ 0).
- **`avgMonthlyNet`:** media aritmética de `net` de los meses del rango.
- **`netTrend`:** signo de la pendiente de una **regresión lineal simple** de `net` vs índice
  de mes:
  - pendiente `> +ε` → `"up"`; `< −ε` → `"down"`; en `[−ε, +ε]` → `"flat"`.
  - `ε` sugerido: `0.05 × promedio(|net|)` (umbral relativo, evita ruido).
- **`currentCashBase`:** saldo de caja consolidado **actual** en CUP. Reutilizar la lógica de
  `consolidateBalances` ([src/lib/cash-flow.ts](../../src/lib/cash-flow.ts)) sobre los
  `currency-account` del negocio (suma de saldos convertidos a CUP).
- **`runwayMonths`** (meses de pista hasta quedarse sin caja):
  - si `avgMonthlyNet >= 0` → `null` (no quema caja).
  - si `avgMonthlyNet < 0` → `currentCashBase / |avgMonthlyNet|` (redondear a 1 decimal).
- **`profitMarginCashBasis`:** `totals.net / totals.inflow` (0..1); `null` si `totals.inflow = 0`.

### 5.1 Matriz de decisión del semáforo (`status`)

Evaluar en orden; la primera que coincida define el estado:

| Condición | `status` |
|---|---|
| `consecutiveNegative >= 3` **o** (`netTrend = "down"` y `runwayMonths != null` y `runwayMonths < 3`) | 🔴 `red` |
| `negativeMonths > positiveMonths` **o** `netTrend = "down"` **o** (`runwayMonths != null` y `runwayMonths < 6`) | 🟡 `amber` |
| en otro caso (mayoría de meses positivos y tendencia ↑/plana, sin *runway* en riesgo) | 🟢 `green` |

### 5.2 `signals` (texto legible)

Lista de 1–4 frases que justifican el `status`, derivadas de los valores anteriores. Ejemplos:
- `"Tendencia de neto al alza"` / `"Tendencia de neto a la baja"`.
- `"5 de 6 meses en positivo"`.
- `"Llevas 3 meses seguidos en negativo"`.
- `"Caja para ~2.4 meses al ritmo actual de gasto"` (cuando `runwayMonths != null`).
- `"Margen de caja del 14%"`.

---

## 6. Exports (PDF / Excel)

Mismo patrón que `accounting-close` ([src/lib/api/accounting-close.ts](../../src/lib/api/accounting-close.ts)),
devolviendo un `Blob` con las **mismas query params** que el endpoint principal:

```
GET /currency-accounts/cashflow/monthly/{businessId}/pdf?from=&to=&currency=
GET /currency-accounts/cashflow/monthly/{businessId}/excel?from=&to=&currency=
```

Contenido sugerido del documento: cabecera (negocio, rango, moneda), **tabla mensual**
(mes, entradas, salidas, neto, acumulado), fila de **totales**, y el **bloque de salud**
(semáforo + señales). El Excel debe traer los meses como filas para permitir análisis posterior
en hoja de cálculo.

---

## 7. Enforcement y errores

- **Gating Enterprise** → `403 ENTERPRISE_REQUIRED` si el plan no es Enterprise.
- Rango inválido (`from > to`, fechas mal formadas) → `422`.
- `currency` sin tasa configurada para reconvertir → `422 RATE_REQUIRED`.
- Negocio inexistente / sin acceso → `404` / `403` según el patrón actual de la API.

---

## 8. Integración frontend que lo consumirá (a crear en v3)

| Pieza FE | Ruta | Notas |
|---|---|---|
| Tipos | `src/lib/types/cash.ts` | `MonthlyCashflowResponse`, `MonthlyCashflowRow`, `CashHealth`. |
| Rutas | `src/lib/routes/cashflow.ts` | `monthly`, `monthlyPdf`, `monthlyExcel`. |
| API | `src/lib/api/cashflow.ts` | `getMonthlyCashflow`, `exportMonthlyPdf/Excel` (`responseType: "blob"`). |
| Hook | `src/hooks/use-cashflow.ts` | `useMonthlyCashflow()` (React Query). |
| Vista | `src/app/dashboard/business/currency-accounts/` | Gráfico (Recharts), tarjeta de semáforo, botones export. |
| Reuso | [src/lib/download.ts](../../src/lib/download.ts), [src/lib/cash-flow.ts](../../src/lib/cash-flow.ts), [src/components/analytics/sales-trend-chart.tsx](../../src/components/analytics/sales-trend-chart.tsx) | descarga de blob, consolidación de caja, patrón de gráfico. |

> Nada de esto se implementa todavía: este documento es el **contrato** para cuando se priorice
> V3-039 en el roadmap v3.
