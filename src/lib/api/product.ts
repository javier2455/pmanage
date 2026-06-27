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
  /** Filtra por nombre (case-insensitive) en el backend. */
  search?: string;
}

export async function getAllProducts({
  page,
  limit,
  search,
}: GetAllProductsParams = {}): Promise<GetAllProductsResponse> {
  const { data } = await apiClient.get<GetAllProductsResponse>(
    productRoutes.getAllProducts,
    // Omitimos `search` cuando está vacío para no ensuciar la URL ni la cache.
    { params: { page, limit, search: search || undefined } },
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
  const { description, name, unit, imageUrl } = credentials;

  if (imageUrl instanceof File) {
    const formData = new FormData();
    formData.append("name", name);
    if (description) formData.append("description", description);
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
    description,
    name,
    unit,
  });
  return data;
}

export async function createInBusiness(
  credentials: CreateProductInBusinessProps,
): Promise<CreateProductResponse> {
  const {
    productId,
    categoryId,
    price,
    entryPrice,
    stock,
    stockAlertThreshold,
    currency,
    exchangeRateApplied,
    registerAsExpense,
  } = credentials;
  const { data } = await apiClient.post(
    productRoutes.createProductInBusiness(credentials.businessId),
    {
      productId,
      price,
      entryPrice,
      stock,
      // La categoría se asigna al BusinessProduct en esta llamada. Ver docs/category.md.
      ...(categoryId ? { categoryId } : {}),
      // Solo se envía si el usuario (Pro) definió un umbral.
      ...(stockAlertThreshold != null ? { stockAlertThreshold } : {}),
      // Auto-registro del gasto de reposición de stock. Solo se envía si el
      // usuario lo marcó; el backend valida `entryPrice` y `stock` > 0.
      ...(registerAsExpense ? { registerAsExpense: true } : {}),
      // Multimoneda: solo si el costo se ingresó en una moneda distinta a CUP.
      // El backend convierte `entryPrice × exchangeRateApplied` a CUP.
      ...(currency && currency !== "CUP"
        ? {
            currency,
            ...(exchangeRateApplied ? { exchangeRateApplied } : {}),
          }
        : {}),
    },
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

export async function updateBusinessProductCategory(
  businessId: string,
  businessProductId: string,
  categoryId: string | null,
) {
  // `categoryId: null` des-asigna la categoría. Ver docs/backend-categoria-business-product.md.
  const { data } = await apiClient.patch(
    productRoutes.updateBusinessProductCategory(businessId, businessProductId),
    { categoryId },
  );
  return data;
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
