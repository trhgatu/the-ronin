'use client';

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useAnimationFrame,
  useMotionValue
} from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap";
import { soundManager } from "@/lib/sound";

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

interface KakemonoScroll {
  order: string;
  kanjiOrdinal: string;
  kanji: string;
  romanji: string;
  element: string;
  title: string;
  subtitle: string;
  quote: string;
  seal: string;
  techs: string[];
}

const SCROLLS: KakemonoScroll[] = [
  {
    order: "01",
    kanjiOrdinal: "壱",
    kanji: "地",
    romanji: "CHI",
    element: "EARTH",
    title: "Groundwork & Core",
    subtitle: "Cốt Lõi Vững Chắc",
    quote: "Solid as Mount Fuji, unshakeable roots where every creation begins.",
    seal: "地印",
    techs: ["TypeScript", "JavaScript", "Go"],
  },
  {
    order: "02",
    kanjiOrdinal: "弐",
    kanji: "水",
    romanji: "SUI",
    element: "WATER",
    title: "Fluid Interfaces",
    subtitle: "Dòng Chảy Vô Định",
    quote: "Taking the shape of every vessel, calm as a mirror, unstoppable in motion.",
    seal: "水印",
    techs: ["React", "Next.js", "TailwindCSS", "GSAP", "Vite", "CSS", "HTML"],
  },
  {
    order: "03",
    kanjiOrdinal: "参",
    kanji: "火",
    romanji: "KA",
    element: "FIRE",
    title: "High-Load Systems",
    subtitle: "Lửa Luyện Thần Binh",
    quote: "Tempered under immense heat, cutting through load with absolute precision.",
    seal: "火印",
    techs: ["NestJS", "Node.js", "Express", "PostgreSQL", "MongoDB", "Redis", "Prisma", "GraphQL"],
  },
  {
    order: "04",
    kanjiOrdinal: "四",
    kanji: "風",
    romanji: "FU",
    element: "WIND",
    title: "Cloud & DevOps",
    subtitle: "Gió Thoảng Vô Vết",
    quote: "Swift as the mountain gale, leaving no unnecessary traces in the ether.",
    seal: "風印",
    techs: ["Docker", "Kubernetes", "Git", "Github", "Postman", "Grafana"],
  },
  {
    order: "05",
    kanjiOrdinal: "伍",
    kanji: "空",
    romanji: "KU",
    element: "VOID",
    title: "Cognitive AI",
    subtitle: "Hư Không Vô Tận",
    quote: "Boundless as the cosmos, where intuition and intellect strike as one.",
    seal: "空印",
    techs: ["Claude", "ChatGPT", "GitHub Copilot", "Gemini"],
  },
];

const TECH_ICON_ASSETS: Record<string, string> = {
  "Next.js": "/tech-stack/nextjs.svg",
  "React": "/tech-stack/reactjs.svg",
  "TailwindCSS": "/tech-stack/tailwindcss.svg",
  "Vite": "/tech-stack/vitejs.svg",
  "GSAP": "/tech-stack/gsap-black.svg",
  "Framer": "/tech-stack/framer-dark.svg",
  "NestJS": "/tech-stack/nestjs.svg",
  "Go": "/tech-stack/go.svg",
  "JavaScript": "/tech-stack/javascript.svg",
  "TypeScript": "/tech-stack/typescript.svg",
  "Node.js": "/tech-stack/nodejs.svg",
  "Express": "/tech-stack/expressjs-dark.svg",
  "PostgreSQL": "/tech-stack/postgresql.svg",
  "MongoDB": "/tech-stack/mongodb.svg",
  "Redis": "/tech-stack/redis.svg",
  "Prisma": "/tech-stack/prisma.svg",
  "GraphQL": "/tech-stack/graphql.svg",
  "CSS": "/tech-stack/css3.svg",
  "HTML": "/tech-stack/html5.svg",
  "Git": "/tech-stack/git.svg",
  "Github": "/tech-stack/github-light.svg",
  "Docker": "/tech-stack/docker.svg",
  "Kubernetes": "/tech-stack/kubernetes.svg",
  "Postman": "/tech-stack/postman.svg",
  "Grafana": "/tech-stack/grafana.svg",
  "Claude": "/tech-stack/claude-ai.svg",
  "GitHub Copilot": "/tech-stack/github-copilot.svg",
  "Gemini": "/tech-stack/gemini.svg",
  "ChatGPT": "/tech-stack/chatgpt.svg",
};

