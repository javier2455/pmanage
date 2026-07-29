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
  /** Aclaración para el formulario cuando la etiqueta no basta. */
  hint?: string;
};

export const PLAN_FEATURES: PlanFeatureDefinition[] = [
  { key: "sales", label: "Registro de ventas y compras", group: "Operación diaria" },
  { key: "expenses", label: "Gestión de gastos con categorías", group: "Operación diaria" },
  { key: "dailyClose", label: "Cierre contable diario", group: "Operación diaria" },
  { key: "exchangeRates", label: "Tasas de cambio multi-moneda", group: "Operación diaria" },
  { key: "globalSearch", label: "Búsqueda global", group: "Operación diaria" },
  {
    key: "statsPanel",
    label: "Panel de estadísticas",
    group: "Operación diaria",
    hint: "El resumen del panel principal, no las analíticas avanzadas.",
  },

  { key: "priceHistory", label: "Historial de precios de productos", group: "Inventario y precios" },
  { key: "inventoryHistory", label: "Historial de inventario", group: "Inventario y precios" },
  { key: "stockAlerts", label: "Alertas de stock bajo", group: "Inventario y precios" },
  {
    key: "priceComparator",
    label: "Comparador de precios multi-producto",
    group: "Inventario y precios",
  },

  { key: "monthlyClose", label: "Cierre contable mensual", group: "Contabilidad" },
  { key: "exports", label: "Exportar cierres a Excel/PDF", group: "Contabilidad" },
  {
    key: "analytics",
    label: "Analíticas avanzadas",
    group: "Contabilidad",
    hint: "Acceso a /dashboard/analytics.",
  },

  { key: "providers", label: "Gestión de proveedores", group: "Equipo y proveedores" },
  { key: "team", label: "Gestión de equipo y permisos", group: "Equipo y proveedores" },

  {
    key: "emailNotifications",
    label: "Notificaciones por correo",
    group: "Notificaciones y soporte",
  },
  {
    key: "whatsappNotifications",
    label: "Notificaciones por WhatsApp",
    group: "Notificaciones y soporte",
  },
  {
    key: "prioritySupport",
    label: "Soporte prioritario 24/7",
    group: "Notificaciones y soporte",
  },
];

/**
 * Capacidades que cualquier plan ha concedido siempre, incluido el gratuito.
 *
 * Es la contrapartida del gate binario anterior (`isPro`): todo lo que NO está
 * en esta lista era exclusivo de Pro. Se usa como respaldo cuando el plan no
 * declara capacidades —sesión sin refrescar o plan anterior al modelo—, para
 * que nadie pierda acceso durante la transición. Debe reflejar lo mismo que
 * `featuresFromTier` en el backend.
 */
export const FREE_TIER_FEATURES: PlanFeatureKey[] = [
  "sales",
  "expenses",
  "dailyClose",
  "exchangeRates",
  "priceHistory",
  "inventoryHistory",
  "globalSearch",
  "statsPanel",
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

/**
 * Reconstruye las capacidades de un plan que no las declara, a partir de su
 * nivel. Réplica de `featuresFromTier` del backend: existe para los planes
 * anteriores al modelo de capacidades, que llegan con `features` en null.
 */
export function featuresFromTier(tier: number): Record<PlanFeatureKey, boolean> {
  const isPro = tier >= 2;
  const features = emptyFeatures();
  for (const key of PLAN_FEATURE_KEYS) {
    if (isPro) {
      features[key] = true;
    } else if (FREE_TIER_FEATURES.includes(key)) {
      features[key] = true;
    } else if (key === "emailNotifications") {
      features[key] = tier >= 1;
    }
  }
  return features;
}

/** ¿El plan concede esta capacidad? Ausente o falsa = no concedida. */
export function hasFeature(
  features: PlanFeatures | null | undefined,
  key: PlanFeatureKey,
): boolean {
  return features?.[key] === true;
}
