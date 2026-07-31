/**
 * Recorrido completo por el sistema.
 *
 * El orden sigue el del menú lateral (Categorías, Productos, Ventas, Gastos,
 * Inventario, Trabajadores, Proveedores, Flujo de caja, cierres, Tipo de cambio
 * y Soporte), para que el usuario reconozca dónde está en todo momento. El
 * Panel abre el recorrido y Notificaciones y Perfil lo cierran.
 *
 * Cada vista arranca con un paso sin ancla —popover centrado— que explica para
 * qué sirve la pantalla; solo después se entra en los detalles. Como el orden
 * es el del menú y no el del flujo de trabajo, algunos pasos hacen de puente
 * hacia lo que viene después (en Ventas se avisa de que el stock se carga en
 * Inventario, y de que las monedas se configuran en Tipo de cambio).
 *
 * Los pasos de rutas Pro no declaran `feature`: el filtro lo deriva de
 * `PRO_ROUTES`, así que un plan sin la capacidad simplemente no los ve.
 */

import type { TourDefinition } from "@/lib/tour/types";

export const FULL_TOUR: TourDefinition = {
  id: "completo",
  kind: "completo",
  title: "Recorrido completo",
  description:
    "De cero a cerrar tu primer día: qué es cada sección y en qué orden usarlas.",
  entryRoute: "/dashboard",
  steps: [
    // --- Panel: entender el mapa ------------------------------------------
    {
      id: "full-welcome",
      route: "/dashboard",
      title: "Bienvenido a Negora",
      description:
        "Ya tienes tu negocio creado. En unos minutos te enseñamos qué hace cada pantalla y por dónde empezar. Puedes salir cuando quieras.",
    },
    {
      id: "full-sidebar",
      element: '[data-sidebar="content"]',
      needsSidebar: true,
      side: "right",
      title: "Este es tu menú",
      description:
        "Desde aquí llegas a todo. Vamos a recorrerlo en el mismo orden en que aparece, para que después sepas encontrar cada cosa. Lo que veas en gris pertenece a un plan superior.",
    },
    {
      id: "full-business-switcher",
      element: '[data-tour="business-switcher"]',
      title: "Tu negocio activo",
      description:
        "Todo lo que veas —stock, ventas, caja— es del negocio seleccionado aquí. Si manejas varios, cámbialo antes de registrar nada.",
    },
    {
      id: "full-notifications-bell",
      element: '[aria-label^="Notificaciones"]',
      align: "end",
      title: "Aquí te avisamos",
      description:
        "Cuando un producto se esté agotando o respondan tu ticket de soporte, el número rojo te lo dice.",
    },
    {
      id: "full-dashboard-stats",
      element: '[data-tour="dashboard-stats-grid"]',
      title: "Tu día de un vistazo",
      description:
        "Lo que vendiste, lo que gastaste y lo que tienes en caja hoy. Ahora mismo está en cero: vamos a cambiar eso.",
    },

    // --- Categorías --------------------------------------------------------
    {
      id: "full-categories-intro",
      route: "/dashboard/business/categories",
      title: "Categorías",
      description:
        "Esta pantalla es donde creas tus etiquetas: las que agrupan lo que vendes y las que agrupan en qué gastas. Es lo primero que conviene tener, porque productos y gastos se apoyan en ellas.",
    },
    {
      id: "full-categories-products",
      element: '[data-tour="categories-card-products"]',
      title: "Agrupa lo que vendes",
      description:
        "«Bebidas», «Aseo», «Comida»… con dos o tres empiezas. Después podrás ver qué familia de productos te deja más.",
    },
    {
      id: "full-categories-expenses",
      element: '[data-tour="categories-card-expenses"]',
      title: "Y en qué gastas",
      description:
        "«Alquiler», «Transporte», «Mercancía». Esto es lo que después responde la pregunta «¿en qué se me va el dinero?».",
    },

    // --- Productos ---------------------------------------------------------
    {
      id: "full-products-intro",
      route: "/dashboard/business/products",
      title: "Productos",
      description:
        "Aquí defines qué vendes. La pantalla tiene dos listas y entender la diferencia es la clave de todo lo demás: el catálogo general, y los productos que tú vendes con tu precio.",
    },
    {
      id: "full-products-catalog",
      element: '[data-tour="products-catalog-section"]',
      title: "El catálogo del almacén",
      description:
        "Arriba está el fichero de todos los productos que existen. Todavía no son tuyos ni tienen precio: son solo fichas.",
    },
    {
      id: "full-products-create",
      element: '[data-tour="products-create-btn"]',
      align: "end",
      title: "Crea un producto",
      description:
        "Nombre, unidad de medida (kg, litros, unidades) y foto. Es la ficha del producto, no su precio.",
    },
    {
      id: "full-products-import",
      element: '[data-tour="products-import-btn"]',
      align: "end",
      title: "¿Ya tienes la lista?",
      description:
        "Si la llevas en Excel, súbela de una vez en lugar de teclear producto por producto.",
    },
    {
      id: "full-products-assign",
      element: '[data-tour="products-assign-btn"]',
      align: "end",
      title: "Ponlo a la venta",
      description:
        "Este es el paso que la gente se salta: eliges un producto del catálogo y le pones tu precio y tu stock. Sin esto no aparece en el mostrador.",
    },
    {
      id: "full-products-onsale",
      element: '[data-tour="products-onsale-section"]',
      title: "Lo que vendes tú",
      description:
        "Esta lista de abajo es la que importa: son los productos que verás al registrar una venta.",
    },

    // --- Ventas ------------------------------------------------------------
    {
      id: "full-sales-intro",
      route: "/dashboard/business/sales",
      title: "Ventas",
      description:
        "Esta pantalla es el registro de todo lo que vendes. Cada venta que anotes descuenta el stock sola y alimenta el cierre del día: es el corazón del sistema.",
    },
    {
      id: "full-sales-create-btn",
      element: '[data-tour="sales-create-btn"]',
      align: "end",
      title: "Registrar una venta",
      description:
        "Este es el botón que más vas a usar. Vamos a abrirlo para que veas el mostrador por dentro.",
    },
    {
      id: "full-sales-grid",
      route: "/dashboard/business/sales/create",
      element: '[data-tour="sales-create-grid"]',
      onMissing: "center",
      title: "El mostrador",
      description:
        "Toca los productos para armar la venta. No te deja pasar del stock que tienes; ese stock se carga desde Inventario, que veremos en un momento.",
    },
    {
      id: "full-sales-cart",
      element: '[data-tour="sales-cart-panel"]',
      onMissing: "skip",
      title: "El carrito",
      description:
        "Al agregar el primer producto aparece aquí: ajustas cantidades, eliges si es en tienda o a domicilio y en qué moneda cobras. Las monedas se configuran en Tipo de cambio, al final del recorrido.",
    },

    // --- Gastos ------------------------------------------------------------
    {
      id: "full-expenses-intro",
      route: "/dashboard/business/expenses",
      title: "Gastos",
      description:
        "Aquí anotas todo lo que sale: alquiler, luz, transporte, mercancía. Es la otra mitad de la cuenta, y sin ella el sistema te dirá que ganas más de lo que ganas.",
    },
    {
      id: "full-expenses-create",
      element: '[data-tour="expenses-create-btn"]',
      align: "end",
      title: "Anota un gasto",
      description:
        "Monto, moneda, una descripción y la categoría que creaste al principio.",
    },
    {
      id: "full-expenses-table",
      element: "#expenses-table",
      title: "Tu historial de gastos",
      description:
        "Toca una fila para ver el detalle. Clasificados por categoría es como sabrás dónde puedes recortar.",
    },

    // --- Inventario --------------------------------------------------------
    {
      id: "full-inventory-intro",
      route: "/dashboard/business/inventory",
      title: "Inventario",
      description:
        "Esta pantalla te dice cuánta mercancía te queda de verdad. No hay que tocarla a mano: baja sola con cada venta y sube cuando registras una entrada.",
    },
    {
      id: "full-inventory-stock",
      element: "#current-inventory-table",
      title: "Lo que te queda",
      description:
        "Esta es tu existencia real, producto por producto. Es el número que limita lo que puedes vender en el mostrador.",
    },
    {
      id: "full-inventory-entry",
      element: '[data-tour="inventory-add-entry-btn"]',
      align: "end",
      title: "Meter mercancía",
      description:
        "Cuando te llegue una compra, entra por aquí: producto, cantidad y a qué costo. Nunca cambies el número a mano.",
    },
    {
      id: "full-inventory-history",
      element: '[data-tour="inventory-history-btn"]',
      align: "end",
      title: "Si algo no cuadra",
      description:
        "Aquí está cada entrada, salida y ajuste con su fecha y su responsable. Es el primer sitio donde mirar.",
    },

    // --- Trabajadores (según el plan) --------------------------------------
    {
      id: "full-workers-intro",
      route: "/dashboard/business/workers",
      title: "Trabajadores",
      description:
        "Esta sección es para dar acceso a quien te ayuda en el negocio, decidir qué puede ver cada uno y medir cuánto vende.",
    },
    {
      id: "full-workers-tabs",
      element: '[data-tour="workers-tabs"]',
      title: "Equipo, invitaciones y desempeño",
      description:
        "Invitas desde la primera pestaña, sigues las invitaciones sin responder en la segunda y ves quién vende más en la tercera.",
    },

    // --- Proveedores (según el plan) ---------------------------------------
    {
      id: "full-providers-intro",
      route: "/dashboard/business/providers",
      title: "Proveedores",
      description:
        "Aquí fichas a quien te vende. Sirve para dos cosas: saber siempre quién te da mejor precio, y que al meter mercancía te rellenemos el costo solo.",
    },
    {
      id: "full-providers-create",
      element: '[data-tour="providers-create-btn"]',
      align: "end",
      title: "Crea el primero",
      description:
        "Con el nombre basta para empezar; el contacto y sus productos los completas después.",
    },

    // --- Flujo de caja -----------------------------------------------------
    {
      id: "full-cash-intro",
      route: "/dashboard/business/currency-accounts",
      title: "Flujo de caja",
      description:
        "Esta pantalla responde a «¿cuánto dinero tengo?». Cada moneda lleva su propio saldo y se actualiza sola con tus ventas y tus gastos.",
    },
    {
      id: "full-cash-tabs",
      element: '[data-tour="currency-accounts-tabs"]',
      title: "Por moneda y todo junto",
      description:
        "La cuenta de cada moneda se abre sola con el primer movimiento. En «Consolidado» las ves todas sumadas en CUP, y en «Transacciones», de dónde salió cada peso.",
    },

    // --- Cierre diario -----------------------------------------------------
    {
      id: "full-daily-close-intro",
      route: "/dashboard/accounting-close/daily",
      title: "Cierre diario",
      description:
        "Esta pantalla es tu cuadre de caja. Ábrela cada noche: es el hábito que hace que todo lo anterior valga la pena, y te dice en un minuto si el día fue bueno.",
    },
    {
      id: "full-daily-close-sold",
      element: '[data-tour="daily-close-sold-card"]',
      title: "Lo que vendiste",
      description: "Producto por producto, sin contar las ventas canceladas.",
    },
    {
      id: "full-daily-close-expenses",
      element: '[data-tour="daily-close-expenses-card"]',
      title: "Lo que gastaste",
      description:
        "Los gastos que anotaste ese día. Si aquí falta algo, tu ganancia se ve mejor de lo que fue.",
    },
    {
      id: "full-daily-close-summary",
      element: '[data-tour="daily-close-summary"]',
      title: "Ganaste o perdiste",
      description:
        "La cifra final: ventas menos gastos, por moneda y todo junto en CUP. Si te sorprende, casi siempre falta un gasto.",
    },
    {
      id: "full-daily-close-export",
      element: '[data-tour="daily-close-export-btn"]',
      feature: "exports",
      align: "end",
      title: "Llévatelo aparte",
      description:
        "Descárgalo en Excel o PDF si necesitas guardarlo o entregárselo a alguien.",
    },

    // --- Cierre mensual (según el plan) ------------------------------------
    {
      id: "full-monthly-close-intro",
      route: "/dashboard/accounting-close/monthly",
      title: "Cierre mensual",
      description:
        "Lo mismo que el cierre diario pero para el mes completo. Es la foto grande: si el negocio va bien o mal, más allá de un día bueno.",
    },
    {
      id: "full-monthly-close-summary",
      element: '[data-tour="monthly-close-summary"]',
      title: "El resultado del mes",
      description:
        "Ventas menos gastos del mes, por moneda y consolidado. Esta es la cifra que le enseñas a tu contador.",
    },

    // --- Tipo de cambio ----------------------------------------------------
    {
      id: "full-exchange-intro",
      route: "/dashboard/exchange-rate",
      title: "Tipo de cambio",
      description:
        "Esta pantalla manda sobre todas las demás si cobras en más de una moneda: aquí dices cuánto vale cada una en CUP. Si las tasas están viejas, tus cierres saldrán mal.",
    },
    {
      id: "full-exchange-values",
      element: '[data-tour="exchange-rate-currency-grid"]',
      onMissing: "skip",
      title: "Cuánto vale en CUP",
      description:
        "Escribe cuántos CUP te dan por cada unidad. En la transferencia no va una tasa sino el porcentaje extra que te cuesta cobrar así.",
    },
    {
      id: "full-exchange-save",
      element: '[data-tour="exchange-rate-save-btn"]',
      title: "Guarda",
      description:
        "Sin guardar no se aplica nada. Las monedas que dejes aquí quedan disponibles en ventas, gastos e inventario.",
    },

    // --- Cierre: avisos, cuenta y ayuda ------------------------------------
    {
      id: "full-notifications-intro",
      route: "/dashboard/notifications",
      title: "Notificaciones",
      description:
        "Aquí queda el historial de todo lo que te avisamos: stock bajo, productos agotados y respuestas de soporte. Es la versión completa de la campana de arriba.",
    },
    {
      id: "full-profile-intro",
      route: "/dashboard/profile",
      title: "Perfil y plan",
      description:
        "Tus datos de cuenta y tu plan: qué incluye, hasta cuándo te dura y cómo cambiarlo si te queda corto.",
    },
    {
      id: "full-support",
      route: "/dashboard/support",
      element: '[data-tour="support-create-ticket-btn"]',
      align: "end",
      title: "Si te trabas",
      description:
        "Abre un ticket y te ayudamos. Y puedes repetir este recorrido —o ver la guía de una pantalla concreta— cuando quieras desde el botón de ayuda de arriba.",
    },
  ],
};
