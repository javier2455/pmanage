# Changelog

Todas las cambios notables del proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y el proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [Sin publicar]

### Agregado

#### El dispositivo se prepara solo para trabajar sin conexión
- **Ya no hay que pasar por cada pantalla con red antes de perder la conexión.**
  Al entrar, la aplicación descarga en segundo plano lo imprescindible para
  vender: catálogo de productos, tasas de cambio y últimas ventas. El caso que
  esto resuelve es real: abrir la app por la mañana con señal, quedarse en el
  panel y perder la conexión antes de entrar a vender.
- **Indicador siempre visible** en la barra superior, atenuado cuando todo está
  guardado, con el detalle pieza a pieza y su estado. La primera versión solo
  aparecía mientras descargaba: con las consultas ya en memoria eso es un
  parpadeo entre otros cuatro iconos, imposible de ver, y encima no dejaba
  comprobar el estado cuando interesa. «¿Puedo irme sin señal con esto?» es una
  pregunta que se hace ANTES de perder la conexión y necesita un sitio fijo.
- Cada pieza se nombra mientras se descarga. Una barra genérica en una conexión
  lenta parece que la aplicación se colgó; «Catálogo de productos» dice que está
  trabajando y en qué.
- La preparación deja traza en consola (`[offline] preparando…`), como la versión
  del service worker: cuando algo no se comporta en producción, lo primero que
  hace falta saber es si llegó a ejecutarse.
- **Pieza a pieza, sin todo-o-nada.** Al contrario que el código de la
  aplicación —donde media copia está rota—, media descarga de datos sirve: con
  catálogo y tasas ya se puede vender aunque falten las últimas ventas. Lo que
  falle se reintenta al volver la conexión, o a mano.
- **Solo lo que esa persona puede ver.** A un trabajador sin acceso a ventas no
  se le descarga el catálogo: guardarle en su dispositivo datos de pantallas que
  no puede abrir es justo lo que el control de accesos existe para evitar.
- Las consultas se comparten entre la pantalla y la preparación en vez de
  copiarse. Si sus claves se separaran, la preparación llenaría una entrada que
  ninguna pantalla lee — y el fallo sería invisible hasta quedarse sin conexión.

#### La sesión sobrevive a cerrar la aplicación
- **Cerrar la app sin conexión dejaba fuera al usuario.** La sesión vivía en
  `sessionStorage`, que muere al cerrar la pestaña o la aplicación, y volver a
  entrar exige al servidor de autenticación. Sus ventas encoladas seguían en el
  dispositivo, pero la pantalla que las muestra estaba detrás del login. La
  promesa «no se pierde una venta» valía solo mientras no cerraras la app — y en
  un móvil el sistema mata procesos en segundo plano.
- La sesión pasa a almacenamiento duradero, con **rescate de las sesiones ya
  abiertas**: quien tenga la aplicación abierta al desplegar no es expulsado.
- Al cerrar sesión se borra la sesión ENTERA, incluido el sitio antiguo. Sin eso,
  el rescate resucitaría la sesión recién cerrada.
- Efecto secundario buscado: las pestañas dejan de tener sesiones independientes.
- **Coste asumido a conciencia**: el token de refresco queda escrito en el
  dispositivo, así que un teléfono perdido es una sesión abierta hasta que ese
  token caduque. Lo compensa el bloqueo del propio dispositivo; el PIN para
  entrar sin conexión queda pendiente de decidir.
- **La aplicación instalada abría un 404.** El `start_url` del manifiesto
  apuntaba a la raíz del dominio y no a la subruta donde vive la app. Ahora se
  reescribe en el build, como el service worker. Solo se lee al instalar, así que
  el fallo aparecía justo cuando ya nadie estaba mirando.

#### La caché servía la versión ANTERIOR sin conexión
- **Regresión introducida al conservar dos generaciones de caché.** La búsqueda
  global recorre las cachés en orden de creación y devuelve la primera
  coincidencia, es decir **la más antigua**: sin red, cualquier pantalla que
  existiera en ambas se servía desde la vieja, y con ella el código viejo. El
  síntoma era desconcertante — la versión nueva instalada y anunciada en consola,
  pero la aplicación comportándose como la anterior — y solo aparecía sin
  conexión, que es cuando menos se puede investigar.
- Ahora se busca primero en la caché de la versión activa y solo después en las
  anteriores, que siguen ahí por lo que se pusieron: una pestaña ya abierta pide
  los archivos con los nombres de SU build.
- **El manifiesto se pedía en la raíz del dominio y devolvía 404 en cada carga.**
  Next prefija el basePath en los enlaces y en los assets, pero no en el
  manifiesto de los metadatos, así que se pedía fuera de la aplicación y esta no
  llegaba a ser instalable. Ya se precachea también, para que sin red no deje un
  error por arranque.
- Las cargas de navegación del router (`?_rsc=…`) se buscan ignorando la cadena
  de consulta: cambia en cada build y hacía fallar cada prefetch aunque el
  archivo estuviera guardado.
- Registrar una venta tiene ahora un **tope absoluto de 25 segundos**. No debería
  saltar nunca —cada paso ya tiene su corte—, pero el fallo que evita es
  intolerable: un botón girando indefinidamente delante de un cliente que espera.

#### La actualización del service worker dejaba la app en dos builds a la vez
- **Causa de la pantalla en blanco con ERR_FAILED.** Los archivos de Next llevan
  un hash del contenido, así que cada despliegue estrena nombres. El service
  worker tomaba el mando aunque la descarga del build nuevo hubiera fallado a
  medias, y acto seguido borraba la caché anterior: quedaba media versión nueva,
  ninguna completa, y cada trozo de código que faltaba salía como ERR_FAILED.
- **Ahora es todo o nada.** Si falla un solo recurso, se reintentan los fallidos;
  si aún así falta alguno, la instalación se aborta y **la versión anterior sigue
  al mando intacta**. El navegador lo reintenta en la siguiente visita. Con una
  conexión intermitente, tarde y bien es mejor que pronto y roto.
- **Se conservan dos generaciones de caché.** Una pestaña ya abierta sigue
  pidiendo los archivos de SU build; borrar la caché anterior al activar la nueva
  la dejaba sin ellos.
- La aplicación **anuncia en consola la versión activa** (`[sw] versión activa:`),
  al arrancar y cuando una versión nueva toma el control. Sin ese dato, responder
  a «ya lo desplegué y sigue igual» es adivinar si corre el código nuevo o una
  caché vieja.
- **Registrar una venta no puede colgarse por la base local**: si IndexedDB no
  responde en 8 segundos —una pestaña antigua bloqueando la actualización del
  esquema— se corta con un error explícito. Y el motivo real del fallo llega al
  aviso en pantalla en vez de quedar bajo un «intenta de nuevo» genérico.

#### Correcciones del primer despliegue de la cola
- **El botón «Registrando…» ya no se queda girando.** Ninguna petición de la
  aplicación tenía tiempo límite: sin conexión el navegador puede tardar
  decenas de segundos en rendirse, y hasta entonces no había respuesta ni
  error. Registrar una venta corta a los 15 segundos, y si el navegador ya sabe
  que no hay red **ni siquiera lo intenta**: encola directamente. Cortar es
  seguro gracias a la clave de idempotencia.
