
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CurrencyIcon } from './currency-icons'

interface ExchangeCardProps {
    title: string
    value: number
    currency: string
}

export default function ExchangeCard({ title, value, currency }: ExchangeCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <CurrencyIcon code={currency} className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-card-foreground">
                        {value}
                    </span>
                    <span className="text-sm text-muted-foreground">{'CUP'}</span>
                </div>
            </CardContent>
        </Card>
    )
}
