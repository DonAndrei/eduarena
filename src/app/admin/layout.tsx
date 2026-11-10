import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import "../globals.css";

const barlow = Barlow_Condensed({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], variable: "--font-barlow" });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope" });

export const metadata: Metadata = { title: "Admin · EduArena", robots: { index: false }, icons: { icon: "/icon.svg" } };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${barlow.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
