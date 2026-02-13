"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, X, MessageCircle, Zap, Shield } from "lucide-react"

const plans = [
    {
        name: "Basico",
        description: "Ideal para negocios que estan comenzando y necesitan lo esencial.",
        price: 299,
        period: "mes",
        badge: null,
        features: [
            { text: "Hasta 500 ventas por mes", included: true },
            { text: "1 punto de venta", included: true },
            { text: "Registro de ingresos", included: true },
            { text: "Cierre contable diario", included: true },
            { text: "Tipo de cambio manual", included: true },
            { text: "Soporte por correo", included: true },
            { text: "Cierre contable mensual", included: false },
            { text: "Multiples usuarios", included: false },
            { text: "Reportes avanzados", included: false },
            { text: "Integracion con facturacion", included: false },
        ],
        highlighted: false,
    },
    {
        name: "Pro",
        description: "Para negocios en crecimiento que necesitan control total.",
        price: 799,
        period: "mes",
        badge: "Recomendado",
        features: [
            { text: "Ventas ilimitadas", included: true },
            { text: "Puntos de venta ilimitados", included: true },
            { text: "Registro de ingresos", included: true },
            { text: "Cierre contable diario", included: true },
            { text: "Tipo de cambio automatico", included: true },
            { text: "Soporte prioritario 24/7", included: true },
            { text: "Cierre contable mensual", included: true },
            { text: "Hasta 10 usuarios", included: true },
            { text: "Reportes avanzados y exportacion", included: true },
            { text: "Integracion con facturacion", included: true },
        ],
        highlighted: true,
    },
]

const WHATSAPP_NUMBER = "5215512345678"
const WHATSAPP_MESSAGE = encodeURIComponent(
    "Hola, estoy interesado en conocer mas sobre los planes de VentasPro."
)

export default function PlansPage() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

    function handleSelect(planName: string) {
        setSelectedPlan(planName)
    }

    return (
        <section className="p-6">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Planes de pago
                        </h1>
                        <p className="text-muted-foreground">
                            Elige el plan que mejor se adapte a las necesidades de tu negocio
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {plans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`relative flex flex-col transition-all ${plan.highlighted
                                    ? "border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                                    : ""
                                    } ${selectedPlan === plan.name
                                        ? "ring-2 ring-primary"
                                        : ""
                                    }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                                            <Zap className="mr-1 h-3 w-3" />
                                            {plan.badge}
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${plan.highlighted
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {plan.highlighted ? (
                                                <Zap className="h-4 w-4" />
                                            ) : (
                                                <Shield className="h-4 w-4" />
                                            )}
                                        </div>
                                        <CardTitle className="text-lg text-card-foreground">
                                            {plan.name}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="mt-2">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-bold text-card-foreground">
                                            ${plan.price}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            MXN / {plan.period}
                                        </span>
                                    </div>

                                    <Separator className="mb-4" />

                                    <ul className="flex flex-col gap-3">
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature.text}
                                                className="flex items-start gap-3"
                                            >
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

                                <CardFooter className="pt-4">
                                    <Button
                                        className="w-full"
                                        variant={plan.highlighted ? "default" : "outline"}
                                        onClick={() => handleSelect(plan.name)}
                                    >
                                        {selectedPlan === plan.name
                                            ? "Plan seleccionado"
                                            : `Elegir ${plan.name}`}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <Separator />

                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                                <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-card-foreground">
                                    Necesitas ayuda para decidir?
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Nuestro equipo de soporte puede asesorarte y resolver cualquier
                                    duda sobre los planes y funcionalidades.
                                </p>
                            </div>
                            <Button
                                asChild
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                            >
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
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
            </div>
        </section>
    )
}
