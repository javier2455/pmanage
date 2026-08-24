/**
 * Guías de "cómo hago X". A diferencia de las de sección, estas siguen un flujo
 * y pueden cruzar rutas: son las dudas concretas que aparecieron en las pruebas
 * con usuarios (el stock que no cuadra, la tasa del dólar, el recargo por
 * transferencia...).
 *
 * Mismas dos convenciones que las guías de sección: el array va en el orden del
 * menú lateral según la pantalla donde arrancan, y cada guía abre con un paso
 * sin ancla que sitúa la vista y anuncia a dónde vamos.
 */

import type { TourDefinition } from "@/lib/tour/types";

export const FLOW_TOURS: TourDefinition[] = [
  // --- Productos ----------------------------------------------------------
  {
    id: "flujo-importar-productos",
    kind: "funcionalidad",
    title: "Importar productos desde Excel",
    description: "Sube tu lista de una vez en lugar de teclear uno por uno.",
    entryRoute: "/dashboard/business/products/import",
    steps: [
      {
        id: "importar-flujo-intro",
        route: "/dashboard/business/products/import",
        title: "Importar desde Excel",
        description:
          "Esta pantalla carga muchos productos de golpe. Vamos a recorrer los cuatro pasos: plantilla, subida, revisión y guardado. Nada se guarda hasta el final.",
      },
      {
        id: "importar-flujo-template",
        element: '[data-tour="products-import-template-btn"]',
        title: "Descarga la plantilla",
        description:
          "No inventes las columnas: usa el archivo que te damos y rellénalo en Excel.",
      },
      {
        id: "importar-flujo-upload",
        element: '[data-tour="products-import-upload-btn"]',
        title: "Súbela llena",
        description: "Excel o CSV, hasta 500 filas por vez.",
      },
      {
        id: "importar-flujo-target",
        element: '[data-tour="products-import-target"]',
        onMissing: "skip",
        title: "¿Solo fichar o ya vender?",
        description:
          "«Catálogo + a la venta» es lo que quieres si ya tienes precios y stock. Si no, déjalos solo en el catálogo.",
      },
      {
        id: "importar-flujo-grid",
        element: '[data-tour="products-import-grid"]',
        onMissing: "skip",
        title: "Arregla lo rojo aquí mismo",
        description:
          "Las celdas con problema se corrigen en pantalla. No hace falta volver al Excel.",
      },
      {
        id: "importar-flujo-expense",
        element: '[data-tour="products-import-as-expense"]',
        onMissing: "skip",
        title: "¿Es tu inventario inicial?",
        description:
          "Marca esto y te creamos el gasto de la compra por costo × cantidad.",
      },
      {
        id: "importar-flujo-continue",
        element: '[data-tour="products-import-continue-btn"]',
        onMissing: "skip",
        title: "Revisa antes de guardar",
        description:
          "«Continuar» solo hace una revisión y te enseña qué va a pasar. Recién al confirmar se guarda.",
      },
    ],
  },

  // --- Ventas -------------------------------------------------------------
  {
    id: "flujo-primera-venta",
    kind: "funcionalidad",
    title: "Registrar mi primera venta",
    description: "Del botón al cobro, con el stock descontándose solo.",
    entryRoute: "/dashboard/business/sales",
    feature: "sales",
    steps: [
      {
        id: "primera-venta-intro",
        route: "/dashboard/business/sales",
        title: "Tu primera venta",
        description:
          "Estamos en la lista de ventas: aquí queda registrado todo lo que vendes. Vamos a entrar al mostrador y hacer una venta de principio a fin.",
      },
      {
        id: "primera-venta-btn",
        element: '[data-tour="sales-create-btn"]',
        align: "end",
        title: "Empieza aquí",
        description:
          "Este es el botón que usarás cien veces al día. Vamos a abrirlo.",
      },
      {
        id: "primera-venta-search",
        route: "/dashboard/business/sales/create",
        element: '[data-tour="sales-create-search"]',
        title: "Busca el producto",
        description:
          "Escribe las primeras letras. Si no aparece, es que aún no lo pusiste a la venta en este negocio.",
      },
      {
        id: "primera-venta-grid",
        element: '[data-tour="sales-create-grid"]',
        onMissing: "center",
        title: "Tócalo para agregarlo",
        description:
          "Cada toque suma uno. Si el producto se vende por peso, te pedimos la cantidad exacta.",
      },
      {
        id: "primera-venta-cart",
        element: '[data-tour="sales-cart-panel"]',
        onMissing: "skip",
        title: "Revisa el carrito",
        description:
          "Cambia cantidades o quita líneas antes de cerrar. El total se recalcula solo.",
      },
      {
        id: "primera-venta-currency",
        element: '[data-tour="sales-cart-currency"]',
        onMissing: "skip",
        title: "En qué moneda cobras",
        description:
          "Convertimos con tu tasa. Si el cliente paga en dólares, dilo aquí y el total se ajusta solo.",
      },
      {
        id: "primera-venta-submit",
        element: '[data-tour="sales-cart-submit-pay"]',
        onMissing: "skip",
        title: "Registra y cobra",
        description:
          "Guarda la venta, descuenta el stock y abre el cobro. Debajo tienes «Registrar venta» a secas, por si la cobras más tarde: queda como pendiente de pago.",
      },
      {
        id: "primera-venta-excedente",
        title: "Si te paga de más",
        description:
          "En el cobro puedes juntar varias monedas, y si el cliente entrega de más te preguntamos qué hiciste con lo que sobró: devolverlo como vuelto —en la moneda que tengas en caja— o quedártelo como propina. Lo que no devuelves entra a la caja, pero no cuenta como venta.",
      },
    ],
  },

  // --- Gastos -------------------------------------------------------------
  {
    id: "flujo-compra-como-gasto",
    kind: "funcionalidad",
    title: "Anotar una compra de mercancía como gasto",
    description: "Meter stock y registrar el gasto en un solo paso.",
    entryRoute: "/dashboard/business/inventory/create",
    feature: "expenses",
    steps: [
      {
        id: "compra-intro",
        route: "/dashboard/business/inventory/create",
        title: "Una compra, dos efectos",
        description:
          "Cuando compras mercancía pasan dos cosas: entra stock y sale dinero. Esta pantalla puede registrar las dos a la vez, sin que tengas que ir a Gastos por separado.",
      },
      {
        id: "compra-product",
        element: '[data-tour="inventory-create-product"]',
        title: "Elige lo que compraste",
        description: "Empieza por el producto al que le llegó mercancía.",
      },
      {
        id: "compra-price",
        element: "#entry-price",
        onMissing: "skip",
        title: "Cuánto te costó",
        description:
          "El costo de esta compra concreta, no el precio al que lo vendes.",
      },
      {
        id: "compra-currency",
        element: '[data-tour="inventory-create-currency"]',
        onMissing: "skip",
        title: "En qué moneda pagaste",
        description:
          "Si fue en dólares, dilo: lo pasamos a CUP con tu tasa para que la contabilidad cuadre.",
      },
      {
        id: "compra-as-expense",
        element: '[data-tour="inventory-create-as-expense"]',
        onMissing: "skip",
        title: "Marca la casilla",
        description:
          "Aquí está la clave: te creamos el gasto solo, por costo × cantidad, en «Reposición de stock».",
      },
      {
        id: "compra-expenses",
        route: "/dashboard/business/expenses",
        element: "#expenses-table",
        title: "Ahí está",
        description:
          "El gasto ya aparece en tu lista y ya resta en el cierre del día. No tuviste que anotarlo dos veces.",
      },
    ],
  },

  // --- Inventario ---------------------------------------------------------
  {
    id: "flujo-stock-descuadrado",
    kind: "funcionalidad",
    title: "Entender por qué mi stock no cuadra",
    description: "Dónde mirar cuando el número no coincide con lo que hay.",
    entryRoute: "/dashboard/business/inventory",
    feature: "inventoryHistory",
    steps: [
      {
        id: "descuadre-intro",
        route: "/dashboard/business/inventory",
        title: "Cuando el stock no cuadra",
        description:
          "El inventario nunca se mueve solo: cada cambio queda registrado. Vamos a seguir el rastro para encontrar dónde está la diferencia.",
      },
      {
        id: "descuadre-table",
        element: "#current-inventory-table",
        title: "Compara con lo físico",
        description:
          "Busca el producto y anota la diferencia entre lo que dice aquí y lo que hay en el almacén.",
      },
      {
        id: "descuadre-history-btn",
        element: '[data-tour="inventory-more-options-btn"]',
        align: "end",
        title: "Ve al historial",
        description:
          "Ábrelo y entra en el historial: ahí está cada movimiento con su motivo y su responsable.",
      },
      {
        id: "descuadre-product",
        route: "/dashboard/business/inventory/history",
        element: "#inventory-history-product",
        title: "Acota a ese producto",
        description:
          "Filtra por el producto para reconstruir su historia sin el ruido de los demás.",
      },
      {
        id: "descuadre-type",
        element: "#inventory-history-action-type",
        title: "¿Ventas o entradas?",
        description:
          "Filtra por tipo de movimiento para encontrar el que no cuadra. Cada línea trae fecha, motivo y quién lo hizo.",
      },
      {
        id: "descuadre-sales",
        route: "/dashboard/business/sales",
        element: "#sales-table",
        title: "Revisa las canceladas",
        description:
          "Una venta cancelada devuelve el stock: es la causa más común del descuadre. Búscala tachada en la lista.",
      },
    ],
  },
  {
    id: "flujo-alertas-stock",
    kind: "funcionalidad",
    title: "Que me avisen antes de quedarme sin nada",
    description: "Poner un límite por producto y elegir por dónde te avisamos.",
    entryRoute: "/dashboard/business/inventory",
    feature: "stockAlerts",
    steps: [
      {
        id: "alertas-intro",
        route: "/dashboard/business/inventory",
        title: "Avisos de stock bajo",
        description:
          "Configurar esto son dos cosas en dos pantallas: el límite de cada producto se pone aquí, y el canal por el que te avisamos, en los datos del negocio.",
      },
      {
        id: "alertas-table",
        element: "#current-inventory-table",
        title: "Pon el límite por producto",
        description:
          "En la columna de alertas dices cuántas unidades quieres que queden para avisarte. Piensa en cuánto tardas en reponer: ese es tu límite.",
      },
      {
        id: "alertas-banner",
        element: '[data-tour="inventory-low-stock-banner"]',
        onMissing: "skip",
        title: "Así se ve el aviso",
        description:
          "Este cartel te salta al entrar cuando algún producto llegó a su límite o se agotó.",
      },
      {
        id: "alertas-channels",
        route: "/dashboard/business/details",
        element: '[data-tour="business-details-tab-notifications"]',
        title: "Y por dónde te aviso",
        description:
          "En la pestaña de notificaciones eliges el canal: correo, SMS o WhatsApp, según lo que incluya tu plan.",
      },
    ],
  },

  // --- Trabajadores -------------------------------------------------------
  {
    id: "flujo-invitar-trabajador",
    kind: "funcionalidad",
    title: "Invitar a un trabajador",
    description: "Dar acceso a alguien y seguir la invitación hasta que la acepte.",
    entryRoute: "/dashboard/business/workers",
    steps: [
      {
        id: "invitar-intro",
        route: "/dashboard/business/workers",
        title: "Invitar a alguien",
        description:
          "Dar acceso a un trabajador es enviarle una invitación por correo. Hasta que la acepte queda pendiente, y una vez dentro cada venta suya queda con su nombre.",
      },
      {
        id: "invitar-tab",
        element: '[data-tour="workers-tab-workers"]',
        title: "Tu equipo",
        description:
          "Aquí ves a quién le has dado acceso y con qué permisos. Desde la tabla creas uno nuevo.",
      },
      {
        id: "invitar-table",
        element: "#workers-table",
        onMissing: "skip",
        title: "Con nombre y correo basta",
        description:
          "Le llega la invitación y elige su propia contraseña. Tú decides qué secciones puede ver.",
      },
      {
        id: "invitar-pending",
        element: '[data-tour="workers-tab-invitations"]',
        title: "Esperando respuesta",
        description:
          "Hasta que la acepte, la invitación vive aquí. El número te dice cuántas están pendientes.",
      },
      {
        id: "invitar-metrics",
        element: '[data-tour="workers-tab-metrics"]',
        title: "Quién vende más",
        description:
          "Cada venta queda con el nombre de quien la registró. Aquí lo ves por período.",
      },
    ],
  },

  // --- Cierre diario ------------------------------------------------------
  {
    id: "flujo-cerrar-el-dia",
    kind: "funcionalidad",
    title: "Cerrar el día",
    description: "Los cinco minutos que hacen que todo lo demás sirva.",
    entryRoute: "/dashboard/accounting-close/daily",
    feature: "dailyClose",
    steps: [
      {
        id: "cerrar-dia-intro",
        route: "/dashboard/accounting-close/daily",
        title: "Cerrar el día",
        description:
          "El cierre no hay que «hacerlo»: se calcula solo con lo que registraste. Lo que sí hay que hacer es revisarlo, y esta guía te dice qué mirar y en qué orden.",
      },
      {
        id: "cerrar-dia-sold",
        element: '[data-tour="daily-close-sold-card"]',
        title: "¿Está todo lo que vendiste?",
        description: "Repasa la lista. Si falta una venta, regístrala ahora.",
      },
      {
        id: "cerrar-dia-expenses",
        element: '[data-tour="daily-close-expenses-card"]',
        title: "¿Está todo lo que gastaste?",
        description:
          "Aquí es donde se pierden las cuentas de la mayoría: el gasto pequeño que no se anotó.",
      },
      {
        id: "cerrar-dia-stock",
        element: '[data-tour="daily-close-stock-card"]',
        title: "Cuánto queda en almacén",
        description:
          "Valorado a lo que te costó, no a lo que vale vendido. Es tu dinero parado en mercancía.",
      },
      {
        id: "cerrar-dia-summary",
        element: '[data-tour="daily-close-summary"]',
        title: "El resultado",
        description:
          "Si el número te sorprende, casi siempre es que falta un gasto por anotar.",
      },
      {
        id: "cerrar-dia-export",
        element: '[data-tour="daily-close-export-btn"]',
        feature: "exports",
        align: "end",
        title: "Guárdalo",
        description: "En Excel o PDF, listo para contabilidad.",
      },
    ],
  },

  // --- Tipo de cambio -----------------------------------------------------
  {
    id: "flujo-tasa-dolar",
    kind: "funcionalidad",
    title: "Cambiar la tasa del dólar",
    description: "Actualizar tus tasas cuando cambia la calle.",
    entryRoute: "/dashboard/exchange-rate",
    feature: "exchangeRates",
    steps: [
      {
        id: "tasa-dolar-intro",
        route: "/dashboard/exchange-rate",
        title: "Actualizar una tasa",
        description:
          "Esta pantalla decide a cuánto se convierte cada moneda. Cambiar una tasa es escribir el número nuevo y guardar, pero hay un detalle importante que verás al final.",
      },
      {
        id: "tasa-dolar-cards",
        element: '[data-tour="exchange-rate-cards"]',
        onMissing: "skip",
        title: "Tus tasas de hoy",
        description: "Esto es lo que está vigente ahora mismo.",
      },
      {
        id: "tasa-dolar-grid",
        element: '[data-tour="exchange-rate-currency-grid"]',
        onMissing: "center",
        title: "Cambia el número",
        description:
          "Escribe cuántos CUP te dan hoy por 1 dólar. Hazlo el mismo día que cambie o tus cierres saldrán mal.",
      },
      {
        id: "tasa-dolar-add",
        element: '[data-tour="exchange-rate-add-currency-btn"]',
        align: "end",
        onMissing: "skip",
        title: "¿Falta una moneda?",
        description:
          "Agrégala y quedará disponible en ventas, gastos y entradas de mercancía.",
      },
      {
        id: "tasa-dolar-save",
        element: '[data-tour="exchange-rate-save-btn"]',
        title: "Guarda",
        description:
          "El detalle importante: afecta a lo que registres a partir de ahora. Las ventas ya guardadas no se recalculan, conservan la tasa que tenían.",
      },
    ],
  },
  {
    id: "flujo-recargo-transferencia",
    kind: "funcionalidad",
    title: "Cobrar por transferencia sin perder dinero",
    description:
      "El recargo por transferencia no es una tasa: es un porcentaje extra.",
    entryRoute: "/dashboard/exchange-rate",
    feature: "exchangeRates",
    steps: [
      {
        id: "transferencia-intro",
        route: "/dashboard/exchange-rate",
        title: "El recargo por transferencia",
        description:
          "La transferencia se configura en esta pantalla junto a las monedas, pero funciona distinto a todas las demás. Esta guía explica por qué.",
      },
      {
        id: "transferencia-grid",
        element: '[data-tour="exchange-rate-currency-grid"]',
        onMissing: "center",
        title: "Aquí no va una tasa",
        description:
          "En la transferencia va el porcentaje extra que te cuesta cobrar así. Si pones 12, cobrar por transferencia sale un 12 % más caro.",
      },
      {
        id: "transferencia-save",
        element: '[data-tour="exchange-rate-save-btn"]',
        title: "Guarda",
        description:
          "A partir de aquí la transferencia aparece como forma de cobro al registrar una venta.",
      },
      {
        id: "transferencia-sale",
        route: "/dashboard/business/sales/create",
        element: '[data-tour="sales-cart-currency"]',
        onMissing: "skip",
        title: "Elígela al cobrar",
        description:
          "El total sube solo con el recargo que fijaste. Ya no tienes que sacar la cuenta a mano.",
      },
    ],
  },

  // --- Transversal --------------------------------------------------------
  {
    id: "flujo-varios-negocios",
    kind: "funcionalidad",
    title: "Trabajar con más de un negocio",
    description: "Cambiar de negocio, copiar el catálogo y ver los gastos de todos.",
    entryRoute: "/dashboard",
    steps: [
      {
        id: "negocios-intro",
        route: "/dashboard",
        title: "Varios negocios a la vez",
        description:
          "Cada negocio lleva su propio inventario, sus ventas y su caja, completamente separados. Lo único que se comparte es el catálogo de productos y tu cuenta.",
      },
      {
        id: "negocios-switcher",
        element: '[data-tour="business-switcher"]',
        title: "Aquí eliges",
        description:
          "Todo lo que ves —stock, ventas, caja— es del negocio seleccionado. Cámbialo antes de registrar nada.",
      },
      {
        id: "negocios-copy",
        route: "/dashboard/business/products/import",
        element: '[data-tour="products-import-copy-btn"]',
        onMissing: "skip",
        title: "Copia el catálogo",
        description:
          "Trae los productos del otro negocio en un clic. El stock viene en 0 a propósito: cada almacén es independiente.",
      },
      {
        id: "negocios-expenses",
        route: "/dashboard/business/expenses",
        element: '[data-tour="expenses-all-businesses-switch"]',
        onMissing: "skip",
        title: "Míralo todo junto",
        description:
          "Activa esto para ver los gastos de todos tus negocios en una sola lista.",
      },
    ],
  },
];
