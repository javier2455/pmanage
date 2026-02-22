import axios from "axios";

interface ExchangeRateProps {
    businessId: string;
}

export async function getExchangeRate({ businessId }: ExchangeRateProps) {
    const { data } = await axios.get(
        `https://psearch.dveloxsoft.com/monetary-exchange/business/${businessId}`
    );

    return data;
}