export type ExchangeRateTypeOne = {
    id: string;
    idbusiness: string;
    USD: number;
    EURO: number;
    CUP_TRANSFERENCIA: number;
    CLASICA: number;
    MLC: number;
    createdAt: string;
    updatedAt: string;
}

export interface ExchangeRatePayload {
    idbusiness: string;
    USD?: number;
    EURO?: number;
    CUP_TRANSFERENCIA?: number;
    CLASICA?: number;
    MLC?: number;
    CAD?: number;
    GBP?: number;
    CHF?: number;
    MXN?: number;
    JPY?: number;
}

export interface ExchangeRateResponse {
    message: string;
    data: ExchangeRateTypeOne;
}

export type UpdateExchangeRatePayload = Omit<ExchangeRatePayload, 'idbusiness'>;