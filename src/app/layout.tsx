import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { CustomCursor } from "@/components/shared/CustomCursor";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRHGATU | Architectural Excellence",
  description: "Transmuting the chaos of logic into the gold of legacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-accent selection:text-black`}
      >
        <div className="grain-overlay" />
        <SmoothScroll>
          <CustomCursor />
          <Navbar />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
