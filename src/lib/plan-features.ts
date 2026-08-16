/**
 * Catálogo de capacidades de un plan.
 *
 * Es el espejo de `PLAN_FEATURE_KEYS` del backend
 * (`psearch-back/src/v2/entities/plan.entity.ts`): las claves deben coincidir
 * exactamente, porque son las que viajan en `plan.features` de `/auth/me` y las
 * que guarda el formulario de plan.
 *
 * Cada entrada aporta las dos cosas que el sistema necesita de una capacidad:
 * la etiqueta con la que se anuncia en la vitrina y el grupo con el que se
 * presenta en el formulario. Añadir una capacidad nueva es añadir una entrada
 * aquí y otra en el catálogo del backend.
 *
 * Sin React ni APIs de navegador: lo consumen tanto componentes de cliente como
 * la lógica de gating pura.
 */

export const PLAN_FEATURE_KEYS = [
  "sales",
  "expenses",
  "dailyClose",
  "exchangeRates",
  "priceHistory",
  "inventoryHistory",
  "globalSearch",
  "statsPanel",
  "emailNotifications",
  "smsNotifications",
  "monthlyClose",
  "exports",
  "providers",
  "team",
  "priceComparator",
  "whatsappNotifications",
  "analytics",
  "stockAlerts",
  "prioritySupport",
] as const;

export type PlanFeatureKey = (typeof PLAN_FEATURE_KEYS)[number];

export type PlanFeatures = Partial<Record<PlanFeatureKey, boolean>>;

export type PlanFeatureGroup =
  | "Operación diaria"
  | "Inventario y precios"
  | "Contabilidad"
  | "Equipo y proveedores"
  | "Notificaciones y soporte";

export type PlanFeatureDefinition = {
  key: PlanFeatureKey;
  /** Texto con el que la capacidad se anuncia en la vitrina. */
  label: string;
  group: PlanFeatureGroup;
  /**
   * Qué hace la capacidad dentro del sistema y qué aporta al negocio. Se muestra
   * en el formulario de plan para que marcar una casilla no sea adivinar: quien
   * define la oferta necesita saber qué está concediendo.
   */
  description: string;
};

