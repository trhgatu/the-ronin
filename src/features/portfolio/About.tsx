'use client';

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PortraitMorph } from "@/components/shared/PortraitMorph";
import { useTheme } from "next-themes";
import { soundManager } from "@/lib/sound";

const fiveRings = [
  {
    book: "EARTH [地]",
    discipline: "Structural Foundation",
    description: "Bulletproof system design, database resilience, and deep core backbones that stand like solid rock."
  },
  {
    book: "WATER [水]",
    discipline: "Fluid Interaction",
    description: "Adaptive motion dynamics, seamless responsiveness, and user experiences that flow like pristine liquid."
  },
  {
    book: "FIRE [火]",
    discipline: "Performance & Combat",
    description: "High-concurrency engineering, extreme low-latency tuning, and aggressive runtime optimizations under heavy stress."
  },
  {
    book: "WIND [風]",
    discipline: "Mastery of Style",
    description: "Uncompromising clean code, global standards, and modular code structures refined through years of strategy."
  },
  {
    book: "THE VOID [空]",
    discipline: "Creative Emptiness",
    description: "The ultimate peak. Removing all useless complexity, writing only what is of use, achieving absolute digital Zen."
  }
];

export const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, -80]);

  return (
    <section
      ref={containerRef}
      id="about"
      className="relative py-32 md:py-48 bg-background select-none z-20"
    >
      {/* Majestic Double-Layered Jagged Torn Paper & Ink Brushstroke Section Transition */}
      {/* Thick Jagged Hand-Torn Paper Sheet (Blends into Section 2 and masks the bottom of Hero) */}
      <div
        className="absolute top-[-30px] left-0 w-full h-[60px] bg-background z-20 pointer-events-none"
        style={{ filter: "url(#about-torn-filter)" }}
      />

      {/* Rough Ink Brushstroke running exactly along the jagged paper tear */}
      <div
        className="absolute top-[-2px] left-0 w-full h-[3px] bg-foreground/20 z-30 pointer-events-none"
        style={{ filter: "url(#about-torn-filter)" }}
      />

      {/* SVG filter definition for torn paper edge inside About - self-contained and bulletproof */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          {/* Main frame filter for thick torn papers */}
          <filter id="about-torn-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Line filter for thin ink-brushed horizontal lines */}
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Hanko seal filter for slight ink bleed/distress */}
          <filter id="hanko-torn-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Giant Zen Calligraphy Kanji: 道 (Dō - The Way / The Path) behind the text scroll */}
      <div
        className="absolute right-[3%] bottom-[3%] font-serif font-black text-[320px] sm:text-[480px] select-none pointer-events-none text-foreground leading-none z-0"
        style={{ opacity: 0.012, filter: "url(#about-torn-filter)" }}
      >
        道
      </div>

      <motion.div
        style={{ opacity, y }}
        className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10"
      >
        {/* Dynamic Editorial Manga Double-Page Spread (5:7 Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">

          {/* Left Column (5 Cols): The Massive, Jagged Character Art Panel */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start z-10 relative">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] aspect-[4/5] rotate-[-3deg] transition-all duration-700 hover:rotate-[-1.5deg] group avatar-frame shadow-[0_16px_48px_rgba(0,0,0,0.3)] border border-foreground/10 p-2.5 bg-foreground">
              <div
                className="absolute inset-0 bg-foreground/5 border border-foreground/15 rotate-[4deg] transition-all duration-700 group-hover:rotate-[5deg] group-hover:bg-foreground/[0.08] pointer-events-none"
                style={{ filter: "url(#about-torn-filter)" }}
              />

              {/* Layer 2: Main photo screen */}
              <div className="absolute inset-0 bg-foreground rotate-[-2deg] transition-all duration-700 group-hover:rotate-[-0.5deg] overflow-hidden">
                <div className="relative w-full h-full overflow-hidden bg-card">
                  <PortraitMorph
                    srcA="/avatar.jpg"
                    srcB="/avatar.jpg"
                    alt="trhgatu Portrait"
                    className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-1000 grayscale contrast-125"
                  />
                </div>
              </div>

              {/* Layer 3: Torn Border Overlay (Physical washi edges) */}
              <div
                className="absolute inset-0 rotate-[-2deg] transition-all duration-700 group-hover:rotate-[-0.5deg] pointer-events-none z-20"
              >
                {/* Background frame mask */}
                <div
                  className="absolute inset-[-12px] border-[24px] border-foreground"
                  style={{ filter: "url(#about-torn-filter)" }}
                />

                {/* Drawn inner torn border */}
                <div
                  className="absolute inset-[10px] border border-foreground/25"
                  style={{ filter: "url(#about-torn-filter)" }}
                />
                <div className="absolute inset-[6px] border border-foreground/[0.04] rotate-[1.5deg]" />
              </div>
            </div>

            {/* Alchemical Stamp & Metadata Panel (Under the avatar) */}
            <div className="mt-12 w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] flex items-center justify-between border-t border-foreground/10 pt-8 pl-4 pr-2 font-mono text-[10px] md:text-[11px] tracking-widest text-foreground/50 leading-relaxed relative">
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] text-foreground/30 block uppercase tracking-[0.2em] mb-1">STANCE</span>
                  <span className="text-foreground/80 font-bold">TWO SWORDS (CODE & ART)</span>
                </div>
                <div>
                  <span className="text-[9px] text-foreground/30 block uppercase tracking-[0.2em] mb-1">STRATEGY</span>
                  <span className="text-foreground/80 font-bold">NITEN ICHI-RYŪ CORE</span>
                </div>
                <div>
                  <span className="text-[9px] text-foreground/30 block uppercase tracking-[0.2em] mb-1">ORIGIN</span>
                  <span className="text-foreground/80 font-bold">10.8231° N, 106.6297° E</span>
                </div>
              </div>

              {/* Traditional Red Ink Hanko Seal (印) */}
              <div
                className="relative group/seal cursor-pointer select-none"
                onMouseEnter={() => soundManager?.playStampThud()}
              >
                {/* Outer glowing ink distress ring */}
                <div className="absolute inset-[-4px] border border-red-600/30 rounded-sm scale-95 group-hover/seal:scale-105 transition-all duration-700 opacity-60 pointer-events-none" style={{ filter: "url(#hanko-torn-filter)" }} />

                {/* Main Stamp */}
                <div
                  className="w-14 h-14 border-2 border-red-600 flex items-center justify-center font-serif text-[20px] font-black text-red-600 tracking-tighter transition-all duration-500 group-hover/seal:rotate-[6deg] group-hover/seal:scale-105"
                  style={{
                    filter: "url(#hanko-torn-filter)",
                    backgroundColor: "rgba(220, 38, 38, 0.03)",
                    boxShadow: "inset 0 0 10px rgba(220, 38, 38, 0.1)"
                  }}
                >
                  <span className="rotate-[-3deg] select-none uppercase font-bold text-center leading-none text-red-600">
                    英<br />秀
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-10 lg:pt-4">

            {/* Title Block */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] tracking-[0.5em] text-foreground/50 uppercase font-bold">[ CHAPTER I : THE RONIN ARCHITECT ]</span>
                <div className="h-[1px] flex-1 bg-foreground/10" style={{ filter: "url(#line-torn-filter)" }} />
              </div>

              <h2 className="text-5xl sm:text-6xl md:text-7xl font-serif font-light text-foreground uppercase tracking-tight leading-[0.9]">
                TRAN HOANG <br />
                <span
                  className="text-transparent"
                  style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}
                >
                  ANH TU.
                </span>
              </h2>
              <p className="font-caveat text-2xl md:text-3xl text-foreground/60 tracking-normal lowercase">
                the ronin architect — the way of the sword & code
              </p>
            </div>
            <div className="space-y-6 text-foreground/90">
              <p className="text-xl md:text-2xl font-light leading-snug tracking-tight">
                I master the two swords of digital craftsmanship: wielding <span className="text-foreground font-semibold underline decoration-foreground/30 underline-offset-4">robust, battle-tested engineering</span> and <span className="text-foreground font-semibold underline decoration-foreground/30 underline-offset-4">razor-sharp Zen aesthetics</span> in perfect, fluid unison.
              </p>

              <p className="text-xs md:text-sm text-foreground/50 leading-relaxed font-light">
                Inspired by the discipline of Musashi&apos;s Niten Ichi-ryū, I treat software architecture as a lifelong martial strategy. A digital system must be built resilient to extreme conditions, structurally elegant, and present a quiet, distraction-free interface. My mission is to bridge complex systems with high-fidelity sensory experiences.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[9px] tracking-widest text-foreground/50 uppercase">Go Rin No Sho — The Five Rings of Software Mastery</span>
                <div className="h-[2px] flex-1 bg-foreground/10" style={{ filter: "url(#line-torn-filter)" }} />
              </div>

              <div className="space-y-4">
                {fiveRings.map((ring, idx) => (
                  <div key={idx} className="group relative pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-baseline gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-foreground/40 font-bold">{idx + 1}.</span>
                        <span className="font-serif text-sm font-semibold tracking-wide text-foreground/90 group-hover:text-foreground transition-colors duration-300">{ring.book}</span>
                      </div>
                      <span className="text-[9px] font-mono text-foreground/50 uppercase tracking-widest">{ring.discipline}</span>
                    </div>
                    <p className="text-xs text-foreground/45 mt-1.5 leading-relaxed font-light group-hover:text-foreground/60 transition-colors duration-300">
                      {ring.description}
                    </p>
                    {/* Sumi-e brushed line divider */}
                    <div
                      className="absolute bottom-0 left-0 w-full h-[1px] bg-foreground/10 group-hover:bg-foreground/20 transition-colors duration-300"
                      style={{ filter: "url(#line-torn-filter)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Quote & Philosophy */}
            <div className="relative pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-[9px] font-mono text-foreground/50 uppercase tracking-widest">Philosophy</div>
                  <div className="font-caveat text-lg sm:text-xl text-foreground/80 leading-snug italic">
                    &quot;Do nothing which is of no use.&quot; — Miyamoto Musashi (Go Rin No Sho)
                  </div>
                </div>
                <div className="space-y-1 text-left sm:text-right">
                  <div className="text-[9px] font-mono text-foreground/50 uppercase tracking-widest">Methodology</div>
                  <div className="text-xs text-foreground/50 leading-relaxed font-light">
                    Modular, silent, driven by zen sensory clarity.
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </section>
  );
};


