'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import Image from 'next/image';
import { useTheme } from "next-themes";
import { ShaderFlow } from '@/components/shared/ShaderFlow';

export const Philosophy = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!containerRef.current || !quoteRef.current) return;

    // Parallax for standard titles
    gsap.to(".phil-title-1", {
      x: -30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".phil-title-2", {
      x: 30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.from(".phil-reveal-top", {
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

    // Clean Character Reveal (Ink spreading effect)
    gsap.to(".phil-char", {
      scrollTrigger: {
        trigger: quoteRef.current,
        start: "top 85%",
        end: "bottom 55%",
        scrub: 1.5,
      },
      opacity: 1,
      color: "var(--foreground)",
      filter: "blur(0px)",
      stagger: 0.05,
      ease: "power1.inOut"
    });

  }, { scope: containerRef });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section
      ref={containerRef}
      id="philosophy"
      className="relative py-28 md:py-48 lg:py-60 bg-background overflow-hidden flex flex-col justify-center select-none"
    >
      <div
        className="absolute top-0 left-0 w-full h-[3px] bg-foreground/15 opacity-60"
        style={{ filter: "url(#line-torn-filter)" }}
      />
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-0" />

      {/* The Void's Meditative Wind (WebGL Fluid) */}
      <div
        className="absolute inset-0 opacity-40 md:opacity-55 pointer-events-none z-0"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)"
        }}
      >
        <ShaderFlow
          scale={3.0}
          brightness={1.15}
          flowSpeed={[0.2, 0.0]}
          className="absolute inset-0 h-full w-full grayscale"
        />
      </div>
      <div className="absolute left-[-20%] md:left-[-15%] top-0 w-96 md:w-[900px] h-[800px] md:h-[1000px] pointer-events-none z-0"
        style={{ filter: isDark ? "invert(1) grayscale(1)" : "invert(0) grayscale(0)" }}>
        <Image
          src="/images/sumi-tree.png"
          alt="Sumi-e Tree Decoration"
          fill
          className="object-contain object-left-bottom"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10 w-full">
        <div className="mb-20 md:mb-40 text-right flex flex-col items-end">
          <div className="flex items-center gap-4 mb-8 w-full justify-end phil-reveal-top">
            <div className="h-[2px] flex-1 bg-foreground/15" style={{ filter: "url(#line-torn-filter)" }} />
            <div className="flex items-center font-mono text-foreground/75">
              <span className="text-[10px] md:text-[12px] tracking-[0.5em] uppercase font-bold text-right">
                [ CHAPTER IV : THE VOID ]
              </span>
            </div>
          </div>

          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light uppercase text-foreground tracking-tighter leading-[0.85] lg:leading-[0.8] overflow-visible phil-reveal-top whitespace-nowrap">
            <span className="inline-block phil-title-1 whitespace-nowrap">THE WAY OF</span> <br />
            <span className="inline-block phil-title-2 text-transparent mr-[5%] md:mr-[15%] whitespace-nowrap" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}>THE RONIN.</span>
          </h2>
        </div>

        <div className="flex flex-col items-end w-full">
          <div className="max-w-4xl z-10 text-right">
            <blockquote
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light text-foreground leading-[1.3] lg:leading-[1.2] tracking-tight pr-6 md:pr-12 relative"
            >
              {/* Brush stroke quote line */}
              <div className="absolute right-0 top-2 bottom-2 w-[4px] bg-foreground/20" style={{ filter: "url(#line-torn-filter)" }} />
              <div ref={quoteRef} className="inline">
                {"Do nothing which is of no use. Code is not written for the machine, but for the soul. True architecture emerges only when the mind is empty of ego and full of intention.".split(" ").map((word, wordIndex) => (
                  <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.25em]">
                    {word.split("").map((char, charIndex) => (
                      <span key={charIndex} className="phil-char inline-block opacity-0" style={{ filter: "blur(8px)" }}>
                        {char}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};

