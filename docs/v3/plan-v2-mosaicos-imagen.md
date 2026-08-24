# Plan — V3-115: Modo imagen (mosaicos) para la difusión de listados

> **Fecha:** 2026-08-22 · **Estado:** ✅ implementado (pendiente de despliegue y prueba real) · **Tier:** Pro
> **Ramas:** `feat/product-list-collage` (psearch-back) · `feat/product-list-image-mode` (pmanage)
> **Depende de:** V3-110 (compositor de listados, ya en `main`)
> **Fase 1 (modo texto):** [plan-v1-difusion-listados.md](./plan-v1-difusion-listados.md)
> **Diseño y contexto general:** [listados-productos-whatsapp.md](./listados-productos-whatsapp.md)
> **Maestro:** [V3-MASTER.md](./V3-MASTER.md)
>
> Este documento es la **fuente de verdad del modo imagen**. Ante cualquier duda
> sobre por qué algo se hace así, manda lo escrito aquí.

---

## 1. Por qué mosaicos

En Cuba la gente **no abre PDFs**. Lo que funciona en un grupo de WhatsApp es ver
el producto con su foto y su precio, mensaje a mensaje. Eso descarta el catálogo
en PDF por muy eficiente que sea técnicamente.

Pero hay una restricción dura: **una imagen es un mensaje**. No existen imágenes
dentro de un texto. Publicar 20 productos con foto propia serían 20 mensajes que
el dueño tendría que reenviar uno a uno — y una ráfaga de 20 envíos desde el
número compartido de la plataforma es justo el patrón que provoca un bloqueo de
WhatsApp.

Componiendo **4 productos por lámina** (2×2), esos mismos 20 productos son
**5 mensajes** con la foto grande y el precio bien legible. Es la diferencia
entre reenviar cómodamente todos los días y no hacerlo nunca.

| Formato | Mensajes (20 productos) | Se ven las fotos | Riesgo para el número |
|---|---|---|---|
| Texto (fase 1) | 1 | ✗ | Nulo |
| **Mosaico (esta fase)** | **5** | **✓** | **Muy bajo** |
| Una foto por producto | 20 | ✓ | Medio, y el reenvío es inviable |
| PDF | 1 | ✓ | Nulo, pero **no lo abren** |

---

## 2. Estado verificado

| Pieza | Estado | Cómo se comprobó |
|---|---|---|
| `send-image` acepta **URL remota + caption** | ✅ | Dashboard de open-wa: campos MEDIA URL y CAPTION |
| El gateway **descarga desde el bucket** | ✅ | Prueba real: URL del bucket pegada en el dashboard, llegó al teléfono **como imagen** |
| El contenedor del bucket es **público** | ✅ | Misma prueba: el gateway la descargó sin credenciales |
| WhatsApp muestra bien el **WebP** del bucket | ✅ | Misma prueba: llegó como imagen, no como sticker |
| Bucket con **API de subida y borrado** | ✅ | `BucketStorageService.uploadFile()` devuelve la URL pública; `deleteFile()` borra |
| Las fotos **no están en el servidor** | ⚠️ | `product-image.service.ts` sube al bucket y **borra el archivo local**. Componer exige descargarlas por HTTP |
| El gateway soporta destinatario **grupo** | ℹ️ | Existe en el dashboard. **No lo usamos**: el sistema no publica en grupos (ver §10) |
| **Ruta exacta de la API de imagen** | ✅ | `POST {OPENWA_URL}/sessions/{sessionId}/messages/send-image` con `{ chatId, url, caption }`. Confirmado en DevTools |
| El gateway responde **201 con `messageId: null`** | ⚠️ | El dashboard lo pinta como "400 - Failed" pero **el mensaje llega**. El éxito se mide por el **status HTTP**, nunca por `messageId` |

---

## 3. Decisiones cerradas

