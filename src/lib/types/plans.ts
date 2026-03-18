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