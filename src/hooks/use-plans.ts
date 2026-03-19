import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPlan, getAllPlans } from "@/lib/api/plans";
import { AssignPlanPayload } from "@/lib/types/plans";

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