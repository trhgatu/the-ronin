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
import { useTheme } from "next-themes";

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const TECH_LANGS = ["TypeScript", "JavaScript", "Golang", "Rust", "Python"];
const TECH_VISUALS = ["React", "NextJS", "Tailwind", "Vite", "GSAP", "ThreeJS", "Framer", "CSS", "Sass", "HTML"];
const TECH_FOUNDATION = ["NodeJS", "Express", "NestJS", "PostgreSQL", "MongoDB", "Redis", "Prisma", "Supabase", "Firebase", "GraphQL"];
const TECH_WORKSHOP = ["Git", "Github", "Docker", "Kubernetes", "VScode", "Vercel", "Figma", "Postman", "Grafana"];

const TechCard = ({ name }: { name: string }) => {
  return (
    <div className="flex-shrink-0 w-56 h-16 md:w-64 md:h-[72px] mx-2 md:mx-4 relative overflow-hidden border border-foreground/20 bg-background/50 rounded-none p-4 group transition-all duration-700 flex items-center justify-between cursor-none">

      {/* Torn Edge Washi Paper Filter applied to border */}
      <div
        className="absolute inset-0 border border-foreground/10 z-10 pointer-events-none group-hover:border-foreground/30 transition-colors duration-700"
        style={{ filter: "url(#line-torn-filter)" }}
      />

      {/* Ink brush sweep on hover */}
      <div className="absolute top-0 left-0 w-0 h-full bg-foreground/[0.04] group-hover:w-full transition-all duration-1000 ease-out z-0" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-8 h-8 md:w-10 md:h-10 relative flex items-center justify-center opacity-60 grayscale contrast-125 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-95 group-hover:scale-110">
          <Image
            src={`https://skillicons.dev/icons?i=${name.toLowerCase()}`}
            alt={name}
            width={36}
            height={36}
            className="w-full h-full"
            unoptimized
          />
        </div>

        <h3 className="text-sm md:text-base font-serif font-semibold text-foreground/70 uppercase tracking-widest group-hover:text-foreground transition-all duration-700">
          {name}
        </h3>
      </div>

      {/* Tiny Japanese Calligraphy Accent (Meaning: Tool/Weapon/Art - Jutsu) */}
      <div className="relative z-10 text-foreground/20 font-serif font-bold text-lg md:text-xl group-hover:text-foreground/40 transition-colors duration-700">
        術
      </div>
    </div>
  );
};

const DataLine = ({ text }: { text: string }) => (
  <div className="flex-shrink-0 mx-6 md:mx-10 text-[10px] md:text-xs font-serif text-foreground/40 uppercase tracking-[0.4em] md:tracking-[0.6em] whitespace-nowrap italic py-2 md:py-4 flex items-center gap-6">
    <span>{text}</span>
    <div className="w-12 md:w-16 h-[1px] bg-foreground/20" style={{ filter: "url(#line-torn-filter)" }} />
    <span>{text}</span>
    <div className="w-12 md:w-16 h-[1px] bg-foreground/20" style={{ filter: "url(#line-torn-filter)" }} />
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
    <div className="flex overflow-hidden whitespace-nowrap flex-nowrap py-2 md:py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div className="flex whitespace-nowrap flex-nowrap items-center" style={{ x }}>
        {children}{children}{children}{children}
      </motion.div>
    </div>
  );
};

export const Stack = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.to(".tech-title-1", {
      x: -30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".tech-title-2", {
      x: 30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.from(".stack-reveal-top", {
      y: -20,
      opacity: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      }
    });
  }, { scope: containerRef });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section
      ref={containerRef}
      id="stack"
      className="relative py-28 md:py-48 lg:py-60 bg-background overflow-hidden select-none z-10"
    >
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="relative z-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 mb-20 md:mb-32 text-left relative">
          <div
            className="hidden md:block absolute right-[2%] lg:right-[5%] top-[-20%] lg:top-[-30%] w-[350px] lg:w-[500px] h-[500px] lg:h-[700px] opacity-80 mix-blend-multiply dark:mix-blend-screen pointer-events-none stack-reveal-top z-0"
            style={{ filter: isDark ? "invert(1)" : "invert(0)" }}
          >
            <Image
              src="/images/samurai.png"
              alt="Ronin Samurai"
              fill
              className="object-contain object-right-top"
              priority
            />
          </div>

          <div className="flex items-center gap-4 mb-8 w-full stack-reveal-top relative z-10">
            <div className="flex items-center font-mono text-foreground/75">
              <span className="text-[10px] md:text-[12px] tracking-[0.5em] uppercase font-bold">
                [ CHAPTER III : THE ARSENAL ]
              </span>
            </div>
            <div className="h-[2px] flex-1 bg-foreground/15" style={{ filter: "url(#line-torn-filter)" }} />
          </div>

          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light uppercase text-foreground tracking-tighter leading-[0.85] lg:leading-[0.8] overflow-visible stack-reveal-top">
            <span className="inline-block tech-title-1">RONIN&apos;S</span> <br />
            <span className="inline-block tech-title-2 text-transparent ml-[5%] md:ml-[15%]" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}>
              ARMORY.
            </span>
          </h2>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-between mt-12 stack-reveal-top">
            <p className="text-xl md:text-3xl font-light text-foreground/45 max-w-2xl leading-tight tracking-tight">
              A master requires no specific sword, but intimately understands every blade. A disciplined mastery of <span className="text-foreground font-semibold underline decoration-foreground/30 underline-offset-4">modern architectural tools</span>.
            </p>
          </div>
        </div>

        {/* The Marquee Arsenal Section - Slightly tilted like a calligraphy scroll */}
        <div className="relative rotate-[-2deg] scale-105 md:scale-105 py-6 md:py-10 bg-foreground/[0.02]">
          {/* Apply filter only to the border background layer to prevent text/logo distortion */}
          <div
            className="absolute inset-0 border-y border-foreground/10 pointer-events-none"
            style={{ filter: "url(#line-torn-filter)" }}
          />
          <div className="absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

          <div className="flex flex-col gap-2 md:gap-4 relative z-10">
            <KineticMarquee baseVelocity={-0.5}>
              {TECH_LANGS.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>

            <KineticMarquee baseVelocity={1.0}>
              <DataLine text="POLISH THE BLADE TEN THOUSAND DAYS TO PERFECT THE ART" />
            </KineticMarquee>

            <KineticMarquee baseVelocity={-0.3}>
              {TECH_VISUALS.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>

            <KineticMarquee baseVelocity={0.8}>
              <DataLine text="PERCEPTION IS STRONG, SIGHT IS WEAK — FOCUS BEYOND THE SURFACE" />
            </KineticMarquee>

            <KineticMarquee baseVelocity={-0.6}>
              {TECH_FOUNDATION.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>

            <KineticMarquee baseVelocity={1.2}>
              <DataLine text="PRACTICE A THOUSAND DAYS TO FORGE THE SPIRIT" />
            </KineticMarquee>

            <KineticMarquee baseVelocity={-0.4}>
              {TECH_WORKSHOP.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>
          </div>
        </div>
      </div>
    </section>
  );
};

