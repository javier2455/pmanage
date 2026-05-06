import { BASIC_ROUTE } from ".";

export const plansRoutes = {
    getActivePlan: `${BASIC_ROUTE}/plans/user/active`,
    getAllPlans: `${BASIC_ROUTE}/plans/`,
    createPlan: `${BASIC_ROUTE}/plans/`,
    assignPlan: `${BASIC_ROUTE}/plans/assign`,
    removeUserPlan: (userId: string) => `${BASIC_ROUTE}/plans/user/${userId}/deactivate`,
    getUserPlanHistory: `${BASIC_ROUTE}/plans/user/history`,
}