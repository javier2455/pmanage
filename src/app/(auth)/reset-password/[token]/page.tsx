"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import {
    changePasswordSchema,
    type ChangePasswordFormData,
} from "@/lib/validations/auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    CheckCircle2,
    KeyRound,
    Loader2,
    Lock,
} from "lucide-react";
import { useChangePasswordMutation } from "@/hooks/use-auth";

export default function ResetPasswordPage() {
    const params = useParams();
    const token = (params?.token as string) ?? "";
    const changePasswordMutation = useChangePasswordMutation();
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = async (data: ChangePasswordFormData) => {
        try {
            await changePasswordMutation.mutateAsync({
                password: data.password,
                token,
            });
            setSuccess(true);
            sileo.success({
                title: "Contraseña actualizada",
                description: "Ya puedes iniciar sesión con tu nueva contraseña.",
                fill: "",
                styles: {
                    title: "text-white! text-[16px]! font-bold!",
                    description: "text-white/90! text-[15px]!",
                },
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setError("root", { message: error.response.data.message });
            } else {
                setError("root", {
                    message:
                        "No se pudo cambiar la contraseña. El enlace puede haber expirado.",
                });
            }
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
                <Card className="w-full max-w-md">
                    <CardHeader className="flex flex-col items-center gap-4 pb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                            <CardTitle className="text-2xl font-bold text-card-foreground">
                                Enlace inválido
                            </CardTitle>
                            <CardDescription>
                                Este enlace no es válido o le falta información.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Link href="/forgot-password" className="w-full">
                            <Button type="button" className="w-full cursor-pointer">
                                Solicitar un nuevo enlace
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center gap-4 pb-2">
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${success ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"
                            }`}
                    >
                        {success ? (
                            <CheckCircle2 className="h-6 w-6" />
                        ) : (
                            <KeyRound className="h-6 w-6" />
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <CardTitle className="text-2xl font-bold text-card-foreground">
                            {success ? "¡Contraseña actualizada!" : "Restablecer contraseña"}
                        </CardTitle>
                        <CardDescription>
                            {success
                                ? "Tu contraseña fue cambiada correctamente."
                                : "Ingresa tu nueva contraseña a continuación."}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-4">
                    {success ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Ya puedes iniciar sesión con tu nueva contraseña.
                            </p>
                            <Link href="/login" className="w-full">
                                <Button type="button" className="w-full cursor-pointer">
                                    Ir al inicio de sesión
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password" className="text-card-foreground">
                                    Nueva contraseña
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Ingresa tu nueva contraseña"
                                        autoComplete="new-password"
                                        {...register("password")}
                                        aria-invalid={!!errors.password}
                                        className="pl-9"
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="confirm-password"
                                    className="text-card-foreground"
                                >
                                    Confirmar contraseña
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Repite tu nueva contraseña"
                                        autoComplete="new-password"
                                        {...register("confirmPassword")}
                                        aria-invalid={!!errors.confirmPassword}
                                        className="pl-9"
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

                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={changePasswordMutation.isPending}
                                aria-busy={changePasswordMutation.isPending}
                            >
                                {changePasswordMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    "Cambiar contraseña"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