- **Sin conexión ya no se bloquea la navegación entera.** La lista de negocios
  no se guardaba en local; al fallar, el sidebar deshabilitaba TODOS sus
  enlaces (así estaba escrito para el caso de un usuario sin negocios) y la
  aplicación quedaba inservible aunque el resto estuviera cacheado. Ahora se
  respalda como el resto de lecturas, guardada por usuario.
- **El listado de ventas se guarda en local**, así que sin red muestra lo último
  conocido en vez de «Error al cargar las ventas».
- **Aviso de ventas encoladas sobre el listado**: una venta guardada en el
  dispositivo todavía no está en el servidor y por tanto no sale en la tabla.
  Sin decirlo, quien acaba de registrarla concluye que se perdió.
- La base local se cierra sola cuando otra pestaña necesita actualizar el
  esquema. Sin eso, una pestaña vieja abierta bloquea la actualización de forma
  indefinida y cualquier lectura o escritura local se queda esperando.

#### Se pueden registrar ventas sin conexión
- **Una venta hecha sin red ya no se pierde.** Se guarda en el dispositivo, en
  una cola de operaciones, y se sube al servidor cuando la persona lo pide.
- **La venta se intenta SIEMPRE contra el servidor primero.** Solo se encola si
  no hubo respuesta. Un 422 (sin stock) o un 403 (plan vencido) siguen fallando
  como siempre: encolarlos sería prometer que la venta subirá cuando ya se sabe
  que será rechazada.
- **`POST /sales` viaja ahora con `Idempotency-Key`.** Resuelve dos problemas de
  golpe: el doble clic deja de crear dos ventas, y el caso en que la petición
  llegó, el servidor la registró y la respuesta se perdió por el camino. La venta
  se encola con el MISMO identificador, así que al subirla el servidor reconoce
  la operación y devuelve la que ya creó en vez de crear otra.
- **Nuevo botón «Cambios sin subir»** en la barra superior, siempre visible, con
  el contador de lo que aún no está en el servidor y el detalle de cada
  operación —incluido el mensaje literal del servidor cuando algo se rechaza—.
- **La subida es manual, no automática.** Al subir pueden aparecer rechazos que
  exigen una decisión (una venta sin stock, un precio que cambió) y esa
  conversación no puede saltar mientras se atiende a alguien.
- **Una venta encolada no se puede cobrar todavía**: el cobro lo calcula el
  servidor (recargo, vuelto multimoneda) y la venta aún no existe allí. Se cobra
  al subirla.
- Un fallo de red **no gasta intentos**: la operación nunca llegó a ser juzgada.
  Solo cuentan los rechazos con respuesta, y tras seis la operación se marca para
  que se vea en vez de reintentarse en silencio para siempre.
- La cola **sobrevive al cierre de sesión** —contiene trabajo sin subir— pero cada
  operación recuerda de quién es: en un mostrador compartido, las ventas de quien
  salió no se suben con la sesión de quien entró.
- Un solo envío a la vez en todo el navegador (cerrojo entre pestañas): dos
  pestañas subiendo la misma cola mandarían cada venta dos veces.
- 33 pruebas nuevas: la política de reintentos como lógica pura, y la cola contra
  Dexie real sobre una IndexedDB en memoria.

#### Las pantallas muestran datos sin conexión
- **Productos, tasas de cambio y resumen del panel ya no aparecen vacíos sin red.**
  Cada una guarda su última respuesta correcta en la base local del navegador
  (IndexedDB, vía Dexie) y la sirve si la recarga falla por falta de conexión.
- **Solo se recurre a la copia cuando el fallo es de RED.** Un 403 o un 422 son
  respuestas legítimas del servidor —permiso revocado, plan vencido— y taparlas
  con datos viejos ocultaría el problema real. Estando en línea manda siempre el
  servidor: la copia nunca se sirve por delante.
- El aviso de «Sin conexión» dice ahora explícitamente que **se están mostrando
  datos guardados**. En un punto de venta, dar por actual un stock de ayer lleva
  a vender algo que ya no está.
- Las copias caducan a los 7 días, se guardan por negocio (dos negocios del mismo
  usuario no comparten catálogo) y **se borran al cerrar sesión**.
- Del catálogo de productos solo se guarda la lista completa, no cada búsqueda:
  cachear los términos tecleados llenaría la base de fragmentos y, sin conexión,
  devolvería el resultado de una búsqueda antigua como si fuera el catálogo entero.

#### El sidebar sobrevive sin conexión
- **El menú lateral ya no se queda vacío al entrar sin red.** La caché de React
  Query vive solo en memoria, así que al recargar —o al abrir directamente estando
  sin conexión— el árbol de secciones, menús y submenús se perdía y no se podía
  navegar a ninguna parte: la app abría, pero no servía para nada.
- El árbol se respalda en `localStorage` y se pinta al instante mientras se
  refresca contra el servidor. Caduca a los 30 días y **se borra al cerrar sesión**,
  porque depende del rol y de los permisos del usuario.
- Nueva utilidad `src/lib/offline-cache.ts` con tests propios (11 casos). Es la
  base para el resto de lecturas offline; los datos de negocio —productos, ventas,
  inventario— irán a IndexedDB, que es lo que corresponde a su volumen.

#### La aplicación abre y se navega sin conexión (PWA)
- Nuevo **service worker** que cachea la aplicación completa (777 archivos, ~12 MB)
  en la primera carga. Sin él, entrar a Ventas —o a cualquier sección— sin
  conexión terminaba en la **pantalla de error del navegador**, desde la que ni
  siquiera se podía volver a la app: con `output: "export"` cada ruta descarga sus
  propios archivos al navegar, y sin red esa descarga falla.
- La app queda **instalable** en el móvil (`manifest.webmanifest`): se abre desde
  la pantalla de inicio, a pantalla completa y sin barra del navegador.
- **La API queda deliberadamente fuera del service worker.** Cachear respuestas de
  negocio daría datos viejos sin que nadie lo note, y una venta servida desde
  caché sería indistinguible de una real. Trabajar sin conexión con datos y
  operaciones es tarea de la cola local, no de esta capa.
- Los assets con hash en el nombre se sirven de caché directamente; el resto usa
  red primero con la caché como respaldo, así que estando en línea siempre se ve
  la versión fresca. Cada despliegue renueva la caché y borra la anterior.
- Solo se registra en producción: en desarrollo un service worker cacheando toda
  la app impide ver los cambios.
- El precacheado se hace **de seis en seis**. Lanzar las ~780 peticiones a la vez
  saturaba el servidor y muchas fallaban, dejando la caché incompleta en silencio:
  la app parecía protegida y al navegar sin red no encontraba nada.
- **Una navegación nunca termina en la pantalla de error del navegador.** Si la
  ruta no está en caché se prueban el panel y la raíz de la app, y como último
  recurso se muestra una página propia de «Sin conexión» con botón de reintento
  —incrustada en el propio service worker, porque es justo el caso en el que no
  hay nada guardado—. Antes salía «No se puede acceder a este sitio web»
  (ERR_FAILED), desde donde no se podía volver a la aplicación.
