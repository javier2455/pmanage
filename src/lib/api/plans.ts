import axios from "axios";

interface ActivePlanProps {
    userId: string;
    token: string;
}

export async function getActivePlan({ userId, token }: ActivePlanProps) {
    const { data } = await axios.get(
        `https://psearch.dveloxsoft.com/plans/user/${userId}/active`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    return data;
}