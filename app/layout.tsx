import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const font = Figtree({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = { title: "Budget", description: "Personal monthly budget manager" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await prisma.appSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return (
    <html lang="en" className={`${font.variable} ${s.theme === "dark" ? "dark" : ""}`} suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden font-sans">{children}</body>
    </html>
  );
}
