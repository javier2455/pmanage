import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPlan, createPlan, getAllPlans } from "@/lib/api/plans";
import { AssignPlanPayload, CreateTypePlanPayload } from "@/lib/types/plans";

export function useGetAllPlans() {
    return useQuery({
        queryKey: ["all-plans"],
        queryFn: () => getAllPlans(),
    });
}

export function useAssignPlanMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: AssignPlanPayload) => assignPlan(payload),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["all-users"] });
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