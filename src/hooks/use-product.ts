import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  create,
  createInBusiness,
  deleteProduct,
  deleteProductInBusiness,
  edit,
  getAllProducts,
  getProductById,
  importProducts,
  updateBusinessProductCategory,
  updateBusinessProductPrice,
} from "@/lib/api/product";
import {
  CreateProductInBusinessProps,
  CreateProductProps,
  EditProductProps,
  ImportProductsPayload,
} from "@/lib/types/product";

interface UseGetAllProductsParams {
  page?: number;
  limit?: number;
  /** Filtra por nombre (case-insensitive) en el backend. */
  search?: string;
}

export function useGetAllProductsQuery(params: UseGetAllProductsParams = {}) {
  return useQuery({
    queryKey: ["all-products", params],
    queryFn: () => getAllProducts(params),
    placeholderData: keepPreviousData,
  });
}

interface UseInfiniteProductsParams {
  /** Término de búsqueda por nombre (ya debounced por el llamador). */
  search?: string;
  /** Tamaño de página. Por defecto 20. */
  limit?: number;
  /** Permite deshabilitar la query (ej. mientras el combobox está cerrado). */
  enabled?: boolean;
}

/**
 * Lista paginada de productos con scroll infinito + búsqueda en servidor.
 * Pensado para comboboxes donde el catálogo puede ser grande: solo trae la
 * página actual y va pidiendo más con `fetchNextPage`.
 */
export function useInfiniteProductsQuery({
  search = "",
  limit = 20,
  enabled = true,
}: UseInfiniteProductsParams = {}) {
  return useInfiniteQuery({
    queryKey: ["products-infinite", { search, limit }],
    queryFn: ({ pageParam }) =>
      getAllProducts({ page: pageParam, limit, search }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

interface UseGetProductByIdOptions {
  refetchOnMount?: boolean | "always";
}

export function useGetProductByIdQuery(
  productId: string,
  options: UseGetProductByIdOptions = {},
) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
    refetchOnMount: options.refetchOnMount,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: CreateProductProps) => create(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
    },
  });
}

export function useCreateProductInBusinessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: CreateProductInBusinessProps) =>
      createInBusiness(credentials),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["all-product-of-my-businesses", variables.businessId],
      });
      // El producto recién asignado puede traer umbral de alerta de stock; hay
      // que refrescar el inventario y las alertas para que la campana/badge
      // aparezcan activas sin esperar a un refetch manual.
      queryClient.invalidateQueries({
        queryKey: ["current-inventory-by-business-id", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-alerts", variables.businessId],
      });
    },
  });
}

/**
 * Importación masiva de productos a un negocio. Invalida las mismas keys que la
 * asignación individual para que catálogo, ventas, inventario y alertas se
 * refresquen sin recargar. `dryRun` NO invalida (no persiste).
 */
export function useImportProductsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessId,
      payload,
      dryRun,
    }: {
      businessId: string;
      payload: ImportProductsPayload;
      dryRun?: boolean;
    }) => importProducts(businessId, payload, dryRun),
    onSuccess: (response, variables) => {
      if (response.data.dryRun) return;
      queryClient.invalidateQueries({
        queryKey: ["all-product-of-my-businesses", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-inventory-by-business-id", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-alerts", variables.businessId],
      });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
    },
  });
}

export function useEditProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      credentials,
    }: {
      productId: string;
      credentials: EditProductProps;
    }) => edit(productId, credentials),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({
        queryKey: ["all-product-of-my-businesses"],
      });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
    },
  });
}

export function useUpdateBusinessProductPriceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessProductId,
      price,
    }: {
      businessProductId: string;
      price: number;
      businessId: string;
      productId: string;
    }) => updateBusinessProductPrice(businessProductId, price),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["all-product-of-my-businesses", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-price-history", variables.productId],
      });
    },
  });
}

export function useUpdateBusinessProductCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessId,
      businessProductId,
      categoryId,
    }: {
      businessId: string;
      businessProductId: string;
      categoryId: string | null;
      productId: string;
    }) =>
      updateBusinessProductCategory(businessId, businessProductId, categoryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["all-product-of-my-businesses", variables.businessId],
      });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-product-of-my-businesses"],
      });
      queryClient.invalidateQueries({ queryKey: ["all-products"] });
    },
  });
}

export function useDeleteProductInBusinessMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessId,
      productId,
    }: {
      businessId: string;
      productId: string;
    }) => deleteProductInBusiness(businessId, productId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["all-product-of-my-businesses", variables.businessId],
      });
    },
  });
}
