/** Qué se muestra de cada producto en el mensaje. */
export interface ProductListOptions {
  showPrices: boolean;
  showAvailability: boolean;
  showUnit: boolean;
  groupByCategory: boolean;
  markOffers: boolean;
  /**
   * Modo imagen: si el listado escrito viaja debajo de la foto.
   *
   * La lámina es un JPEG, así que nada de lo que hay en ella se puede copiar,
   * buscar en el chat ni leer si la imagen no carga. La introducción y la nota
   * final NO dependen de esta opción: son el negocio hablándole a su cliente y
   * viajan siempre.
   */
  includeCaption: boolean;
}

/**
 * Solo el precio viene marcado: es lo único sin lo que un listado de precios no
 * tiene sentido. Lo demás añade ruido a un mensaje pensado para reenviarse, así
 * que lo activa el usuario.
 */
export const DEFAULT_PRODUCT_LIST_OPTIONS: ProductListOptions = {
  showPrices: true,
  showAvailability: false,
  showUnit: false,
  groupByCategory: false,
  markOffers: false,
  includeCaption: true,
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
