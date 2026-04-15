"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Check,
    X,
    Sparkles,
    Shield,
    Crown,
    ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type StoredPlan = {
    name?: string
    type?: string
}

function normalizePlanKey(raw: string | undefined | null) {
    return String(raw ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}

const plans = [
    {
        name: "Gratuito",
        description: "Perfecto para probar la plataforma sin compromiso.",
        price: 0,
        period: "mes",
        icon: Shield,
        features: [
            { text: "Hasta 50 productos", included: true },
            { text: "100 ventas por mes", included: true },
            { text: "1 usuario", included: true },
            { text: "Cierre diario basico", included: true },
            { text: "Soporte por correo", included: true },
            { text: "Registro de ingresos", included: false },
            { text: "Tipo de cambio automatico", included: false },
            { text: "Reportes avanzados", included: false },
            { text: "Cierre mensual", included: false },
            { text: "Integracion facturacion", included: false },
        ],
    },
    {
        name: "Básico",
        description: "Ideal para negocios que estan comenzando y necesitan lo esencial.",
        price: 100,
        period: "mes",
        icon: Sparkles,
        features: [
            { text: "Hasta 500 productos", included: true },
            { text: "Ventas ilimitadas", included: true },
            { text: "3 usuarios", included: true },
            { text: "Cierre diario completo", included: true },
            { text: "Soporte prioritario", included: true },
            { text: "Registro de ingresos", included: true },
            { text: "Tipo de cambio automatico", included: true },
            { text: "Reportes basicos", included: true },
            { text: "Cierre mensual", included: false },
            { text: "Integracion facturacion", included: false },
        ],
    },
    {
        name: "Pro",
        description: "Para negocios en crecimiento que necesitan control total.",
        price: 200,
        period: "mes",
        icon: Crown,
        features: [
            { text: "Productos ilimitados", included: true },
            { text: "Ventas ilimitadas", included: true },
            { text: "Usuarios ilimitados", included: true },
            { text: "Cierre diario avanzado", included: true },
            { text: "Soporte 24/7", included: true },
            { text: "Registro de ingresos", included: true },
            { text: "Tipo de cambio automatico", included: true },
            { text: "Reportes avanzados y exportacion", included: true },
            { text: "Cierre mensual y anual", included: true },
            { text: "Integracion facturacion", included: true },
        ],
    },
] as const

export default function ChangePlanPage() {
    const [storedPlan, setStoredPlan] = useState<StoredPlan | null>(null)

    useEffect(() => {
        const stored = sessionStorage.getItem("user")
        if (!stored) return
        try {
            const parsed = JSON.parse(stored)
            queueMicrotask(() => setStoredPlan(parsed?.plan ?? null))
        } catch {
            // ignore invalid session data
        }
    }, [])

    const currentPlanKey = useMemo(() => {
        const byType = normalizePlanKey(storedPlan?.type)
        const byName = normalizePlanKey(storedPlan?.name)
        return byType || byName
    }, [storedPlan?.name, storedPlan?.type])

    const plansWithCurrent = useMemo(() => {
        return plans.map((p) => {
            const key = normalizePlanKey(p.name)
            const current =
                currentPlanKey.length > 0 &&
                (currentPlanKey === key ||
                    (currentPlanKey === "free" && key.includes("gratuito")) ||
                    (currentPlanKey === "basic" && key.includes("basico")) ||
                    ((currentPlanKey === "pro" || currentPlanKey === "premium") && key === "pro"))

            return { ...p, current }
        })
    }, [currentPlanKey])

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/profile"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Cambiar de plan
                    </h1>
                    <p className="text-muted-foreground">
                        Selecciona el plan que mejor se adapte a tu negocio
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {plansWithCurrent.map((plan) => {
                    const Icon = plan.icon
                    return (
                        <Card
                            key={plan.name}
                            className={cn(
                                "relative flex flex-col transition-all",
                                plan.current &&
                                    "border-2 border-emerald-500 shadow-sm shadow-emerald-500/10",
                            )}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-xl text-card-foreground">
                                            {plan.name}
                                        </CardTitle>
                                    </div>
                                    {plan.current && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 px-2.5 py-0.5 text-xs font-semibold"
                                        >
                                            Plan actual
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="mt-2 min-h-[40px]">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <div className="flex items-baseline gap-1 mb-6">
                                    {plan.price === 0 ? (
                                        <span className="text-4xl font-bold text-card-foreground">
                                            Gratis
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-bold text-card-foreground">
                                                ${plan.price}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                CUP / {plan.period}
                                            </span>
                                        </>
                                    )}
                                </div>

                                <Separator className="mb-4" />

                                <ul className="flex flex-col gap-2.5">
                                    {plan.features.map((feature) => (
                                        <li key={feature.text} className="flex items-start gap-2.5">
                                            {feature.included ? (
                                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                    <Check className="h-3 w-3 text-primary" />
                                                </div>
                                            ) : (
                                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                                                    <X className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                            )}
                                            <span
                                                className={`text-sm ${feature.included
                                                    ? "text-card-foreground"
                                                    : "text-muted-foreground"
                                                    }`}
                                            >
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            {/* <CardFooter className="pt-4">
                                {plan.current ? (
                                    <Button className="w-full" variant="secondary" disabled>
                                        Plan actual
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                    >
                                        {plan.price === 0 ? "Cambiar a Free" : `Elegir ${plan.name}`}
                                    </Button>
                                )}
                            </CardFooter> */}
                        </Card>
                    )
                })}
            </div>

            <Card className="border-emerald-500/20 bg-linear-to-r from-emerald-500/5 via-transparent to-emerald-500/5">
                <CardContent className="flex flex-col items-center gap-5 py-8 text-center sm:flex-row sm:text-left">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <svg
                            className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-card-foreground">
                            ¿Quieres cambiar de plan?
                        </h3>
                        <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
                            Nuestro equipo de soporte esta disponible para ayudarte a elegir
                            el plan adecuado y gestionar el cambio de manera sencilla. Contactanos
                            por WhatsApp y te atenderemos de inmediato.
                        </p>
                    </div>
                    <Button
                        asChild
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-2"
                    >
                        <a
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Contactar por WhatsApp
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
