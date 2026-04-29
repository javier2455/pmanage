import { Badge } from "@/components/ui/badge"
import { CircleCheck, CircleX } from "lucide-react"

interface SaleStatusBadgeProps {
    text: string
    className?: string
}

export function StatusBadge({ text, className }: SaleStatusBadgeProps) {
    if (text.toLowerCase().includes("cancelada")) {
        return (
            <Badge variant="ghost" className="bg-destructive text-destructive-foreground border border-destructive/70">
                <CircleX className="size-3" />
                {text}
            </Badge>
        )
    }
    if (text.toLowerCase().includes("efectuada")) {
        return (
            <Badge variant="ghost" className="bg-emerald-500 text-white border border-emerald-500">
                <CircleCheck className="size-3" />
                {text}
            </Badge>
        )
    }
}