export const PLAN_FEATURES: PlanFeatureDefinition[] = [
  {
    key: "sales",
    label: "Registro de ventas y compras",
    group: "Operación diaria",
    description:
      "Anotar cada venta con producto, cantidad, precio y moneda. Es la base del cierre diario y de las estadísticas: sin esto el negocio no tiene histórico de ingresos.",
  },
  {
    key: "expenses",
    label: "Gestión de gastos con categorías",
    group: "Operación diaria",
    description:
      "Registrar gastos clasificados por categoría (alquiler, insumos, salarios…) para ver en qué se va el dinero y restarlos del resultado del cierre.",
  },
  {
    key: "dailyClose",
    label: "Cierre contable diario",
    group: "Operación diaria",
    description:
      "Cuadre de la jornada: ventas, gastos y saldo por moneda con el detalle de cada movimiento. Permite cerrar el día y detectar descuadres el mismo día.",
  },
  {
    key: "exchangeRates",
    label: "Tasas de cambio multi-moneda",
    group: "Operación diaria",
    description:
      "Fijar la tasa de cada moneda (USD, EUR, MLC, transferencia) para que ventas y gastos en distintas monedas se consoliden en CUP con un valor coherente.",
  },
  {
    key: "globalSearch",
    label: "Búsqueda global",
    group: "Operación diaria",
    description:
      "Buscar productos, ventas, gastos y negocios desde una sola caja, sin recorrer sección por sección.",
  },
  {
    key: "statsPanel",
    label: "Panel de estadísticas",
    group: "Operación diaria",
    description:
      "Las tarjetas de resumen del inicio: ventas, gastos y caja del período con acceso directo a cada vista. No incluye las analíticas avanzadas.",
  },

  {
    key: "priceHistory",
    label: "Historial de precios de productos",
    group: "Inventario y precios",
    description:
      "Ver cómo ha cambiado el precio de un producto en el tiempo, con la fecha de cada cambio. Sirve para justificar subidas y detectar errores de tecleo.",
  },
  {
    key: "inventoryHistory",
    label: "Historial de inventario",
    group: "Inventario y precios",
    description:
      "Registro de cada entrada, salida y ajuste de existencias, con motivo, responsable y coste. Es la trazabilidad del stock.",
  },
  {
    key: "stockAlerts",
    label: "Alertas de stock bajo",
    group: "Inventario y precios",
    description:
      "Definir un umbral por producto y avisar cuando las existencias lo alcanzan o llegan a cero, para reponer antes de quedarse sin vender.",
  },
  {
    key: "priceComparator",
    label: "Comparador de precios multi-producto",
    group: "Inventario y precios",
    description:
      "Comparar la evolución de precios de varios productos a la vez en una misma gráfica, para decidir compras y ver tendencias.",
  },

  {
    key: "monthlyClose",
    label: "Cierre contable mensual",
    group: "Contabilidad",
    description:
      "Consolidado del mes por negocio y moneda: ingresos, gastos, beneficio y comparación con meses anteriores.",
  },
  {
    key: "exports",
    label: "Exportar cierres a Excel/PDF",
    group: "Contabilidad",
    description:
      "Descargar los cierres y el historial de inventario en Excel o PDF, con el formato listo para contabilidad o para presentar a terceros.",
  },
  {
    key: "analytics",
    label: "Analíticas avanzadas",
    group: "Contabilidad",
    description:
      "Acceso a la sección de analíticas: productos más vendidos, márgenes, evolución por período y comparativas entre negocios.",
  },

  {
    key: "providers",
    label: "Gestión de proveedores",
    group: "Equipo y proveedores",
    description:
      "Fichar proveedores con sus productos y precios de compra, y asociarlos a las entradas de inventario para saber a quién comprar más barato.",
  },
  {
    key: "team",
    label: "Gestión de equipo y permisos",
    group: "Equipo y proveedores",
    description:
      "Invitar trabajadores, asignarles permisos por sección y suspender su acceso. Sin esta capacidad el negocio lo opera únicamente el dueño.",
  },

  {
    key: "emailNotifications",
    label: "Notificaciones por correo",
    group: "Notificaciones y soporte",
    description:
      "Enviar por correo los avisos que cada negocio active: cierre diario, cierre mensual, stock bajo y producto agotado.",
  },
  {
    key: "smsNotifications",
    label: "Notificaciones por SMS",
    group: "Notificaciones y soporte",
    description:
      "Los mismos avisos enviados como mensaje de texto al teléfono del negocio. Requiere un teléfono válido y llega sin necesidad de conexión a internet.",
  },
  {
    key: "whatsappNotifications",
    label: "Notificaciones por WhatsApp",
    group: "Notificaciones y soporte",
    description:
      "Los mismos avisos enviados por WhatsApp al teléfono del negocio. Requiere un teléfono válido asociado al negocio.",
  },
  {
    key: "prioritySupport",
    label: "Soporte prioritario 24/7",
    group: "Notificaciones y soporte",
    description:
      "Los tickets de soporte de estos usuarios se atienden con prioridad sobre el resto.",
  },
];

/** Orden en que se presentan los grupos en el formulario. */
export const PLAN_FEATURE_GROUPS: PlanFeatureGroup[] = [
  "Operación diaria",
  "Inventario y precios",
  "Contabilidad",
  "Equipo y proveedores",
  "Notificaciones y soporte",
];

export function featuresByGroup(group: PlanFeatureGroup): PlanFeatureDefinition[] {
  return PLAN_FEATURES.filter((f) => f.group === group);
}

export function featureLabel(key: PlanFeatureKey): string {
  return PLAN_FEATURES.find((f) => f.key === key)?.label ?? key;
}

/** Objeto de capacidades con todas las claves en `false`, para partir de cero. */
export function emptyFeatures(): Record<PlanFeatureKey, boolean> {
  return Object.fromEntries(PLAN_FEATURE_KEYS.map((k) => [k, false])) as Record<
    PlanFeatureKey,
    boolean
  >;
}

/**
 * Completa un objeto parcial (lo que devuelve el backend) con las claves que
 * falten en `false`. El formulario necesita un booleano por casilla, y una
 * capacidad ausente es una capacidad no concedida.
 */
export function normalizeFeatures(
  features: PlanFeatures | null | undefined,
): Record<PlanFeatureKey, boolean> {
  const base = emptyFeatures();
  if (!features) return base;
  for (const key of PLAN_FEATURE_KEYS) {
    base[key] = features[key] === true;
  }
  return base;
}

/** ¿El plan concede esta capacidad? Ausente o falsa = no concedida. */
export function hasFeature(
  features: PlanFeatures | null | undefined,
  key: PlanFeatureKey,
): boolean {
  return features?.[key] === true;
}
