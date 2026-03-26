"use client";

import { useState } from "react";
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
import { User, Mail, Lock, Pencil, X, Save } from "lucide-react";

function EditableFieldWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-primary/25" />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        <Pencil className="h-3 w-3 text-primary/50" />
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Perfil
        </h1>
        <p className="text-muted-foreground">Información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Datos de la cuenta
                </CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Modifica los campos que deseas actualizar"
                    : "Los campos con el indicador pueden editarse"}
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Nombre completo */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-card-foreground">
                  Nombre completo
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      className="pl-9"
                    />
                  </div>
                ) : (
                  <EditableFieldWrapper>
                    <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <User className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">-</span>
                    </div>
                  </EditableFieldWrapper>
                )}
              </div>

              {/* Correo electrónico */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo electrónico
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      className="pl-9"
                    />
                  </div>
                ) : (
                  <EditableFieldWrapper>
                    <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <Mail className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">-</span>
                    </div>
                  </EditableFieldWrapper>
                )}
              </div>
            </div>

            {/* Contraseña */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-card-foreground">
                  {isEditing ? "Nueva contraseña" : "Contraseña"}
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      className="pl-9"
                    />
                  </div>
                ) : (
                  <EditableFieldWrapper>
                    <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <Lock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm tracking-widest text-foreground">
                        ••••••••
                      </span>
                    </div>
                  </EditableFieldWrapper>
                )}
              </div>

              {/* Confirmar contraseña — solo en modo edición */}
              {isEditing && (
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
                      placeholder="Repite tu contraseña"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
