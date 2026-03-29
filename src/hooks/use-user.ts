import { getAllUsersData, updateUser } from "@/lib/api/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UpdateUserFormPayload } from "@/lib/types/user";

export function useGetAllUsersData() {
    return useQuery({
        queryKey: ["all-users"],
        queryFn: () => getAllUsersData(),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
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
