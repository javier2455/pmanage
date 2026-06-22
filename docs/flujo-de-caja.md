# Flujo de caja

> Estado del módulo de caja del negocio y hoja de ruta para llevarlo de una
> simple "foto del saldo" a un flujo de caja completo.
> Relacionado: [currency-account-guide.md](../currency-account-guide.md) ·
> [extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md) ·
> [../ROADMAP.md](../ROADMAP.md)

---

## 1. Estado actual

El módulo `currency-account` lleva el **saldo de caja por moneda** de cada negocio.

```
saldo (currentBalance) = presupuesto inicial (initialBudget) + ingresos − salidas
```

El backend recalcula `currentBalance` automáticamente vía eventos. Tabla de eventos (§5 de la guía):

| Evento | Operación | ¿Afecta saldo? |
|--------|-----------|----------------|
| `sale` | suma | Sí |
| `payment` | suma | Sí |
| `expense` | resta | Sí |
| `purchase` | resta | Sí |
| `stock_purchase` | resta | Sí |
| `sale_cancellation` | resta | Sí |
| `inventory_return` | — | No (solo historial) |
| `inventory_adjustment` | — | No (solo historial) |

El front es **solo lectura** de saldos + un setup inicial (`initialize`, de un único uso por moneda).

### Endpoints existentes (backend)
- `GET /api/v2/currency-accounts/balances/{businessId}` — saldos de todas las monedas.
- `GET /api/v2/currency-accounts/balance/{businessId}/{currency}` — saldo de una moneda.
- `POST /api/v2/currency-accounts/initialize` — presupuestos iniciales.

---

## 2. Implementado — Fase 1 (consolidación visual)

Objetivo: que el dueño vea de un vistazo **cuánto efectivo tiene en total** sin prometer
funciones que el backend todavía no soporta. Todo se construye con los endpoints ya existentes.

- **Consolidación a moneda base (CUP).** Helper puro `consolidateBalances` en
  [src/lib/cash-flow.ts](../src/lib/cash-flow.ts): convierte cada saldo a CUP con
  `getCurrencyRate` ([src/lib/currency.ts](../src/lib/currency.ts)) y suma un total.
  Las monedas **sin tasa** configurada se marcan y se **excluyen del total** (no se
  reportan cifras incorrectas).
- **Página `currency-accounts` con pestañas**
  ([page.tsx](../src/app/dashboard/business/currency-accounts/page.tsx)):
  - **Saldos** → tabla por moneda (`BalancesTable`).
  - **Consolidado** → total en CUP + desglose por moneda con su equivalente y % de
    participación (`ConsolidatedBalanceCard`).
- **Widget "Caja" en el dashboard**
  (`CashBalanceWidget` en [dashboard/page.tsx](../src/app/dashboard/page.tsx)): total
  consolidado en CUP junto a las tarjetas de Ventas y Gastos.

### Relación con otros módulos (no duplicar)
- **`accounting-close`** (cierre diario/mensual): suma ingresos vs gastos por período,
  pero en base **devengo** (ventas/gastos), no en base **caja** (cuándo entra/sale el
  efectivo) y no por moneda. Sirve para el P&L, no para el saldo de caja.
- **`dashboard-summary`**: KPIs hoy vs ayer. La caja le añade el saldo acumulado.
- **`exchange-rate`**: fuente de las tasas para consolidar.

---

## 3. Pendiente — Fase 2+ (requiere backend)

### 3.1 Libro de movimientos de caja  ⟵ pieza más importante
Hoy solo vemos la foto del saldo, no el detalle de **qué entró/salió y cuándo**. La guía
describe los eventos pero **no existe endpoint para listarlos**.

**Contrato propuesto al backend:**
```
GET /api/v2/currency-accounts/movements/{businessId}
    ?currency=USD&page=1&limit=20&startDate=&endDate=
```
```jsonc
{
  "data": [
    {
      "id": "uuid",
      "currency": "USD",
      "type": "sale",              // uno de los type de la tabla §5
      "operation": "add",         // "add" | "subtract"
      "amount": 100.00,
      "balanceAfter": 600.00,      // saldo resultante (para mostrar saldo corriente)
      "reference": "SALE-123",     // id/ref del documento origen
      "createdAt": "2026-06-22T12:00:00.000Z"
    }
  ],
  "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 0 }
}
```
Con esto, el front añade una pestaña **"Movimientos"** (ya hay sitio reservado en la página).

### 3.2 Ajustes manuales de caja
Depósitos, retiros y **transferencias entre monedas** (hoy solo existe `initialize`).
Requiere endpoints de escritura nuevos (p. ej. `POST /currency-accounts/adjustments`).

### 3.3 Flujo por período (base caja)
Entradas vs salidas reales en un rango de fechas, por moneda, con **saldo corriente**.
Distinto del cierre contable (devengo). Se alimenta de 3.1.

### 3.4 Proyección de cobros (cuentas por cobrar / AR)
Ventas pendientes de pago como entradas futuras de caja. Forma parte del módulo AR/AP
descrito en [extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md).

---

## 4. Evolución a largo plazo

`currency-account` + este flujo de caja son el **primer paso pragmático en base caja**.
La evolución natural es el **Núcleo Contable** de partida doble
([extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md)): plan de cuentas,
asientos automáticos y estados financieros reales (P&L, Balance, Flujo de Caja formal).
