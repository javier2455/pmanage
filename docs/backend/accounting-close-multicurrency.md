# Cierre diario/mensual multimoneda — contrato de backend

Este documento describe lo que el **backend** debe cumplir para que el desglose
por moneda del cierre diario y mensual (ya implementado en el frontend) muestre
cifras correctas. Contexto: hasta ahora los totales del cierre
(`totalIncome`/`totalExpense`/`total`) se devolvían como **números únicos ciegos a
la moneda**, sumando ventas en CUP, USD, EURO, etc. como si fueran la misma
unidad. El frontend ahora agrupa por moneda y consolida a CUP, pero **necesita
que cada transacción traiga su moneda**.

Endpoints afectados:
`/sales/closing/daily/{businessId}`, `/sales/closing/monthly/{businessId}`,
`/sales/closing/range/{businessId}` y los de exportación PDF/Excel.

---

## 1. `currency` en cada gasto — OBLIGATORIO (bloqueante)

Hoy la respuesta del cierre entrega los gastos **sin moneda**
(`ExpenseInAccountingClose` no tiene `currency`), aunque la entidad `Expense`
completa sí la tiene. Sin este campo **el desglose de gastos por moneda es
imposible** y el frontend cae a agrupar todos los gastos bajo CUP (fallback).

Añadir `currency` a cada gasto de la respuesta:

```jsonc
// expenses[]
{
  "id": "…",
  "title": "Pago de Internet",
  "amount": 40,
  "description": "…",
  "createdAt": "2026-07-01T…",
  "currency": "usd"        // ← AÑADIR. Enum snake_case del sistema.
}
```

Enum de moneda: usar la **misma forma que el resto del sistema** (la que consume
`fromBackendCurrency` en el frontend): `cup`, `usd`, `euro`, `cup_transferencia`,
`clasica`, `mlc`, `cad`, `gbp`, `chf`, `mxn`, `jpy`. La transferencia en CUP puede
venir truncada (`cup_transf`); el frontend la normaliza igual, pero preferible
enviarla completa.

## 2. `currency` siempre presente en cada venta — OBLIGATORIO

En la respuesta del cierre, `sales[].currency` hoy es **opcional** (Fase 1). Debe
venir **siempre poblada**. Además, **confirmar que `sales[].total` está expresado
en `sales[].currency`** (el monto en la moneda de la venta), **no** pre-convertido
a CUP. El frontend asume esto para sumar los subtotales por moneda; si `total`
viniera en CUP, los subtotales por moneda serían incorrectos.

## 3. Totales por moneda — RECOMENDADO

Para que el frontend no re-derive y para que **PDF/Excel coincidan exactamente**
con la UI, añadir a la respuesta un mapa de totales por moneda:

```jsonc
"totalsByCurrency": {
  "cup":  { "income": 40000, "expense": 40000, "balance": 0 },
  "usd":  { "income": 1200,  "expense": 40,    "balance": 1160 }
}
```

`income`/`expense`/`balance` en **la propia moneda** (no convertidos).

## 4. Consolidado en CUP + snapshot de tasas — RECOMENDADO

Para que el consolidado sea **reproducible y auditable** (evita que el frontend
use tasas "vivas" distintas a las del momento del cierre), devolver:

```jsonc
"exchangeRateSnapshot": { "USD": 400, "EURO": 420, "CUP_TRANSFERENCIA": 0.8333, "…": 0 },
"consolidatedBase": { "income": 520000, "expense": 56000, "balance": 464000 }  // en CUP
```

Reglas de conversión a CUP (deben coincidir con `convertToBase` del frontend):
- **Toda moneda** (USD, EURO, MLC… y CUP_TRANSFERENCIA): `montoBase = monto × tasa`,
  donde la tasa es cuántas CUP vale 1 unidad. Para CUP_TRANSFERENCIA la tasa es < 1
  (p. ej. 0.8333 = recargo del 20%): cobrar en transferencia da menos CUP por unidad.
- **CUP**: tasa 1.
- Moneda **sin tasa configurada** (tasa ≤ 0): se **excluye** del consolidado y se
  marca como no convertible (el frontend muestra un aviso "sin tasa configurada").

## 5. `totalIncome` / `totalExpense` / `total` — DEPRECAR para UI

Estos campos son ciegos a la moneda y **ya no se usan** en la UI del cierre.
Mantenerlos solo por compatibilidad, o **redefinirlos como el consolidado en CUP**
(equivalente a `consolidatedBase`). Documentar la decisión que se tome.

## 6. Exportación PDF / Excel — actualizar

Los exports los genera el backend. Deben alinearse con la UI:
- **Columna "Moneda"** por fila en las tablas de ventas y gastos.
- Totales **desglosados por moneda** (subtotal por cada moneda).
- Línea de **equivalente consolidado en CUP** (con la misma lógica de §4),
  indicando si alguna moneda quedó fuera por falta de tasa.

---

## Contrato objetivo (resumen de la respuesta del cierre)

```jsonc
{
  "date": "2026-07-01",
  "sales": [ { "…": "…", "total": "1200", "currency": "usd" } ],   // §2
  "expenses": [ { "…": "…", "amount": 40, "currency": "usd" } ],   // §1
  "totalsByCurrency": { /* §3 */ },
  "exchangeRateSnapshot": { /* §4 */ },
  "consolidatedBase": { "income": 0, "expense": 0, "balance": 0 }, // §4
  // Deprecados (§5):
  "totalIncome": 0, "totalExpense": 0, "total": 0
}
```

## Comportamiento del frontend mientras tanto

El frontend es **defensivo**: si falta `currency` en una transacción la agrupa
bajo **CUP** (fallback), así que la vista no se rompe antes del deploy del
backend. Una vez cumplidos §1 y §2, el desglose por moneda será correcto sin más
cambios de frontend. La lógica de agrupación y consolidación del frontend vive en
`src/lib/accounting-close-currency.ts`.

**Estado actual del consolidado (§4):** el frontend **ya prefiere** el
`consolidatedBase` y el `unconvertedCurrencies` del backend para el equivalente en
CUP y el aviso de monedas sin tasa (`resolveConsolidation` / `hasUnconvertibleFor`).
Solo cae a consolidar con las tasas vivas de `useExchangeRate` cuando la respuesta
**no** trae `consolidatedBase` (cierres antiguos u otros endpoints). Los
**subtotales por moneda** (`currencyRows`) todavía se calculan client-side desde
`sale.total`/`expense.amount`; migrarlos a `totalsByCurrency` (§3) es la siguiente
mejora pendiente para que subtotales y consolidado compartan exactamente la misma
fuente (relevante solo si `sale.total` difiere de `Σ cantidad×precio`).
