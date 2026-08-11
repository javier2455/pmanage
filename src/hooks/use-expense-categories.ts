import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
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

/**
 * Refresca las vistas que pintan la categoría de un gasto.
 *
 * Igual que con los productos: la tabla de gastos no consulta las categorías,
 * lee `expenseCategoryName` embebido en cada fila. Sin esto, renombrar una
 * categoría dejaba el nombre viejo en el listado hasta recargar con F5.
 */
function invalidateExpenseViews(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["all-expenses"] });
  queryClient.invalidateQueries({ queryKey: ["expense"] });
}

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
      // Renombrarla cambia lo que muestra el listado de gastos.
      invalidateExpenseViews(queryClient);
    },
  });
}

export function useDeleteExpenseCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteExpenseCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      // Los gastos que la tenían se quedan sin categoría.
      invalidateExpenseViews(queryClient);
    },
  });
}
