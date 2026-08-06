# Moneda del precio de venta

> Estado: **resuelto de punta a punta** (frontend + backend).
> Fecha: 2026-08-05. Backend: [`migration_doc/149`](../../psearch-back/src/v2/migration_doc/149-sale-price-currency-conversion.md),
> que completa el [`148`](../../psearch-back/src/v2/migration_doc/148-business-product-sale-price-currency.md).
> Relacionado: [multimoneda-productos.md](../../psearch-back/docs/multimoneda-productos.md) (costo multimoneda).

---

## 1. El problema

Al asignar un producto se piden dos importes: **costo de entrada** y **precio de
venta**. Solo el costo tenía moneda; el precio se interpretaba **siempre como
CUP**. Quien vendía a 20 USD escribía `20` y el sistema guardaba **20 CUP**:
margen ≈ −99 % en el inventario y, en el carrito, el producto ofrecido a céntimos.

El cambio 148 del backend añadió la columna `price_currency` pero guardaba el
precio **sin convertir** y ningún consumidor leía la etiqueta, así que el producto
seguía vendiéndose por 20 CUP — solo que ahora con un rótulo que decía «USD».

## 2. La solución

**El precio se cotiza en la moneda del negocio y se persiste en CUP**, exactamente
el patrón que ya seguía `entryPrice`. `priceCurrency` y
`priceExchangeRateApplied` no describen el importe guardado: describen **cómo se
fijó**.

```
Usuario: 20 USD          →  POST { price: 20, priceCurrency: "USD",
                                   priceExchangeRateApplied: 675 }
                         →  BD: price = 13500 (CUP)
                                price_currency = "USD"
                                price_exchange_rate_applied = 675
```

Todo lo que consume el precio —validación de la venta, margen del inventario,
analytics, cierres— sigue leyendo CUP, que es lo que el campo contiene. **No hubo
que tocar ninguno de esos cuatro consumidores**, y esa es la razón principal de
elegir esta semántica: la alternativa (convertir al leer) obliga a cada uno a
resolver tasas por su cuenta, y el que se olvide compara divisa contra CUP sin
error visible.

### Reparto de responsabilidades

| Importe | Qué viaja al backend | Quién convierte |
|---|---|---|
| Costo de entrada | `entryPrice` + `currency` + `exchangeRateApplied` | El backend |
| **Precio de venta** | `price` + `priceCurrency` + `priceExchangeRateApplied` | **El backend** |

El frontend **no convierte**: solo previsualiza. Si volviera a convertir antes de
enviar, la conversión se aplicaría dos veces.

### Archivos (frontend)

| Archivo | Cambio |
|---|---|
| [amount-currency-field.tsx](../src/components/products/amount-currency-field.tsx) | Antes `entry-cost-currency.tsx`. Selector + preview de conversión, con `id`/`label` configurables: lo comparten costo y precio. |
| [assign-product-to-business-form.tsx](../src/components/products/assign-product-to-business-form.tsx) | Campo «Moneda del precio»; envía el precio cotizado con su moneda y su tasa. |
| [edit-business-product-dialog.tsx](../src/components/products/edit-business-product-dialog.tsx) | Ídem al editar; el delta «actual vs nuevo» se compara en CUP. |
| [api/product.ts](../src/lib/api/product.ts) · [use-product.ts](../src/hooks/use-product.ts) | `priceCurrency` y `priceExchangeRateApplied` en el alta y en `PUT .../price`. |
| [current-inventory-table-columns.tsx](../src/components/inventory/current-inventory-table-columns.tsx) | Precio en CUP y, si se fijó en divisa, «fijado en 20,00 USD» debajo con la tasa en el tooltip. |
| [validations/products.ts](../src/lib/validations/products.ts) | `priceInputCurrency` en los dos schemas + `MAX_PRODUCT_PRICE`. |

`priceInputCurrency` (formulario) y `priceCurrency` (backend) ahora significan lo
mismo; el nombre distinto se mantiene porque el primero es estado de UI que no
viaja tal cual.

### Comportamiento

- El selector ofrece **CUP + las monedas con tasa > 0** (`getAvailableCurrencies`).
- Preview antes de enviar: **«Se guardará como 13.500,00 CUP (tasa 675)»**.
- Se envía la **misma tasa** del preview, así lo guardado es exactamente lo que se
  vio.
- **Moneda sin tasa:** el backend la rechaza (`MONEDA_NO_CONFIGURADA`); el
  formulario avisa antes de enviar para señalar el campo.
- El tope (`MAX_PRODUCT_PRICE`) se valida sobre el **equivalente en CUP**.
- El diálogo de edición abre en CUP con el importe real guardado; para cambiar el
  precio en divisa se elige la moneda y se teclea el nuevo valor.

## 3. Qué NO resuelve: la deriva de la tasa

