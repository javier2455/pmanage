"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  openGoogleAuthPopup,
  isUserCancellation,
  GoogleAuthError,
  type GoogleAuthTokens,
} from "@/lib/google-oauth";

interface GoogleAuthButtonProps {
  /** Recibe los tokens tras un OAuth correcto (persistir sesión y enrutar). */
  onSuccess: (tokens: GoogleAuthTokens) => Promise<void> | void;
  /** Mensaje a mostrar al usuario cuando algo falla. */
  onError: (message: string) => void;
  /** Avisa a la pantalla para que bloquee el resto del formulario. */
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Botón "Continuar con Google" compartido por login y registro.
 *
 * Existe como componente porque la pantalla de registro tenía el botón pintado
 * pero SIN manejador: se veía igual que el del login y no hacía absolutamente
 * nada al pulsarlo. Teniendo un único componente, el alta con Google no puede
 * volver a quedarse sin cablear.
 */
export function GoogleAuthButton({
  onSuccess,
  onError,
  onBusyChange,
  disabled = false,
  label = "Continuar con Google",
  className,
}: GoogleAuthButtonProps) {
  const [isBusy, setIsBusy] = useState(false);

  const setBusy = (busy: boolean) => {
    setIsBusy(busy);
    onBusyChange?.(busy);
  };

  const handleClick = () => {
    setBusy(true);

    /* Sin `await` por delante: `openGoogleAuthPopup` llama a `window.open` de
       forma síncrona y tiene que ocurrir dentro del gesto del usuario, o el
       navegador bloquea la ventana. Por eso este manejador no es `async`. */
    openGoogleAuthPopup()
      .then(async (tokens) => {
        try {
          await onSuccess(tokens);
        } catch {
          onError(
            "Iniciaste sesión con Google, pero no se pudieron cargar los datos de tu cuenta. Vuelve a intentarlo.",
          );
        }
      })
      .catch((error: unknown) => {
        // Cerrar la ventana es una decisión del usuario, no un error.
        if (isUserCancellation(error)) return;
        onError(
          error instanceof GoogleAuthError
            ? error.message
            : "No se pudo iniciar sesión con Google. Vuelve a intentarlo.",
        );
      })
      .finally(() => setBusy(false));
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full cursor-pointer", className)}
      onClick={handleClick}
      disabled={disabled || isBusy}
      aria-busy={isBusy}
    >
      {isBusy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-4 w-4" />
      )}
      {isBusy ? "Conectando..." : label}
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
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
  );
}
