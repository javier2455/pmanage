/**
 * Guías de una sola pantalla. Se lanzan desde el botón de ayuda estando ya en
 * la vista, así que todos los pasos comparten la ruta del primer paso.
 *
 * Dos convenciones:
 *
 * - El array va en el orden del menú lateral (Categorías, Productos, Ventas,
 *   Gastos, Inventario, Trabajadores, Proveedores, Flujo de caja, cierres,
 *   Tipo de cambio y Soporte). El catálogo lo lista tal cual, así que buscar
 *   una guía se parece a buscar la sección en el menú.
 * - Cada guía abre con un paso sin ancla —popover centrado— que explica para
 *   qué sirve la pantalla. Solo después se entra en los detalles.
 *
 * Regla de anclaje: cabeceras, botones de acción y contenedores. Nunca filas de
 * datos, que no existen en un negocio recién creado. Lo que puede faltar lleva
 * `onMissing: "skip"`.
 *
 * No hay guía de Analíticas: hoy `/dashboard/analytics` es un redirect y la
 * vista real está aparcada sin enrutar.
 */

import type { TourDefinition } from "@/lib/tour/types";

export const SECTION_TOURS: TourDefinition[] = [
  {
    id: "seccion-panel",
    kind: "seccion",
    title: "Panel principal",
    description: "Qué te dicen las tarjetas de hoy y a dónde te lleva cada una.",
    entryRoute: "/dashboard",
    steps: [
      {
        id: "panel-intro",
        route: "/dashboard",
        title: "Panel principal",
        description:
          "Esta es tu portada: el resumen de cómo va el negocio hoy. No se registra nada aquí, solo se consulta, y cada tarjeta es un atajo a la sección correspondiente.",
      },
      {
        id: "panel-stats",
        element: '[data-tour="dashboard-stats-grid"]',
        title: "Tu día de un vistazo",
        description:
          "Lo que vendiste, lo que gastaste y lo que tienes en caja. El porcentaje compara con ayer, para que veas si vas mejor o peor.",
      },
      {
        id: "panel-sales-card",
        element: '[data-tour="dashboard-sales-card"]',
        title: "Ventas de hoy",
        description:
          "Si vendes en varias monedas verás una línea por moneda: no las mezclamos para que no te cuadre mal. Toca la tarjeta para ver todas las ventas.",
      },
      {
        id: "panel-cash-card",
        element: '[data-tour="dashboard-cash-card"]',
        title: "Cuánto tienes en caja",
        description:
          "Suma el saldo de todas tus monedas convertido a CUP. Si dice «algunas sin tasa», hay una moneda a la que aún no le pusiste tipo de cambio.",
      },
      {
        id: "panel-recent",
        element: '[data-tour="dashboard-recent-grid"]',
        title: "Los últimos movimientos",
        description:
          "Tus cinco últimas ventas y tus cinco últimos gastos, para comprobar de un vistazo que todo quedó anotado.",
      },
    ],
  },

  // --- Categorías ---------------------------------------------------------
  {
    id: "seccion-categorias",
    kind: "seccion",
    title: "Categorías",
    description:
      "Para qué sirven las etiquetas de productos y de gastos, y cómo crear las primeras.",
    entryRoute: "/dashboard/business/categories",
    steps: [
      {
        id: "categorias-intro",
        route: "/dashboard/business/categories",
        title: "Categorías",
        description:
          "Esta pantalla es donde creas tus etiquetas. Son dos familias independientes: unas agrupan lo que vendes y otras, en qué gastas. Créalas antes de cargar productos y te ahorras rehacer trabajo.",
      },
      {
        id: "categorias-products",
        element: '[data-tour="categories-card-products"]',
        title: "Categorías de productos",
        description:
          "Sirven para agrupar lo que vendes: «Bebidas», «Aseo», «Comida». Después podrás filtrar y ver qué familia te deja más.",
      },
      {
        id: "categorias-expenses",
        element: '[data-tour="categories-card-expenses"]',
        title: "Categorías de gastos",
        description:
          "Sin ellas todos tus gastos son un montón sin forma. Con ellas ves de un vistazo cuánto se te va en cada cosa.",
      },
    ],
  },
  {
    id: "seccion-categorias-detalle",
    kind: "seccion",
    title: "Administrar categorías",
    description: "Crear, renombrar y eliminar categorías de una familia.",
    entryRoute: "/dashboard/business/categories/products",
    steps: [
      {
        id: "categorias-detalle-intro",
        route: "/dashboard/business/categories/products",
        title: "Administrar categorías",
        description:
          "Aquí gestionas una familia de categorías completa: crear, renombrar y eliminar. Es la vista de detalle de la tarjeta que tocaste.",
      },
      {
        id: "categorias-detalle-create",
        element: '[data-tour="categories-kind-create-btn"]',
        align: "end",
        title: "Crea una nueva",
        description:
          "Solo necesita nombre. Si vas a eliminar una, revisa antes que no tenga productos o gastos asociados.",
      },
      {
        id: "categorias-detalle-table",
        element: "#categories-table",
        title: "Todas tus categorías",
        description: "Toca una fila para ver su detalle y editarla.",
      },
    ],
  },

  // --- Productos ----------------------------------------------------------
  {
    id: "seccion-productos",
    kind: "seccion",
    title: "Productos",
    description:
      "La diferencia entre el catálogo del almacén y lo que tú vendes, y cómo pasar de uno a otro.",
    entryRoute: "/dashboard/business/products",
    steps: [
      {
        id: "productos-intro",
        route: "/dashboard/business/products",
        title: "Productos",
        description:
          "Aquí defines qué vendes. La pantalla tiene dos listas y entender la diferencia es lo más importante: arriba el catálogo general, abajo lo que tú vendes con tu precio y tu stock.",
      },
      {
        id: "productos-catalog",
        element: '[data-tour="products-catalog-section"]',
        title: "El catálogo del almacén",
        description:
          "El fichero de todos los productos que existen. Son fichas: todavía no son tuyas ni tienen precio.",
      },
      {
        id: "productos-create",
        element: '[data-tour="products-create-btn"]',
        align: "end",
        title: "Crear un producto",
        description:
          "Crea la ficha: nombre, unidad de medida y foto. Ojo, esto todavía no lo pone a la venta.",
      },
      {
        id: "productos-assign",
        element: '[data-tour="products-assign-btn"]',
        align: "end",
        title: "Ponerlo a la venta",
        description:
          "Con «Asignar producto» eliges uno del catálogo y le pones tu precio y tu stock. Ese es el paso que lo hace vendible aquí.",
      },
      {
        id: "productos-import",
        element: '[data-tour="products-import-btn"]',
        align: "end",
        title: "Si tienes muchos",
        description:
          "¿Ya llevas tu lista en Excel? Impórtala de una vez en lugar de crear producto por producto.",
      },
      {
        id: "productos-price-history",
        element: '[data-tour="products-price-history-btn"]',
        onMissing: "skip",
        align: "end",
        title: "Cómo cambió el precio",
        description:
          "Consulta todos los cambios de precio de un producto con su fecha. Útil cuando un cliente reclama que antes costaba menos.",
      },
    ],
  },
  {
    id: "seccion-producto-crear",
    kind: "seccion",
    title: "Crear un producto",
    description:
      "Qué poner en cada campo de la ficha y por qué la unidad de medida importa.",
    entryRoute: "/dashboard/business/products/create",
    steps: [
      {
        id: "producto-crear-intro",
        route: "/dashboard/business/products/create",
        title: "Crear un producto",
        description:
          "Este formulario crea la ficha del producto en el catálogo general. Son pocos datos y ninguno es su precio: eso viene en el paso siguiente, al ponerlo a la venta.",
      },
      {
        id: "producto-crear-name",
        element: "#product-name",
        title: "Nombre del producto",
        description:
          "Ponle el nombre con el que lo llamas al vender. Es el que verás al buscarlo en el mostrador.",
      },
      {
        id: "producto-crear-unit",
        element: '[data-tour="product-create-unit"]',
        title: "Unidad de medida",
        description:
          "Elige cómo lo vendes: por unidades, por peso (kg, lb, g) o por volumen (L, mL). De esto depende que puedas vender medio kilo o solo piezas enteras.",
      },
      {
        id: "producto-crear-image",
        element: '[data-tour="product-create-image"]',
        onMissing: "skip",
        title: "Una foto ayuda",
        description:
          "Es opcional, pero con foto encuentras el producto mucho más rápido en la pantalla de ventas. Máximo 2 MB.",
      },
      {
        id: "producto-crear-next",
        element: '[data-tour="product-create-submit"]',
        title: "Aún falta un paso",
        description:
          "Al guardar, el producto queda en el catálogo. Para venderlo tienes que asignarlo a tu negocio y ponerle precio y stock.",
      },
    ],
  },
  {
    id: "seccion-producto-asignar",
    kind: "seccion",
    title: "Poner un producto a la venta",
    description:
      "Precio, costo, stock y alerta: el paso que convierte una ficha en algo vendible.",
    entryRoute: "/dashboard/business/products/asign-to-business",
    steps: [
      {
        id: "asignar-intro",
        route: "/dashboard/business/products/asign-to-business",
        title: "Poner un producto a la venta",
        description:
          "Esta pantalla es la que convierte una ficha del catálogo en algo que puedes vender: le asigna tu precio, tu costo y tu stock en este negocio concreto.",
      },
      {
        id: "asignar-product",
        element: "#product-select",
        title: "Qué producto vas a vender",
        description:
          "Busca en el catálogo el producto que quieres poner a la venta.",
      },
      {
        id: "asignar-entry-price",
        element: "#entry-price",
        title: "Cuánto te costó",
        description:
          "El precio de entrada es lo que tú pagaste. Con esto calculamos después tu ganancia real, no solo lo que facturaste.",
      },
      {
        id: "asignar-as-expense",
        element: '[data-tour="product-assign-as-expense"]',
        onMissing: "skip",
        title: "¿Anotarlo como gasto?",
        description:
          "Marca la casilla si acabas de comprar esta mercancía: te creamos el gasto en «Reposición de stock» sin que tengas que ir a Gastos.",
      },
      {
        id: "asignar-price-stock",
        element: "#price",
        title: "Precio y cantidad",
        description:
          "El precio es a cuánto lo vendes (siempre en CUP) y el stock, cuántos tienes ahora mismo.",
      },
      {
        id: "asignar-alert",
        element: "#stock-alert-threshold",
        feature: "stockAlerts",
        onMissing: "skip",
        title: "Avísame antes de agotarme",
        description:
          "Pon cuántas unidades quieres que queden para que te avisemos. Así repones antes de perder ventas.",
      },
    ],
  },
  {
    id: "seccion-productos-importar",
    kind: "seccion",
    title: "Importar productos",
    description:
      "De la plantilla de Excel al catálogo, corrigiendo errores sin salir de la pantalla.",
    entryRoute: "/dashboard/business/products/import",
    steps: [
      {
        id: "importar-intro",
        route: "/dashboard/business/products/import",
        title: "Importar productos",
        description:
          "Esta pantalla carga muchos productos de golpe desde un Excel. Va por pasos: descargas la plantilla, la subes llena, revisas lo que va a pasar y recién entonces se guarda.",
      },
      {
        id: "importar-template",
        element: '[data-tour="products-import-template-btn"]',
        title: "Empieza por la plantilla",
        description:
          "Descarga el archivo de ejemplo, ábrelo en Excel y escribe tus productos en las columnas que ya vienen. No cambies los títulos de las columnas.",
      },
      {
        id: "importar-upload",
        element: '[data-tour="products-import-upload-btn"]',
        title: "Sube tu archivo",
        description:
          "Acepta Excel (.xlsx) o CSV, hasta 500 filas por vez. Si tienes más, hazlo en varias tandas.",
      },
      {
        id: "importar-copy",
        element: '[data-tour="products-import-copy-btn"]',
        onMissing: "skip",
        title: "Copia de otro negocio",
        description:
          "Si ya cargaste el catálogo en otro de tus negocios, tráelo con un clic. El stock viene en 0 a propósito: cada negocio tiene su propio almacén.",
      },
      {
        id: "importar-target",
        element: '[data-tour="products-import-target"]',
        onMissing: "skip",
        title: "¿Qué haces con ellos?",
        description:
          "«Catálogo + a la venta» los deja listos para vender con precio y stock. «Solo al catálogo» los ficha y tú decides después.",
      },
      {
        id: "importar-grid",
        element: '[data-tour="products-import-grid"]',
        onMissing: "skip",
        title: "Corrige en pantalla",
        description:
          "Las celdas en rojo tienen un problema; pasa el cursor por encima y te dice cuál. Puedes arreglarlas aquí mismo sin volver al Excel.",
      },
    ],
  },
  {
    id: "seccion-historial-precios",
    kind: "seccion",
    title: "Historial de precios",
    description:
      "Cómo consultar todos los cambios de precio de un producto con su fecha.",
    entryRoute: "/dashboard/business/products/price-history",
    steps: [
      {
        id: "precios-intro",
        route: "/dashboard/business/products/price-history",
        title: "Historial de precios",
        description:
          "Esta pantalla es de consulta: te muestra cómo ha ido cambiando el precio de un producto en el tiempo. Sirve para justificar una subida o detectar un error de tecleo.",
      },
      {
        id: "precios-selector",
        element: '[data-tour="price-history-selector"]',
        title: "Elige un producto",
        description:
          "Selecciónalo y te mostramos cada cambio con su fecha. Hasta que no elijas uno, la pantalla está vacía.",
      },
      {
        id: "precios-view",
        element: '[data-tour="price-history-view"]',
        onMissing: "skip",
        title: "Acota por fechas",
        description:
          "Si el producto lleva mucho tiempo contigo, filtra un rango para ver solo los cambios que te interesan.",
      },
    ],
  },

  // --- Ventas -------------------------------------------------------------
  {
    id: "seccion-ventas",
    kind: "seccion",
    title: "Ventas",
    description:
      "Consultar, ver el detalle y cancelar ventas sin romper la contabilidad.",
    entryRoute: "/dashboard/business/sales",
    steps: [
      {
        id: "ventas-intro",
        route: "/dashboard/business/sales",
        title: "Ventas",
        description:
          "Esta pantalla es el registro de todo lo que has vendido. Cada venta descuenta el stock sola y alimenta el cierre del día: es el corazón del sistema.",
      },
      {
        id: "ventas-create",
        element: '[data-tour="sales-create-btn"]',
        align: "end",
        title: "Registrar una venta",
        description:
          "Este es el botón que más vas a usar. Ábrelo cada vez que vendas.",
      },
      {
        id: "ventas-table",
        element: "#sales-table",
        title: "Todas tus ventas",
        description:
          "Cada línea es una venta. Toca una fila para ver el detalle: qué productos llevaba, en qué moneda y si ya está cobrada.",
      },
      {
        id: "ventas-cancel",
        element: "#sales-table",
        onMissing: "skip",
        title: "Cancelar sin borrar",
        description:
          "Si te equivocaste, cancela la venta con su motivo en lugar de borrarla. Queda tachada, el stock vuelve y el cierre sigue cuadrando.",
      },
    ],
  },
  {
    id: "seccion-venta-crear",
    kind: "seccion",
    title: "Registrar una venta",
    description:
      "El mostrador: buscar, armar el carrito, elegir moneda y cobrar.",
    entryRoute: "/dashboard/business/sales/create",
    steps: [
      {
        id: "venta-intro",
        route: "/dashboard/business/sales/create",
        title: "Registrar una venta",
        description:
          "Esta es tu pantalla de mostrador. Funciona como una caja: tocas productos, se arma el carrito a la derecha y cierras la venta. El stock se descuenta solo.",
      },
      {
        id: "venta-search",
        element: '[data-tour="sales-create-search"]',
        title: "Busca lo que vendiste",
        description:
          "Escribe el nombre del producto para filtrar. Si vendes poco surtido, ni hace falta: están todos en pantalla.",
      },
      {
        id: "venta-grid",
        element: '[data-tour="sales-create-grid"]',
        onMissing: "center",
        title: "Toca para agregar",
        description:
          "Cada tarjeta es un producto con su precio y lo que te queda. Tócala para sumarlo al carrito; no te deja pasar del stock disponible.",
      },
      {
        id: "venta-cart",
        element: '[data-tour="sales-cart-panel"]',
        onMissing: "skip",
        title: "Tu carrito",
        description:
          "Aquí ves lo que lleva el cliente. Puedes cambiar cantidades o quitar líneas antes de cerrar la venta.",
      },
      {
        id: "venta-currency",
        element: '[data-tour="sales-cart-currency"]',
        onMissing: "skip",
        title: "¿En qué moneda cobras?",
        description:
          "Elige la moneda del cliente. Convertimos el precio con la tasa que fijaste en Tipo de cambio, así que revisa que esté al día.",
      },
      {
        id: "venta-submit",
        element: '[data-tour="sales-cart-submit-pay"]',
        onMissing: "skip",
        title: "Registrar y cobrar",
        description:
          "El botón principal guarda la venta y abre el cobro de una vez: es el flujo de mostrador. El otro solo la anota para cobrarla después.",
      },
    ],
  },

  // --- Gastos -------------------------------------------------------------
  {
    id: "seccion-gastos",
    kind: "seccion",
    title: "Gastos",
    description:
      "Anotar y clasificar todo lo que sale, y verlo consolidado entre negocios.",
    entryRoute: "/dashboard/business/expenses",
    steps: [
      {
        id: "gastos-intro",
        route: "/dashboard/business/expenses",
        title: "Gastos",
        description:
          "Aquí anotas todo lo que sale del negocio: alquiler, luz, transporte, mercancía. Es la otra mitad de la cuenta; sin esto el cierre te dirá que ganas más de lo que ganas.",
      },
      {
        id: "gastos-create",
        element: '[data-tour="expenses-create-btn"]',
        align: "end",
        title: "Agregar un gasto",
        description:
          "Monto, moneda, una descripción y la categoría. La categoría es lo que después te deja ver en qué se te va el dinero.",
      },
      {
        id: "gastos-table",
        element: "#expenses-table",
        title: "Tu historial de gastos",
        description:
          "Toca una fila para ver el detalle. Clasificados por categoría es como sabrás dónde recortar.",
      },
      {
        id: "gastos-all-businesses",
        element: '[data-tour="expenses-all-businesses-switch"]',
        onMissing: "skip",
        title: "Ver todos tus negocios",
        description:
          "Si manejas varios negocios, activa esto para ver los gastos de todos juntos en una sola lista.",
      },
    ],
  },
  {
    id: "seccion-gasto-crear",
    kind: "seccion",
    title: "Registrar un gasto",
    description: "Monto, moneda, descripción y categoría: los datos que importan.",
    entryRoute: "/dashboard/business/expenses/create",
    steps: [
      {
        id: "gasto-intro",
        route: "/dashboard/business/expenses/create",
        title: "Registrar un gasto",
        description:
          "Cuatro datos y listo. Cuanto más concreto seas aquí, más te va a servir el cierre del día y el resumen del mes.",
      },
      {
        id: "gasto-amount",
        element: "#expense-amount",
        title: "Cuánto y en qué moneda",
        description:
          "Pon el monto tal como lo pagaste. Si fue en dólares, elige USD: lo convertimos con tu tasa para el cierre.",
      },
      {
        id: "gasto-description",
        element: "#expense-description",
        title: "Di para qué fue",
        description:
          "Escribe una descripción que entiendas dentro de tres meses («pago de luz de julio», no «pago»).",
      },
      {
        id: "gasto-category",
        element: "#expense-category",
        title: "Clasifícalo",
        description:
          "Elegir categoría es opcional, pero es lo que te permite después responder «¿en qué se me va el dinero?». Créalas en la sección Categorías.",
      },
    ],
  },

  // --- Inventario ---------------------------------------------------------
  {
    id: "seccion-inventario",
    kind: "seccion",
    title: "Inventario",
    description:
      "Leer tu stock real, meter mercancía y saber a dónde ir si no cuadra.",
    entryRoute: "/dashboard/business/inventory",
    steps: [
      {
        id: "inventario-intro",
        route: "/dashboard/business/inventory",
        title: "Inventario",
        description:
          "Esta pantalla te dice cuánta mercancía te queda de verdad. No se edita a mano: baja sola con cada venta y sube cuando registras una entrada.",
      },
      {
        id: "inventario-table",
        element: "#current-inventory-table",
        title: "Lo que te queda",
        description:
          "La existencia real de cada producto ahora mismo. Es el número que limita lo que puedes vender.",
      },
      {
        id: "inventario-entry",
        element: '[data-tour="inventory-add-entry-btn"]',
        align: "end",
        title: "Meter mercancía",
        description:
          "Cuando llegue una compra entra por aquí: eliges el producto, pones cuánto entró y a qué costo.",
      },
      {
        id: "inventario-history",
        element: '[data-tour="inventory-history-btn"]',
        align: "end",
        title: "Quién movió qué",
        description:
          "El historial guarda cada entrada, salida y ajuste con fecha y responsable. Es lo primero que hay que mirar si el stock no cuadra.",
      },
      {
        id: "inventario-alerts",
        element: '[data-tour="inventory-low-stock-banner"]',
        feature: "stockAlerts",
        onMissing: "skip",
        title: "Productos en rojo",
        description:
          "Este aviso aparece cuando algún producto llegó a su límite o se agotó. El límite se configura desde la columna de alertas de la tabla.",
      },
    ],
  },
  {
    id: "seccion-inventario-entrada",
    kind: "seccion",
    title: "Entrada de mercancía",
    description:
      "Registrar una compra con su costo, su proveedor y —si quieres— su gasto automático.",
    entryRoute: "/dashboard/business/inventory/create",
    steps: [
      {
        id: "entrada-intro",
        route: "/dashboard/business/inventory/create",
        title: "Entrada de mercancía",
        description:
          "Esta pantalla suma stock cuando te llega una compra. Cada entrada guarda su propio costo, que es lo que después permite saber qué margen te dejó cada lote.",
      },
      {
        id: "entrada-product",
        element: '[data-tour="inventory-create-product"]',
        title: "Elige el producto",
        description:
          "Busca el producto al que le llegó mercancía. Al elegirlo se abren el resto de campos y verás cuánto tienes ahora.",
      },
      {
        id: "entrada-provider",
        element: '[data-tour="inventory-create-provider"]',
        onMissing: "skip",
        title: "De quién lo compraste",
        description:
          "Si registras proveedores, elígelo y te rellenamos solo el costo que ese proveedor te cobra.",
      },
      {
        id: "entrada-price",
        element: "#entry-price",
        onMissing: "skip",
        title: "Cuánto te costó",
        description:
          "El costo de esta compra, en la moneda en que pagaste.",
      },
      {
        id: "entrada-quantity",
        element: "#new-stock",
        onMissing: "skip",
        title: "Cuánto entró",
        description:
          "Escribe lo que entra, no el total que quedará. Abajo te mostramos cuánto será el nuevo stock para que lo confirmes.",
      },
      {
        id: "entrada-as-expense",
        element: '[data-tour="inventory-create-as-expense"]',
        onMissing: "skip",
        title: "¿Fue una compra?",
        description:
          "Marca esta casilla y te creamos el gasto solo, por costo × cantidad. Si fue una devolución o un ajuste, déjala sin marcar.",
      },
    ],
  },
  {
    id: "seccion-inventario-historial",
    kind: "seccion",
    title: "Historial de inventario",
    description:
      "Filtrar movimientos, ver los lotes vivos y exportar el registro.",
    entryRoute: "/dashboard/business/inventory/history",
    feature: "inventoryHistory",
    steps: [
      {
        id: "historial-intro",
        route: "/dashboard/business/inventory/history",
        title: "Historial de inventario",
        description:
          "Esta pantalla es la trazabilidad de tu almacén: toda entrada, salida y ajuste con su fecha, su motivo y quién lo hizo. Es tu prueba cuando el stock no cuadra.",
      },
      {
        id: "historial-product",
        element: "#inventory-history-product",
        title: "Mira un producto solo",
        description:
          "Elige un producto y la lista se acota a él. Es la forma rápida de reconstruir qué pasó con ese artículo.",
      },
      {
        id: "historial-type",
        element: "#inventory-history-action-type",
        title: "Filtra por tipo",
        description:
          "¿Solo quieres ver las ventas? ¿Solo las entradas? Filtra por tipo de movimiento y por rango de fechas.",
      },
      {
        id: "historial-export",
        element: '[data-tour="inventory-history-export-btn"]',
        feature: "exports",
        align: "end",
        onMissing: "skip",
        title: "Llévatelo en un archivo",
        description:
          "Exporta el historial a CSV, Excel o PDF si necesitas presentárselo a alguien o guardarlo aparte.",
      },
    ],
  },

  // --- Trabajadores -------------------------------------------------------
  {
    id: "seccion-trabajadores",
    kind: "seccion",
    title: "Trabajadores",
    description: "Invitar al equipo, gestionar permisos y medir su desempeño.",
    entryRoute: "/dashboard/business/workers",
    steps: [
      {
        id: "trabajadores-intro",
        route: "/dashboard/business/workers",
        title: "Trabajadores",
        description:
          "Esta sección da acceso al negocio a quien te ayuda, y te deja decidir qué puede ver cada uno. Tiene tres pestañas: el equipo, las invitaciones y el desempeño.",
      },
      {
        id: "trabajadores-tabs",
        element: '[data-tour="workers-tab-workers"]',
        title: "Tu equipo",
        description:
          "Aquí ves a quién le has dado acceso y con qué permisos. Cada venta queda con el nombre de quien la registró.",
      },
      {
        id: "trabajadores-invitations",
        element: '[data-tour="workers-tab-invitations"]',
        title: "Invitaciones pendientes",
        description:
          "Cuando invitas a alguien, la invitación espera aquí hasta que la acepte. El número te dice cuántas están sin responder.",
      },
      {
        id: "trabajadores-metrics",
        element: '[data-tour="workers-tab-metrics"]',
        title: "Quién vende más",
        description:
          "El desempeño de cada trabajador en el período que elijas. Sirve para repartir turnos o reconocer a quien empuja.",
      },
    ],
  },

  // --- Proveedores --------------------------------------------------------
  {
    id: "seccion-proveedores",
    kind: "seccion",
    title: "Proveedores",
    description:
      "Fichar a quien te vende y enlazarlo con tus entradas de inventario.",
    entryRoute: "/dashboard/business/providers",
    steps: [
      {
        id: "proveedores-intro",
        route: "/dashboard/business/providers",
        title: "Proveedores",
        description:
          "Aquí fichas a quien te vende, con sus productos y sus precios. Sirve para saber quién te da mejor precio y para que al meter mercancía te rellenemos el costo solo.",
      },
      {
        id: "proveedores-create",
        element: '[data-tour="providers-create-btn"]',
        align: "end",
        title: "Crea el primero",
        description:
          "Con el nombre basta para empezar; el contacto y sus productos los completas después.",
      },
      {
        id: "proveedores-table",
        element: "#providers-table",
        onMissing: "skip",
        title: "Tus proveedores",
        description:
          "Toca uno para ver su ficha, sus datos de contacto y lo que te suministra.",
      },
    ],
  },

  // --- Flujo de caja ------------------------------------------------------
  {
    id: "seccion-flujo-caja",
    kind: "seccion",
    title: "Flujo de caja",
    description:
      "Tu caja moneda a moneda, el consolidado en CUP y el detalle de cada movimiento.",
    entryRoute: "/dashboard/business/currency-accounts",
    steps: [
      {
        id: "caja-intro",
        route: "/dashboard/business/currency-accounts",
        title: "Flujo de caja",
        description:
          "Esta pantalla responde a «¿cuánto dinero tengo?». No se registra nada aquí: los saldos se mueven solos con tus ventas y tus gastos.",
      },
      {
        id: "caja-tabs",
        element: '[data-tour="currency-accounts-tabs"]',
        title: "Tu caja, moneda por moneda",
        description:
          "Cada moneda tiene su propia cuenta. No hace falta que la crees: se abre sola con el primer movimiento que la use.",
      },
      {
        id: "caja-consolidado",
        element: '[data-tour="currency-accounts-tab-consolidated"]',
        title: "Todo junto en CUP",
        description:
          "«Consolidado» suma todas tus monedas convertidas a CUP con tus tasas. Es la cifra para responder cuánto tienes en total.",
      },
      {
        id: "caja-transacciones",
        element: '[data-tour="currency-accounts-tab-transactions"]',
        title: "De dónde salió cada peso",
        description:
          "En «Transacciones» ves el movimiento uno a uno: qué venta o qué gasto lo generó. Filtra por moneda si buscas algo concreto.",
      },
    ],
  },

  // --- Cierres ------------------------------------------------------------
  {
    id: "seccion-cierre-diario",
    kind: "seccion",
    title: "Cierre diario",
    description:
      "El cuadre del día: ventas, gastos, almacén y resultado, con exportación.",
    entryRoute: "/dashboard/accounting-close/daily",
    feature: "dailyClose",
    steps: [
      {
        id: "cierre-intro",
        route: "/dashboard/accounting-close/daily",
        title: "Cierre diario",
        description:
          "Esta pantalla es tu cuadre de caja: qué vendiste, qué gastaste y con cuánto te quedas, sin sacar cuentas a mano. Todo lo que ves se calcula solo con lo que registraste.",
      },
      {
        id: "cierre-date",
        element: '[data-tour="daily-close-date-filter"]',
        align: "end",
        title: "Mira otro día",
        description:
          "Por defecto muestra hoy. Cambia la fecha si quieres revisar un día pasado que se te quedó sin cuadrar.",
      },
      {
        id: "cierre-sold",
        element: '[data-tour="daily-close-sold-card"]',
        title: "Lo que vendiste",
        description:
          "Producto por producto, sin contar las ventas canceladas. Si buscas algo puntual, filtra por nombre.",
      },
      {
        id: "cierre-expenses",
        element: '[data-tour="daily-close-expenses-card"]',
        title: "Lo que gastaste",
        description:
          "Todos los gastos que anotaste ese día. Si aquí falta algo, tu ganancia se ve mejor de lo que fue.",
      },
      {
        id: "cierre-stock",
        element: '[data-tour="daily-close-stock-card"]',
        title: "Lo que queda en almacén",
        description:
          "El inventario que te sobra al cerrar, valorado al costo con el que entró y no al precio de venta.",
      },
      {
        id: "cierre-summary",
        element: '[data-tour="daily-close-summary"]',
        title: "Ganaste o perdiste",
        description:
          "El resumen final: ventas menos gastos, por moneda y también todo junto en la moneda que elijas.",
      },
      {
        id: "cierre-export",
        element: '[data-tour="daily-close-export-btn"]',
        feature: "exports",
        align: "end",
        title: "Llévatelo en Excel o PDF",
        description:
          "Descarga el cierre con el formato listo para contabilidad o para enseñárselo a alguien.",
      },
    ],
  },
  {
    id: "seccion-cierre-mensual",
    kind: "seccion",
    title: "Cierre mensual",
    description: "El consolidado del mes y cómo comparar un mes con otro.",
    entryRoute: "/dashboard/accounting-close/monthly",
    steps: [
      {
        id: "mensual-intro",
        route: "/dashboard/accounting-close/monthly",
        title: "Cierre mensual",
        description:
          "Lo mismo que el cierre diario pero para el mes completo. Es la foto que te dice si el negocio va bien, más allá de un día bueno o malo.",
      },
      {
        id: "mensual-month",
        element: '[data-tour="monthly-close-month-filter"]',
        align: "end",
        title: "Elige el mes",
        description:
          "Compara meses cambiando aquí. Ver un mes junto al anterior dice mucho más que verlo solo.",
      },
      {
        id: "mensual-summary",
        element: '[data-tour="monthly-close-summary"]',
        title: "El resultado del mes",
        description:
          "Ventas menos gastos del mes completo, por moneda y consolidado. Esta es la cifra que le enseñas a tu contador.",
      },
    ],
  },

  // --- Tipo de cambio -----------------------------------------------------
  {
    id: "seccion-tipo-cambio",
    kind: "seccion",
    title: "Tipo de cambio",
    description:
      "Agregar tus monedas, fijar su valor en CUP y entender el recargo por transferencia.",
    entryRoute: "/dashboard/exchange-rate",
    feature: "exchangeRates",
    steps: [
      {
        id: "tasa-intro",
        route: "/dashboard/exchange-rate",
        title: "Tipo de cambio",
        description:
          "Esta pantalla manda sobre todas las demás si cobras en más de una moneda: aquí dices cuánto vale cada una en CUP, y con eso convertimos ventas, gastos y cierres.",
      },
      {
        id: "tasa-add",
        element: '[data-tour="exchange-rate-add-currency-btn"]',
        align: "end",
        onMissing: "skip",
        title: "Agrega tus monedas",
        description:
          "Añade solo las que realmente usas. Las que agregues quedan disponibles para ventas, gastos y entradas de mercancía.",
      },
      {
        id: "tasa-values",
        element: '[data-tour="exchange-rate-currency-grid"]',
        onMissing: "skip",
        title: "Cuánto vale en CUP",
        description:
          "Escribe cuántos CUP te dan por 1 dólar (o 1 euro, o 1 MLC). Para la transferencia no va una tasa sino el porcentaje extra que te cuesta cobrar así.",
      },
      {
        id: "tasa-save",
        element: '[data-tour="exchange-rate-save-btn"]',
        title: "Guarda",
        description:
          "Nada se aplica hasta que guardas, y solo afecta a lo que registres a partir de ahora: las ventas ya guardadas no se recalculan.",
      },
    ],
  },

  // --- Negocio, avisos y cuenta -------------------------------------------
  {
    id: "seccion-negocio-detalles",
    kind: "seccion",
    title: "Datos del negocio",
    description:
      "Las pestañas de configuración: datos, horario, avisos y zona de riesgo.",
    entryRoute: "/dashboard/business/details",
    steps: [
      {
        id: "negocio-intro",
        route: "/dashboard/business/details",
        title: "Datos del negocio",
        description:
          "Esta es la configuración del negocio activo, repartida en cuatro pestañas. Lo que pongas aquí sale en tus documentos y decide qué avisos recibes.",
      },
      {
        id: "negocio-details",
        element: '[data-tour="business-details-tab-details"]',
        title: "Los datos",
        description:
          "Nombre, tipo, dirección y contacto. Vale la pena tenerlo correcto: es lo que aparece en tus documentos.",
      },
      {
        id: "negocio-schedule",
        element: '[data-tour="business-details-tab-schedule"]',
        title: "Cuándo abres",
        description:
          "Registra tu horario. Si aceptas domicilios, es lo que le dice al sistema cuándo puedes recibir pedidos.",
      },
      {
        id: "negocio-notifications",
        element: '[data-tour="business-details-tab-notifications"]',
        title: "Qué avisos quieres",
        description:
          "Elige qué te avisamos (cierre del día, stock bajo, producto agotado) y por dónde: correo, SMS o WhatsApp.",
      },
      {
        id: "negocio-danger",
        element: '[data-tour="business-details-tab-delete"]',
        title: "Zona delicada",
        description:
          "Aquí se archiva o elimina el negocio. No es un botón para tocar por curiosidad.",
      },
    ],
  },
  {
    id: "seccion-negocio-crear",
    kind: "seccion",
    title: "Crear un negocio",
    description: "Los dos pasos del alta: datos y ubicación.",
    entryRoute: "/dashboard/business/create",
    steps: [
      {
        id: "crear-negocio-intro",
        route: "/dashboard/business/create",
        title: "Crear un negocio",
        description:
          "Son dos pasos: primero los datos, después la ubicación en el mapa. Cada negocio lleva su propio inventario, sus ventas y su caja, y podrás cambiarlo todo más adelante.",
      },
      {
        id: "crear-negocio-name",
        element: "#name",
        onMissing: "skip",
        title: "Cómo se llama",
        description:
          "El nombre con el que lo conoce tu gente. Aparecerá en el selector de arriba y en tus reportes.",
      },
      {
        id: "crear-negocio-place",
        element: "#province",
        onMissing: "skip",
        title: "Dónde está",
        description:
          "Provincia y municipio nos sirven para el mapa y para tus documentos. Al continuar marcas el punto exacto.",
      },
    ],
  },
  {
    id: "seccion-notificaciones",
    kind: "seccion",
    title: "Notificaciones",
    description: "Las dos bandejas de avisos y cómo dejarlas en cero.",
    entryRoute: "/dashboard/notifications",
    steps: [
      {
        id: "notificaciones-intro",
        route: "/dashboard/notifications",
        title: "Notificaciones",
        description:
          "Aquí queda el historial completo de todo lo que te avisamos: stock bajo, productos agotados, cambios de precio y respuestas de soporte. Es la versión completa de la campana.",
      },
      {
        id: "notificaciones-tabs",
        element: '[data-tour="notifications-tabs"]',
        title: "Dos bandejas",
        description:
          "«Generales» son los avisos del negocio que tengas seleccionado arriba. «Soporte» son las respuestas a tus tickets, y no dependen del negocio.",
      },
      {
        id: "notificaciones-mark",
        element: '[data-tour="notifications-mark-all-btn"]',
        align: "end",
        title: "Limpia la bandeja",
        description:
          "Marca todas como leídas para dejar la campana en cero y no perder de vista lo nuevo.",
      },
    ],
  },
  {
    id: "seccion-perfil",
    kind: "seccion",
    title: "Perfil y plan",
    description: "Tus datos, qué incluye tu plan y hasta cuándo te dura.",
    entryRoute: "/dashboard/profile",
    steps: [
      {
        id: "perfil-intro",
        route: "/dashboard/profile",
        title: "Perfil y plan",
        description:
          "Esta pantalla es tu cuenta, no tu negocio: tus datos personales y el plan que tienes contratado, con lo que incluye y hasta cuándo te dura.",
      },
      {
        id: "perfil-user",
        element: '[data-tour="profile-user-card"]',
        title: "Tus datos",
        description:
          "Nombre, correo y teléfono. El teléfono importa: es a donde te llegan los avisos por SMS.",
      },
      {
        id: "perfil-plan",
        element: '[data-tour="profile-plan-card"]',
        title: "Tu plan",
        description:
          "Qué plan tienes, cuándo vence y cuántos productos y negocios te permite.",
      },
      {
        id: "perfil-change",
        element: '[data-tour="profile-plan-change-btn"]',
        onMissing: "skip",
        title: "Si te quedaste corto",
        description:
          "Si necesitas más negocios, más productos o funciones como el cierre mensual, desde aquí cambias de plan.",
      },
    ],
  },
  {
    id: "seccion-planes",
    kind: "seccion",
    title: "Cambiar de plan",
    description: "Comparar planes, ver mensual frente a anual y cómo se gestiona.",
    entryRoute: "/dashboard/profile/plans-change",
    steps: [
      {
        id: "planes-intro",
        route: "/dashboard/profile/plans-change",
        title: "Cambiar de plan",
        description:
          "Esta pantalla es la vitrina de planes: sirve para comparar qué incluye cada uno. El cambio no se hace aquí, lo gestionamos nosotros contigo.",
      },
      {
        id: "planes-grid",
        element: '[data-tour="plans-change-grid"]',
        title: "Compara los planes",
        description:
          "Cada columna te dice qué incluye. La marcada es la que tienes hoy.",
      },
      {
        id: "planes-billing",
        element: '[data-tour="plans-change-billing-tabs"]',
        title: "Mensual o anual",
        description:
          "Pagando el año completo el mes te sale más barato. Cambia la pestaña para ver los dos precios.",
      },
      {
        id: "planes-contact",
        element: '[data-tour="plans-change-contact-card"]',
        onMissing: "skip",
        title: "El cambio lo hacemos nosotros",
        description:
          "No hay botón de pago: escríbenos por WhatsApp y te gestionamos el cambio.",
      },
    ],
  },

  // --- Soporte ------------------------------------------------------------
  {
    id: "seccion-soporte",
    kind: "seccion",
    title: "Soporte",
    description: "Abrir un ticket y seguir su estado.",
    entryRoute: "/dashboard/support",
    steps: [
      {
        id: "soporte-intro",
        route: "/dashboard/support",
        title: "Soporte",
        description:
          "Desde aquí nos escribes cuando algo no funciona o no se entiende, y sigues la conversación hasta que se resuelve.",
      },
      {
        id: "soporte-create",
        element: '[data-tour="support-create-ticket-btn"]',
        align: "end",
        title: "¿Algo no cuadra?",
        description:
          "Abre un ticket y te respondemos. Cuenta qué hiciste y qué esperabas que pasara; con eso lo resolvemos mucho más rápido.",
      },
      {
        id: "soporte-table",
        element: "#my-tickets-table",
        onMissing: "center",
        title: "Sigue tus tickets",
        description:
          "Aquí ves el estado de cada uno. Cuando respondamos te llega un aviso en la campana.",
      },
    ],
  },
];
