import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGetSaleById } from "@/hooks/use-sales"

interface DetailsDialogProps {
    saleId: string
    tooltip?: string
    trigger?: React.ReactNode
}

export default function DetailsDialog({ saleId, tooltip, trigger }: DetailsDialogProps) {
    const { data, isLoading, isError } = useGetSaleById(saleId)
    // console.log('data of useGetSaleById', data)

    const triggerContent = trigger ?? <Button variant="outline">Open Dialog</Button>
    return (
        <Dialog>
            <DialogTrigger asChild>
                {tooltip ? (
                    <span className="inline-flex">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {triggerContent}
                            </TooltipTrigger>
                            <TooltipContent>{tooltip}</TooltipContent>
                        </Tooltip>
                    </span>
                ) : triggerContent}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-[520px] shadow-lg shadow-cyan-300/30">
                <DialogHeader>
                    <DialogTitle className="text-card-foreground">
                        Resumen de venta
                    </DialogTitle>
                    {/* <DialogDescription>
                        Detalle y conversiones de moneda
                    </DialogDescription> */}
                </DialogHeader>
                <div className="flex flex-col mt-4">
                    <div className="flex items-start justify-between border-b border-border py-4 first:pt-0">
                        <span className="text-sm text-muted-foreground">Producto</span>
                        <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
                            {data?.productName ?? "--"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-4">
                        <span className="text-sm text-muted-foreground">Cantidad</span>
                        <span className="text-sm font-medium text-card-foreground tabular-nums">
                            {data?.cantidad ?? "--"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-4">
                        <span className="text-sm text-muted-foreground">
                            Precio unitario
                        </span>
                        <span className="text-sm font-medium text-card-foreground tabular-nums">
                            {data?.precio ?? "--"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-4">
                        <span className="text-sm text-muted-foreground">
                            Total
                        </span>
                        <span className="text-sm font-semibold text-card-foreground tabular-nums">
                            {data?.precio && data?.cantidad
                                ? new Intl.NumberFormat("es-CO", {
                                    style: "currency",
                                    currency: "COP",
                                }).format(Number(data.precio) * Number(data.cantidad))
                                : "--"}
                        </span>
                    </div>
                    <div className="flex items-start justify-between border-b border-border py-4">
                        <span className="text-sm text-muted-foreground">Descripción</span>
                        <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
                            {data?.descripcion || "--"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-4">
                        <span className="text-sm text-muted-foreground">Estado</span>
                        <span className={`text-sm font-medium tabular-nums ${data?.isCancelled ? "text-destructive" : "text-primary"}`}>
                            {data?.isCancelled ? "Cancelada" : "Activa"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-4">
                        <span className="text-sm text-muted-foreground">Fecha de creación</span>
                        <span className="text-sm font-medium text-card-foreground tabular-nums">
                            {data?.createdAt
                                ? new Date(data.createdAt).toLocaleDateString("es-CO", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                                : "--"}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
