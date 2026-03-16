import axios from "axios";
import { exchangeRateRoutes } from "../routes/exchange-rate";
import { ExchangeRatePayload, ExchangeRateResponse, UpdateExchangeRatePayload } from "../types/exchange-rate";

interface ExchangeRateProps {
    businessId: string;
}

export async function getExchangeRate({ businessId }: ExchangeRateProps) {
    const { data } = await axios.get(
        exchangeRateRoutes.getExchangeRate(businessId)
    );

    return data;
}

export async function createExchangeRate(payload: ExchangeRatePayload): Promise<ExchangeRateResponse> {
    const { data } = await axios.post(
        exchangeRateRoutes.createExchangeRate,
        payload,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
        }
    );

    return data;
}

export async function updateExchangeRate(businessId: string, payload: UpdateExchangeRatePayload): Promise<ExchangeRateResponse> {
    console.log('payload', payload);
    console.log('businessId', businessId);
    const { data } = await axios.put(
        exchangeRateRoutes.updateExchangeRate(businessId),
        payload,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
        }
    );

    return data;
}