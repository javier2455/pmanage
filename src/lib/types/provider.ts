import { Product, ProductUnit } from "./product";

export type Provider = {
  id: string;
  name: string;
  description: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  businessId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderProduct = {
  id: string;
  price: number;
  /**
   * Moneda de `price` (`CUP`, `USD`…). El backend guarda el precio tal y como
   * lo factura el proveedor, sin convertir, así que sin este campo la vista no
   * puede saber la unidad y daba todo por pesos. Opcional por compatibilidad
   * con respuestas anteriores a la migración.
   */
  currency?: string;
  product: Product;
};

export type ProviderBusinessRef = {
  id: string;
  name: string;
};

export type ProviderWithRelations = Provider & {
  business?: ProviderBusinessRef | null;
  providerProducts?: ProviderProduct[];
};

export type ProviderProductInput = {
  productId: string;
  price?: number;
  /** Moneda de `price`; el backend asume CUP si se omite. */
  currency?: string;
};

export type CreateProviderProps = {
  name: string;
  description?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  businessId: string;
  providerProducts?: ProviderProductInput[];
};

export type UpdateProviderProps = {
  name?: string;
  description?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  providerProducts?: ProviderProductInput[];
};

export type GetAllProvidersParams = {
  page?: number;
  limit?: number;
  businessId?: string;
};

export type GetAllProvidersResponse = {
  data: ProviderWithRelations[];
  total: number;
  page: number;
  limit: number;
};

export type GetProviderByIdResponse = {
  message: string;
  data: ProviderWithRelations;
};

export type CreateProviderResponse = {
  message: string;
  data: ProviderWithRelations;
};

export type UpdateProviderResponse = CreateProviderResponse;

export type ProviderProductItem = {
  id: string;
  name: string;
  description: string | null;
  unit: ProductUnit;
  imageUrl: string | null;
  price: number;
  /** Moneda de `price`; ausente en respuestas anteriores a la migración. */
  currency?: string;
  createdAt: string;
  updatedAt: string;
};

export type GetProviderProductsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type GetProviderProductsResponse = {
  message: string;
  data: ProviderProductItem[];
  total: number;
  page: number;
  limit: number;
};
