import apiClient from "@/lib/axios";
import { productRoutes } from "../routes/product";
import { CreateProductInBusinessProps, CreateProductProps, CreateProductResponse, EditProductProps, GetAllProductsResponse } from "../types/product";
import { businessRoutes } from "../routes/business";


export async function getAllProducts(): Promise<GetAllProductsResponse> {
    const { data } = await apiClient.get(productRoutes.getAllProducts);
    return data;
}

export async function getProductById(productId: string) {
    const { data } = await apiClient.get(productRoutes.getProductById(productId));
    return data;
}

export async function create(credentials: CreateProductProps): Promise<CreateProductResponse> {
    const { category, description, name, unit } = credentials
    const { data } = await apiClient.post(productRoutes.createProduct,
        { category, description, name, unit });
    console.log('response of create product', data)
    return data;
}

export async function createInBusiness(credentials: CreateProductInBusinessProps): Promise<CreateProductResponse> {
    const { productId, price, entryPrice, stock } = credentials
    const { data } = await apiClient.post(productRoutes.createProductInBusiness(credentials.businessId),
        { productId, price, entryPrice, stock });

    return data;
}

export async function edit(productId: string, credentials: EditProductProps) {
    const { data } = await apiClient.put(productRoutes.editProduct(productId), credentials);
    return data;
}

export async function deleteProduct(productId: string) {
    const { data } = await apiClient.delete(productRoutes.deleteProduct(productId));

    return data;
}

export async function deleteProductInBusiness(businessId: string, productId: string) {
    const reponse = await apiClient.delete(businessRoutes.deleteProductOfMyBusiness(businessId, productId));

    if (reponse.status === 204) {
        return {
            success: true,
            message: "Producto eliminado del negocio correctamente",
        };
    } else {
        return {
            success: false,
            message: "Error al eliminar el producto del negocio",
        };
    }
}