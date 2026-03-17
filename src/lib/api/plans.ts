import axios from "axios";
import { plansRoutes } from "../routes/plans";
import { PlanResponse } from "../types/plans";

interface ActivePlanProps {
    token: string;
}

export async function getActivePlan({ token }: ActivePlanProps) {
    const { data } = await axios.get(plansRoutes.getActivePlan,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return data;
}

export async function getAllPlans(): Promise<PlanResponse[]> {
    const { data } = await axios.get(plansRoutes.getAllPlans, {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}