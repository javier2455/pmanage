# Tipos de venta retirados del mostrador — pendientes de reponer

> **Estado:** retirados de la interfaz de creación de venta el **8 de agosto de 2026**.
> Todas las ventas nuevas se registran como `in_store`. El backend sigue aceptando los tres
> tipos y las ventas antiguas conservan el suyo intacto.

Se retiró el selector **"Tipo de venta"** del carrito, con sus opciones **A domicilio**
(`delivery`) y **Para recoger** (`pickup`), y con él el bloque de datos de entrega.

---

## Por qué se retiraron

Ninguno de los dos tipos llegó a tener un flujo detrás. Marcar una venta como "a domicilio"
guardaba una dirección y una tarifa, y ahí se acababa: **no hay reparto, ni estado de
entrega, ni asignación de mensajero, ni aviso al cliente, ni forma de cerrar el ciclo**.
"Para recoger" era aún más fino — un valor distinto en la columna `saleType` sin ninguna
consecuencia en el sistema.

El resultado era un campo que el cajero tenía que responder en cada venta sin que la
respuesta cambiara nada, y un dato que ensuciaba las estadísticas dando a entender que
existía una operación de delivery que en realidad no existe.

---

## Qué se quitó exactamente

| Pieza | Dónde estaba |
|---|---|
| Selector "Tipo de venta" con las tres opciones | [sale-cart-panel.tsx](../src/components/sales/sale-cart-panel.tsx) |
| Aviso *"Este negocio no acepta delivery…"* | idem |
| Bloque de entrega: dirección, nombre y teléfono de contacto, precio de mensajería | idem |
| Fila de desglose **Productos / Mensajería** en el total | idem |
| Estado `saleType` y `delivery`, y la validación de dirección obligatoria | [create/page.tsx](../src/app/dashboard/business/sales/create/page.tsx) |
| Interfaz exportada `SaleDeliveryInfo` | [sale-cart-panel.tsx](../src/components/sales/sale-cart-panel.tsx) |

La creación de venta ahora envía siempre `saleType: "in_store"`, explícito en vez de
confiar en el default del backend.

---

## Qué aportaba y qué se pierde mientras tanto

- **La tarifa de mensajería sumaba al total de la venta.** Era la única vía para cobrar un
  extra que no fuera un producto del catálogo. Hoy, un negocio que cobre envío tiene que
  darlo de alta como producto.
- **Los datos de contacto de entrega** (dirección, nombre, teléfono) quedaban guardados en
  la venta. Sin ellos no hay a quién llamar si el pedido no se entrega.
- **La distinción en las estadísticas** entre lo que se vende en mostrador y lo que sale a
  domicilio, que es el dato con el que se decide si merece la pena montar el reparto.

---

## Qué sigue funcionando

| | Estado |
|---|---|
| Ventas antiguas con `delivery`/`pickup` | ✅ Conservan su tipo; el detalle sigue mostrando los datos de entrega ([details-dialog.tsx](../src/components/sales/details-dialog.tsx)) |
| Backend | ✅ `CreateSaleDto` sigue aceptando los tres tipos y los campos de entrega |
| `deliveryFee` en el total de la venta | ✅ El backend lo suma si llega (`sale.service.ts`) |
| Flag **`acceptsMessaging`** del negocio | ✅ Sigue configurable en los datos del negocio y visible en el switcher |
| Notificación `sale.delivery_created` | ✅ Intacta en el backend; hoy no la dispara nadie desde el mostrador |

---

## Cómo reponerlos

El código está en el historial de git y el contrato de backend no cambió, así que es volver
a pintar el selector y el bloque de entrega, y devolver los props `saleType`,
`onSaleTypeChange`, `acceptsDelivery`, `delivery` y `onDeliveryChange` a `SaleCartPanel`.

**Pero reponer el selector tal cual devolvería el mismo problema.** Antes de eso conviene
decidir qué hace el sistema con una venta a domicilio:

1. **Estado de entrega** en la venta (pendiente → en reparto → entregada / fallida), que es
   lo que convierte el tipo en una operación y no en una etiqueta.
2. **A quién se asigna** el reparto, si hay que registrarlo y si cobra algo.
3. **Qué pasa con el `deliveryFee`** en el cierre contable: hoy entra en `sale.total` pero
   el cierre reconstruye el ingreso desde `sale_items`, así que la mensajería **no aparece
   en el cierre** aunque sí en el dashboard. Esa divergencia ya existía y hay que resolverla
   antes de volver a cobrar envíos.
4. **Recogida en tienda** (`pickup`): decidir si aporta algo distinto de `in_store` o si
   basta con retirarlo del modelo.

> Ver también [pendientes-costeo.md](pendientes-costeo.md), que sigue el mismo criterio:
> lo que no tiene flujo detrás no se pide en pantalla.
