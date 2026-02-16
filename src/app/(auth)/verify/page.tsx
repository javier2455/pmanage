"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { verifySchema, type VerifyFormData } from "@/lib/validations/auth"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, RefreshCw, MailCheck } from "lucide-react"
import axios, { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import { authRoutes } from "@/lib/routes/auth";


const CODE_LENGTH = 6

export default function VerifyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const {
        setValue,
        watch,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<VerifyFormData>({
        resolver: zodResolver(verifySchema),
        defaultValues: { code: "" },
    })

    const code = watch("code")
    const digits = code.split("").concat(Array(CODE_LENGTH).fill("")).slice(0, CODE_LENGTH)
    const isComplete = code?.length === CODE_LENGTH

    const focusInput = useCallback((index: number) => {
        inputRefs.current[index]?.focus()
    }, [])

    useEffect(() => {
        focusInput(0)
    }, [focusInput])

    function handleChange(index: number, value: string) {
        if (!/^\d*$/.test(value)) return

        const digit = value.slice(-1)
        const newDigits = [...digits]
        newDigits[index] = digit
        const newCode = newDigits.join("")
        setValue("code", newCode)
        clearErrors("code")

        if (digit && index < CODE_LENGTH - 1) {
            focusInput(index + 1)
        }
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace") {
            if (!digits[index] && index > 0) {
                const newDigits = [...digits]
                newDigits[index - 1] = ""
                setValue("code", newDigits.join(""))
                focusInput(index - 1)
            } else {
                const newDigits = [...digits]
                newDigits[index] = ""
                setValue("code", newDigits.join(""))
            }
        }
        if (e.key === "ArrowLeft" && index > 0) focusInput(index - 1)
        if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) focusInput(index + 1)
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
        if (!pasted) return

        const newDigits = Array(CODE_LENGTH).fill("")
        for (let i = 0; i < pasted.length; i++) {
            newDigits[i] = pasted[i]
        }
        const newCode = newDigits.join("")
        setValue("code", newCode)
        clearErrors("code")

        const nextEmpty = newDigits.findIndex((d) => !d)
        focusInput(nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty)
    }

    async function onSubmit(data: VerifyFormData) {
        const userEmail = localStorage.getItem("userEmail")
        const parseEmail = JSON.parse(userEmail || '{}')
        if (!userEmail) {
            setError("root", { message: "Usuario no encontrado" })
            return
        }
        setLoading(true)
        try {
            const response = await axios.post(
                authRoutes.verify,
                { email: parseEmail, code: data.code },
                { headers: { "Content-Type": "application/json" } }
            )
            console.log("response of verify", response)
            if (response.data?.message === "Email verified successfully") {
                localStorage.removeItem("userEmail")
                router.push("/login")
            }
        } catch (error: unknown) {
            console.log("error of verify", error)
            if (error instanceof AxiosError) {
                if (error.response?.data?.error === "Unauthorized" && error.response?.data?.message === "Invalid verification code") {
                    setError("code", { message: "Código de verificación inválido o expirado" })
                }
            }
        } finally {
            setLoading(false)
        }
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
                            Verifica tu cuenta
                        </CardTitle>
                        <CardDescription className="text-center">
                            Hemos enviado un código de verificación de 6 dígitos a tu correo electrónico
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-4">
                    <div className="mx-auto flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                        <MailCheck className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">
                            Revisa tu bandeja de entrada
                        </span>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                        <fieldset className="flex flex-col gap-3">
                            <legend className="sr-only">Código de verificación</legend>

                            <div
                                className="flex w-full items-center justify-center gap-1.5 sm:gap-2"
                                onPaste={handlePaste}
                            >
                                {digits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        aria-label={`Dígito ${index + 1} de ${CODE_LENGTH}`}
                                        className={`h-12 w-10 flex-1 rounded-lg border-2 bg-card text-center font-mono text-lg font-semibold text-card-foreground shadow-sm transition-all sm:h-14 sm:max-w-12 sm:text-xl
                                            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                                            ${digit ? "border-primary/50" : "border-border"}
                                            ${errors.code ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""}
                                        `}
                                    />
                                ))}
                            </div>

                            {errors.code && (
                                <p className="text-center text-sm text-destructive" role="alert">
                                    {errors.code.message}
                                </p>
                            )}
                            {errors.root && (
                                <p className="text-center text-sm text-destructive" role="alert">
                                    {errors.root.message}
                                </p>
                            )}
                        </fieldset>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !isComplete}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                "Verificar código"
                            )}
                        </Button>
                    </form>

                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            ¿No recibiste el código?
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
