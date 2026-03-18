import apiClient from "@/lib/axios";
import { exchangeRateRoutes } from "../routes/exchange-rate";
import { ExchangeRatePayload, ExchangeRateResponse, UpdateExchangeRatePayload } from "../types/exchange-rate";

interface ExchangeRateProps {
    businessId: string;
}

export async function getExchangeRate({ businessId }: ExchangeRateProps) {
    const { data } = await apiClient.get(
        exchangeRateRoutes.getExchangeRate(businessId)
    );

    return data;
}

export async function createExchangeRate(payload: ExchangeRatePayload): Promise<ExchangeRateResponse> {
    const { data } = await apiClient.post(
        exchangeRateRoutes.createExchangeRate,
        payload
    );

    return data;
}

export async function updateExchangeRate(businessId: string, payload: UpdateExchangeRatePayload): Promise<ExchangeRateResponse> {
    console.log('payload', payload);
    console.log('businessId', businessId);
    const { data } = await apiClient.put(
        exchangeRateRoutes.updateExchangeRate(businessId),
        payload
    );

    return data;
}