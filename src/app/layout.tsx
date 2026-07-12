import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sileo";

export const metadata: Metadata = {
  title: {
    default: "Negora",
    template: "%s · Negora",
  },
  description:
    "Sistema de gestión multimoneda para negocios reales: ventas, inventario y finanzas en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* La fuente se declara en el root layout, por lo que aplica a TODAS las
            páginas (no a una sola): el aviso de next no corresponde aquí. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Toaster position="bottom-right" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