- Implementado sin dependencias nuevas: `scripts/generate-sw.mjs` recorre `out/`
  tras el build y genera la lista exacta de archivos. Se descartó Serwist porque
  su integración con Next pasa por el bundler (Next 16 usa Turbopack) y este
  proyecto combina `output: export` + `basePath`, terreno poco probado; con un
  export estático la lista de archivos ya se conoce y el plugin no aporta nada.
- Segundo paso del [plan offline](docs/offline-plan/plan-offline-negora.md) (B1).
  Las pantallas abrirán, pero **sin datos** hasta que exista la caché local (B4).

#### Detección de conexión real (base del modo offline)
- Nuevo aviso **«Sin conexión»** en la barra superior del panel, con la hora de la
  última conexión y un botón de reintento. Solo aparece cuando de verdad no hay
  salida a Internet, así que en el uso normal no ocupa espacio.
- El estado **no se decide con `navigator.onLine`**, que solo ve el enlace de red:
  estar conectado a un WiFi sin salida, tras un portal cautivo o con el ISP caído
  da `true` mientras la app no puede subir una sola venta. Ahora «en línea» exige
  además que un sondeo al servidor (`GET /sync/health`) haya obtenido respuesta.
- **Cualquier** respuesta HTTP cuenta como conexión, incluido un 404 o un 500: si el
  servidor contestó, la red funciona. Tratar un 404 como «sin conexión» dejaría la
  app encolando operaciones que podía subir.
- El sondeo se retrae solo (5s → 60s) mientras no hay conexión y se detiene con la
  pestaña en segundo plano, para no gastar batería ni datos móviles; al volver a
  primer plano comprueba de inmediato.
- El botón **Reintentar** muestra estado de carga (con una duración mínima
  perceptible: sin red el sondeo falla en milisegundos y el indicador ni se veía)
  y avisa del resultado con un toast. Los sondeos automáticos son silenciosos.
- En tablet y móvil el aviso se reduce a **solo el icono**, con el detalle y el
  reintento en un desplegable: la tarjeta completa empujaba fuera de la pantalla
  los botones de guía y notificaciones.
- Corregido además el desbordamiento de fondo de la barra superior: el bloque del
  selector de negocio usaba `flex-1` sin `min-w-0`, así que **se negaba a
  encogerse** y expulsaba los iconos del borde derecho en móvil. Ahora los iconos
  van en un grupo que nunca cede espacio.
- Lógica pura en `src/lib/connectivity.ts` con suite propia (12 casos); el hook
  `useConnectivity` solo orquesta los efectos del navegador.
- Primer paso del [plan offline](docs/offline-plan/plan-offline-negora.md) (B0). El
  aviso mostrará también las operaciones pendientes cuando exista la cola local.

#### Crear la categoría mientras se asigna el producto
- El selector de categoría del formulario de asignación **ya no se bloquea cuando el
  negocio no tiene ninguna**: antes se deshabilitaba con «Aún no hay categorías» y
  obligaba a salir a la sección de Categorías y volver a empezar. Ahora se escribe
  el nombre ahí mismo y se crea al guardar el producto.
- El combobox filtra las categorías existentes mientras se escribe y, si el texto no
  coincide con ninguna, ofrece **«Crear "…"»**. Lo escrito se conserva aunque no se
  pulse esa opción, con un aviso de qué categoría se creará.
- El nombre viaja al backend (`categoryName`), que la busca en el negocio sin
  distinguir mayúsculas y solo la crea si no existe (migración 151), así que no se
  duplican categorías por escribir «bebidas» en vez de «Bebidas».

#### Moneda del precio de venta
- Al asignar un producto a un negocio y al editar su precio ahora se elige **en qué
  moneda se cobra**, con preview del equivalente en CUP. Antes solo el **costo**
  tenía moneda y el precio se interpretaba siempre como CUP: quien vendía a 5 USD
  guardaba 5 CUP, y el inventario mostraba margen negativo y la venta salía a
  céntimos.
- El precio viaja en la moneda cotizada (`priceCurrency` +
  `priceExchangeRateApplied`) y **el backend lo convierte a CUP al guardarlo**,
  igual que hace con el costo (migraciones 148 y 149). Todo lo que consume el
  precio —validación de la venta, margen, costo medio, analytics, cierres— sigue
  leyendo CUP sin cambios.
- El inventario muestra el precio en CUP y, si se fijó en divisa, **«fijado en
  20,00 USD»** debajo, con la tasa aplicada en el tooltip.
- Una moneda sin tasa configurada **rechaza** la operación en vez de guardar el
  importe sin convertir.
- La **importación masiva** gana la columna `moneda_precio` (alias `moneda_venta`),
  independiente de `moneda`, que sigue describiendo el costo: se puede comprar en
  una divisa y cotizar en otra. Las plantillas antiguas siguen siendo válidas —sin
  la columna, el precio se lee como CUP— porque el mapeo es por encabezado.
- Límite conocido: el precio queda congelado en CUP; si la tasa se mueve hay que
  reeditarlo. Motivo y plan de aviso automático:
  [docs/moneda-precio-venta.md](docs/moneda-precio-venta.md).

#### Costeo de inventario FIFO por capas y su cascada
- El costo de un producto deja de ser un único `entryPrice` que **cada compra
  sobrescribe** y pasa a ser una lista de **lotes** (`InventoryCostLayer`) con lo
  que queda vivo de cada uno. Cada venta consume lotes en orden de llegada (FIFO)
  y registra qué consumió (`SaleItemCostConsumption`), **congelando** el costo de
  esa venta: aunque después cambie la tasa o el precio de compra, el margen
  histórico no se mueve.
- El cierre contable **diario y mensual** incorpora **costo de la mercancía
  vendida** y **ganancia bruta**. De paso se corrigió el **valor de inventario**,
  que se calculaba a precio de venta e inflaba el activo.
- El listado de stock actual gana **costo medio** y **margen** por producto, y los
  exports (PDF y Excel) del cierre incluyen el costo.
- Nueva vista de **rentabilidad lote a lote**: por cada compra, cuántas unidades se
  vendieron, qué costaron, qué se cobró y el margen resultante.
- Backend: `migration_doc/143`, `145`, `146`, `147`.

#### Importación masiva de productos
- Alta de productos en bloque desde **Excel (`.xlsx`) o CSV** a partir de una
  plantilla fija, con validación **previa** a la confirmación y reporte accionable
  fila por fila. Página en `/dashboard/business/products/import`.
- Fuente de la verdad (plantilla, contrato, reglas y pendientes del MVP):
  [docs/importacion-masiva-productos.md](docs/importacion-masiva-productos.md).
  Rama `feat-upload-products`.

#### Gestión de navegación (admin)
- CRUD de la jerarquía **Sección → Menú → Submenú** desde `/dashboard/admin/menus`,
  con reordenado **drag-and-drop**. Modelo, reglas y mapa de archivos en
  [docs/extra/NAVIGATION_MANAGEMENT_GUIDE.md](docs/extra/NAVIGATION_MANAGEMENT_GUIDE.md).
- **Pendiente de backend:** los endpoints `/reorder` (batch por grupo) siguen en la
  rama `feat-menus-management` del backend, sin mergear a `main`.

