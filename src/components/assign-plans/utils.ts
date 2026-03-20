import { Crown, Gift, Sparkles, Star } from "lucide-react"
import type { PlanResponse } from "@/lib/types/plans"

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

export type PlanStyle = {
  icon: typeof Star
  color: string
  bgColor: string
  borderColor: string
  /** Estilos inline para garantizar colores (Tailwind puede no incluir clases dinámicas) */
  style: { color?: string; backgroundColor?: string; borderColor?: string }
}

export function getPlanStyle(plan: PlanResponse | { type?: string; name?: string }): PlanStyle {
  const raw = plan.type ?? plan.name ?? ""
  const type = normalize(raw)
  // Free primero: tier de entrada, neutro (slate), no confundir con basic/premium
  if (type.includes("free") || type.includes("gratis"))
    return {
      icon: Gift,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-500/20",
      // Sin inline color: respeta dark: en Badge / iconos
      style: {},
    }
  // Pro antes que basic para que "Pro Basic" / "Basic Pro" reciba estilos Pro
  if (type.includes("pro") || type.includes("profesional") || type.includes("premium") || type.includes("plus"))
    return {
      icon: Sparkles,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      style: { color: "#d97706", backgroundColor: "rgb(245 158 11 / 0.15)", borderColor: "rgb(245 158 11 / 0.4)" },
    }
  if (type.includes("basico") || type.includes("basic"))
    return {
      icon: Star,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      style: { color: "#2563eb", backgroundColor: "rgb(59 130 246 / 0.15)", borderColor: "rgb(59 130 246 / 0.4)" },
    }
  if (type.includes("custom") || type.includes("personalizado"))
    return {
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      style: { color: "#9333ea", backgroundColor: "rgb(168 85 247 / 0.15)", borderColor: "rgb(168 85 247 / 0.4)" },
    }
  return {
    icon: Star,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    style: {},
  }
}

/** Estilo unificado para funcionalidades Pro (sidebar, navbar, etc.) */
export const PRO_STYLE = {
  icon: Sparkles,
  color: "text-amber-600 dark:text-amber-400",
  bgColor: "bg-amber-500/10",
  borderColor: "border-amber-500/20",
  className: "flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20",
} as const
