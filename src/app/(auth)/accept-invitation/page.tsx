"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { NegoraLogo } from "@/components/brand/negora-logo";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcceptInvitationMutation } from "@/hooks/use-invitations";

function AcceptInvitationPageContent() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const mutation = useAcceptInvitationMutation();

  if (!invitationId) {
    return (
      <ResultCard
        tone="destructive"
        icon={<AlertTriangle className="h-6 w-6" />}
        title="Invitación no válida"
        description="El enlace que utilizaste no contiene una invitación válida. Solicita uno nuevo al dueño del negocio."
        actionHref="/login"
        actionLabel="Ir al inicio de sesión"
      />
    );
  }

  if (mutation.isSuccess) {
    return (
      <ResultCard
        tone="primary"
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="¡Invitación aceptada!"
        description="Ya formas parte del negocio. Inicia sesión con tu cuenta para acceder."
        actionHref="/login"
        actionLabel="Iniciar sesión"
      />
    );
  }

  if (mutation.isError) {
    const errorMessage =
      axios.isAxiosError(mutation.error) &&
      mutation.error.response?.data?.message
        ? mutation.error.response.data.message
        : "Ocurrió un error al procesar la invitación. Intenta de nuevo más tarde.";

    return (
      <ResultCard
        tone="destructive"
        icon={<AlertTriangle className="h-6 w-6" />}
        title="No pudimos aceptar la invitación"
        description={errorMessage}
        actionHref="/login"
        actionLabel="Ir al inicio de sesión"
      />
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <NegoraLogo className="h-12 w-12 rounded-xl" />
          <div className="flex flex-col items-center gap-1 text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Aceptar invitación
            </CardTitle>
            <CardDescription>
              Has sido invitado a unirte a un negocio en Negora. Confirma para aceptar la invitación y obtener acceso.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <Button
            type="button"
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(invitationId)}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aceptando...
              </>
            ) : (
              "Aceptar invitación"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ResultCardProps {
  tone: "primary" | "destructive";
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

function ResultCard({
  tone,
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: ResultCardProps) {
  const iconWrapperClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : "bg-destructive/10 text-destructive";

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconWrapperClass}`}
          >
            {icon}
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <Button asChild className="w-full">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
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
      <AcceptInvitationPageContent />
    </Suspense>
  );
}
