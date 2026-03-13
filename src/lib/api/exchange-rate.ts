import axios from "axios";
import { exchangeRateRoutes } from "../routes/exchange-rate";

interface ExchangeRateProps {
    businessId: string;
}

export async function getExchangeRate({ businessId }: ExchangeRateProps) {
    const { data } = await axios.get(
        exchangeRateRoutes.getExchangeRate(businessId)
    );

    return data;
}