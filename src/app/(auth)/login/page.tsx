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
import { Store, Mail, Lock } from "lucide-react"
import Link from 'next/link'
import { useLoginMutation } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getActivePlan } from "@/lib/api/plans";
import { authRoutes } from "@/lib/routes/auth";
import { getMe } from "@/lib/api/auth";
import { getMyBusinessesList } from "@/lib/api/business";
import { setAuthCookies } from "@/lib/cookies";
import { useState } from "react";


export default function LoginPage() {
    const router = useRouter();
    const loginMutation = useLoginMutation();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

    const handleGoogleLogin = () => {
        setIsGoogleLoading(true);

        // Abrir popup con las dimensiones especificadas
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            authRoutes.google,
            'GoogleLogin',
            `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
        );

        if (!popup) {
            setIsGoogleLoading(false);
            setError("root", { message: "No se pudo abrir la ventana de autenticación. Verifica que los popups estén habilitados." });
            return;
        }

        // Escuchar mensajes del popup
        const handleMessage = async (event: MessageEvent) => {
            // Verificar que el mensaje viene de nuestro dominio
            if (!event.origin.includes('ms.dveloxsoft.com')) return;

            if (event.isTrusted) {
                const { accessToken, refreshToken } = event.data;

                try {
                    // Llamar al endpoint auth/me para obtener los datos completos del usuario
                    // Guardar token en sessionStorage antes de hacer llamadas autenticadas
                    sessionStorage.setItem("token", accessToken);
                    const user = await getMe();
                    const activePlan = await getActivePlan();

                    // Guardar datos en sessionStorage (misma forma que login email: `role` para compatibilidad con UI)
                    sessionStorage.setItem("token", accessToken);
                    sessionStorage.setItem("refresh_token", refreshToken);
                    sessionStorage.setItem(
                        "user",
                        JSON.stringify({
                            name: user.name,
                            role: user.rol,
                            email: user.email,
                            plan: user.plan,
                        })
                    );

                    const roleName = typeof user.rol === "string" ? user.rol : user.rol?.name ?? "";
                    const planType = user.plan?.type ?? user.plan?.name ?? "";
                    setAuthCookies({
                        token: accessToken,
                        role: roleName,
                        planType,
                    });

                    window.removeEventListener('message', handleMessage);
                    setIsGoogleLoading(false);

                    // Cerrar el popup si sigue abierto
                    if (popup && !popup.closed) {
                        popup.close();
                    }

                    if (activePlan?.data?.isActive || activePlan?.isActive) {
                        const businesses = await getMyBusinessesList();
                        router.push(businesses.length > 0 ? "/dashboard" : "/dashboard/business/create");
                    } else {
                        router.push("/plans");
                    }

                } catch (error) {
                    if (popup && !popup.closed) {
                        popup.close();
                    }
                    window.removeEventListener('message', handleMessage);
                    setIsGoogleLoading(false);
                    setError("root", { message: "Error al obtener los datos del usuario" });
                }
            } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
                if (popup && !popup.closed) {
                    popup.close();
                }
                window.removeEventListener('message', handleMessage);
                setIsGoogleLoading(false);
                setError("root", { message: event.data.message || "Error al iniciar sesión con Google" });
            }
        };

        window.addEventListener('message', handleMessage);

        // Verificar si el popup se cierra sin completar la autenticación
        const checkPopupClosed = setInterval(() => {
            if (popup && popup.closed) {
                clearInterval(checkPopupClosed);
                window.removeEventListener('message', handleMessage);
                setIsGoogleLoading(false);
            }
        }, 500);
    };

    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await loginMutation.mutateAsync(data);
            const { access_token, refresh_token } = response;

            /* Verificar si el usuario tiene o no un plan activo */
            // Guardar token en sessionStorage antes de llamar a getMe y getActivePlan
            sessionStorage.setItem("token", access_token);
            if (refresh_token) {
                sessionStorage.setItem("refresh_token", refresh_token);
            }
            const user = await getMe();

            const activePlan = await getActivePlan();
            if (activePlan?.data?.isActive || activePlan?.isActive) {
                sessionStorage.setItem("token", access_token);
                if (refresh_token) {
                    sessionStorage.setItem("refresh_token", refresh_token);
                }
                sessionStorage.setItem("user", JSON.stringify({ name: user.name, role: user.rol, email: user.email, plan: user.plan }));

                /* Guardar cookies */
                const roleName = typeof user.rol === "string" ? user.rol : user.rol?.name ?? "";
                const planType = user.plan?.type ?? user.plan?.name ?? "";
                setAuthCookies({
                    token: access_token,
                    role: roleName,
                    planType,
                });

                const businesses = await getMyBusinessesList();
                router.push(businesses.length > 0 ? "/dashboard" : "/dashboard/business/create");
            } else {
                /* Guardar cookies */
                const roleName = typeof user.rol === "string" ? user.rol : user.rol?.name ?? "";
                const planType = user.plan?.type ?? user.plan?.name ?? "";
                setAuthCookies({
                    token: access_token,
                    role: roleName,
                    planType,
                });
                /* Guardar cookies */
                router.push("/plans");
            }

        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error === "Unauthorized" && error.response?.data?.message === "Invalid credentials") {
                setError("root", { message: "Credenciales incorrectas" })
                return
            }
            if (axios.isAxiosError(error) && error.response?.data?.error === "Internal Server Error" && error.response?.data?.message === "User not authenticated") {
                setError("root", { message: "Usuario no activo. Comuniquese con soporte para activar su cuenta." })
                return
            }
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setError("root", { message: error.response.data.message });
            } else {
                setError("root", { message: "Error al iniciar sesión. Intenta de nuevo." });
            }
        }
    };
    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center gap-4 pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Store className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <CardTitle className="text-2xl font-bold text-card-foreground">
                            Iniciar sesión
                        </CardTitle>
                        <CardDescription>
                            Ingresa tus credenciales para acceder a VentasPro
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
                                    placeholder="admin@ventaspro.com"
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
                            <Label htmlFor="password" className="text-card-foreground">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Ingresa tu contraseña"
                                    {...register("password")}
                                    aria-invalid={!!errors.password}
                                    className="pl-9 pr-10"
                                    autoComplete="current-password"
                                />
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

                        <Button type="submit" className="w-full cursor-pointer" disabled={loginMutation.isPending}>
                            {loginMutation.isPending ? "Ingresando..." : "Iniciar sesión"}
                        </Button>
                    </form>

                    <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">o continua con</span>
                        <Separator className="flex-1" />
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
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
                        {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
                    </Button>
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
                {/* <CardFooter className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">Solo para pruebas</span>
                        <Separator className="flex-1" />
                    </div>
                    <Button onClick={handleDeleteUser} className="w-full">Eliminar usuario</Button>
                </CardFooter> */}
            </Card>
        </div>
    )
}
