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
import { Lock, Mail, User, Loader2, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { NegoraLogo } from "@/components/brand/negora-logo"
import { useRouter, useSearchParams } from "next/navigation";
import { extractApiErrorMessage } from "@/lib/api-error"
import { useRegisterMutation } from '@/hooks/use-auth'
import { useQuery } from "@tanstack/react-query"
import { getInvitationInformation } from "@/lib/api/auth"
import { usePostLogin } from "@/hooks/use-post-login"
import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { LoginTypeSelectionModal } from "@/components/auth/login-type-selection-modal"
import { Suspense, useEffect, useState } from "react"

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
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

  const [invitationRegistrationDone, setInvitationRegistrationDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);

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

  const showRootError = (message: string) => setError("root", { message });

  /* Darse de alta con Google devuelve directamente una sesión iniciada (el
     gateway crea la cuenta si no existía), así que el destino se resuelve con
     la misma lógica que usa el login. */
  const { completeLogin, loginTypeModal } = usePostLogin({
    onError: showRootError,
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
        ? {
            ...data,
            email: invitationData?.email ?? data.email,
            invitationId,
            rolId: undefined,
          }
        : data;
      await registerMutation.mutateAsync(payload);

      if (invitationId) {
        setInvitationRegistrationDone(true);
        return;
      }

      const email = data.email;
      localStorage.setItem("userEmail", JSON.stringify(email));
      router.push("/verify");

    } catch (error) {
      setError("root", {
        message: extractApiErrorMessage(
          error,
          "No se pudo completar el registro. Intenta de nuevo.",
        ),
      });
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

  if (invitationRegistrationDone) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center gap-4 pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <CardTitle className="text-2xl font-bold text-card-foreground">
                ¡Registro exitoso!
              </CardTitle>
              <CardDescription>
                Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión y acceder a {invitationData?.business?.name ?? "tu negocio"}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/login">Iniciar sesión</Link>
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
          <NegoraLogo className="h-12 w-12 rounded-xl" />
          <div className="flex flex-col items-center gap-1">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Crear cuenta
            </CardTitle>
            <CardDescription>
              {invitationData
                ? `Has sido invitado a ${invitationData.business.name}. Completa tu registro.`
                : "Registrate para comenzar a usar Negora"}
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
                  className={`pl-9 ${invitationData ? "cursor-not-allowed bg-muted opacity-70" : ""}`}
                  autoComplete="email"
                  required
                  readOnly={Boolean(invitationData)}
                  tabIndex={invitationData ? -1 : undefined}
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-9 pr-10"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contrasena"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}

                  className="pl-9 pr-10"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
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

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending || isGoogleBusy}
            >
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

              <GoogleAuthButton
                onSuccess={completeLogin}
                onError={showRootError}
                onBusyChange={setIsGoogleBusy}
                disabled={registerMutation.isPending}
              />
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
      <LoginTypeSelectionModal {...loginTypeModal} />
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
