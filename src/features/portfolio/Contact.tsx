'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import Image from 'next/image';
import { useTheme } from "next-themes";
import { ArrowUpRight } from "lucide-react";

const CONTACT_LINKS = [
  {
    id: "01",
    title: "THE ARSENAL",
    value: "GITHUB",
    href: "https://github.com/trhgatu",
    annotation: "where the blades are forged..."
  },
  {
    id: "02",
    title: "THE NETWORK",
    value: "LINKEDIN",
    href: "https://linkedin.com/in/trhgatu",
    annotation: "alliances across the digital lands..."
  },
  {
    id: "03",
    title: "THE DIRECT SCROLL",
    value: "EMAIL",
    href: "mailto:trhgatu.dev@gmail.com",
    annotation: "dispatch a raven directly to my dojo..."
  },
];

export const Contact = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;

    // Subtle fade in and float reveal
    gsap.from('.contact-reveal', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
      },
      y: 40,
      opacity: 0,
      stagger: 0.12,
      duration: 1.2,
      ease: 'power3.out',
    });
  }, { scope: containerRef, dependencies: [mounted] });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section
      id="contact"
      ref={containerRef}
      className="py-32 md:py-48 bg-background relative overflow-hidden select-none z-20"
    >
      {/* Torn Paper Edge Transition */}
      <div
        className="absolute top-[-2px] left-0 w-full h-[3px] bg-foreground/20 z-30 pointer-events-none"
        style={{ filter: "url(#line-torn-filter-contact)" }}
      />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-0" />

      {/* Self-contained SVG filters for torn lines and stamp */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter-contact" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="ink-bleed-filter-contact" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="hanko-torn-filter-contact" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Giant Sumi-e Calligraphy Kanji: 召 (Shō - Summon / Call) in background with heavy ink bleed */}
      <div
        className="absolute right-[3%] bottom-[5%] font-serif font-black text-[320px] sm:text-[480px] lg:text-[600px] select-none pointer-events-none text-foreground leading-none z-0"
        style={{ opacity: 0.012, filter: "url(#ink-bleed-filter-contact)" }}
      >
        召
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 w-full relative z-10">
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8 w-full contact-reveal">
            <span className="font-mono text-[9px] tracking-[0.5em] text-foreground/50 uppercase font-bold">
              [ CHAPTER VI : THE SUMMONS ]
            </span>
            <div className="h-[1px] flex-1 bg-foreground/10" style={{ filter: "url(#line-torn-filter-contact)" }} />
          </div>
        </div>

        {/* Dynamic Editorial Manga Double-Page Spread (5:7 Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

          {/* Left Column (5 Cols): The Real Manga Panel with going.jpg */}
          <div className="lg:col-span-5 flex flex-col items-center z-10 relative contact-reveal w-full">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[100/160] rotate-[-3deg] transition-all duration-700 hover:rotate-[-0.5deg] group avatar-frame shadow-[0_16px_48px_rgba(0,0,0,0.3)] border border-foreground/10 p-2.5 bg-background">

              {/* Manga Drawing Sheet Border Guidelines (Pencil crop marks) */}
              <div className="absolute top-[-15px] left-[-15px] w-[30px] h-[1px] bg-foreground/30 pointer-events-none" />
              <div className="absolute top-[-15px] left-[-15px] w-[1px] h-[30px] bg-foreground/30 pointer-events-none" />
              <div className="absolute bottom-[-15px] right-[-15px] w-[30px] h-[1px] bg-foreground/30 pointer-events-none" />
              <div className="absolute bottom-[-15px] right-[-15px] w-[1px] h-[30px] bg-foreground/30 pointer-events-none" />

              {/* Layer 1: Background backing paper (Double torn) */}
              <div
                className="absolute inset-0 bg-foreground/5 border border-foreground/15 rotate-[4deg] transition-all duration-700 group-hover:rotate-[5deg] group-hover:bg-foreground/[0.08] pointer-events-none"
                style={{ filter: "url(#ink-bleed-filter-contact)" }}
              />

              {/* Layer 2: Main photo screen with going.jpg */}
              <div className="absolute inset-0 bg-background rotate-[-2deg] transition-all duration-700 group-hover:rotate-[-0.5deg] overflow-hidden">
                <div
                  className="relative w-full h-full overflow-hidden bg-card grayscale transition-all duration-1000"
                  style={{ filter: isDark ? "invert(1) contrast(1.15)" : "invert(0) contrast(1.05)" }}
                >
                  <Image
                    src="/images/going.jpg"
                    alt="Miyamoto Musashi - I'm going to meet someone very strong."
                    fill
                    className="object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000"
                    priority
                  />
                </div>
              </div>

              {/* Layer 3: Torn Border Overlay (Physical washi edges) */}
              <div
                className="absolute inset-0 rotate-[-2deg] transition-all duration-700 group-hover:rotate-[-0.5deg] pointer-events-none z-20"
              >
                {/* Background frame mask */}
                <div
                  className="absolute inset-[-12px] border-[24px] border-background"
                  style={{ filter: "url(#ink-bleed-filter-contact)" }}
                />

                {/* Drawn inner torn border */}
                <div
                  className="absolute inset-[10px] border border-foreground/25"
                  style={{ filter: "url(#ink-bleed-filter-contact)" }}
                />
                <div className="absolute inset-[6px] border border-foreground/[0.04] rotate-[1.5deg]" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-12 w-full">
            <div className="space-y-4 contact-reveal">
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-serif font-light text-foreground uppercase tracking-tight leading-[0.9]">
                CALL THE <br />
                <span
                  className="text-transparent"
                  style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}
                >
                  RONIN.
                </span>
              </h2>
              <p className="font-caveat text-2xl md:text-3xl text-foreground/60 tracking-normal lowercase">
                A blade kept in the scabbard rusts. A vision unbuilt fades.
              </p>
            </div>

            {/* The Architect's Contact Ledger list */}
            <div className="w-full border-t border-foreground/15 flex flex-col contact-reveal">
              {CONTACT_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col md:flex-row md:items-center justify-between py-6 md:py-8 border-b border-foreground/10 overflow-hidden cursor-pointer gap-2 md:gap-0"
                >
                  {/* Subtle Sumi-e ink background sweep */}
                  <div className="absolute inset-0 bg-foreground/[0.015] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out z-0 pointer-events-none" />

                  {/* Clean item markup matching fiveRings style in About */}
                  <div className="relative z-10 flex items-center gap-4 pl-2">
                    <span className="font-mono text-[9px] text-foreground/30 font-bold group-hover:text-foreground/50 transition-colors duration-300">
                      [{link.id}]
                    </span>
                    <div className="flex flex-col">
                      <span className="font-serif text-xl md:text-2xl uppercase tracking-widest text-foreground/75 group-hover:text-foreground group-hover:translate-x-2 transition-all duration-500 font-light leading-none">
                        {link.value}
                      </span>
                      {/* Breathtaking Handwritten sketchbook annotation */}
                      <span className="font-caveat text-lg text-foreground/40 mt-1 md:mt-2 group-hover:text-foreground/70 transition-colors duration-500 lowercase tracking-normal pl-1 leading-none">
                        {link.annotation}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-4 pr-2 self-end md:self-auto">
                    <span className="hidden md:inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-foreground/45">
                      {link.title}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                  </div>
                </a>
              ))}
            </div>

            {/* Premium Seal Signature block */}
            <div className="flex items-center justify-start lg:justify-end gap-6 pt-4 contact-reveal">

              {/* Minimal Metadata Sign-off */}
              <div className="text-[10px] font-mono text-foreground/40 text-left lg:text-right leading-relaxed uppercase tracking-[0.3em] font-bold">
                <div>Status // <span className="text-foreground/70">BLADE_IS_READY</span></div>
                <div className="mt-1">Location // <span className="text-foreground/70">GLOBAL_NEXUS</span></div>
              </div>

              {/* The Signature Hanko Seal - Identical to About section for perfect branding */}
              <div className="relative group/seal cursor-pointer select-none">
                {/* Stamp Outer glow ring */}
                <div className="absolute inset-[-4px] border border-red-600/30 rounded-sm scale-95 group-hover/seal:scale-105 transition-all duration-700 opacity-60 pointer-events-none" style={{ filter: "url(#hanko-torn-filter-contact)" }} />

                {/* Main red stamp */}
                <div
                  className="w-14 h-14 border-2 border-red-600 flex items-center justify-center font-serif text-[20px] font-black text-red-600 tracking-tighter transition-all duration-500 group-hover/seal:rotate-[6deg] group-hover/seal:scale-105"
                  style={{
                    filter: "url(#hanko-torn-filter-contact)",
                    backgroundColor: "rgba(220, 38, 38, 0.03)",
                    boxShadow: "inset 0 0 10px rgba(220, 38, 38, 0.1)"
                  }}
                >
                  <span className="rotate-[-3deg] uppercase font-bold text-center leading-none text-red-600">
                    英<br />秀
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
