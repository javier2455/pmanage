import { cn } from "@/lib/utils";

/**
 * Logotipo de Negora: tarjeta oscura con el gráfico de crecimiento en degradado
 * verde. Extraído de la landing page (negora-landing) para mantener la marca
 * consistente en todo pmanage.
 */
export function NegoraLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Negora"
      className={cn(className)}
    >
      <defs>
        <linearGradient
          id="negora-logo-gradient"
          x1="2"
          y1="17"
          x2="22"
          y2="7"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0fa968" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="5" fill="#0a0e15" />
      <path
        d="M4 16.5 L9.5 11 L13.5 15 L20 8.5"
        stroke="url(#negora-logo-gradient)"
        strokeWidth="2.2"
      />
      <path
        d="M15 8.5 L20 8.5 L20 13.5"
        stroke="url(#negora-logo-gradient)"
        strokeWidth="2.2"
      />
      <circle cx="4" cy="16.5" r="1.4" fill="#34d399" />
    </svg>
  );
}
