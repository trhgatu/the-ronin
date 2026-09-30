import type { Metadata } from "next";
import { Geist, Geist_Mono, Rock_Salt, Caveat, Fraunces } from "next/font/google";
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

// The site's `font-serif` utility (the headline, the logo, every serif
// heading) had no real font behind it — Tailwind's default theme falls back
// silently to the system serif stack (Georgia/Times) when `--font-serif`
// isn't overridden, which is exactly what was happening here. Fraunces is a
// display serif built for this kind of dramatic, oversized editorial use —
// its italic in particular is far more expressive/"handcrafted" than a
// standard oblique, which suits the already-italic "SAMURAI DISCIPLINE."
// treatment specifically.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Tran Hoang Anh Tu — Software Architect & Creative Developer",
  description: "Personal portfolio of Tran Hoang Anh Tu (TRHGATU). Fusing systems engineering, NestJS/Go architectures, and interactive WebGL experiences into high-performance digital solutions.",
  keywords: [
    "Trần Hoàng Anh Tú",
    "TRHGATU",
    "Software Architect",
    "Fullstack Developer",
    "Creative Coding",
    "Next.js Portfolio",
    "Three.js",
    "Go Developer",
    "NestJS Architect",
    "Vietnam Developer"
  ],
  authors: [{ name: "Trần Hoàng Anh Tú", url: "https://thatu.dev" }],
  creator: "Trần Hoàng Anh Tú",
  openGraph: {
    title: "Trần Hoàng Anh Tú — Software Architect & Creative Developer",
    description: "Fusing systems engineering, NestJS/Go architectures, and interactive WebGL experiences into high-performance digital solutions.",
    url: "https://thatu.dev",
    siteName: "TRHGATU Portfolio",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trần Hoàng Anh Tú — Software Architect & Creative Developer",
    description: "Fusing systems engineering, NestJS/Go architectures, and interactive WebGL experiences into high-performance digital solutions.",
  },
};

import { PageBackdrop } from "@/components/shared/PageBackdrop";
import { InkTransitionCanvas } from "@/components/shared/InkTransitionCanvas";
import { Preloader } from "@/components/shared/Preloader";
import { GlobalCanvas } from "@/components/shared/GlobalCanvas";

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
        className={`${geistSans.variable} ${geistMono.variable} ${rockSalt.variable} ${caveat.variable} ${fraunces.variable} antialiased selection:bg-accent selection:text-black`}
      >
        <Preloader />
        <InkTransitionCanvas />
        <PageBackdrop />
        <GlobalCanvas />
        <SmoothScroll>
          <CustomCursor />
          <Navbar />
          {children}
          <Analytics />
        </SmoothScroll>
      </body>
    </html>
  );
}

