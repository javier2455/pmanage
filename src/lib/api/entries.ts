import axios from "axios";
import { entriesRoutes } from "../routes/entries";
import { AddStockToProductProps } from "../types/entries";


export async function addStock(credentials: AddStockToProductProps): Promise<{ message: string }> {
    console.log('credentials of create', credentials)
    const { quantity, unitPrice, description } = credentials
    const { data } = await axios.post(entriesRoutes.addStockToProduct(credentials.businessId, credentials.productId), { quantity, description }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    return data;
}