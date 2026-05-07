import { getAllUsersData, getUserPlanStats, updateUser } from "@/lib/api/user";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { GetAllUsersParams, UpdateUserFormPayload } from "@/lib/types/user";

export function useGetAllUsersData(params: GetAllUsersParams = {}) {
    return useQuery({
        queryKey: ["all-users", params],
        queryFn: () => getAllUsersData(params),
        placeholderData: keepPreviousData,
    });
}

export function useGetUserPlanStats() {
    return useQuery({
        queryKey: ["user-plan-stats"],
        queryFn: () => getUserPlanStats(),
    });
}

export function useUpdateUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserFormPayload }) =>
            updateUser(userId, payload),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["auth-user-data"] });
        },
    });
}
