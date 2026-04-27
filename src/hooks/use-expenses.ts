import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
} from "@/lib/api/expense";
import {
  CreateExpenseProps,
  UpdateExpenseProps,
} from "@/lib/types/expenses";

interface UseGetAllExpensesParams {
  page?: number;
  limit?: number;
}

export function useGetAllExpensesQuery(params: UseGetAllExpensesParams = {}) {
  return useQuery({
    queryKey: ["all-expenses", params],
    queryFn: () => getAllExpenses(params),
    placeholderData: keepPreviousData,
  });
}

export function useGetExpenseByIdQuery(expenseId: string) {
  return useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: !!expenseId,
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: CreateExpenseProps) => createExpense(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-expenses"] });
    },
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      credentials,
    }: {
      expenseId: string;
      credentials: UpdateExpenseProps;
    }) => updateExpense(expenseId, credentials),
    onSuccess: (_, { expenseId }) => {
      queryClient.invalidateQueries({ queryKey: ["all-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", expenseId] });
    },
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-expenses"] });
    },
  });
}
