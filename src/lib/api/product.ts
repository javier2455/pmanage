import axios from "axios";
import { productRoutes } from "../routes/product";
import { CreateProductProps, CreateProductResponse } from "../types/product";

export async function create(credentials: CreateProductProps): Promise<CreateProductResponse> {
    console.log('credentials of create', credentials)
    const { category, description, imageUrl, name, price, stock, unit } = credentials
    const { data } = await axios.post(productRoutes.createProduct(credentials.businessId),
        { category, description, imageUrl, name, price, stock, unit }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    return data;
}