export interface PlanResponse {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number | null;
  maxProducts: number;
  isActive: boolean;
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

export interface  CreateTypePlanPayload {
  name: string;
  description: string | null;
  type: PlanType;
  price: number | null;
  maxProducts: number;
  isActive: boolean;
}

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
  planType: SelectablePlanType;
  billingPeriod: BillingPeriod;
  keepBusinessId?: string;
}

export interface SelectPlanResponse {
  message: string;
  data: {
    /** Tipo del plan ya aplicado (p.ej. `basic`, `premium`). */
    type: string;
    name?: string;
    expireDate?: string | null;
    /** URL de pago si el flujo comercial la requiere; opcional. */
    paymentUrl?: string | null;
  };
}

