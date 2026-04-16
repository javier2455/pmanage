import { cn } from "@/lib/utils"
import { PRO_STYLE } from "@/components/assign-plans/utils"

interface ProBadgeProps {
  className?: string
}

/**
 * Badge reutilizable para indicar funcionalidades Pro.
 * Usa los estilos unificados de PRO_STYLE (Sparkles icon, tema amber).
 */
export function ProBadge({ className }: ProBadgeProps) {
  return (
    <span className={cn("ml-auto", PRO_STYLE.className, className)}>
      <PRO_STYLE.icon className="size-2.5" />
      Pro
    </span>
  )
}
