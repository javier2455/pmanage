
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DollarSign, Euro, CreditCard } from 'lucide-react'

interface ExchangeCardProps {
    title: string
    value: string
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
                    {currency === 'USD' && <DollarSign className="h-4 w-4 text-primary" />}
                    {currency === 'EUR' && <Euro className="h-4 w-4 text-primary" />}
                    {currency === 'CUP_TRANSFERENCIA' && <CreditCard className="h-4 w-4 text-primary" />}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-card-foreground">
                        {value}
                    </span>
                    <span className="text-sm text-muted-foreground">{'MN'}</span>
                </div>
                {/* <p className="mt-1 text-xs text-muted-foreground">
                    {'1'} {currency} = {value} {'MN'}
                </p> */}
            </CardContent>
        </Card>
    )
}
