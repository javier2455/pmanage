import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  DollarSign,
  ShoppingCart
} from "lucide-react"


interface StatsCardProps {
  title: 'Ventas del dia' | 'Transacciones';
  today: number;
  percentageChange: number;
}

export default function StatsCard({ title, today, percentageChange }: StatsCardProps) {
  return (
    <Card key={title}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {title === 'Ventas del dia' && <DollarSign className="h-4 w-4 text-muted-foreground" />}
        {title === 'Transacciones' && <ShoppingCart className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{today}</div>
        <p
          className={
            percentageChange > 0 
              ? "text-xs text-emerald-600 dark:text-emerald-500 mt-1"
              : "text-xs text-red-600 dark:text-red-500 mt-1"
          }
        >
          {percentageChange}% respecto a ayer
        </p>
      </CardContent>
    </Card>
  )
}
