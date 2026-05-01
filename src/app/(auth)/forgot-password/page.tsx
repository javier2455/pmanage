"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    requestPasswordResetSchema,
    type RequestPasswordResetFormData,
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
import { ArrowLeft, KeyRound, Loader2, Mail, MailCheck } from "lucide-react";
import { useRequestPasswordResetMutation } from "@/hooks/use-auth";

export default function ForgotPasswordPage() {
    const requestResetMutation = useRequestPasswordResetMutation();
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<RequestPasswordResetFormData>({
        resolver: zodResolver(requestPasswordResetSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (data: RequestPasswordResetFormData) => {
        try {
            const urlCallback = `${window.location.origin}/reset-password`;
            await requestResetMutation.mutateAsync({
                email: data.email,
                urlCallback,
            });
            setSubmittedEmail(data.email);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setError("root", { message: error.response.data.message });
            } else {
                setError("root", {
                    message: "No se pudo enviar el correo. Intenta de nuevo.",
                });
            }
        }
    };

    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center gap-4 pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        {submittedEmail ? (
                            <MailCheck className="h-6 w-6" />
                        ) : (
                            <KeyRound className="h-6 w-6" />
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <CardTitle className="text-2xl font-bold text-card-foreground">
                            {submittedEmail ? "Revisa tu correo" : "Recuperar contraseña"}
                        </CardTitle>
                        <CardDescription>
                            {submittedEmail
                                ? "Te enviamos un enlace para restablecer tu contraseña."
                                : "Ingresa tu correo y te enviaremos un enlace para restablecerla."}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-4">
                    {submittedEmail ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Enviamos un correo a{" "}
                                <span className="font-medium text-card-foreground">
                                    {submittedEmail}
                                </span>{" "}
                                con instrucciones para restablecer tu contraseña. Revisa tu
                                bandeja de entrada (y la carpeta de spam).
                            </p>
                            <Link href="/login" className="w-full">
                                <Button type="button" className="w-full cursor-pointer">
                                    Volver al inicio de sesión
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email" className="text-card-foreground">
                                    Correo electrónico
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="tucorreo@ejemplo.com"
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

                            {errors.root && (
                                <p className="text-sm text-destructive" role="alert">
                                    {errors.root.message}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={requestResetMutation.isPending}
                                aria-busy={requestResetMutation.isPending}
                            >
                                {requestResetMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar enlace"
                                )}
                            </Button>

                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver al inicio de sesión
                            </Link>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
