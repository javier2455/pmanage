import apiClient from "@/lib/axios";
import { productRoutes } from "../routes/product";
import {
  CreateProductCategoryProps,
  GetAllProductCategoriesResponse,
  ProductCategory,
  ProductCategoryWithBusiness,
  UpdateProductCategoryProps,
} from "../types/product-category";

interface GetAllProductCategoriesParams {
  page?: number;
  limit?: number;
  businessId?: string;
}

interface RawListResponse {
  message?: string;
  data: ProductCategory[];
  total?: number;
  page?: number;
  limit?: number;
}

interface SingleResponse<T> {
  message?: string;
  data: T;
}

export async function getAllProductCategories({
  page,
  limit,
  businessId,
}: GetAllProductCategoriesParams = {}): Promise<GetAllProductCategoriesResponse> {
  const { data } = await apiClient.get<RawListResponse>(
    productRoutes.getAllProductCategory,
    { params: { page, limit, businessId } },
  );
  const items = data.data ?? [];
  const resolvedTotal = data.total ?? items.length;
  const resolvedPage = data.page ?? page ?? 1;
  const resolvedLimit = data.limit ?? limit ?? items.length;
  return {
    data: items,
    meta: {
      total: resolvedTotal,
      page: resolvedPage,
      limit: resolvedLimit,
      totalPages:
        resolvedLimit > 0 ? Math.ceil(resolvedTotal / resolvedLimit) : 0,
    },
  };
}

export async function getProductCategoryById(
  categoryId: string,
): Promise<ProductCategoryWithBusiness> {
  const { data } = await apiClient.get<SingleResponse<ProductCategoryWithBusiness>>(
    productRoutes.getProductCategoryById(categoryId),
  );
  return data.data;
}

export async function createProductCategory(
  credentials: CreateProductCategoryProps,
): Promise<ProductCategory> {
  const { data } = await apiClient.post<SingleResponse<ProductCategory>>(
    productRoutes.createProductCategory,
    credentials,
  );
  return data.data;
}

export async function updateProductCategory(
  categoryId: string,
  credentials: UpdateProductCategoryProps,
): Promise<ProductCategory> {
  const { data } = await apiClient.put<SingleResponse<ProductCategory>>(
    productRoutes.updateProductCategory(categoryId),
    credentials,
  );
  return data.data;
}

export async function deleteProductCategory(categoryId: string) {
  const { data } = await apiClient.delete(
    productRoutes.deleteProductCategory(categoryId),
  );
  return data;
}
