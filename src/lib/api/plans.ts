import axios from "axios";
import { plansRoutes } from "../routes/plans";

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

export async function getAllPlans() {
    const { data } = await axios.get(plansRoutes.getAllPlans);

    return data;
    // const { data } = await axios.get("/api/plans");
    // const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data;
    // return Array.isArray(list) ? list : [];
}