#### Motor de tablas para PDF
- Nuevos `pdf-table.ts` + `pdf-report.ts` en el backend: los anchos de columna se
  **calculan** en vez de ir fijos, así que los importes grandes dejan de partirse en
  dos líneas e invadir la columna vecina. Se reescribe el PDF de cierre contable y
  se **migra la factura** al mismo motor (arrastraba el defecto por ser una copia
  literal). Backend: `migration_doc/141`, `142`.

#### Desglose por moneda en los cierres
- Los endpoints de cierre (`daily`, `monthly`, `range`) exponen el desglose por
  moneda, y pantalla, PDF y Excel quedan alineados. Backend: `migration_doc/138`.

#### Cron de cierres
- Envío automático del cierre diario y mensual según la **hora de cierre del horario
  de cada negocio** (zona `APP_TIMEZONE`, por defecto `America/Havana`), idempotente
  vía `lastDailyClosingSentAt` / `lastMonthlyClosingSentAt`. El correo de cierre va
  con datos enriquecidos. Backend: `migration_doc/087`, `088`.

#### Despliegue en subruta `/manager` (producción `main`)
- La app pasa a servirse bajo `https://negora.dveloxsoft.com/manager/` (login en
  `.../manager/login`, etc.) para colgar del mismo dominio que la landing. Se
  controla con la variable de build **`NEXT_PUBLIC_BASE_PATH`** (`/manager` en
  `main`, `/dev` en `develop`, vacío en local), que Next aplica como `basePath` +
  `assetPrefix`.
- Nuevo helper [base-path.ts](src/lib/base-path.ts) → `withBasePath()`, para
  prefijar el basePath en navegaciones crudas que Next no reescribe solo
  (`window.location`, URLs construidas a mano).
- El workflow [deploy-workflow.yml](.github/workflows/deploy-workflow.yml)
  (job `main`) construye con `NEXT_PUBLIC_BASE_PATH=/manager`, **regenera el
  `.htaccess`** con destinos de rewrite prefijados a `/manager`, y despliega solo
  a `~/negora.dveloxsoft.com/manager` **sin tocar la landing** del directorio
  padre. El job `develop` queda igual.
- Detalle completo y tareas de backend/cPanel en
  [docs/despliegue-negora-manager.md](docs/despliegue-negora-manager.md).

### Corregido

#### Costos y precios en divisa por debajo de 1 no se podían registrar
- Comprar a **0,60 USD la unidad** (un lote de bolsas de arroz, por ejemplo) se
  rechazaba con «el valor debe ser mayor que 1». El mínimo se aplicaba al número
  tecleado sin mirar la moneda: nació pensando en CUP, pero en divisa equivalía a
  exigir 1 USD (~440 CUP) de costo mínimo. Afectaba al costo y al precio de venta
  al asignar un producto, y al costo del lote en la entrada de stock.
- Ahora los importes solo exigen **ser mayores que 0** y el mínimo real se valida
  sobre el **equivalente en CUP** —igual que ya se validaba el tope—, con el
  corte en 0,01 CUP, que es la resolución de las columnas `decimal(10,2)` del
  backend. El mensaje dice a cuánto equivale lo escrito.
- El campo sigue siendo el costo **por unidad**; la compra por cantidad se
  refleja en `costo × stock` (0,60 USD × 24 bolsas = 14,40 USD).

#### La tasa de transferencia en CUP no se podía usar (backend)
- Al **guardar** las tasas, la rama que actualiza un negocio con registro previo
  escribía `cupTransferencia` en vez de `CUP_TRANSFERENCIA`; TypeORM descarta lo
  que no mapea, así que la tasa volvía a 0 sin ningún error. Como cada negocio
  nace con un registro en 0, era la rama que se tomaba siempre.
- Al **leer**, la resolución de tasa del costo repetía el mismo error de nombre, y
  un costo en transferencia CUP fallaba con «moneda no configurada». Ese mapa
  duplicado se sustituyó por `extractExchangeRate`, que ya resolvía bien todas las
  columnas.
- Dos tests de regresión: el typecheck no ve el fallo porque `Object.assign` acepta
  cualquier literal. Detalle en `psearch-back` → `migration_doc/149`.

#### Precios formateados como pesos colombianos
- El diálogo de editar producto mostraba el precio actual y su variación con
  `Intl.NumberFormat("es-CO", { currency: "COP" })`. Ahora usa `formatMoney` en CUP,
  la moneda en la que realmente se guardan. Quedan con el mismo formato heredado la
  tabla de productos, la tarjeta de catálogo, el diálogo de detalles y el historial
  de precios (ver [docs/moneda-precio-venta.md](docs/moneda-precio-venta.md) §3.6).

#### Abrir "Pruebas del sistema" degradaba la sesión al plan básico
- El runner in-app corría las suites al montar la vista, y la suite `pro-gates`
  llamaba a la función **real** `applySelectedPlanToSession`, que escribe en
  `sessionStorage` y en las cookies de auth. Al pasarle `{ type: "basic" }` sin
  datos frescos del backend, esta borraba `plan.features`, `plan.isPro` y
  `plan.limits`, dejaba `plan.type` en `"basic"` y la cookie `user_plan_type`
  igual: un admin con plan Pro perdía **todas** las funciones Pro hasta recargar.
- El aviso a los suscriptores se extrae a `notifyPlanSessionChange()`
  ([lib/plan-session.ts](src/lib/plan-session.ts)) y el test comprueba el
  alta/aviso/baja con esa función, sin tocar la sesión.

#### Notificaciones: el estado de "leída" no se guardaba
- La ruta para marcar **una** notificación como leída estaba declarada
  `@Patch("{id}/read")` en vez de `@Patch(":id/read")`. Con NestJS 11 → Express 5 →
  path-to-regexp 8, `{...}` ya **no** es un parámetro sino un grupo opcional
  literal, así que `PATCH /notifications/<uuid>/read` compilaba a una ruta literal
  y devolvía **404**: al pulsar una notificación su `readAt` nunca se guardaba y al
  volver a entrar reaparecía como no leída.
- El frontend tampoco enviaba el `businessId` que ese endpoint exige como query
  param ([lib/api/notifications.ts](src/lib/api/notifications.ts) y
  [hooks/use-notifications.ts](src/hooks/use-notifications.ts)).
- Dos filtros usaban `readAt: null` en vez de `IsNull()`. En TypeORM 0.3 la opción
  por defecto `invalidWhereValuesBehavior.null = "ignore"` **descarta la condición
  entera** del WHERE, así que `?unreadOnly=true` devolvía todo y `markAllAsRead`
  seleccionaba **todas** las notificaciones del negocio —las ya leídas incluidas— y
  les reescribía la fecha de lectura.
- **Requiere redesplegar el backend** para que surta efecto en producción.

#### Resúmenes semanal y mensual con cifras reales
- `buildSummary()` devolvía `revenue: 0` fijo (placeholder). Ahora calcula ingresos
  reales delegando en `SaleService.getClosingByDateRange`, **la misma fuente que los
  cierres contables**, así que resumen y cierre nunca discrepan: excluye ventas
  canceladas y consolida las monedas a CUP.
