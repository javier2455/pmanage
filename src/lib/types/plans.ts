import type { PlanFeatures } from "@/lib/plan-features";

export interface PlanResponse {
  id: string;
  /** Identidad estable del plan; es lo único único, `type` puede repetirse. */
  code: string;
  name: string;
  description: string | null;
  type: string;
  /** @deprecated Espejo de `priceMonthly`; lo sigue devolviendo el backend. */
  price: number | null;
  currency: string;
  priceMonthly: number;
  /** Importe que se cobra al AÑO en la modalidad anual, no el mensualizado. */
  priceYearly: number;
  /** En los tres topes, `null` significa "sin límite". */
  maxProducts: number | null;
  maxBusinesses: number | null;
  maxWorkers: number | null;
  features: PlanFeatures | null;
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignPlanPayload {
  userId: string;
  planId: string;
  startDate: string;
  expiresAt: string;
}

export interface AssignPlanResponse {
    message: string;
    data: AssignPlanResponseData;
}

/**
 * Alta de plan. Los tres topes son de envío obligatorio aunque admitan `null`:
 * omitirlos era lo que creaba planes con negocios y trabajadores ilimitados sin
 * que nadie lo hubiera decidido, así que "sin límite" tiene que escribirse.
 */
export interface CreateTypePlanPayload {
  code: string;
  name: string;
  description: string | null;
  type: PlanType;
  currency: string;
  priceMonthly: number;
  priceYearly: number;
  maxProducts: number | null;
  maxBusinesses: number | null;
  maxWorkers: number | null;
  features: PlanFeatures;
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number;
}

/** Edición: todo opcional, porque omitir un campo es "déjalo como está". */
export type UpdatePlanPayload = Partial<CreateTypePlanPayload>;

type AssignPlanResponseData = {
  id: string;
  userId: string;
  planId: string;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanHistoryResponse {
    id: string;
    userId: string;
    planId: string;
    plan: PlanResponse;
    startsAt: string;
    expiresAt: string;
    price: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type PlanType = "free" | "basic" | "premium" | "enterprise";

/** Alcance que el usuario puede elegir de forma self-service al terminar el trial. */
export type SelectablePlanType = "basic" | "pro";

export type BillingPeriod = "monthly" | "yearly";

/**
 * Payload de `POST /plans/select` (self-service). Cuando se baja a `basic` y el
 * usuario tiene más de un negocio activo, `keepBusinessId` es obligatorio: el
 * backend conserva ese negocio y archiva el resto (ver backend-cambios.md).
 */
export interface SelectPlanPayload {
  /**
   * Plan destino. Es lo que debe enviarse: identifica un plan concreto del
   * catálogo, incluidos los que no son ni "basic" ni "pro".
   */
  planId?: string;
  /** Forma anterior, solo capaz de nombrar dos planes. Se mantiene por compatibilidad. */
  planType?: SelectablePlanType;
  billingPeriod: BillingPeriod;
  /** Negocio a conservar cuando el plan destino admite menos de los activos. */
  keepBusinessId?: string;
}

export interface SelectPlanResponse {
  message: string;
  data: {
    /** Tipo del plan ya aplicado (p.ej. `basic`, `premium`). */
    type: string;
    name?: string;
    expireDate?: string | null;
    planId?: string;
    code?: string;
    /** Periodo e importe realmente contratados. */
    billingPeriod?: BillingPeriod;
    price?: number;
    currency?: string;
    /** URL de pago si el flujo comercial la requiere; opcional. */
    paymentUrl?: string | null;
  };
}

