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
  Rocket,
} from "lucide-react"
import Link from "next/link"
import { useAuthUserData } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function ProfilePage() {
  const { data: user, isLoading } = useAuthUserData();
  console.log('user data', user);

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
                  {user?.plan?.name}
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
                    ${user?.plan?.price}
                  </span>
                  <span className="text-sm text-muted-foreground">CUP / mes</span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {user?.plan?.description}
                </p>

                <Separator />

                <div className="grid gap-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Max. productos
                      </span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {user?.plan?.maxProducts}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Tipo de plan
                      </span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">
                      {user?.plan?.name}
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
                      {formatDate(user?.plan?.createdAt)}
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
                      {formatDate(user?.plan?.updatedAt)}
                    </span>
                  </div>
                </div>

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
        <Card className="lg:col-span-2">
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
        </Card>
      </div>
    </div>
  )
}
