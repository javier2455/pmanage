import type { ReactNode } from "react"

interface DetailRowProps {
  label: string
  icon?: ReactNode
  children: ReactNode
}

/**
 * Fila etiqueta / valor de las fichas de proveedor. La usan tanto la página de
 * detalle como el diálogo, que antes repetía este mismo bloque a mano.
 */
export function DetailRow({ label, icon, children }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
        {children}
      </span>
    </div>
  )
}
