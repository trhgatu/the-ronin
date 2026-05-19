import type { Metadata } from "next";
import { Geist, Geist_Mono, Rock_Salt, Caveat } from "next/font/google";
import "@/app/globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { CustomCursor } from "@/components/shared/CustomCursor";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rockSalt = Rock_Salt({
  weight: "400",
  variable: "--font-rock-salt",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRHGATU | Architectural Excellence",
  description: "Transmuting the chaos of logic into the gold of legacy.",
};

import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { PageBackdrop } from "@/components/shared/PageBackdrop";
import { InkTransitionCanvas } from "@/components/shared/InkTransitionCanvas";
import { Preloader } from "@/components/shared/Preloader";
import { SoundToggle } from "@/components/shared/SoundToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('preloader-seen') !== 'true') {
                  document.documentElement.classList.add('is-loading');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rockSalt.variable} ${caveat.variable} antialiased selection:bg-accent selection:text-black`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Preloader />
          <InkTransitionCanvas />
          <PageBackdrop />
          <div className="grain-overlay" />
          <SmoothScroll>
            <CustomCursor />
            <Navbar />
            {children}
            <SoundToggle />
            <Analytics />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}

