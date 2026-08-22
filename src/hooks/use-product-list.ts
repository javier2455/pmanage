"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProductListTemplate,
  deleteProductListTemplate,
  getProductListRecipients,
  getProductListTemplates,
  previewProductList,
  sendProductList,
  updateProductListTemplate,
} from "@/lib/api/product-list";
import type {
  CreateProductListTemplatePayload,
  ProductListPayload,
  SendProductListPayload,
  UpdateProductListTemplatePayload,
} from "@/lib/types/product-list";

/**
 * La previa se pide al backend a propósito: es la misma función que construye
 * el mensaje enviado, así lo que el usuario revisa y lo que reenvía a sus
 * clientes no pueden divergir.
 */
export function useProductListPreviewQuery(
  payload: ProductListPayload,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["product-list-preview", payload],
    queryFn: () => previewProductList(payload),
    enabled: enabled && !!payload.businessId && payload.productIds.length > 0,
    staleTime: 0,
  });
}

export function useProductListRecipientsQuery(businessId: string | undefined) {
  return useQuery({
    queryKey: ["product-list-recipients", businessId],
    queryFn: () => getProductListRecipients(businessId as string),
    enabled: !!businessId,
  });
}

export function useProductListTemplatesQuery(businessId: string | undefined) {
  return useQuery({
    queryKey: ["product-list-templates", businessId],
    queryFn: () => getProductListTemplates(businessId as string),
    enabled: !!businessId,
  });
}

export function useSendProductListMutation() {
  return useMutation({
    mutationFn: (payload: SendProductListPayload) => sendProductList(payload),
  });
}

export function useCreateProductListTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductListTemplatePayload) =>
      createProductListTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-list-templates"] });
    },
  });
}

export function useUpdateProductListTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string;
      payload: UpdateProductListTemplatePayload;
    }) => updateProductListTemplate(templateId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-list-templates"] });
    },
  });
}

export function useDeleteProductListTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteProductListTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-list-templates"] });
    },
  });
}
