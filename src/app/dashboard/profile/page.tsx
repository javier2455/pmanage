"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  Pencil,
  Crown,
  Calendar,
  Package,
  Tag,
  Clock,
  History,
  RefreshCw,
  Check,
  Store,
  ChevronDown,
  ChevronUp,
  // Rocket,
} from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useAuthUserData } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { getPlanLabel } from "@/components/assign-plans/utils"
import { getPlanCatalogEntry } from "@/lib/plans-catalog"

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Funcionalidades visibles antes de expandir la lista. */
const FEATURES_PREVIEW_COUNT = 6;

export default function ProfilePage() {
  const { data: user, isLoading } = useAuthUserData();
  const [featuresExpanded, setFeaturesExpanded] = useState(false);

  // Catálogo del plan suscrito: fuente de verdad de lo que realmente oferta el plan.
  const planEntry = getPlanCatalogEntry(user?.plan);
  const includedFeatures = planEntry?.features.filter((f) => f.included) ?? [];
  const visibleFeatures = featuresExpanded
    ? includedFeatures
    : includedFeatures.slice(0, FEATURES_PREVIEW_COUNT);
  const hiddenFeaturesCount = includedFeatures.length - FEATURES_PREVIEW_COUNT;
  const maxProducts = planEntry?.maxProducts ?? user?.plan?.maxProducts;
  const maxBusinesses = planEntry?.maxBusinesses;
  // El precio lo rige el catálogo (lo que realmente cuesta el plan); el backend es solo fallback.
  const planPrice = planEntry?.monthlyPrice ?? user?.plan?.price;
  const priceCurrency = planEntry?.currency ?? "USD";
  // Nombre único para badge y "Tipo de plan" (mismo origen → siempre coinciden).
  const planName = planEntry?.name ?? getPlanLabel(user?.plan);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Mi Perfil
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu informacion personal y configuracion de cuenta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card de informacion del usuario */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg text-card-foreground">
                  Informacion personal
                </CardTitle>
              </div>
              <Link
                href="/dashboard/profile/edit"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Link>
            </div>
            <CardDescription>
              Datos de tu cuenta y contacto
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {isLoading ? (
              <>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-4 w-44" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    {user?.avatar ? (
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {user?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">Administrador</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Correo electronico
                      </span>
                      <span className="text-sm text-card-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Telefono
                      </span>
                      <span className="text-sm text-card-foreground">
                        {user?.phone || "No disponible"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card del plan activo */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Crown className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg text-card-foreground">
                  Plan activo
                </CardTitle>
              </div>
              {isLoading ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0">
                  {planName}
                </Badge>
              )}
            </div>
            <CardDescription>
              Detalles de tu suscripcion actual
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <div className="grid gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
                  <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-card-foreground">
                    {planPrice === 0 ? "Gratis" : `$${planPrice}`}
                  </span>
                  {planPrice !== 0 && (
                    <span className="text-sm text-muted-foreground">
                      {priceCurrency} / mes
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {planEntry?.description ?? user?.plan?.description}
                </p>

                <Separator />

                <div className="grid gap-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Máx. productos
                      </span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {maxProducts ?? "—"}
                    </span>
                  </div>

                  {maxBusinesses != null && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Máx. negocios
                        </span>
                      </div>
                      <span className="text-sm font-medium text-card-foreground">
                        {maxBusinesses}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Tipo de plan
                      </span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {planName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Fecha de inicio
                      </span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {formatDate(user?.plan?.startsAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Fecha de expiracion
                      </span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {formatDate(user?.plan?.expiresAt)}
                    </span>
                  </div>
                </div>

                {includedFeatures.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Incluido en tu plan
                      </span>
                      <ul className="grid gap-2.5 sm:grid-cols-2">
                        {visibleFeatures.map((feature) => (
                          <li
                            key={feature.text}
                            className="flex items-start gap-2.5"
                          >
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm text-card-foreground">
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {hiddenFeaturesCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setFeaturesExpanded((v) => !v)}
                          className="flex items-center gap-1 self-start text-sm font-medium text-primary transition-colors hover:text-primary/80"
                          aria-expanded={featuresExpanded}
                        >
                          {featuresExpanded ? (
                            <>
                              Ver menos
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Ver {hiddenFeaturesCount} más
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <Link
                    href="/dashboard/profile/plans-history"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
                  >
                    <History className="h-4 w-4" />
                    Ver historial
                  </Link>
                  <Link
                    href="/dashboard/profile/plans-change"
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Cambiar de plan
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card de funcionalidades futuras */}
        {/* <Card className="lg:col-span-2">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-card-foreground">
                Funcionalidades futuras
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Estamos trabajando en nuevas funcionalidades para mejorar tu
                experiencia. Pronto podras personalizar tu perfil, gestionar
                notificaciones y mucho mas.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0"
            >
              En desarrollo
            </Badge>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