- Compara el tramo transcurrido contra el **mismo tramo** del periodo anterior
  (semana natural desde el lunes; mes desde el día 1, recortando si el mes anterior
  es más corto), con las fechas delimitadas en `APP_TIMEZONE` y la aritmética en UTC
  para que no la afecte el horario de verano. Nuevo `summary-period.util.ts` con
  suite de tests.
- `GET /notifications/summaries/weekly|monthly` devuelve ahora también `revenue`,
  `previousRevenue`, `revenueChange`, `period` y `previousPeriod` además de `content`.
- **Estos resúmenes todavía no se ven en la app**: nada dispara la notificación y los
  tipos están excluidos de la UI. Activarlos está planificado como **V3-040..043** en
  [docs/v3/V3-MASTER.md](docs/v3/V3-MASTER.md) §8.

#### Revisión de julio 2026 — cinco fases
- **Panel principal:** estados de carga que faltaban.
- **Saldos por moneda:** se retira el concepto de presupuestos.
- **Desempeño de ventas:** el total por trabajador sumaba monedas distintas como si
  fueran la misma unidad, y el rango de fechas personalizado **perdía el último día**
  por mezclar parseo UTC con día local. Backend: `migration_doc/139`.
- **Historial de inventario:** filtros por rango de fechas y por tipo de movimiento,
  más exportación. El parseo de días locales se extrae a `common/date-range.util.ts`.
  Backend: `migration_doc/140`.
- **PDF de cierre:** rediseño de la maquetación (ver "Motor de tablas para PDF").
- Detalle fase por fase en
  [docs/revision-2026-07-correcciones.md](docs/revision-2026-07-correcciones.md).

#### Transacciones financieras
- Refactor a **4 tipos** (gastos, pagos de venta, cancelaciones de venta, pagos a
  proveedores) guardando monto y moneda **originales** más las tasas aplicadas.
- Cancelar una venta con pagos multimoneda emitía transacciones **duplicadas** (una
  por moneda de pago **y** otra por el total). Corregido, junto con el cálculo de
  `convertedAmount` en EUR y la emisión de la transacción por mercancía perdida o
  dañada en cancelaciones parciales. Backend: `migration_doc/136`, `137`.

#### Decimales en cantidades de productos por unidades
- El historial de inventario pintaba `quantity`, `previousStock` y `newStock` tal
  como llegan del backend (columnas `decimal(10,2)`, es decir strings `"1.00"`),
  así que un producto por piezas mostraba "Cantidad: 1.00" y "Stock: 5.00 → 6.00".
  No existe media laptop: ahora [inventory-history-item.tsx](src/components/inventory/inventory-history-item.tsx)
  formatea según la unidad del producto, y de paso deja de listar movimientos con
  cantidad 0 (el string `"0.00"` es truthy y colaba).
- Nuevo helper `formatQuantity()` en [units.ts](src/lib/units.ts): número ya
  normalizado (redondeado en `ud`) y la unidad como sufijo **solo** en
  peso/volumen, para celdas de tabla y badges donde "12 unidades" no cabe.
  Complementa a `formatStockWithUnit()`, que sigue siendo el formato largo.
- Aplicado a los sitios que mostraban cantidades sin mirar la unidad: CSV del
  historial ([inventory-history-export.ts](src/lib/inventory-history-export.ts),
  que además ahora escribe números y no texto), lotes de costo
  ([product-cost-layers.tsx](src/components/inventory/product-cost-layers.tsx),
  que rotulaba todo como "uds" — un lote de 0,5 kg salía como "0,5 uds"), tablas
  de stock y de vendidos del cierre contable, tabla de productos del negocio,
  detalles de producto y de venta, cancelación/devolución de venta, historial de
  precios, actividad reciente del panel, diálogo de alerta de stock (mostraba
  "0 unidades" para 0,4 kg) y badge de stock bajo.
- El resumen del carrito ya no suma unidades de distinta naturaleza: 2 laptops +
  0,5 kg de café daban "2,5 unidades". Si hay peso/volumen en el carrito, cuenta
  productos.

#### Rutas con basePath
- Las 3 redirecciones a login por 401 en [axios.ts](src/lib/axios.ts) usaban
  `window.location.href = "/login"` (ignoraba el basePath y sacaba al usuario de
  `/manager`). Ahora usan `withBasePath("/login")`; de paso queda correcto también
  en `develop` (`/dev/login`).
- El `urlCallback` del correo de recuperación en
  [forgot-password/page.tsx](src/app/%28auth%29/forgot-password/page.tsx) ahora incluye
  el basePath, para que el enlace apunte a `.../manager/reset-password`.

#### Efectos con `setState` (React Compiler)
- Reescritos 5 casos de `react-hooks/set-state-in-effect` al patrón oficial de
  React de **ajustar estado durante el render** (condición idempotente o rastreo
  de referencia previa) en vez de en un `useEffect`, evitando renders en cascada:
  `assign-plans/page.tsx` (reset de página), `sales/create/page.tsx` (tipo de
  venta sin delivery), `business-location-step.tsx`, `notification-settings-card.tsx`
  y `worker-form.tsx`.

### Cambiado

#### Calidad de código / linter
- El proyecto queda **sin errores ni advertencias** de ESLint (`pnpm run lint`) y
  de TypeScript (`tsc --noEmit`).
- [eslint.config.mjs](eslint.config.mjs): se silencian de forma acotada avisos
  inherentes de librería y de terceros — `react-hooks/incompatible-library`
  (TanStack Table / React Hook Form no memoizables por el React Compiler), `require()`
  solo en `server.js` (servidor Node CommonJS), y las reglas propias de los
  componentes **vendored de shadcn** en `src/components/ui/**` (que no se modifican).
- Correcciones reales en código propio: imports sin usar eliminados y
  `provinces`/`plans` envueltos en `useMemo` (`react-hooks/exhaustive-deps`).

#### Permisos de trabajadores
- Los módulos exclusivos de administradores del sistema ya **no aparecen** entre
  los permisos asignables al crear o editar un trabajador (vista
  `/dashboard/business/workers`). En concreto se ocultan **Asignar Planes**
  (`/admin/assign-plans`) y **Gestión de menús** (`/admin/menus`): son de uso
  exclusivo de administradores, no de dueños de negocio ni trabajadores (sea
  plan gratuito, básico o pro).
- Nuevo helper `filterAssignableMenuItems` y constante `ADMIN_ONLY_URL_SEGMENTS`
  en [worker-permissions-section.tsx](src/components/workers/worker-permissions-section.tsx),
  que filtran por **URL** (estable ante cambios de nombre en el backend). Para
  ocultar más módulos admin-only basta con añadir su segmento de URL ahí.
- El filtro se aplica tanto en la lista de checkboxes (`WorkerPermissionsSection`)
  como en [worker-form.tsx](src/components/workers/worker-form.tsx): en modo
  edición, si un trabajador ya tuviera uno de esos permisos no se vuelve a marcar
  ni a reenviar al guardar, y la validación de "permisos incompletos" lo ignora.
- **Nota:** es un control de UI en el cliente. El backend debería rechazar también
  un `assign-plans` / `menus` enviado manualmente para un trabajador.

### Eliminado

