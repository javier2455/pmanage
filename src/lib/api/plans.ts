import apiClient from "@/lib/axios";
import { plansRoutes } from "../routes/plans";

export async function getActivePlan() {
    const { data } = await apiClient.get(plansRoutes.getActivePlan);
    return data;
}

export async function getAllPlans() {
    const { data } = await apiClient.get(plansRoutes.getAllPlans);
    return data;
}