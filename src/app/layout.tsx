import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Calculadora de Margen Real y Precio Óptimo | E-commerce MXN",
  description:
    "Calcula en tiempo real tu utilidad neta por unidad, margen real libre, precio mínimo sugerido para 20% de margen y punto de equilibrio mensual en MXN.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f8fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh bg-[#f6f8fb] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-950">
        {children}
      </body>
    </html>
  );
}

