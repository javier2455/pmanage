import axios from "axios";
import { productRoutes } from "../routes/product";
import { CreateProductInBusinessProps, CreateProductProps, CreateProductResponse, EditProductProps, GetAllProductsResponse } from "../types/product";


export async function getAllProducts(): Promise<GetAllProductsResponse> {
    const { data } = await axios.get(productRoutes.getAllProducts, {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function getProductById(productId: string) {
    const { data } = await axios.get(productRoutes.getProductById(productId), {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function create(credentials: CreateProductProps): Promise<CreateProductResponse> {
    const { category, description, name, unit } = credentials
    const { data } = await axios.post(productRoutes.createProduct,
        { category, description, name, unit }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });
    console.log('response of create product', data)
    return data;
}

export async function createInBusiness(credentials: CreateProductInBusinessProps): Promise<CreateProductResponse> {
    const { productId, price, entryPrice, stock } = credentials
    const { data } = await axios.post(productRoutes.createProductInBusiness(credentials.businessId),
        { productId, price, entryPrice, stock }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}

export async function edit(productId: string, credentials: EditProductProps) {
    const { data } = await axios.put(productRoutes.editProduct(productId), credentials, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function deleteProduct(productId: string) {
    const { data } = await axios.delete(productRoutes.deleteProduct(productId), {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}