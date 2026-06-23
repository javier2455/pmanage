import {
    deactivateAccount,
    getAllUsersData,
    getUserPlanStats,
    reactivateAccount,
    updateUser,
} from "@/lib/api/user";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    DeactivateAccountPayload,
    GetAllUsersParams,
    UpdateUserFormPayload,
} from "@/lib/types/user";
import { setDeactivatedCookie } from "@/lib/cookies";

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

export function useDeactivateAccountMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: DeactivateAccountPayload = {}) =>
            deactivateAccount(payload),
        onSuccess: async (data) => {
            // Sembramos la cookie para que el middleware bloquee de inmediato.
            setDeactivatedCookie(data.deactivatedAt);
            await queryClient.invalidateQueries({ queryKey: ["auth-user-data"] });
        },
    });
}

export function useReactivateAccountMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => reactivateAccount(),
        onSuccess: async () => {
            setDeactivatedCookie(null);
            await queryClient.invalidateQueries({ queryKey: ["auth-user-data"] });
        },
    });
}
