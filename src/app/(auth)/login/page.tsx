"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { NegoraLogo } from "@/components/brand/negora-logo"
import Link from 'next/link'
import { useLoginMutation } from "@/hooks/use-auth";
import { extractApiErrorMessage } from "@/lib/api-error";
import { usePostLogin } from "@/hooks/use-post-login";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useState } from "react";
import { LoginTypeSelectionModal } from "@/components/auth/login-type-selection-modal";

/**
 * Mensaje que ve el usuario cuando falla el login. `extractApiErrorMessage`
 * saca el texto real del envoltorio del gateway (que llega como JSON dentro
 * de `message`); aquí solo traducimos los códigos que el backend todavía
 * responde en inglés.
 */
const LOGIN_ERROR_TRANSLATIONS: Record<string, string> = {
    "invalid credentials": "Credenciales incorrectas",
    "user not authenticated":
        "Usuario no activo. Comuniquese con soporte para activar su cuenta.",
};

function getLoginErrorMessage(error: unknown): string {
    const message = extractApiErrorMessage(
        error,
        "Error al iniciar sesión. Intenta de nuevo.",
    );
    return LOGIN_ERROR_TRANSLATIONS[message.toLowerCase()] ?? message;
}

export default function LoginPage() {
    const loginMutation = useLoginMutation();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isGoogleBusy, setIsGoogleBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const showRootError = (message: string) => setError("root", { message });

    /* Persistir sesión, consultar /auth/me y enrutar: es idéntico para el
       formulario y para Google, y lo comparte con la pantalla de registro. */
    const { completeLogin, loginTypeModal } = usePostLogin({
        onError: showRootError,
    });

    const isSubmitBusy = isAuthenticating || loginMutation.isPending;
    const isAnyAuthBusy = isSubmitBusy || isGoogleBusy;

    const onSubmit = async (data: LoginFormData) => {
        setIsAuthenticating(true);
        try {
            const response = await loginMutation.mutateAsync(data);
            await completeLogin({
                accessToken: response.access_token,
                refreshToken: response.refresh_token,
            });
        } catch (error) {
            setIsAuthenticating(false);
            showRootError(getLoginErrorMessage(error));
        }
    };

    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center gap-4 pb-2">
                    <NegoraLogo className="h-12 w-12 rounded-xl" />
                    <div className="flex flex-col items-center gap-1">
                        <CardTitle className="text-2xl font-bold text-card-foreground">
                            Iniciar sesión
                        </CardTitle>
                        <CardDescription>
                            Ingresa tus credenciales para acceder a Negora
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email" className="text-card-foreground">
                                Correo electrónico
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@negora.com"
                                    autoComplete="email"
                                    {...register("email")}
                                    aria-invalid={!!errors.email}
                                    className="pl-9"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive" role="alert">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-card-foreground">
                                    Contraseña
                                </Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-primary hover:underline underline-offset-4"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ingresa tu contraseña"
                                    {...register("password")}
                                    aria-invalid={!!errors.password}
                                    className="pl-9 pr-10"
                                    autoComplete="current-password"
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

                        {errors.root && (
                            <p className="text-sm text-destructive" role="alert">
                                {errors.root.message}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full cursor-pointer"
                            disabled={isAnyAuthBusy}
                            aria-busy={isSubmitBusy}
                        >
                            {isSubmitBusy ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                "Iniciar sesión"
                            )}
                        </Button>
                    </form>

                    <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">o continua con</span>
                        <Separator className="flex-1" />
                    </div>

                    <GoogleAuthButton
                        onSuccess={completeLogin}
                        onError={showRootError}
                        onBusyChange={setIsGoogleBusy}
                        disabled={isSubmitBusy}
                    />

                    <p className="text-center text-sm text-muted-foreground">
                        {"No tienes una cuenta? "}
                        <Link
                            href="/register"
                            className="font-medium text-primary hover:underline underline-offset-4"
                        >
                            Registrate
                        </Link>
                    </p>
                </CardContent>
            </Card>
            <LoginTypeSelectionModal {...loginTypeModal} />
        </div>
    )
}
