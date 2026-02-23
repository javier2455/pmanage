"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { businessRoutes } from "@/lib/routes/business";


export default function LoginPage() {
    const router = useRouter();
    const loginMutation = useLoginMutation();

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

    // async function handleDeleteUser() {
    //     const user = localStorage.getItem("user")
    //     const userId = JSON.parse(user || '{}').id
    //     if (!userId) {
    //         setError("root", { message: "Usuario no encontrado" })
    //         return
    //     }
    //     try {
    //         const response = await axios.delete('https://psearch.dveloxsoft.com/api/auth/delete-user-by-id', {
    //             data: {
    //                 userId: userId
    //             },
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });
    //         console.log('response of delete user', response);
    //     } catch (error) {
    //         console.log('error of delete user', error);
    //         if (axios.isAxiosError(error) && error.response?.data?.message) {
    //             setError("root", { message: error.response.data.message });
    //         } else {
    //             setError("root", { message: "Error al eliminar usuario. Intenta de nuevo." });
    //         }
    //     }
    // }



    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await loginMutation.mutateAsync(data);
            console.log('response', response);

            const { token, user } = response.data;

            /* Verificar si el usuario tiene o no un plan activo */
            const activePlan = await getActivePlan({ userId: user.id, token });
            console.log("activePlan", activePlan);

            if (activePlan?.data?.isActive || activePlan?.isActive) {
                const response = await axios.get(businessRoutes.getMyBusinesses,{
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (response) {
                    console.log('response of get my businesses', response);
                }
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));

                router.push("/dashboard");
            } else {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                router.push("/plans");
            }

        } catch (error) {
            console.log('error of login', error);
            if (axios.isAxiosError(error) && error.response?.data?.error === "Unauthorized" && error.response?.data?.message === "Invalid credentials") {
                console.log('entro aqui')
                setError("root", { message: "Credenciales incorrectas" })
                return
            }
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                console.log('entro aqui x2')
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

                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
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
                        className="w-full"
                    // onClick={handleGoogleLogin}
                    // disabled={loading}
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
