"use client";

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth"
import { Lock, Mail, Store, User, Loader2, AlertTriangle } from 'lucide-react'
import { useRouter, useSearchParams } from "next/navigation";
import axios from 'axios'
import { useRegisterMutation } from '@/hooks/use-auth'
import { useQuery } from "@tanstack/react-query"
import { getInvitationInformation } from "@/lib/api/auth"
import { Suspense, useEffect } from "react"

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitation");
  const registerMutation = useRegisterMutation();

  const invitationQuery = useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: () => getInvitationInformation(invitationId as string),
    enabled: Boolean(invitationId),
    retry: false,
  });

  const isInvitationLoading = Boolean(invitationId) && invitationQuery.isLoading;
  const invitationData = invitationQuery.data?.data;
  const invitationExpired =
    Boolean(invitationId) &&
    (invitationQuery.isError || invitationQuery.data?.expired === true);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      rolId: '4',
    },
  });

  useEffect(() => {
    if (invitationData) {
      reset({
        name: invitationData.name ?? "",
        email: invitationData.email,
        password: "",
        confirmPassword: "",
        rolId: undefined,
        invitationId: invitationData.id,
      });
    }
  }, [invitationData, reset]);


  const onSubmit = async (data: RegisterFormData) => {
    try {
      const payload: RegisterFormData = invitationId
        ? { ...data, invitationId, rolId: undefined }
        : data;
      await registerMutation.mutateAsync(payload);

      const email = invitationData?.email ?? data.email;
      localStorage.setItem("userEmail", JSON.stringify(email));
      router.push("/verify");

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: error.response.data.message });
      } else {
        setError("root", { message: "Error al iniciar sesión. Intenta de nuevo." });
      }
    }
  };

  if (isInvitationLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Validando invitación...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationExpired) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center gap-4 pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <CardTitle className="text-2xl font-bold text-card-foreground">
                Invitación no válida
              </CardTitle>
              <CardDescription>
                Esta invitación ha expirado o no es válida. Solicita una nueva al dueño del negocio.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Crear cuenta
            </CardTitle>
            <CardDescription>
              {invitationData
                ? `Has sido invitado a ${invitationData.business.name}. Completa tu registro.`
                : "Registrate para comenzar a usar VentasPro"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-card-foreground">
                Nombre completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  placeholder="Tu nombre"
                  className="pl-9"
                  autoComplete="name"
                  required
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-card-foreground">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  className="pl-9 disabled:cursor-not-allowed disabled:opacity-70"
                  autoComplete="email"
                  required
                  disabled={Boolean(invitationData)}
                  readOnly={Boolean(invitationData)}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-card-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="pl-9 pr-10"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  autoComplete="new-password"
                  required
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password" className="text-card-foreground">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repite tu contrasena"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}

                  className="pl-9 pr-10"
                  autoComplete="new-password"
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {errors.root && (
              <p className="text-sm text-destructive" role="alert">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          {!invitationData && (
            <>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">o continua con</span>
                <Separator className="flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuar con Google
              </Button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {"Ya tienes una cuenta? "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Inicia sesion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
