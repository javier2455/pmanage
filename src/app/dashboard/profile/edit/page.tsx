"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateUserSchema, type UpdateUserFormData } from "@/lib/validations/user"
import { useAuthUserData } from "@/hooks/use-auth"
import { useUpdateUserMutation } from "@/hooks/use-user"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  Camera,
  FileText,
  X,
  Save,
} from "lucide-react"
import Link from "next/link"
import { sileo } from "sileo"
import axios from "axios"

export default function EditProfilePage() {
  const router = useRouter()
  const { data: user } = useAuthUserData()
  const updateUserMutation = useUpdateUserMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      description: "",
      phone: user?.phone ?? "",
      password: "",
      confirmPassword: "",
    },
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function clearAvatar() {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function onSubmit(data: UpdateUserFormData) {
    if (!user?.id) return

    try {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        payload: {
          name: data.name || undefined,
          description: data.description || undefined,
          phone: data.phone || undefined,
          password: data.password || undefined,
          avatar: avatarFile ?? undefined,
        },
      })

      sileo.success({
        title: "Perfil actualizado",
        description: "Los datos de tu cuenta han sido guardados correctamente",
        fill: "",
        styles: {
          title: "text-white! text-[16px]! font-bold!",
          description: "text-white/90! text-[15px]!",
        },
      })

      router.push("/dashboard/profile")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          description: error.response?.data?.message ?? "No se pudo actualizar el perfil",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        })
      } else {
        sileo.error({
          title: "Error",
          description: "No se pudo actualizar el perfil. Intenta de nuevo.",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        })
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Editar perfil
          </h1>
          <p className="text-muted-foreground">
            Actualiza tu información personal y contraseña
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Datos personales
                </CardTitle>
                <CardDescription>
                  Nombre, teléfono y foto de perfil
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Avatar */}
            <div className="flex flex-col gap-2">
              <Label className="text-card-foreground">Foto de perfil</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Preview" />
                    ) : user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={clearAvatar}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {avatarPreview ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o WEBP. Máximo 2MB.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-2">
              {/* Nombre */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-card-foreground">
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre completo"
                    className="pl-9"
                    {...register("name")}
                    aria-invalid={!!errors.name}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-card-foreground">
                  Teléfono{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+53 5555 5555"
                    className="pl-9"
                    {...register("phone")}
                    aria-invalid={!!errors.phone}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Correo (solo lectura) */}
            <div className="flex flex-col gap-2">
              <Label className="text-card-foreground">Correo electrónico</Label>
              <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                <Mail className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground">{user?.email ?? "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                El correo no puede modificarse desde aquí.
              </p>
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-card-foreground">
                Descripción{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="description"
                  type="text"
                  placeholder="Una breve descripción sobre ti"
                  className="pl-9"
                  {...register("description")}
                  aria-invalid={!!errors.description}
                />
              </div>
              {errors.description && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">Seguridad</CardTitle>
                <CardDescription>
                  Deja los campos en blanco si no deseas cambiar la contraseña
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-2">
              {/* Nueva contraseña */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-card-foreground">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="pl-9"
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password" className="text-card-foreground">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repite tu contraseña"
                    className="pl-9"
                    {...register("confirmPassword")}
                    aria-invalid={!!errors.confirmPassword}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/profile")}
            disabled={updateUserMutation.isPending}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={updateUserMutation.isPending}>
            <Save className="h-4 w-4" />
            {updateUserMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
