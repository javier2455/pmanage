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