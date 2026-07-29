import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPlan, createPlan, getAllPlans, getAllPlansForAdmin, getPlanById, getUserPlanHistory, removeUserPlan, selectPlan, updatePlan } from "@/lib/api/plans";
import { AssignPlanPayload, CreateTypePlanPayload, SelectPlanPayload, UpdatePlanPayload } from "@/lib/types/plans";

export function useGetAllPlans() {
    return useQuery({
        queryKey: ["all-plans"],
        queryFn: () => getAllPlans(),
    });
}

/** Catálogo completo para administrar planes, incluidos ocultos e inactivos. */
export function useGetAllPlansForAdmin() {
    return useQuery({
        queryKey: ["all-plans", "admin"],
        queryFn: () => getAllPlansForAdmin(),
    });
}

export function useGetPlanById(planId: string | undefined) {
    return useQuery({
        queryKey: ["plan", planId],
        queryFn: () => getPlanById(planId as string),
        enabled: Boolean(planId),
    });
}

export function useGetUserPlanHistory() {
    return useQuery({
        queryKey: ["user-plan-history"],
        queryFn: () => getUserPlanHistory(),
    });
}



export function useSelectPlanMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: SelectPlanPayload) => selectPlan(payload),
        onSuccess: async () => {
            // El plan y el set de negocios cambian: refrescar identidad y negocios.
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["auth-user-data"] }),
                queryClient.invalidateQueries({ queryKey: ["businesses"] }),
            ]);
        },
    });
}

export function useAssignPlanMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: AssignPlanPayload) => assignPlan(payload),
        onSuccess: async () => {
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ["all-users"] }),
                queryClient.refetchQueries({ queryKey: ["user-plan-stats"] }),
            ]);
        },
    });
}

export function useRemoveUserPlanMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => removeUserPlan(userId),
        onSuccess: async () => {
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ["all-users"] }),
                queryClient.refetchQueries({ queryKey: ["user-plan-stats"] }),
            ]);
        },
    });
}

export function useCreatePlanMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTypePlanPayload) => createPlan(payload),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["all-plans"] });
        },
    });
}

export function useUpdatePlanMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ planId, payload }: { planId: string; payload: UpdatePlanPayload }) =>
            updatePlan(planId, payload),
        onSuccess: async (_data, variables) => {
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ["all-plans"] }),
                queryClient.invalidateQueries({ queryKey: ["plan", variables.planId] }),
            ]);
        },
    });
}