#### Vista "Pruebas del sistema" (`/dashboard/admin/test`)
- Se retira la página admin que ejecutaba las suites en el navegador, junto con
  su runner (`components/admin-test/`, `testing/run-suites.ts`). Las pruebas se
  mantienen como internas: las suites siguen en `src/testing/suites/` y corren
  con `pnpm test` (Vitest).
- **Pendiente manual:** eliminar el menú "Pruebas del sistema" desde
  `/dashboard/admin/menus`; vive en la base de datos, no en el código.

---

## [0.10.0-beta] - 2026-03-24

### Agregado

#### Productos (negocio y catálogo)
- Botón **Agregar producto** de nuevo en la parte superior de `products/page.tsx` (enlace con `Button` + `Plus`).
- Búsqueda y tabla siguen en los componentes de tabla; sin filtro por categoría en la UI (la columna categoría permanece visible u ordenable donde aplica).

#### Asignar planes (admin)
- Tabla de usuarios con **TanStack Table**, columnas ordenables, búsqueda por nombre/correo integrada en la tabla, paginación con `DataTablePaginationNav`, estados vacíos y de carga.
- Nuevos archivos: `assign-plans-table-columns.tsx`; `assign-plans-table.tsx` reescrito; `page.tsx` sin estado `searchQuery` local y `handlePlanSelect` con `useCallback`.

#### Cierre contable diario
- Tres **data tables**: productos vendidos (sin canceladas), ingresos de inventario del día y stock en almacén — con ordenación, filtro por nombre de producto, paginación y totales al pie (ingresos/gastos/valor inventario según bloque).
- Helper `formatClosingCurrency` en `components/accounting-close/format-closing-currency.ts`.
- Componentes: `daily-close-sortable-header.tsx`, `daily-close-sold/entry/stock-columns.tsx`, `daily-close-sold/entry/stock-table.tsx`, `daily-close-table-layout.ts` (anchos fijos `table-fixed` para evitar solapamiento: producto ~28 %, columnas numéricas con `min-width`).
- Página `daily/page.tsx`: import de formato como `formatCurrency` (alias de `formatClosingCurrency`) para compatibilidad con el runtime.

### Cambiado

#### Cierre diario — UI
- Cards en grid de dos columnas con `lg:items-start` y `Card` con `gap-4 py-4` en bloques de tablas para reducir altura fantasma cuando una columna tiene poco contenido.
- Estado vacío (`Empty`) con `flex-none` y padding acotado para anular el `flex-1` por defecto del componente que estiraba la card.
- Tablas con `table-fixed`, `w-full`, `min-w-0` y reparto de anchos documentado en `daily-close-table-layout.ts`.

#### Cierre diario — Hidratación
- Primer render unificado: estado `mounted` + `useEffect` y skeleton `DailyClosePageSkeleton` hasta montar el cliente, luego `isLoading` u otras ramas — evita mismatch SSR/cliente entre skeleton, error sin negocio y contenido (contexto React Query / negocio activo).

### Corregido

- Errores de consola por identificadores ausentes tras refactors (`searchQuery`, `formatCurrency`) al alinear estado/imports con el código actual y caché de desarrollo cuando aplica.

---

## [0.5.0-beta] - 2026-03-16

### Agregado

#### Tipo de cambio — Formulario de actualización
- Nuevo componente `ExchangeRateForm` (`components/exchange-rate/exchange-rate-form.tsx`) con:
  - Inputs para USD, EUR y Transferencia usando `InputGroup` con icono de prefijo
  - Lógica create/update: llama a `useCreateExchangeRateMutation` si no hay datos previos, o `useUpdateExchangeRateMutation` si ya existen
  - Pre-rellena los campos con los valores actuales vía `useEffect` + `reset()`
  - Tras guardar, actualiza los campos inmediatamente con la respuesta del servidor (`response.data`) sin esperar el refetch
  - Notificaciones `sileo.success` / `sileo.error` y manejo de errores con `axios.isAxiosError`
  - Muestra "Valor actual: X MN" debajo de cada campo cuando hay datos existentes
- Nuevo schema de validación `exchangeRateSchema` en `lib/validations/exchange-rate.ts`
- Tipo `UpdateExchangeRatePayload` (`Omit<ExchangeRatePayload, 'idbusiness'>`) en `lib/types/exchange-rate.ts`
- Función `updateExchangeRate` en `lib/api/exchange-rate.ts`
- Ruta `updateExchangeRate` en `lib/routes/exchange-rate.ts`
- Hook `useUpdateExchangeRateMutation` en `hooks/use-exchange.ts`
- `ExchangeRateTypeOne` exportado desde `lib/types/exchange-rate.ts`

#### Detalles del negocio — Campo tipo de negocio editable
- "Tipo de negocio" ahora es editable al activar el modo edición, usando un `Select` con las opciones MiPyme, Agromercado y Mercado
- Campo `type` añadido al schema `updateBusinessSchema` y al payload del `onSubmit`
- Componente `EditableFieldWrapper` interno: envuelve los campos editables en modo lectura con un ring sutil (`ring-1 ring-primary/25`) y un icono de lápiz pequeño (`Pencil h-3 w-3 text-primary/50`) en la esquina derecha como indicador visual; los campos de solo lectura (Provincia, Municipio) no tienen este wrapper

### Corregido

#### Tipo de cambio
- `TypeError: Cannot read properties of null (reading 'USD')`: añadido guard `data?.data` en la page; las cards solo se renderizan si hay datos, y al formulario se le pasa `data?.data ?? null`
- Schema Zod: `invalid_type_error` reemplazado por `error` para compatibilidad con Zod v4
- Interfaces `ExchangeRateData` y `ExchangeRateFormProps` locales del formulario eliminadas y reemplazadas con `ExchangeRateTypeOne` importada desde tipos
- Corregido `invalidateQueries` en `useCreateExchangeRateMutation`: ahora invalida `["exchange-rate", idbusiness]` en vez de queries de productos

#### Detalles del negocio — Select de tipo de negocio
- Valor seleccionado aparecía centrado: icono y `SelectValue` agrupados en un `div flex` para que formen un bloque a la izquierda junto al chevron a la derecha
- Dropdown del select se abría centrado: `SelectContent` cambiado a `align="start"` y `position="popper"` para alinearse al inicio del trigger y heredar su ancho

### Eliminado
- Proxies Next.js de productos (`src/app/api/products/route.ts`, `src/app/api/products/[productId]/route.ts`, `src/app/api/products/business/[businessId]/route.ts`) — no se utilizaban; las rutas en `lib/routes/product.ts` apuntan directamente al backend externo

---

## [0.4.0-beta] - 2026-03-12 / 2026-03-14

### Agregado

#### Cierre contable diario — Filtro de fechas
- Tipo `DateRangeParameters` en `lib/types/accounting-close.ts`
- Función `getDailyAccountingClose` acepta parámetro opcional `params?: DateRangeParameters` y construye la URL con `URLSearchParams` según si hay rango de fechas
- Hook `useDailyAccountingClose` incluye `params` en el `queryKey` para que TanStack Query refetch automáticamente al cambiar las fechas
- Nuevo componente `DateFilter` (`components/accounting-close/date-filter.tsx`): calendario shadcn en un Popover con botones "Confirmar" y "Limpiar", y botón `X` en el trigger para limpiar directamente
- Integración del `DateFilter` en la página de cierre diario con estado local `selectedDate`

