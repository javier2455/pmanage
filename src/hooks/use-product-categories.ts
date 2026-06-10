import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProductCategory,
  deleteProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  updateProductCategory,
} from "@/lib/api/product-category";
import {
  CreateProductCategoryProps,
  UpdateProductCategoryProps,
} from "@/lib/types/product-category";

interface UseGetAllProductCategoriesParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

// Las categorías de producto son globales por usuario, así que no se filtran ni
// se cachean por negocio (a diferencia de las de gasto).
export function useGetAllProductCategoriesQuery({
  page,
  limit,
  enabled = true,
}: UseGetAllProductCategoriesParams = {}) {
  return useQuery({
    queryKey: ["product-categories", page, limit],
    queryFn: () => getAllProductCategories({ page, limit }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGetProductCategoryByIdQuery(categoryId: string) {
  return useQuery({
    queryKey: ["product-category", categoryId],
    queryFn: () => getProductCategoryById(categoryId),
    enabled: !!categoryId,
  });
}

export function useCreateProductCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: CreateProductCategoryProps) =>
      createProductCategory(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useUpdateProductCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      credentials,
    }: {
      categoryId: string;
      credentials: UpdateProductCategoryProps;
    }) => updateProductCategory(categoryId, credentials),
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["product-category", categoryId],
      });
    },
  });
}

export function useDeleteProductCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteProductCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}
