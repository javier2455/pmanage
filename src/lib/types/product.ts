import { BusinessProduct, BusinessType } from "./business";

export type ProductUnit = "kg" | "lb" | "g" | "L" | "mL" | "ud";

export type ProductCategoryEmbed = {
    id: string;
    name: string;
    description: string | null;
    createdAt?: string;
    updatedAt?: string;
};

export type Product = {
    id: string;
    name: string;
    description: string | null;
    category: ProductCategoryEmbed | null;
    categoryId?: string | null;
    unit: ProductUnit;
    imageUrl: string | null;
    active: boolean;
    userId?: string | null | undefined;
    createdAt: Date;
};

export type GetAllProductsResponse = {
    message: string;
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type CreateProductResponse = {
    message: string;
    data: {
        product: Product;
        businessProduct: BusinessProduct;
    };

};

export type CreateProductProps = {
    // businessId: string;
    name: string;
    description: string | null;
    // La categoría ya no vive en el `Product` (catálogo) sino en el `BusinessProduct`.
    // Se asigna al asignar el producto a un negocio. Ver docs/category.md.
    unit: ProductUnit;
    imageUrl?: string | File | null | undefined;
};

export type CreateProductInBusinessProps = {
    businessId: string;
    productId: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    /**
     * Nombre de una categoría que aún no existe en el negocio. Solo se envía
     * cuando no hay `categoryId`: el backend la busca por nombre (sin distinguir
     * mayúsculas) y la crea si hace falta.
     */
    categoryName?: string | null;
    unit: ProductUnit;
    imageUrl?: string | null | undefined;
    price: number;
    entryPrice: number;
    stock: number;
    /**
     * Umbral de alerta de stock bajo (feature Pro). Opcional.
     * `null`/ausente = sin alerta. Editable luego desde el inventario.
     */
    stockAlertThreshold?: number | null;
    /**
     * Moneda en la que se ingresó `entryPrice` (`CUP`, `USD`, `EURO`, `MLC`…).
     * Si se omite o es `CUP`, no hay conversión. El backend convierte a CUP
     * antes de persistir. Ver docs/multimoneda-productos.md.
     */
    currency?: string;
    /**
     * Moneda en la que se cotiza `price` (`CUP`, `USD`, `EURO`…). El backend
     * convierte a CUP antes de persistir y guarda esta moneda como referencia de
     * cómo se fijó el precio — mismo patrón que `currency` para el costo.
     * Ver docs/moneda-precio-venta.md.
     */
    priceCurrency?: string;
    /**
     * Tasa CUP por 1 unidad de `priceCurrency`. Si se omite, el backend la busca
     * en `MonetaryExchange`. Se envía la misma que se usó en el preview para que
     * lo guardado sea exactamente lo previsualizado.
     */
    priceExchangeRateApplied?: number;
    /**
     * Tasa CUP por 1 unidad de `currency`. Si se omite, el backend la busca en
     * `MonetaryExchange` del negocio. El frontend envía la misma tasa que usó
     * para previsualizar el costo convertido.
     */
    exchangeRateApplied?: number;
};

export type EditProductProps = {
    name: string;
    description: string | null;
    // La categoría se gestiona a nivel de `BusinessProduct`, no del catálogo.
    unit: ProductUnit;
    imageUrl: string | File | null;
    active?: boolean | null;
};

export type ProductToShowInTable = {
    id: string;
    businessId: string;
    productId: string;
    price: string;
    entryPrice: string;
    stock: number;
    updatedAt: Date;
    product: Product;
    /**
     * Categoría del `BusinessProduct` (por negocio). Reemplaza a `product.category`
     * tras el cambio de relación del backend (docs/category.md). Puede ser `null`.
     */
    category: ProductCategoryEmbed | null;
}

export type GetProductByIdResponse = {
    message: string;
    data: {
        id: string;
        name: string;
        description: string | null;
        category: ProductCategoryEmbed | null;
        categoryId?: string | null;
        unit: ProductUnit;
        imageUrl: string | null;
        businesses?: BusinessResponseForGetProductById[];
    };
}

export type BusinessResponseForGetProductById = {
    businessId: string;
    businessName: string;
    businessType: BusinessType;
    address: string;
    phone: string | null;
    email: string | null;
    lat: number;
    lng: number;
    price: number;
    stock: number;
    productImageUrl: string | null;
    updatedAt: Date;

}

/* ── Importación masiva de productos ─────────────────────────────────────── */

export type ImportTarget = "catalog" | "catalog+sale";

/** Qué hacer con productos que ya están a la venta en el negocio. */
export type ImportDuplicateStrategy = "skip" | "update";

/** Una fila ya validada y lista para enviar al backend. */
export type ImportProductItem = {
    productName: string;
    productDescription?: string;
    productUnit: ProductUnit;
    categoryName?: string;
    price?: number;
    /**
     * Moneda del `price` (venta). `CUP` o ausente = sin conversión. Independiente
     * de `currency`: se puede comprar en USD y cotizar en CUP. El backend guarda
     * el precio convertido a CUP. Ver docs/moneda-precio-venta.md.
     */
    priceCurrency?: string;
    entryPrice?: number;
    /**
     * Moneda del `entryPrice` (costo). `CUP` o ausente = sin conversión. El backend
     * convierte a CUP con la tasa configurada del negocio. Ver docs/importacion-masiva-productos.md.
     */
    currency?: string;
    stock?: number;
    stockAlertThreshold?: number;
};

export type ImportProductsPayload = {
    items: ImportProductItem[];
    target: ImportTarget;
    mode?: "strict" | "tolerant";
    duplicateStrategy?: ImportDuplicateStrategy;
    /** Registra la entrada de cada producto nuevo (costo × stock) como gasto. */
    registerAsExpense?: boolean;
};

export type ImportSkippedRow = { row: number; productName: string; reason: string };
export type ImportErrorRow = { row: number; productName: string; reason: string };

export type ImportResult = {
    dryRun: boolean;
    target: ImportTarget;
    totalRows: number;
    productsCreated: number;
    productsReused: number;
    businessProductsCreated: number;
    businessProductsUpdated: number;
    businessProductsSkipped: number;
    categoriesCreated: number;
    expensesCreated: number;
    planLimit: number | null;
    remainingQuota: number | null;
    skipped: ImportSkippedRow[];
    errors: ImportErrorRow[];
};

export type ImportProductsResponse = {
    message: string;
    data: ImportResult;
};

export interface SalesProductInfoResponse {
    id: string;
    idsale?: string;
    idproducto: string;
    product?: Product;
    quantity: string | number;
    price: string | number;
    isCancelled: boolean;
    cancelledReason: string | null;
}