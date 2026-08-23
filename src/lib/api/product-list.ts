import apiClient from "@/lib/axios";
import { productListRoutes } from "../routes/product-list";
import type {
  CreateProductListTemplatePayload,
  ProductListPayload,
  ProductListPreviewResponse,
  ProductListCurrency,
  ProductListRecipient,
  ProductListSendResponse,
  ProductListTemplate,
  SendProductListPayload,
  UpdateProductListTemplatePayload,
} from "../types/product-list";

export async function previewProductList(
  payload: ProductListPayload,
): Promise<ProductListPreviewResponse> {
  const { data } = await apiClient.post<ProductListPreviewResponse>(
    productListRoutes.preview,
    payload,
  );
  return data;
}

export async function sendProductList(
  payload: SendProductListPayload,
): Promise<ProductListSendResponse> {
  const { data } = await apiClient.post<ProductListSendResponse>(
    productListRoutes.send,
    payload,
  );
  return data;
}

export async function getProductListRecipients(
  businessId: string,
): Promise<ProductListRecipient[]> {
  const { data } = await apiClient.get<ProductListRecipient[]>(
    productListRoutes.recipients,
    { params: { businessId } },
  );
  return Array.isArray(data) ? data : [];
}

export async function getProductListCurrencies(
  businessId: string,
): Promise<ProductListCurrency[]> {
  const { data } = await apiClient.get<ProductListCurrency[]>(
    productListRoutes.currencies,
    { params: { businessId } },
  );
  return Array.isArray(data) ? data : [];
}

export async function getProductListTemplates(
  businessId: string,
): Promise<ProductListTemplate[]> {
  const { data } = await apiClient.get<ProductListTemplate[]>(
    productListRoutes.templates,
    { params: { businessId } },
  );
  return Array.isArray(data) ? data : [];
}

export async function createProductListTemplate(
  payload: CreateProductListTemplatePayload,
): Promise<ProductListTemplate> {
  const { data } = await apiClient.post<ProductListTemplate>(
    productListRoutes.templates,
    payload,
  );
  return data;
}

export async function updateProductListTemplate(
  templateId: string,
  payload: UpdateProductListTemplatePayload,
): Promise<ProductListTemplate> {
  const { data } = await apiClient.patch<ProductListTemplate>(
    productListRoutes.template(templateId),
    payload,
  );
  return data;
}

export async function deleteProductListTemplate(
  templateId: string,
): Promise<void> {
  await apiClient.delete(productListRoutes.template(templateId));
}
