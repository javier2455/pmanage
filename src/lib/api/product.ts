import apiClient from "@/lib/axios";
import { productRoutes } from "../routes/product";
import {
  CreateProductInBusinessProps,
  CreateProductProps,
  CreateProductResponse,
  EditProductProps,
  GetAllProductsResponse,
} from "../types/product";
import { businessRoutes } from "../routes/business";

interface GetAllProductsParams {
  page?: number;
  limit?: number;
}

export async function getAllProducts({
  page,
  limit,
}: GetAllProductsParams = {}): Promise<GetAllProductsResponse> {
  const { data } = await apiClient.get<GetAllProductsResponse>(
    productRoutes.getAllProducts,
    { params: { page, limit } },
  );
  return data;
}

export async function getProductById(productId: string) {
  const { data } = await apiClient.get(productRoutes.getProductById(productId));
  return data;
}

export async function create(
  credentials: CreateProductProps,
): Promise<CreateProductResponse> {
  const { category, description, name, unit, imageUrl } = credentials;

  if (imageUrl instanceof File) {
    const formData = new FormData();
    formData.append("name", name);
    if (description) formData.append("description", description);
    if (category) formData.append("category", category);
    formData.append("unit", unit);
    formData.append("imageUrl", imageUrl);

    const { data } = await apiClient.post(
      productRoutes.createProduct,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  }

  const { data } = await apiClient.post(productRoutes.createProduct, {
    category,
    description,
    name,
    unit,
  });
  return data;
}

export async function createInBusiness(
  credentials: CreateProductInBusinessProps,
): Promise<CreateProductResponse> {
  const { productId, price, entryPrice, stock } = credentials;
  const { data } = await apiClient.post(
    productRoutes.createProductInBusiness(credentials.businessId),
    { productId, price, entryPrice, stock },
  );

  return data;
}

export async function edit(productId: string, credentials: EditProductProps) {
  const { imageUrl } = credentials;

  if (imageUrl instanceof File) {
    const formData = new FormData();
    formData.append("name", credentials.name);
    if (credentials.description !== null)
      formData.append("description", credentials.description);
    if (credentials.category !== null)
      formData.append("category", credentials.category);
    formData.append("unit", credentials.unit);
    if (credentials.active !== undefined && credentials.active !== null)
      formData.append("active", String(credentials.active));
    formData.append("imageUrl", imageUrl);

    const { data } = await apiClient.put(
      productRoutes.editProduct(productId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  }

  const { data } = await apiClient.put(
    productRoutes.editProduct(productId),
    credentials,
  );
  return data;
}

export async function deleteProduct(productId: string) {
  const { data } = await apiClient.delete(
    productRoutes.deleteProduct(productId),
  );

  return data;
}

export async function deleteProductInBusiness(
  businessId: string,
  productId: string,
) {
  const reponse = await apiClient.delete(
    businessRoutes.deleteProductOfMyBusiness(businessId, productId),
  );

  if (reponse.status === 204) {
    return {
      success: true,
      message: "Producto eliminado del negocio correctamente",
    };
  } else {
    return {
      success: false,
      message: "Error al eliminar el producto del negocio",
    };
  }
}

export async function updateBusinessProductPrice(businessProductId: string, price: number) {
  const reponse = await apiClient.put(
    productRoutes.updateBusinessProductPrice(businessProductId),
    { price: price },
  );

  if (reponse.status === 204) {
    return {
      success: true,
      message: "Precio del producto actualizado correctamente",
    };
  } else {
    return {
      success: false,
      message: "Error al actualizar el precio del producto",
    };
  }
}