#### Ventas — Cancelación con razón
- Nuevo componente `CancelSaleDialog` (`components/sales/cancel-sale-dialog.tsx`) con:
  - Input obligatorio para la razón de cancelación (`cancellationReason`)
  - Botón de confirmar deshabilitado si el input está vacío o está cargando
  - Estado de carga con spinner (`Loader2`)
  - Limpieza automática del input al cerrar el diálogo
  - Soporte para confirmar con `Enter`
  - Tooltip opcional en el trigger
- Botón de cancelar deshabilitado en `TableOfSales` si la venta ya está cancelada (`sale.isCancelled`)

#### Página de detalles del negocio
- Nueva página `/dashboard/business/details` que muestra los datos del negocio activo con la misma estructura y estilos que la página de crear negocio (campos de solo lectura)

#### Proxies Next.js para CORS
- `/api/businesses/my-businesses` — proxy GET para obtener negocios del usuario
- `/api/businesses/[businessId]/products` — proxy GET para productos de un negocio
- `/api/auth/login`, `/api/auth/register`, `/api/auth/activate` — proxies POST para autenticación
- `/api/auth/send-confirmation-token/[email]` — proxy POST para reenvío de código
- `/api/auth/me` — proxy GET con reenvío del header `Authorization`
- `/api/products` y `/api/products/[productId]` — proxies GET/POST/PUT/DELETE para productos generales

### Corregido

#### ExchangeRatePage
- `TypeError: Cannot read properties of undefined (reading 'data')`: añadido guard `if (!data?.data)` y fallbacks `?? '-'` en los valores pasados a `ExchangeCard`

#### ComboboxCollection en ventas e inventario
- Error `Type 'Element[]' is not assignable to type '(item: any, index: number) => ReactNode'`: `ComboboxCollection` requiere una función render como children, no un array; reemplazado `products.map()` por función render directa en `sales/create/page.tsx` y `update-stock-form.tsx`

#### Rutas de productos
- Corregido path del backend de plural `/products` a singular `/product` en los proxies `api/products/route.ts` y `api/products/[productId]/route.ts`
- Todas las rutas de productos, businesses y auth en `lib/routes/*.ts` apuntan ahora a los proxies locales (`/api/*`) en vez del backend externo directamente

#### Proxies — Parsing robusto
- Reemplazado `response.json()` por `response.text()` + `try { JSON.parse(text) } catch { data = { message: text } }` en todos los proxies para evitar crash cuando el backend devuelve HTML o respuesta vacía

### Cambiado

#### Almacenamiento de sesión
- Migración completa de `localStorage` a `sessionStorage` para `token`, `refresh_token`, `user` y `activeBusinessId` en: `login/page.tsx`, `business-context.tsx`, `nav-user.tsx` y todos los archivos de `lib/api/*.ts`

#### Cancelación de venta
- `cancelSale` en `lib/api/sale.ts` ahora recibe `cancellationReason: string` y lo envía en el body del POST
- `useCancelSaleMutation` en `hooks/use-sales.ts` ahora acepta `{ saleId, cancellationReason }` en lugar de solo `saleId`
- `TableOfSales` usa `CancelSaleDialog` en lugar del `DeleteDialog` genérico

### Resuelto
- Merge conflict en `src/lib/routes/index.ts`: mantenida la URL `https://psearch.dveloxsoft.com/apiv1`

---

## [0.3.0-beta] - 2026-03-05

### Agregado

#### Productos
- Tabs en página crear producto: "Crear nuevo producto" y "Asignar producto a negocio" (igual que entradas)
- Tabla de "otros productos" (productos no asociados al negocio activo)
- Campo "Precio de entrada" en formulario de crear producto
- Proxy `/api/products` en Next.js para evitar CORS (backend redirige OPTIONS)

#### Inventario
- Tabla de historial de entradas (`TableOfInventory`) con columnas: Producto, Cantidad, Precio unitario, Stock anterior, Stock nuevo, Fecha, Acciones
- Diálogo de detalles de entrada (`InventoryDetailsDialog`) con misma estructura que ventas
- Skeleton durante carga y refetch en página de inventario
- Contador de total de entradas

#### Sidebar
- Icono `Boxes` para Inventario (reemplaza ArrowDownToLine)
- Versión de la app en el menú de opciones del usuario

### Corregido

#### Inventario
- Hook renombrado `useAllSalesByBusinessId` → `useAllInventoryByBusinessId` en `use-inventory.ts`
- Invalidación de `["all-inventory-by-business-id"]` al agregar stock

#### Productos
- Tipo `imageUrl` en `edit-product-form`: `?? null` para evitar `undefined` en `EditProductProps`

### Cambiado
- Página de productos: dos tablas (productos del negocio + otros productos), carga paralela de queries

---

## [0.2.0-beta] - 2026-03-03

### Agregado

#### Productos
- Componente `ProductsTableSkeleton` para mostrar estado de carga con estructura de tabla (shadcn)
- Skeleton en página de productos durante carga inicial (`isLoading`) y refetch tras crear/editar/eliminar (`isFetching`)

### Corregido

#### Crear producto
- Combobox de unidad no sincronizaba con react-hook-form (usaba estado local); ahora usa `watch("unit")` y `setValue` para mantener el valor del formulario
- Backend rechazaba `imageUrl`: eliminado del payload en `lib/api/product.ts` y del schema de validación
- Toast de feedback cuando falla la validación del formulario (campos requeridos)

#### StatusBadge
- Badges no mostraban color de fondo: la variante `default` del Badge aplicaba `bg-neutral-900` y sobrescribía las clases personalizadas; ahora usan `variant="ghost"` para que `bg-destructive` y `bg-emerald-500` se apliquen correctamente

#### Invalidación de cache (productos)
- `useEditProductMutation` no invalidaba la lista de productos; ahora invalida `["all-product-of-my-businesses"]` además de la query del producto individual
- La tabla de productos se actualiza correctamente tras crear, editar o eliminar

#### Otros (sesiones anteriores)
- `DeleteDialog`: no se cerraba tras confirmar eliminación; añadido estado `open` controlado y `setOpen(false)` tras `onConfirm` exitoso
- `BusinessProvider`: token expirado causaba 401, lista de negocios vacía y redirección incorrecta; añadido manejo de `isError`, retry sin reintentos en 401, redirección a login y limpieza de localStorage
- `cancelSale`: mismo fix de headers en body (orden de argumentos en `axios.post`)

### Eliminado
- Campo `imageUrl` del schema `createProductSchema` y del formulario de crear producto (el backend no lo acepta)
- `console.log` de debug en `lib/api/product.ts`

---

## [0.1.0-beta] - 2026-03-01

### Funcionalidades del sistema

#### Autenticación
- Registro de usuario con verificación por correo electrónico
- Login con validación de credenciales
- Verificación de código enviado al correo
- Reenvío de código de verificación
- Cierre de sesión con limpieza de localStorage
- Verificación de plan activo al hacer login (redirige a `/plans` si no tiene plan)