| # | Decisión | Motivo |
|---|---|---|
| **I1** | **Pestañas Texto / Imágenes** en el panel de composición, **excluyentes** | Son dos formas distintas de publicar lo mismo; mezclarlas duplicaría el contenido |
| **I2** | **4 productos por lámina** (2×2), 1200×1572 px, **JPEG** | Foto de ~568 px: se ve de verdad en un móvil, y el precio entra a 42 px. Cambiado desde 6 el 2026-08-23 |
| **I3** | En modo imagen **no se envía listado de texto aparte** | El caption ya lleva nombre y precio; repetirlo son mensajes de más |
| **I4** | **Caption por lámina:** nombre y precio de *sus* productos, nada más | Acordado explícitamente. La introducción va en la primera lámina y la nota final en la última |
| **I5** | **Las láminas se rellenan en orden de categoría, sin forzar el salto** | Forzar lámina nueva por categoría haría que 12 productos en 10 categorías salieran en 10 mensajes casi vacíos |
| **I6** | Producto **sin foto**: icono de caja como marcador, con sus datos igual | Pedido explícitamente; el producto no desaparece del listado por no tener foto |
| **I7** | Si **ningún** producto tiene foto, se avisa y se cae a **modo texto** | Una lámina entera de iconos de caja no aporta nada |
| **I8** | **Tope de 20 productos** en modo imagen | 5 láminas. El modo texto mantiene su tope de 300 |
| **I9** | **2-3 segundos entre láminas** | El gateway no documenta límite propio; un envío espaciado no se parece a un bot |
| **I10** | La **vista previa la genera el backend** y la devuelve en base64, sin subirla al bucket | Mismo principio que el texto: lo que se ve es lo que se envía. Y no ensucia el bucket con previas |
| **I11** | **Sin ofertas: se publica el precio base** (`price`), no `getEffectivePrice()` | Acordado el 2026-08-23. El precio publicado es el que se cobra; los descuentos son una decisión aparte |
| **I12** | **El usuario elige la moneda** en la que se publican los precios | Ver §5.1. Los precios se guardan en CUP y se convierten al vuelo con la tasa del negocio |
| **I13** | **El pie escrito es opcional**, con la casilla «Escribir la lista de productos debajo de la imagen» | Acordado el 2026-08-23. Quien quiera mandar solo la foto puede. La introducción y la nota final NO dependen de ella: son el negocio hablándole a su cliente |
| **I14** | **Solo el precio viene marcado por defecto** | Es lo único sin lo que un listado de precios no tiene sentido. Disponibilidad, unidad, agrupar por categoría y marcar ofertas los activa el usuario, porque cada uno añade ruido a un mensaje pensado para reenviarse |
| **I15** | **La lámina usa Poppins**, la misma familia del sistema, en dos pesos | Acordado el 2026-08-23. La lámina es el negocio hablándole a su cliente: no debe parecer impresa por otro programa. Regular para el texto de lectura, semibold para el nombre del negocio y el precio |

---

## 4. La lámina

**1200×1572 px**, 2×2, unos 60 KB en JPEG.

```
┌───────────────────────────────────────────┐
│  La Esquina · 1/5              23/08/2026 │  <- cabecera
├─────────────────────┬─────────────────────┤
│                     │                     │
│       [foto]        │       [foto]        │  <- 568×568 px
│                     │                     │
│     Queso gouda     │ Leche en polvo ent… │  <- nombre, 36 px
│     450 CUP/kg      │    1 250.50 CUP     │  <- precio, 42 px negrita
├─────────────────────┼─────────────────────┤
│                     │                     │
│       [caja]        │       [foto]        │
│                     │                     │
│  Jabón de baño azul │  Aceite de girasol… │
│       95 CUP        │      1 250 CUP      │
│      agotado        │                     │
└─────────────────────┴─────────────────────┘
```

- **Composición con `sharp`** (`composite`). El texto va como **capa SVG**: `sharp`
  no escribe texto directamente y esa es la técnica estándar, sin dependencias nuevas.
