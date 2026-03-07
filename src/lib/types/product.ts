import { BusinessProduct, BusinessType } from "./business";

export type ProductUnit = "kg" | "lb" | "g" | "L" | "mL " | "ud";

export type Product = {
    id: string;
    name: string;
    description: string | null;
    category: string;
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
    category: string | null;
    unit: ProductUnit;
    imageUrl?: string | null | undefined;
};

export type CreateProductInBusinessProps = {
    businessId: string;
    name: string;
    description: string | null;
    category: string | null;
    unit: ProductUnit;
    imageUrl?: string | null | undefined;
    price: number;
    entryPrice: number;
    stock: number;
};

export type EditProductProps = {
    name: string;
    description: string | null;
    category: string | null;
    unit: ProductUnit;
    imageUrl: string | null;
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
}

export type GetProductByIdResponse = {
    message: string;
    data: {
        id: string;
        name: string;
        description: string | null;
        category: string;
        unit: ProductUnit;
        imageUrl: string | null;
        businesses: BusinessResponseForGetProductById[];
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