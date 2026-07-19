import { cn } from "@/lib/utils"
import { PRO_STYLE } from "@/components/assign-plans/utils"

interface ProBadgeProps {
  className?: string
}

/**
 * Badge reutilizable para indicar funcionalidades Pro.
 * Usa los estilos unificados de PRO_STYLE (Sparkles icon, tema amber).
 *
 * `shrink-0` (badge e icono) es imprescindible: en el sidebar el botón aplica
 * `[&>span:last-child]:truncate` sobre este badge (último span), y por la regla
 * de flexbox `overflow:hidden` ⇒ `min-width:0`, lo que dejaba que el badge —y
 * su icono— se comprimieran cuando la etiqueta del menú era larga (Trabajadores
 * sin icono, Proveedores con icono a medias). El truncado debe recaer en la
 * etiqueta, no en el badge.
 */
export function ProBadge({ className }: ProBadgeProps) {
  return (
    <span className={cn("ml-auto shrink-0", PRO_STYLE.className, className)}>
      <PRO_STYLE.icon className="size-2.5 shrink-0" />
      Pro
    </span>
  )
}