const TechIcon = ({ name }: { name: string }) => {
  const iconAsset = TECH_ICON_ASSETS[name];

  if (name === "Github") {
    return (
      <span
        aria-hidden="true"
        className="block h-full w-full bg-[#161412] opacity-75"
        style={{
          WebkitMask: "url('/tech-stack/github-light.svg') center / contain no-repeat",
          mask: "url('/tech-stack/github-light.svg') center / contain no-repeat",
        }}
      />
    );
  }

  if (name === "Express") {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src="/tech-stack/expressjs-dark.svg"
          alt="Express"
          width={16}
          height={16}
          className="object-contain grayscale contrast-125 opacity-70 group-hover/item:opacity-100 group-hover/item:grayscale-0 transition-all duration-300"
        />
      </div>
    );
  }

  if (iconAsset) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={iconAsset}
          alt={name}
          width={16}
          height={16}
          className="object-contain grayscale contrast-125 opacity-70 group-hover/item:opacity-100 group-hover/item:grayscale-0 transition-all duration-300 group-hover/item:scale-105"
        />
      </div>
    );
  }

  return (
    <span className="font-mono text-[9px] text-foreground/50 uppercase font-semibold">
      {name.slice(0, 2)}
    </span>
  );
};

// Kinetic Marquee Line
const DataLine = ({ text }: { text: string }) => (
  <div className="flex-shrink-0 mx-6 md:mx-10 text-lg md:text-xl font-caveat text-foreground/40 whitespace-nowrap py-2 flex items-center gap-6 lowercase select-none">
    <span>{text}</span>
    <div className="w-12 h-[1px] bg-foreground/15" />
    <span>{text}</span>
    <div className="w-12 h-[1px] bg-foreground/15" />
    <span>{text}</span>
  </div>
);

interface MarqueeProps {
  children: React.ReactNode;
  baseVelocity: number;
}