El precio queda **congelado en CUP**. Si fijaste 20 USD a 675 (13.500 CUP) y la
tasa sube a 700, el producto sigue a 13.500 CUP, que son **19,29 USD**. Hay que
reeditarlo.

Es una decisión consciente (modelo «snapshot»): la alternativa —recalcular el
precio en cada lectura— hace que los precios cambien solos, con efectos sobre
ventas emitidas, cierres y comparativas históricas.

Lo que sí quedó preparado: `price_exchange_rate_applied` guarda la tasa de
referencia, así que ya se puede **detectar** la deriva. El inventario muestra
«fijado en X USD» con su tasa. Falta decidir umbral y acción:

- **A — Snapshot (lo actual).** Reeditar a mano.
- **B — Precio anclado.** Recalcular en cada lectura. Descartado por lo anterior.
- **C — A + aviso (recomendado).** Marcar «precio desactualizado» cuando
  `tasa_actual / price_exchange_rate_applied` se desvíe de un umbral (p. ej. 5 %),
  con acción de **recálculo en lote**. Ya no requiere backend nuevo.

## 4. Otros pendientes

1. **El diálogo de edición abre en CUP**, no en la moneda en que se fijó. El dato
   ya llega en la respuesta; falta pasarlo como prop y reexpresar el importe.
2. **`product_price_history` sin moneda:** el historial se ve siempre en CUP.
3. **`offerPrice` y `wholesalePrice`** siguen asumiendo CUP. Ningún cliente los
   edita todavía.
4. **Deuda de presentación ajena a esto:** varias vistas formatean precios en CUP
   como si fueran pesos colombianos —
   [business-products-table-columns.tsx](../src/components/products/business-products-table-columns.tsx),
   [product-catalog-card.tsx](../src/components/products/product-catalog-card.tsx),
   [details-dialog.tsx](../src/components/products/details-dialog.tsx),
   [price-history-item.tsx](../src/components/products/price-history-item.tsx).

### Resuelto en esta misma tanda

- **Importación masiva:** la plantilla gana la columna **`moneda_precio`** (alias
  `moneda_venta`), independiente de `moneda` (la del costo). El backend convierte
  ambos a CUP. Las plantillas antiguas siguen funcionando: sin la columna, el
  precio se lee como CUP. Ver [importacion-masiva-productos.md](importacion-masiva-productos.md).
  En «copiar catálogo de otro negocio» la columna va **vacía** a propósito: el
  precio copiado ya está en CUP y volver a etiquetarlo lo convertiría dos veces.
- **Dos bugs de la transferencia en CUP**, que la dejaban inservible de punta a
  punta y son ajenos al precio de venta (detalle en
  [migration_doc/149](../../psearch-back/src/v2/migration_doc/149-sale-price-currency-conversion.md)):
  al **guardar**, `create()` escribía `cupTransferencia` en vez de
  `CUP_TRANSFERENCIA`, y TypeORM descartaba el valor en silencio, así que la tasa
  se quedaba en 0 por mucho que se configurara; al **leer**, `products.service.ts`
  cometía el mismo error de nombre y un costo en esa moneda fallaba siempre con
  «moneda no configurada».

## 5. Verificación

Automática, en verde:

- Frontend: `tsc --noEmit`, `eslint`, `pnpm test` (**208**: 204 + 4 de la columna
  `moneda_precio`), `pnpm build`.
- Backend: `npm run typecheck`, `npm test` (**465**: 455 existentes + 8 de
  [sale-price.util.spec.ts](../../psearch-back/src/common/sale-price.util.spec.ts)
  + 2 de regresión de la transferencia en CUP).

Pendiente de prueba manual contra la BD, con tasas configuradas:

1. Asignar un producto a **20 USD** con tasa 675 → en BD `price = 13500`,
   `price_currency = 'USD'`, `price_exchange_rate_applied = 675`.
2. Ese producto en **vender**: 13.500 CUP en venta CUP; **20 USD** exactos si la
   venta se hace en USD. La venta debe completarse sin `400`.
3. Inventario: **margen positivo** coherente y la línea «fijado en 20,00 USD».
4. Editar el precio a 22 USD → se guardan 14.850 CUP.
5. Editar solo el precio en CUP (sin tocar la moneda) → `price_currency` se
   **conserva** en USD.
6. Elegir una moneda sin tasa → 400 `MONEDA_NO_CONFIGURADA`, sin escribir nada.
7. Importar una fila con `moneda_precio = USD` y `precio = 20` → el producto queda
   a 13.500 CUP; una plantilla sin esa columna sigue creando el precio en CUP.
8. Configurar la tasa de **transferencia en CUP** y recargar: debe persistir (antes
   volvía a 0), y un costo en esa moneda ya no debe dar «moneda no configurada».
