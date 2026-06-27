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
  businessId?: string;
  enabled?: boolean;
}

export function useGetAllProductCategoriesQuery({
  page,
  limit,
  businessId,
  enabled = true,
}: UseGetAllProductCategoriesParams = {}) {
  return useQuery({
    queryKey: ["product-categories", businessId ?? null, page, limit],
    queryFn: () => getAllProductCategories({ page, limit, businessId }),
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-categories", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-categories", null],
      });
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
