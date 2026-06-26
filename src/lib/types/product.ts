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
     * Tasa CUP por 1 unidad de `currency`. Si se omite, el backend la busca en
     * `MonetaryExchange` del negocio. El frontend envía la misma tasa que usó
     * para previsualizar el costo convertido.
     */
    exchangeRateApplied?: number;
    /**
     * Si es `true`, el backend crea un gasto de "Reposición de stock"
     * (`entryPrice × stock`, en la moneda original) de forma atómica con la
     * creación del producto. Por defecto `false`.
     */
    registerAsExpense?: boolean;
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