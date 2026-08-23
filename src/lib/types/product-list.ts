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

/** Texto plano, o láminas de 4 productos con su foto. */
export type ProductListMode = "text" | "image";

/** Máximo de productos que caben en un envío con imágenes (5 láminas). */
export const MAX_PRODUCTS_IMAGE_MODE = 20;

export interface ProductListPayload {
  businessId: string;
  productIds: string[];
  intro?: string;
  outro?: string;
  options?: Partial<ProductListOptions>;
  mode?: ProductListMode;
  /** Moneda de publicación. Los precios se guardan en CUP y se convierten. */
  currency?: string;
}

export interface SendProductListPayload extends ProductListPayload {
  /** `business` (por defecto) o el userId del trabajador destinatario. */
  recipientId?: string;
}

/** Una lámina generada, tal y como la devuelve la vista previa. */
export interface ProductListSheetPreview {
  /** `data:image/jpeg;base64,…`, listo para un `img`. */
  image: string;
  caption: string;
  productCount: number;
}

export interface ProductListPreviewResponse {
  mode: ProductListMode;
  currency: string;
  /** Modo texto: un string por mensaje. Vacío en modo imagen. */
  messages: string[];
  /** Modo imagen: una entrada por lámina. Vacío en modo texto. */
  sheets: ProductListSheetPreview[];
  productCount: number;
  characterCount: number;
  /** Se pidió modo imagen pero ningún producto tenía foto. */
  fellBackToText: boolean;
}

/** Moneda en la que el negocio puede publicar, con su tasa contra el CUP. */
export interface ProductListCurrency {
  code: string;
  rate: number;
}

export interface ProductListSendResponse {
  sent: boolean;
  mode: ProductListMode;
  currency: string;
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
