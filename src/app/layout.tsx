import type { Metadata } from "next";
import { poppins } from "@/fonts";
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
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
      >
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
