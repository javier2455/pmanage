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
    createdAt: Date;
};

export type CreateProductResponse = {
    message: string;
    data: {
        product: Product;
        businessProduct: BusinessProduct;
    };

};
export type CreateProductProps = {
    businessId: string;
    name: string;
    description: string | null;
    category: string | null;
    unit: ProductUnit;
    imageUrl: string | null;
    price: number;
    stock: number;
};

export type ProductToShowInTable = {
    id: string;
    businessId: string;
    productId: string;
    price: string;
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