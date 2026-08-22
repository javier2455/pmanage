/** Qué se muestra de cada producto en el mensaje. */
export interface ProductListOptions {
  showPrices: boolean;
  showAvailability: boolean;
  showUnit: boolean;
  groupByCategory: boolean;
  markOffers: boolean;
}

export const DEFAULT_PRODUCT_LIST_OPTIONS: ProductListOptions = {
  showPrices: true,
  showAvailability: true,
  showUnit: false,
  groupByCategory: true,
  markOffers: true,
};

export interface ProductListPayload {
  businessId: string;
  productIds: string[];
  intro?: string;
  outro?: string;
  options?: Partial<ProductListOptions>;
}

export interface SendProductListPayload extends ProductListPayload {
  /** `business` (por defecto) o el userId del trabajador destinatario. */
  recipientId?: string;
}

export interface ProductListPreviewResponse {
  messages: string[];
  productCount: number;
  characterCount: number;
}

export interface ProductListSendResponse {
  sent: boolean;
  messagesSent: number;
  messagesTotal: number;
  recipientLabel: string;
  notificationIds: string[];
  /** Presente cuando solo una parte de los mensajes llegó a salir. */
  error?: string;
}

export interface ProductListRecipient {
  id: string;
  label: string;
  phone: string;
  isDefault: boolean;
}

export interface ProductListTemplate {
  id: string;
  name: string;
  intro: string | null;
  outro: string | null;
  categoryIds: string[] | null;
  onlyInStock: boolean;
  excludedProductIds: string[] | null;
  options: ProductListOptions;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductListTemplatePayload {
  businessId: string;
  name: string;
  intro?: string;
  outro?: string;
  categoryIds?: string[];
  onlyInStock?: boolean;
  excludedProductIds?: string[];
  options?: Partial<ProductListOptions>;
}

export type UpdateProductListTemplatePayload = Partial<
  Omit<CreateProductListTemplatePayload, "businessId">
>;

/**
 * Producto tal y como lo devuelve `GET /businesses/:id/products`, recortado a
 * lo que necesita el selector: el texto final siempre lo arma el backend.
 */
export interface SelectableBusinessProduct {
  id: string;
  price: number;
  stock: number;
  isOnOffer: boolean;
  effectivePrice: number;
  product: {
    id: string;
    name: string;
    unit: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
}
