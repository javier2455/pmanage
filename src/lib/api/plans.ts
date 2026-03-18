import apiClient from "@/lib/axios";
import { plansRoutes } from "../routes/plans";
import { AssignPlanPayload, AssignPlanResponse } from "../types/plans";

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