const KineticMarquee = ({ children, baseVelocity = 1 }: MarqueeProps) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 3], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`);

  useAnimationFrame((t, delta) => {
    let moveBy = baseVelocity * (delta / 1000);
    const vFactor = velocityFactor.get();
    moveBy += moveBy * vFactor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="flex overflow-hidden whitespace-nowrap flex-nowrap py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div className="flex whitespace-nowrap flex-nowrap items-center" style={{ x }}>
        {children}{children}{children}{children}
      </motion.div>
    </div>
  );
};

export const Stack = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;

    // Subtle gentle headline parallax on natural scroll
    gsap.to(".tech-title-1", {
      x: -16,
      ease: "none",
      scrollTrigger: {
        trigger: ".tech-title-trigger",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
    gsap.to(".tech-title-2", {
      x: 16,
      ease: "none",
      scrollTrigger: {
        trigger: ".tech-title-trigger",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    // Staggered ink-wash entrance for the 5 hanging scrolls
    gsap.utils.toArray<HTMLElement>(".kakemono-scroll").forEach((scroll, idx) => {
      gsap.fromTo(
        scroll,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: idx * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: scroll,
            start: "top 88%",
            once: true,
          },
        }
      );
    });
  }, { scope: containerRef, dependencies: [mounted] });

  if (!mounted) return null;

  return (
    <section
      ref={containerRef}
      id="stack"
      className="relative -mt-[100vh] pt-20 sm:pt-24 md:pt-28 pb-24 md:pb-36 bg-[#fdfdfd] text-[#161412] overflow-hidden select-none z-20 shadow-[0_-35px_90px_rgba(0,0,0,0.50)]"
      style={{
        "--background": "#fdfdfd",
        "--foreground": "#161412",
      } as React.CSSProperties}
    >
      {/* Top Mist Feather: Ethereal morning haze blending Lake into Washi */}
      <div
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none bg-gradient-to-b from-black/[0.06] to-transparent z-10"
      />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-foreground/15 z-10 shadow-[0_-1px_10px_rgba(0,0,0,0.25)]" />

      {/* Background Washi Paper Subtle Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] z-0"
        style={{
          backgroundImage: `radial-gradient(#161412 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        {/* ========================================================================= */}
        {/* HEADER: TRANQUIL MASTHEAD                                                 */}
        {/* ========================================================================= */}
        <div className="tech-title-trigger mb-12 md:mb-16 text-left relative z-10">
          {/* Classical Sumi-e Samurai Illustration blended peacefully onto Washi paper */}
          <div
            className="hidden md:block absolute right-[0%] lg:right-[3%] -top-14 lg:-top-24 w-[320px] lg:w-[440px] h-[460px] lg:h-[580px] opacity-[0.12] lg:opacity-[0.16] pointer-events-none z-0 mix-blend-multiply"
          >
            <Image
              src="/images/samurai.png"
              alt="Ronin Samurai Sumi-e Art"
              fill
              sizes="(max-width: 768px) 0vw, (max-width: 1024px) 320px, 440px"
              className="object-contain object-right-top contrast-125"
              priority
            />
          </div>

          <div className="flex items-center gap-4 mb-6 w-full relative z-10">
            <span className="font-mono text-[10px] sm:text-xs tracking-[0.4em] uppercase font-bold text-foreground/50">
              [ CHAPTER III : THE ARSENAL ]
            </span>
            <div className="h-px flex-1 bg-foreground/10" />
          </div>

          <h2 className="font-serif font-light text-foreground uppercase tracking-tight leading-[0.88] text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl relative z-10">
            <span className="inline-block tech-title-1">RONIN&apos;S</span> <br />
            <span
              className="inline-block tech-title-2 text-transparent ml-[3%] md:ml-[8%]"
              style={{ WebkitTextStroke: "1.5px var(--foreground)" }}
            >
              ARMORY.
            </span>
          </h2>

          <p className="mt-6 md:mt-8 font-caveat text-2xl sm:text-3xl md:text-4xl text-foreground/60 tracking-wide font-normal max-w-2xl relative z-10">
            &ldquo;A master requires no specific sword, but intimately understands every blade.&rdquo;
          </p>
        </div>

        {/* ========================================================================= */}
        {/* KAKEMONO EDITORIAL SCROLLS: 5 HANGING SUMI-E PARCHMENTS                   */}
        {/* ========================================================================= */}
        <div
          className="border-y border-foreground/15 grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-foreground/15 relative z-20 bg-background/30 backdrop-blur-[2px]"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {SCROLLS.map((scroll, idx) => {
            const isHovered = hoveredIndex === idx;
            const isAnyHovered = hoveredIndex !== null;
            const isFaded = isAnyHovered && !isHovered;

            return (
              <div
                key={scroll.order}
                onMouseEnter={() => {
                  setHoveredIndex(idx);
                  soundManager?.playSwordWhoosh();
                }}
                className={`kakemono-scroll group relative p-6 sm:p-7 lg:p-8 flex flex-col justify-between transition-all duration-500 ease-out cursor-default ${isFaded ? "opacity-45 md:opacity-40" : "opacity-100"
                  } ${isHovered ? "bg-foreground/[0.02]" : "bg-transparent"}`}
              >
                {/* Subtle vertical hanging rod accent line at the top */}
                <div className="absolute top-0 left-6 right-6 h-[2px] bg-foreground/10 group-hover:bg-foreground/30 transition-colors" />

                {/* Ambient Calligraphic Kanji Watermark in background */}
                <div className="absolute right-2 top-24 pointer-events-none select-none transition-all duration-700 group-hover:scale-105 group-hover:translate-x-1 opacity-[0.035] group-hover:opacity-[0.07]">
                  <span className="font-serif text-8xl lg:text-[110px] font-black leading-none">
                    {scroll.kanji}
                  </span>
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* SCROLL TOP: ORDINAL, RED HANKO SEAL, & CALLIGRAPHIC HEADING       */}
                {/* ----------------------------------------------------------------- */}
                <div className="relative z-10">
                  {/* Top Bar: Book Ordinal & Vermilion Red Inkan Stamp */}
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm font-bold text-foreground/50">
                        {scroll.kanjiOrdinal}
                      </span>
                      <span className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase">
                        // BK.{scroll.order}
                      </span>
                    </div>

                    {/* Authentic Japanese Red Hanko (印鑑) Seal Stamp */}
                    <div
                      className="w-7 h-7 rounded-[2px] border border-[#9e2a2b] text-[#9e2a2b] bg-[#9e2a2b]/[0.05] flex items-center justify-center font-serif text-[11px] font-bold tracking-tighter select-none rotate-[-1.5deg] shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-0"
                      title={`${scroll.element} Seal`}
                    >
                      {scroll.seal}
                    </div>
                  </div>

                  {/* Main Calligraphy Kanji & Element Header */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-5xl lg:text-6xl font-light text-foreground/85 group-hover:text-foreground transition-colors leading-none">
                        {scroll.kanji}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs tracking-[0.25em] font-semibold text-foreground/60 uppercase">
                          {scroll.romanji}
                        </span>
                        <span className="font-mono text-[9px] tracking-wider text-foreground/35 uppercase">
                          {scroll.element}
                        </span>
                      </div>
                    </div>

                    {/* Scroll Title & Vietnamese Subtitle */}
                    <h3 className="font-serif text-lg lg:text-xl font-light text-foreground tracking-tight mt-3">
                      {scroll.title}
                    </h3>
                  </div>

                  {/* Poetic Musashi Haiku Maxim */}
                  <p className="font-caveat text-lg lg:text-xl text-foreground/65 leading-snug my-5">
                    &ldquo;{scroll.quote}&rdquo;
                  </p>

                </div>

                {/* ----------------------------------------------------------------- */}
                {/* SCROLL BODY: PURE LITERARY TECH INSCRIPTIONS (NO BOXES/PILLS)     */}
                {/* ----------------------------------------------------------------- */}
                <div className="relative z-10 mt-2 space-y-2">
                  {scroll.techs.map((techName) => (
                    <div
                      key={techName}
                      className="group/item flex items-center gap-2.5 py-0.5 transition-all duration-200"
                    >
                      {/* Minimalist Grayscale Sumi-e Icon */}
                      <div className="w-4 h-4 relative flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover/item:scale-110">
                        <TechIcon name={techName} />
                      </div>
                      {/* Pure Typographic Name */}
                      <span className="font-serif text-sm lg:text-[15px] text-foreground/75 group-hover/item:text-foreground group-hover/item:translate-x-0.5 transition-all duration-200 font-medium">
                        {techName}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* SCROLL BOTTOM: SUBTLE FOOTER STAMP                                */}
                {/* ----------------------------------------------------------------- */}
                <div className="relative z-10 pt-6 mt-6 border-t border-foreground/10 flex items-center justify-between text-[9px] font-mono text-foreground/30">
                  <span>MA.{scroll.order}</span>
                  <span className="group-hover:text-foreground/60 transition-colors">
                    {scroll.element} DISCIPLINE
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER: TRANQUIL SUMI-E KINETIC MARQUEE                                   */}
        {/* ========================================================================= */}
        <div className="mt-16 md:mt-24 relative border-y border-foreground/10 py-4 bg-foreground/[0.01]">
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#fdfdfd] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#fdfdfd] to-transparent z-10 pointer-events-none" />

          <KineticMarquee baseVelocity={0.3}>
            <DataLine text="polish the blade ten thousand days to perfect the art // do nothing which is of no use" />
          </KineticMarquee>
        </div>
      </div>
    </section>
  );
};
