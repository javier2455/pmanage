import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
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

/**
 * Refresca las vistas que pintan la categoría de un producto.
 *
 * La categoría no se consulta aparte: viaja **embebida** en cada producto
 * (`businessProduct.category`, con fallback a `product.category`). Invalidar
 * solo `product-categories` refrescaba la pantalla de categorías pero dejaba el
 * nombre viejo en las tablas de productos hasta recargar con F5.
 *
 * Sin `businessId` a propósito: una categoría puede estar en productos de
 * cualquier negocio, así que se invalidan todas las variantes de cada clave.
 */
function invalidateProductViews(queryClient: QueryClient) {
  // Tabla de productos del negocio y buscador del mostrador.
  queryClient.invalidateQueries({ queryKey: ["all-product-of-my-businesses"] });
  // Catálogo global.
  queryClient.invalidateQueries({ queryKey: ["all-products"] });
  // Detalle de un producto.
  queryClient.invalidateQueries({ queryKey: ["product"] });
}

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
      // Renombrar la categoría cambia lo que muestran las tablas de productos.
      invalidateProductViews(queryClient);
    },
  });
}

export function useDeleteProductCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteProductCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      // Los productos que la tenían se quedan sin categoría.
      invalidateProductViews(queryClient);
    },
  });
}