- **Formato JPEG**, calidad ~80. Aunque el WebP del bucket funciona, generar en JPEG
  elimina de raíz cualquier duda sobre stickers y es lo que mejor comprime WhatsApp.
- **Celda:** foto, nombre y **precio base** debajo (I11). Sin tachados ni ofertas.
- **Sin foto:** marcador con icono de caja, mismo tamaño de celda.
- **Nombres largos:** se cortan con puntos suspensivos a 26 caracteres.

---

## 5. Agrupación por categoría (I5)

Los productos se **ordenan** por categoría —igual que en el modo texto, con los
que no tienen categoría al final bajo "OTROS"— y las láminas se **rellenan de
cuatro en cuatro siguiendo ese orden**, sin abrir lámina nueva al cambiar de
categoría.

Así, 20 productos son **siempre 5 láminas**, tenga el negocio 2 categorías o 10.

El caption indica a qué categoría pertenece cada producto, de modo que no se
pierde la información:

```
*LÁCTEOS*
• Queso gouda — 450 CUP/kg
• Leche en polvo entera — 1 250.50 CUP

*ASEO*
• Jabón de baño azul — 95 CUP (agotado)
• Aceite de girasol refinado premium — 1 250 CUP
```

Cabe de sobra: el caption admite ~1024 caracteres y una lámina llena ronda las 240.

---

## 5.1 Moneda de publicación (I12)

El usuario elige en qué moneda se publican los precios. Es factible sin tocar
nada del modelo de datos, porque la conversión ya está resuelta en el sistema:

- `business_products.price` **siempre está en CUP** (lo garantiza
  `resolveSalePriceInBase`, en `src/common/sale-price.util.ts`).
- `MonetaryExchange` guarda **una fila por negocio** con las tasas de USD, EURO,
  MLC, CUP_TRANSFERENCIA, CLASICA, CAD, GBP, CHF, MXN y JPY.
- La tasa es **CUP por 1 unidad** de esa moneda. El sistema ya convierte
  moneda → CUP multiplicando (`convertMoney(precio, tasa)`); aquí se hace el
  camino inverso: **`precioEnMoneda = precioCUP / tasa`**.

Reglas:

| Regla | Motivo |
|---|---|
| El desplegable ofrece **solo las monedas con tasa configurada y mayor que 0** en ese negocio | Ofrecer una moneda sin tasa sería ofrecer un envío que falla |
| Por defecto, **CUP** | Es la moneda del precio guardado: cero conversión, cero riesgo |
| La conversión se hace **en el momento de generar** la lámina o el texto | El precio publicado refleja la tasa vigente al publicar |
| Se reutilizan `extractExchangeRate` y `convertMoney` de `src/common/` | La misma tabla de tasas que usan ventas, inventario y cierres |
| Aplica **igual al modo texto**, no solo a las láminas | Sería incoherente que el mismo listado publicara monedas distintas según el formato |

Dos consecuencias que conviene tener presentes:

- **Redondeo.** 450 CUP con una tasa de 675 son 0,67 USD. En monedas fuertes los
  productos baratos quedan con decimales poco redondos; es inevitable y correcto.
- **La tasa se mueve.** Un mensaje publicado en USD y reenviado tres días después
  puede no coincidir con la tasa del día. La fecha que la lámina ya lleva en la
  cabecera ayuda, pero conviene no perderlo de vista.

---

## 6. Vista previa

El backend genera **las láminas reales** y las devuelve en base64; el frontend las
pinta con una etiqueta `img` sobre un data URI.

La diferencia con el modo texto, que hay que asumir: la previa de texto es una
cadena y cuesta cero; la de imagen **descarga las fotos del bucket y compone**.
Por eso:

- Se genera **con un botón** ("Generar vista previa"), no en cada pulsación.
- Se **cachea por firma** de la selección y las opciones: si nada cambió, no se
  regenera.
