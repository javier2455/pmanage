import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getAllExpenseCategories,
  getExpenseCategoryById,
  updateExpenseCategory,
} from "@/lib/api/expense-category";
import {
  CreateExpenseCategoryProps,
  UpdateExpenseCategoryProps,
} from "@/lib/types/expense-category";

interface UseGetAllExpenseCategoriesParams {
  page?: number;
  limit?: number;
  businessId?: string;
  enabled?: boolean;
}

export function useGetAllExpenseCategoriesQuery({
  page,
  limit,
  businessId,
  enabled = true,
}: UseGetAllExpenseCategoriesParams = {}) {
  return useQuery({
    queryKey: ["expense-categories", businessId ?? null, page, limit],
    queryFn: () => getAllExpenseCategories({ page, limit, businessId }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGetExpenseCategoryByIdQuery(categoryId: string) {
  return useQuery({
    queryKey: ["expense-category", categoryId],
    queryFn: () => getExpenseCategoryById(categoryId),
    enabled: !!categoryId,
  });
}

export function useCreateExpenseCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: CreateExpenseCategoryProps) =>
      createExpenseCategory(credentials),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["expense-categories", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["expense-categories", null],
      });
    },
  });
}

export function useUpdateExpenseCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      credentials,
    }: {
      categoryId: string;
      credentials: UpdateExpenseCategoryProps;
    }) => updateExpenseCategory(categoryId, credentials),
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["expense-category", categoryId],
      });
    },
  });
}

export function useDeleteExpenseCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteExpenseCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}
