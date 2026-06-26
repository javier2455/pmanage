import {
    Banknote,
    CreditCard,
    DollarSign,
    Euro,
    PoundSterling,
    JapaneseYen,
    type LucideIcon,
    type LucideProps,
} from "lucide-react"
import type { ExchangeCurrencyCode } from "@/lib/currency"

/** Icono asociado a cada moneda configurable. Fallback: `Banknote`. */
const CURRENCY_ICONS: Record<ExchangeCurrencyCode, LucideIcon> = {
    USD: DollarSign,
    EURO: Euro,
    CUP_TRANSFERENCIA: CreditCard,
    CLASICA: CreditCard,
    MLC: Banknote,
    CAD: DollarSign,
    GBP: PoundSterling,
    CHF: Banknote,
    MXN: DollarSign,
    JPY: JapaneseYen,
}

interface CurrencyIconProps extends LucideProps {
    code: string
}

export function CurrencyIcon({ code, ...props }: CurrencyIconProps) {
    const Icon = CURRENCY_ICONS[code as ExchangeCurrencyCode] ?? Banknote
    return <Icon {...props} />
}
