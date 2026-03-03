import axios from "axios";
import { productRoutes } from "../routes/product";
import { CreateProductProps, CreateProductResponse, EditProductProps } from "../types/product";


export async function getProductById(productId: string) {
    console.log('productId of getProductById before request', productId)
    const { data } = await axios.get(productRoutes.getProductById(productId), {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function create(credentials: CreateProductProps): Promise<CreateProductResponse> {
    const { category, description, name, price, stock, unit } = credentials
    const { data } = await axios.post(productRoutes.createProduct(credentials.businessId),
        { category, description, name, price, stock, unit }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    return data;
}

export async function edit(productId: string, credentials: EditProductProps) {
    const { data } = await axios.put(productRoutes.editProduct(productId), credentials, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    return data;
}

export async function deleteProduct(productId: string) {
    const { data } = await axios.delete(productRoutes.deleteProduct(productId), {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    return data;
}