import apiClient from "@/lib/axios";
import { plansRoutes } from "../routes/plans";
import { AssignPlanPayload, AssignPlanResponse, CreateTypePlanPayload, PlanHistoryResponse, SelectPlanPayload, SelectPlanResponse } from "../types/plans";

export async function getActivePlan() {
    const { data } = await apiClient.get(plansRoutes.getActivePlan);
    return data;
}

export async function getAllPlans() {
    const { data } = await apiClient.get(plansRoutes.getAllPlans);
    return data;
}

export async function assignPlan(payload: AssignPlanPayload): Promise<AssignPlanResponse> {
    const { data } = await apiClient.post(plansRoutes.assignPlan, payload);
    return data;
}

/**
 * Selección self-service de plan al terminar el trial (Básico o Pro).
 * Para bajar a Básico con varios negocios, `keepBusinessId` indica cuál se
 * conserva; el backend archiva el resto y suspende trabajadores/invitaciones.
 */
export async function selectPlan(payload: SelectPlanPayload): Promise<SelectPlanResponse> {
    const { data } = await apiClient.post(plansRoutes.selectPlan, payload);
    return data;
}

export async function removeUserPlan(userId: string) {
    const { data } = await apiClient.put(plansRoutes.removeUserPlan(userId));
    return data;
}

export async function createPlan(payload: CreateTypePlanPayload) {
    const { data } = await apiClient.post(plansRoutes.createPlan, payload);
    return data;
}

export async function getUserPlanHistory(): Promise<PlanHistoryResponse[]> {
    const { data } = await apiClient.get(plansRoutes.getUserPlanHistory);
    return data;
}