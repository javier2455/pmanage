import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sileo";

export const metadata: Metadata = {
  title: "Sistema de Gestión de Negocios",
  description: "Sistema de Gestión para todo tipo de negocios",
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
