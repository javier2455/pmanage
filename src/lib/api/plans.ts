import apiClient from "@/lib/axios";
import { plansRoutes } from "../routes/plans";
import { AssignPlanPayload, AssignPlanResponse, CreateTypePlanPayload, PlanHistoryResponse } from "../types/plans";

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

export async function createPlan(payload: CreateTypePlanPayload) {
    const { data } = await apiClient.post(plansRoutes.createPlan, payload);
    return data;
}

export async function getUserPlanHistory(): Promise<PlanHistoryResponse[]> {
    const { data } = await apiClient.get(plansRoutes.getUserPlanHistory);
    return data;
}