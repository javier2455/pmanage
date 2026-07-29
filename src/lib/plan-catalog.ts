import { Shield, Sparkles, Crown, type LucideIcon } from "lucide-react";

import type { PlanResponse } from "@/lib/types/plans";
import {
  PLAN_FEATURES,
  normalizeFeatures,
  type PlanFeatureKey,
} from "@/lib/plan-features";

/**
 * Traduce los planes del catálogo del backend a lo que la vitrina necesita
 * pintar.
 *
 * Antes los precios y las funcionalidades anunciadas vivían escritos a mano en
 * el front, en la landing y en los seeds, de modo que la oferta publicada podía
 * no coincidir con la que el backend aplicaba —y no coincidía: se anunciaban
 * 100 y 500 productos mientras la base imponía 50 y 200—. Al derivar la vitrina
 * del propio plan, esa desviación deja de ser posible.
 */

/** Una funcionalidad tal y como se anuncia en la vitrina. */
export type PlanFeature = {
  text: string;
  included: boolean;
};

export type PlanCatalogEntry = {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: number;
  currency: string;
  /** Importe mensual en la modalidad mensual. */
  monthlyPrice: number;
  /** Importe mensual equivalente si se contrata el año completo. */
  yearlyPricePerMonth: number;
  /** Importe total que se cobra al contratar un año. */
  yearlyTotal: number;
  icon: LucideIcon;
  /** Lista con etiqueta e incluido/no incluido, para pintar la vitrina. */
  features: PlanFeature[];
  /** Las mismas capacidades indexadas por clave, para consultarlas en código. */
  grantedFeatures: Record<PlanFeatureKey, boolean>;
  isPro: boolean;
  /**
   * Tope de negocios activos; `null` es sin límite. Es lo que decide si al
   * cambiar de plan hay que reconciliar negocios, en vez de dar por hecho que
   * "bajar a Básico" siempre deja exactamente uno.
   */
  maxBusinesses: number | null;
};

/**
 * Nivel de servicio de cada familia, para ordenar y comparar planes sin mirar
 * sus nombres. Se deriva del tipo —igual que en el backend— en vez de guardarse
 * como columna propia, que solo permitiría contradecirlo.
 */
const TIER_BY_TYPE: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
};

/** El icono acompaña al nivel del plan, no a su nombre. */
function iconForTier(tier: number): LucideIcon {
  if (tier >= 2) return Crown;
  if (tier >= 1) return Sparkles;
  return Shield;
}

/**
 * Lista de funcionalidades para la vitrina. Sale del catálogo de capacidades,
 * así que el texto anunciado y el acceso real proceden del mismo dato.
 */
function featureListFor(granted: Record<PlanFeatureKey, boolean>): PlanFeature[] {
  return PLAN_FEATURES.map((definition) => ({
    text: definition.label,
    included: granted[definition.key] === true,
  }));
}

export function planToCatalogEntry(plan: PlanResponse): PlanCatalogEntry {
  const tier = TIER_BY_TYPE[plan.type] ?? 0;
  const monthlyPrice = Number(plan.priceMonthly ?? plan.price ?? 0);
  const yearlyTotal = Number(plan.priceYearly ?? 0);
  const granted = normalizeFeatures(plan.features);

  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    tier,
    currency: plan.currency ?? "USD",
    monthlyPrice,
    // La vitrina compara precios "al mes" en ambas modalidades; el importe
    // anual se guarda como total, así que aquí se mensualiza para mostrarlo.
    yearlyPricePerMonth: yearlyTotal > 0 ? Number((yearlyTotal / 12).toFixed(2)) : 0,
    yearlyTotal,
    icon: iconForTier(tier),
    features: featureListFor(granted),
    grantedFeatures: granted,
    isPro: tier >= 2,
    maxBusinesses: plan.maxBusinesses ?? null,
  };
}

/**
 * Planes que un usuario puede contratar por su cuenta al terminar el trial.
 *
 * Se excluye el nivel gratuito: es el propio periodo de prueba, no una opción a
 * la que volver.
 */
export function selectablePlans(catalog: PlanCatalogEntry[]): PlanCatalogEntry[] {
  return catalog.filter((plan) => plan.tier > 0);
}
