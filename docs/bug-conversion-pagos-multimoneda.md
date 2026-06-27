# Bug: conversión invertida al registrar pagos cuando la moneda base de la venta no es CUP

> **Para:** equipo de backend (`pseach-back`)
> **Módulo:** Ventas / Pagos multimoneda — `POST /api/v2/sales/:saleId/payments`
> **Severidad:** Alta — el cliente paga el total completo pero la venta queda `partially_paid`.
> **Fecha:** 2026-06-20

---

## 1. Resumen

Cuando una venta tiene **moneda base distinta de CUP** (ej. `USD`) y el pago se hace en una **tercera moneda** (ej. `EURO`), el backend calcula el `equivalente` en moneda base usando el **cruce invertido**. Como resultado, acredita un monto menor al real y la venta nunca llega a `paid` aunque el cliente haya pagado el total.

El **frontend muestra el valor correcto** en el preview; el descuadre aparece solo al persistir, porque el `equivalente`/`tasa` los calcula el backend.

---

## 2. Caso reproducible

- **Venta:** total = `779.71 USD` (moneda base = `USD`).
- **Pago:** el cliente paga todo en EURO. El sistema le indica pagar `681.01 EUR`.

### Payload enviado (`POST /api/v2/sales/:saleId/payments`)

```json
[
  {
    "moneda": "EURO",
    "monto": 681.01,
    "metodo": "cash"
  }
]
```

### Response recibida

```json
{
  "resumen": {
    "totalVenta": 779.71,
    "totalPagado": 594.81,
    "pendiente": 184.9,
    "monedaBase": "USD",
    "estado": "partially_paid",
    "pagos": [
      {
        "id": "a14859e4-93c0-49d1-bc3e-7f1d1096d4f6",
        "moneda": "EURO",
        "monto": 681.01,
        "tasa": 0.8734,
        "equivalente": 594.81,
        "metodo": "cash",
        "referencia": null,
        "fecha": "2026-06-20T23:10:09.292Z"
      }
    ],
    "sugerencia": {
      "moneda": "CUP",
      "monto": 184.91,
      "tasa": 1
    }
  }
}
```

**Esperado:** `equivalente = 779.71`, `totalPagado = 779.71`, `estado = "paid"`.
**Obtenido:** `equivalente = 594.81`, `estado = "partially_paid"`.

---

## 3. Análisis matemático

La convención del sistema (documentada y respetada por el frontend) es:

> Cada columna de `MonetaryExchange` = **cuántas CUP vale 1 unidad de esa moneda**.

Por tanto, el cruce correcto entre dos monedas (pago → base) es:

```
equivalente = monto_pago × (tasaCUP_pago ÷ tasaCUP_base)
```

### Lo que hace el frontend (correcto)

Usa el cruce **1 EUR = 1.1449 USD**:

- Calcular cuánto pagar:   `779.71 USD ÷ 1.1449 = 681.01 EUR` ✅
- Mostrar el equivalente:  `681.01 EUR × 1.1449 = 779.71 USD` ✅

### Lo que hace el backend (incorrecto)

Usa el cruce **invertido, 1 EUR = 0.8734 USD**:

- `681.01 EUR × 0.8734 = 594.81 USD` ❌

### Smoking gun

```
0.8734 = 1 / 1.1449
```

El `tasa: 0.8734` devuelto es **exactamente el recíproco** del cruce correcto (`1.1449`).
Es decir, el backend está dividiendo al revés:

```
INCORRECTO:  tasa = USD_en_CUP ÷ EURO_en_CUP   →  0.8734
CORRECTO:    tasa = EURO_en_CUP ÷ USD_en_CUP   →  1.1449
```

Comprobación con el dato del usuario:
`779.71 ÷ 681.01 = 1.1449` (cruce real EUR→USD).

---

## 4. Causa raíz (probable)

La fórmula del documento (§4.3) funciona solo cuando la **base es CUP**:

```
amountInBaseCurrency = monto × tasa_desde_MonetaryExchange
```

Cuando la base **no** es CUP, hay que hacer un **cruce vía CUP** usando AMBAS tasas
(la de la moneda del pago y la de la moneda base), no una sola tasa de la tabla.
El backend parece estar tomando una sola tasa (o invirtiendo el cociente),
lo que produce el recíproco.

---

## 5. Corrección esperada

En el cálculo de `equivalente` / `tasa` al registrar un pago, para ventas con
`moneda base ≠ CUP`:

```
tasaCUP_pago  = MonetaryExchange[moneda_pago]    // CUP por 1 unidad de la moneda del pago
tasaCUP_base  = MonetaryExchange[moneda_base]    // CUP por 1 unidad de la moneda base
                (CUP = 1)

tasa_cruce    = tasaCUP_pago / tasaCUP_base
equivalente   = monto_pago * tasa_cruce
```

Con los datos del caso: `equivalente = 681.01 × (EURO_en_CUP / USD_en_CUP) = 681.01 × 1.1449 = 779.71 USD`
→ `totalPagado = 779.71` → `estado = "paid"`. ✅

### Casos a cubrir / probar

| Moneda base | Moneda pago | Resultado esperado |
|-------------|-------------|--------------------|
| CUP | CUP | tasa 1 (sin cambios) |
| USD | USD | tasa 1 |
| USD | EURO | `EURO_en_CUP / USD_en_CUP` (≈ 1.1449 en este caso) |
| USD | CUP | `1 / USD_en_CUP` |
| CUP | USD | `USD_en_CUP` (la fórmula actual ya funciona aquí) |

> Nota: el bug **no** se manifiesta cuando la base es CUP, por eso pasó desapercibido.
> Solo aparece con base ≠ CUP + pago en otra moneda.

---

## 6. Síntoma adicional (mismo origen)

La `sugerencia` devuelve:

```json
{ "moneda": "CUP", "monto": 184.91, "tasa": 1 }
```

Una sugerencia en **CUP con `tasa: 1`** para una venta con base **USD** es incorrecta:
CUP frente a una base USD no tiene tasa 1. Esto confirma que el manejo de
moneda base ≠ CUP (tanto en el cálculo de equivalentes como en las sugerencias)
está usando CUP como base implícita en lugar de la moneda real de la venta.

---

## 7. Alcance del frontend

**No requiere cambios.** El frontend ya calcula y previsualiza el valor correcto
(`681.01 EUR ≈ 779.71 USD`) usando ambas tasas (`convertBetween`). El descuadre se
origina únicamente en el cálculo de crédito del backend. Una vez corregido el
cruce en el servidor, el flujo cuadra automáticamente y la venta pasará a `paid`.
