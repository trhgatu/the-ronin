'use client';

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useAnimationFrame,
  useMotionValue
} from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "next-themes";

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const BOOKS = [
  {
    id: "earth",
    kanji: "地",
    title: "The Book of Earth",
    subtitle: "Foundations & Core Platforms",
    description: "Bulletproof system design, database resilience, and deep core backbones that stand like solid rock.",
    techs: ["Golang", "Rust", "TypeScript", "JavaScript", "Python"],
  },
  {
    id: "water",
    kanji: "水",
    title: "The Book of Water",
    subtitle: "Fluid Interaction & Motion",
    description: "Adaptive motion dynamics, seamless responsiveness, and user experiences that flow like pristine liquid.",
    techs: ["React", "NextJS", "Tailwind", "Vite", "GSAP", "ThreeJS", "Framer", "CSS", "HTML"],
  },
  {
    id: "fire",
    kanji: "火",
    title: "The Book of Fire",
    subtitle: "Concurrency, Scaling & Infra Forge",
    description: "High-concurrency engineering, extreme low-latency tuning, and aggressive runtime optimizations under heavy stress.",
    techs: ["NestJS", "NodeJS", "Express", "PostgreSQL", "MongoDB", "Redis", "Prisma", "Supabase", "GraphQL"],
  },
  {
    id: "wind",
    kanji: "風",
    title: "The Book of Wind",
    subtitle: "Stealth Automation & Arsenal",
    description: "Uncompromising clean code, automated container pipelines, and modular cloud architectures.",
    techs: ["Git", "Github", "Docker", "Kubernetes", "Vercel", "Figma", "Postman", "Grafana"],
  },
];

const TechCard = ({ name }: { name: string }) => {
  return (
    <div className="flex-shrink-0 w-56 h-16 md:w-64 md:h-[72px] relative overflow-hidden border border-foreground/20 bg-background/50 rounded-none p-4 group transition-all duration-700 flex items-center justify-between cursor-none">
      <div
        className="absolute inset-0 border border-foreground/10 z-10 pointer-events-none group-hover:border-foreground/30 transition-colors duration-700"
        style={{ filter: "url(#line-torn-filter)" }}
      />
      <div className="absolute top-0 left-0 w-0 h-full bg-foreground/[0.04] group-hover:w-full transition-all duration-1000 ease-out z-0" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-8 h-8 md:w-10 md:h-10 relative flex items-center justify-center opacity-95 group-hover:opacity-100 transition-all duration-700 scale-95 group-hover:scale-110">
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
  const [activeBook, setActiveBook] = useState<string>("earth");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync GSAP measurements after height animations complete to prevent scroll jitter
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 650); // Matches the Framer Motion transition duration perfectly
      return () => clearTimeout(timer);
    }
  }, [activeBook, mounted]);

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;

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

    // Discrete Scroll-driven Triggers: perfectly stable, immune to layout shift feedback loops
    const rows = gsap.utils.toArray<HTMLElement>(".book-row-trigger");
    rows.forEach((row) => {
      const bookId = row.id.replace("book-row-", "");
      ScrollTrigger.create({
        trigger: row,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) {
            setActiveBook(bookId);
          }
        }
      });
    });

  }, { scope: containerRef, dependencies: [mounted] });

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
        {/* Header block: EXACTLY KEEPING PREVIOUS STYLING & SAMURAI IMAGE */}
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

        {/* Custom interactive chapters accordion, scrolling down auto-expands them in sequence */}
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 space-y-6 relative z-10">
          {BOOKS.map((book) => {
            const isOpen = activeBook === book.id;
            return (
              <div
                key={book.id}
                id={`book-row-${book.id}`}
                className="border-b border-foreground/10 pb-6 relative group overflow-hidden book-row-trigger"
              >
                {/* Subtle hover background highlight */}
                <div className="absolute inset-0 bg-foreground/[0.005] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out z-0 pointer-events-none" />

                <button
                  onClick={() => setActiveBook(book.id)}
                  className="w-full text-left flex items-center py-4 relative z-10 cursor-none pointer-events-auto group/btn"
                >
                  <div className="flex items-center gap-6">
                    {/* Kanji element with scale highlight on select (strictly monochromatic) */}
                    <span className={`font-serif text-3xl md:text-4xl lg:text-5xl transition-all duration-500 ${isOpen ? "text-foreground scale-110 font-bold" : "text-foreground/25 group-hover/btn:text-foreground/60"}`}>
                      {book.kanji}
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-lg md:text-xl lg:text-2xl font-serif font-light uppercase tracking-wide transition-colors duration-500 ${isOpen ? "text-foreground font-semibold" : "text-foreground/60 group-hover/btn:text-foreground/90"}`}>
                        {book.title}
                      </span>
                      <span className="text-[10px] font-mono tracking-widest text-foreground/40 mt-1 uppercase">
                        {book.subtitle}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Accordion content with butter-smooth easeOutQuart transition */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden relative z-10"
                    >
                      <div className="pt-4 pb-2 space-y-6">
                        <p className="text-sm md:text-base font-serif font-light text-foreground/75 leading-relaxed pl-6 relative">
                          {/* Hand-torn brushed left accent line */}
                          <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-foreground/20" style={{ filter: "url(#line-torn-filter)" }} />
                          {book.description}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-2">
                          {book.techs.map((tech) => (
                            <TechCard key={tech} name={tech} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Simplified, Silent Kinetic Marquee at the very bottom */}
        <div className="mt-32 md:mt-48 relative border-y border-foreground/5 py-4 opacity-[0.4] bg-foreground/[0.005]">
          <div className="absolute inset-y-0 left-0 w-1/12 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-1/12 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

          <KineticMarquee baseVelocity={0.3}>
            <DataLine text="POLISH THE BLADE TEN THOUSAND DAYS TO PERFECT THE ART // DO NOTHING WHICH IS OF NO USE" />
          </KineticMarquee>
        </div>
      </div>
    </section>
  );
};