- Mientras trabaja, la UI muestra progreso; con 20 fotos son 1-3 segundos.

---

## 7. El envío

```
generar láminas (sharp)
  -> subir al bucket, subfolder "broadcasts"
     nombre determinista: business-{businessId}-{n}.jpg
  -> send-image { chatId, url, caption } por lámina
  -> esperar 2-3 s entre láminas
  -> borrar del bucket las láminas sobrantes de un envío anterior más largo
```

**Por qué nombres deterministas:** cada envío sobrescribe el anterior, así el
espacio ocupado queda acotado a 4-5 archivos por negocio en vez de crecer sin
freno. No hace falta un cron de limpieza. Los mensajes ya enviados **no se rompen**:
WhatsApp guarda su propia copia del archivo en el momento del envío.

Cada lámina se persiste en `notifications` igual que en el modo texto
(`type: "product_list"`, `channel: "whatsapp"`), con la URL en `metadata`.

---

## 8. Qué se toca

**Backend** (`psearch-back`)

| Archivo | Cambio |
|---|---|
| `src/v2/product-list-share/product-list-collage.util.ts` | **Nuevo.** Composición de láminas: reparto en grupos de 6, celda, marcador sin foto, cabecera |
| `src/v2/product-list-share/product-list-collage.util.spec.ts` | **Nuevo.** Reparto, agrupación, captions, caso sin fotos, tope de 20 |
| `src/v2/product-list-share/product-list-share.service.ts` | Modo imagen en `preview` (base64) y `send` (subir + enviar con ritmo) |
| `src/v2/product-list-share/dto/preview-product-list.dto.ts` | Campo `mode` con valores `text` o `image` |
| `src/common/services/bucket-storage.service.ts` | El `Blob` fuerza `image/webp`; parametrizar el content-type para poder subir JPEG |
| `src/v2/notifications/openwa.service.ts` | Método `sendImage(chatId, url, caption)` |

**Frontend** (`pmanage`)

| Archivo | Cambio |
|---|---|
| `src/components/product-list-share/mode-tabs.tsx` | **Nuevo.** Pestañas Texto / Imágenes |
| `src/components/product-list-share/message-preview.tsx` | Pintar láminas en base64 con su caption, además del texto |
| `src/app/dashboard/broadcast/product-list/page.tsx` | Estado del modo, botón de previa, aviso de "sin fotos" |
| `src/lib/types/product-list.ts`, `src/lib/api/product-list.ts`, `src/hooks/use-product-list.ts` | `mode` y respuesta con láminas |

---

## 9. Casos borde

| Caso | Comportamiento |
|---|---|
| Ningún producto con foto | Aviso en la UI y envío en modo texto (I7) |
| Una foto no descarga del bucket (404, timeout) | Esa celda usa el marcador; **el envío no falla** |
| Última lámina incompleta (2 de 6) | Se compone igual, con las celdas vacías sin marco |
| Más de 20 productos seleccionados | La UI lo impide en modo imagen y sugiere texto o dividir el envío |
| Falla el envío de la lámina 3 de 4 | Se reporta "3 de 4 enviadas" y no se reintenta automáticamente: reintentar duplicaría las ya entregadas (mismo criterio que la fase 1) |
| Falla la subida al bucket | Error claro antes de enviar nada; no se manda un envío a medias |

---

## 10. Lo que este plan NO hace

- **No publica en grupos**, aunque el gateway lo permita. El sistema entrega al
  dueño o al trabajador designado y esa persona reenvía. Cambiarlo pondría el
  número compartido de la plataforma —y con él las notificaciones de todos los
  negocios— a merced de los reportes de clientes ajenos.
- **No envía una foto por producto.** Ver §1.
- **No añade PDF.** Descartado por el contexto de uso real.
- **No usa un número por negocio.** Sigue habiendo una sola sesión. Si esta
  función se vuelve central, esa es la evolución natural: el gateway ya organiza
  su API por `sessions/{id}`, así que la arquitectura lo admite.