#### Gestión de negocios
- Creación de negocios con formulario completo (nombre, tipo, dirección, provincia, municipio, descripción, teléfono, correo)
- Selects dependientes de provincia → municipio (municipio se habilita al seleccionar provincia)
- Tipos de negocio soportados: MiPyme, Agromercado, Mercado
- Redirección automática a crear negocio si el usuario no tiene ninguno registrado
- Loading state mientras se cargan los negocios (evita flash de contenido)
- Cambio de negocio activo desde el sidebar (BusinessSwitcher)
- Persistencia del negocio activo en localStorage

#### Productos
- Listado de productos por negocio
- Creación de productos (nombre, descripción, categoría, unidad, precio, stock)
- Edición de productos existentes
- Eliminación de productos con diálogo de confirmación

#### Ventas
- Registro de ventas con selector de producto y cantidad
- Validación de stock disponible
- Cálculo automático de total
- Resumen de venta en tiempo real
- Listado de ventas por negocio

#### Entradas (Inventario)
- Actualización de stock de productos existentes

#### Cierre contable
- Cierre diario
- Cierre mensual

#### Tipo de cambio
- Consulta de tipo de cambio

#### UI/UX
- Sidebar colapsable con navegación por secciones
- Dark mode con toggle
- Diseño responsivo (móvil y escritorio)
- Notificaciones con Sileo (éxito y error)
- Componentes shadcn/ui + Tailwind CSS

### Stack técnico
- **Framework**: Next.js (App Router)
- **UI**: shadcn/ui, Tailwind CSS, Lucide icons
- **Formularios**: react-hook-form + Zod
- **Estado servidor**: TanStack Query (React Query)
- **HTTP**: Axios
- **Notificaciones**: Sileo

---

### Cambios realizados en esta sesión

#### Corregido
- Fix en la función `register` de `lib/api/auth.ts`: eliminado `try/catch` que tragaba errores silenciosamente e impedía la navegación a `/verify` después del registro

#### Agregado
- Tipo `CreateBusinessPayload` en `lib/types/business.ts`
- Schema de validación `createBusinessSchema` en `lib/validations/business.ts`
- Ruta `createBusiness` en `lib/routes/business.ts`
- Función API `createBusiness` en `lib/api/business.ts`
- Hook `useCreateBusinessMutation` en `hooks/use-business.ts` con invalidación de cache
- Página `/dashboard/business/create` con formulario completo
- Selects dependientes de provincia/municipio usando `useGetAllProvinces` y `useGetAllMunicipalitiesByProvinceId`
- Redirección automática en `BusinessProvider` cuando el usuario no tiene negocios
- Loading state en `BusinessProvider` para evitar flash del dashboard
- Botón "Agregar negocio" funcional en el `BusinessSwitcher` del sidebar
- Notificaciones con Sileo en éxito y error al crear negocio
- Botón de cancelar en el formulario de crear negocio

#### Corregido (edición de productos)
- Fix en `lib/api/product.ts`: función `edit` enviaba los headers como parte del body en vez de como config de axios (segundo vs tercer argumento de `axios.put`)
- Fix en `lib/validations/products.ts`: campo `active` en `editProductSchema` era requerido pero el formulario no lo incluía, causando que la validación fallara silenciosamente y el submit nunca se ejecutara. Ahora es `.optional()`

#### Cambiado
- Icono del botón de actualizar producto: `Save` reemplazado por `RefreshCw`
- Eliminado efecto hover del `SelectTrigger` en `components/ui/select.tsx`

#### Eliminado
- Código muerto de `getMyBusinesses` en el login (no se usaba la respuesta)
- Import sin usar de `businessRoutes` en login

---

## Resumen del sistema (estado actual), recomendaciones y mejoras sugeridas

*Actualizado: 2026-03-19 — complementa las notas de versiones anteriores; no sustituye el historial por release.*

### Resumen breve del sistema actual

**pmanage** (v0.9.0-beta) es un panel web (**Next.js 16**, App Router) orientado a la gestión de negocios: autenticación (login, registro, verificación por correo), multi-negocio con negocio activo, **productos**, **ventas** (incl. cancelación con motivo), **inventario / entradas**, **cierre contable** (diario y mensual), **tipo de cambio** y página pública de **planes**. La UI usa **shadcn/ui**, **Tailwind CSS 4**, **TanStack Query**, **Axios**, formularios con **react-hook-form + Zod**, tema claro/oscuro y toasts con **Sileo**.

La sesión se basa en **sessionStorage** (token, usuario, negocio activo) y **cookies de auth** sincronizadas para que el **middleware** pueda proteger rutas: exige token en `/dashboard` y `/plans`, restringe `/dashboard/admin/*` a rol admin y el cierre **mensual** a planes tipo “Pro” (premium/profesional/plus, etc.). El sidebar filtra ítems según rol y plan.

**Admin**: flujo de **asignar planes** a usuarios, creación de planes con tipos `free | basic | premium | enterprise`, estadísticas por plan y estilos visuales por tipo de plan (`getPlanStyle`). Parte de las llamadas a API pasan por **proxies `/api/*`** en Next para mitigar CORS en auth y negocios.

### Funcionalidades que se podrían agregar

- **Refresh token automático** o reintento controlado antes de expulsar al usuario en 401.
- **Auditoría / historial** de cambios en productos, planes asignados y cierres contables.
- **Exportación** (CSV/PDF) de ventas, inventario y cierres.
- **Notificaciones in-app** o recordatorios (vencimiento de planes, stock bajo).
- **Roles intermedios** (p. ej. solo lectura) si el backend lo soporta.
- **Tests** (Vitest/Playwright o similares): hoy no hay suite automatizada visible en el repo.
- **Documentación de API / `.env.example`** para onboarding de desarrolladores.

### Mejoras sugeridas (UX, consistencia, mantenimiento)

- **Unificar estilos de toasts Sileo** en toda la app (`text-foreground` / `text-muted-foreground` / `text-destructive`) para modo claro/oscuro, no solo en assign-plans.
- **Tipado estricto de `PlanResponse.type`** frente a `string` si el backend garantiza el enum.
- **Revisión de proxies vs llamadas directas** al backend: documentar qué rutas usan proxy y cuáles no, para evitar duplicidad y confusiones de CORS.
- **Accesibilidad**: foco en diálogos, `aria-*` en tablas complejas y contraste en badges.
- **i18n** si se prevé otro idioma además del español actual en UI.

### Errores, riesgos o puntos a corregir / vigilar

- **Cookies + sessionStorage**: si una cookie queda desincronizada del storage (pestaña antigua, limpieza parcial), el middleware y el cliente podrían discrepar; conviene una única función de “logout total” y revisar edge cases.
- **`PlanType` vs nombres en BD**: `getPlanStyle` también mira `name` y palabras como `custom`/`personalizado`; alinear contrato API para que `type` sea la fuente de verdad y reducir heurísticas por nombre.
- **Changelog histórico**: entradas muy antiguas mencionan `localStorage` en planes/login; el sistema actual usa **sessionStorage** — al leer documentación antigua, contrastar con el código vigente.

*Esta sección es orientativa; priorizar según negocio y capacidad del backend.*
