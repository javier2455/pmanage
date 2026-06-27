import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPlan, createPlan, getAllPlans, getUserPlanHistory, removeUserPlan, selectPlan } from "@/lib/api/plans";
import { AssignPlanPayload, CreateTypePlanPayload, SelectPlanPayload } from "@/lib/types/plans";

export function useGetAllPlans() {
    return useQuery({
        queryKey: ["all-plans"],
        queryFn: () => getAllPlans(),
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