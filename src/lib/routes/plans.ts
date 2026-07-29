import { BASIC_ROUTE } from ".";

export const plansRoutes = {
    getActivePlan: `${BASIC_ROUTE}/plans/user/active`,
    getAllPlans: `${BASIC_ROUTE}/plans/`,
    /** Catálogo completo (incluye ocultos e inactivos). Solo admin. */
    getAllPlansForAdmin: `${BASIC_ROUTE}/plans/admin/all`,
    createPlan: `${BASIC_ROUTE}/plans/`,
    updatePlan: (planId: string) => `${BASIC_ROUTE}/plans/${planId}`,
    getPlanById: (planId: string) => `${BASIC_ROUTE}/plans/${planId}`,
    assignPlan: `${BASIC_ROUTE}/plans/assign`,
    selectPlan: `${BASIC_ROUTE}/plans/select`,
    removeUserPlan: (userId: string) => `${BASIC_ROUTE}/plans/user/${userId}/deactivate`,
    getUserPlanHistory: `${BASIC_ROUTE}/plans/user/history`,
}