---

## 11. Único pendiente para arrancar

**La ruta exacta de la API de imagen del gateway**, el equivalente a
`messages/send-text`. El dashboard confirma que la función existe, pero no revela
la ruta ni los nombres de los campos.

Tres formas de obtenerla, de más a menos fiable:

1. **DevTools en el dashboard** (30 segundos): pestaña Red, enviar una imagen de
   prueba y mirar la petición. Da la ruta y el cuerpo exactos.
2. **Documentación del gateway**: probar `/docs`, `/docs-json` o `/api-json` sobre
   el host de `OPENWA_URL`.
3. **Convención**: por simetría con `messages/send-text`, lo más probable es
   `messages/send-image` con `{ chatId, url, caption }`. Sirve para empezar, pero
   conviene confirmarlo antes de dar por buena la integración.

---

## 12. Criterios de aceptación

- [ ] 20 productos en modo imagen producen exactamente **5 láminas** y 5 mensajes.
- [ ] 12 productos repartidos en 10 categorías producen **3 láminas**, no 10.
- [ ] Publicando en USD, los precios salen divididos por la tasa del negocio.
- [ ] Una moneda sin tasa configurada no aparece en el desplegable.
- [ ] Un producto en oferta se publica con su **precio base**, sin tachados.
- [ ] Un producto sin foto aparece con el marcador y **con su nombre y precio**.
- [ ] Sin ningún producto con foto, la UI avisa y envía en modo texto.
- [ ] La previa muestra **la misma imagen** que llega a WhatsApp.
- [ ] Una foto rota en el bucket no impide el envío.
- [ ] Un segundo envío **no aumenta** el número de archivos del negocio en el bucket.
- [ ] Entre láminas transcurren al menos 2 segundos.
- [ ] Las ofertas salen con el precio anterior tachado, igual que en el texto.

---

## 13. Esfuerzo

| Fase | Contenido | Esfuerzo |
|---|---|---|
| 1 | `product-list-collage.util.ts` + tests (el grueso) | ~1 d |
| 2 | `sendImage` en el gateway, modo imagen en preview/send, subida al bucket | ~0,5 d |
| 3 | Pestañas, previa de láminas, avisos | ~1 d |

**Total ≈ 2,5 días**, sin contar la confirmación de §11.

---

## 14. Bitácora

| Fecha | Cambio |
|---|---|
| 2026-08-22 | Creación. Recoge la decisión de descartar el PDF por el contexto de uso real, el formato de mosaico, las diez decisiones cerradas (I1-I10) y el reparto continuo por categoría (I5) frente al corte estricto. Verificado con una prueba real que el gateway descarga imágenes del bucket y las entrega como imagen. |
| 2026-08-23 | La lámina pasa a Poppins, la fuente del sistema, en regular y semibold (I15). Con ella el recorte de nombres deja de contar caracteres y pasa a medir el ancho renderizado: a 30 px, 28 «W» miden 508 px y 28 «i» miden 193 px, así que un tope por número de letras se pasaba del ancho de la celda para unos nombres y desperdiciaba media celda para otros. |
| 2026-08-23 | El pie escrito pasa a ser opcional (I13) y los valores por defecto se reducen al precio (I14). Además, la vista previa deja de tener scroll propio: el contenedor con alto máximo dejaba la lámina ocupándolo entero y el pie recortado justo debajo, y parecía que el mensaje llevaba un solo producto. |
| 2026-08-23 | Ajustes tras ver la primera lámina real: **4 productos por lámina en 2×2** en vez de 6 (I2) — la foto pasa de 350 a 568 px y el precio de 30 a 42 px; **fuera las ofertas**, se publica el precio base (I11); y **moneda de publicación elegible** por el usuario, convirtiendo desde CUP con la tasa del negocio (I12, §5.1). Con 4 por lámina, 20 productos pasan de 4 a 5 mensajes. |
