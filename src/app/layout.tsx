import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serifDisplay = Cormorant_Garamond({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Laporan Keuangan Gereja | Sistem Manajemen Terpusat",
  description:
    "Sistem pelaporan keuangan gereja yang elegan dan aman — menghubungkan admin pusat, wilayah, dan gereja lokal dalam satu platform transparan.",
  keywords: ["gereja", "laporan keuangan", "manajemen gereja", "persembahan", "donasi"],
  authors: [{ name: "Gereja" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${serifDisplay.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
