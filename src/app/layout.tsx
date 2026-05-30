import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIADTL - Sistema Informasaun Orsamentu Igreja Evangelika Asembleia de Deus Timor-Leste",
  description: "Sistema ida ne'e ajuda igreja sira atu hatama relatóriu finanseiru no monitoriza osan tama no gastu iha nível nasional.",
  keywords: ["SIADTL", "Igreja", "Timor-Leste", "Orsamentu", "Finanseiru", "Asembleia de Deus"],
  authors: [{ name: "Igreja Evangelika Asembleia de Deus Timor-Leste" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-TL" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
