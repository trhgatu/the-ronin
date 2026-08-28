'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ShaderFlow } from '@/components/shared/ShaderFlow';
import { SumiLeaves } from '@/components/shared/SumiLeaves';
import { soundManager } from '@/lib/sound';

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tearPathRef = useRef<SVGPathElement>(null);
  const bladeRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [entranceReady, setEntranceReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    if (typeof window === 'undefined') return;

    // The entrance timeline below must not play while the Preloader overlay is
    // covering the screen, or the whole reveal happens invisibly behind it.
    if (sessionStorage.getItem('preloader-seen') === 'true') {
      setEntranceReady(true);
      return;
    }

    const onPreloaderComplete = () => setEntranceReady(true);
    window.addEventListener('preloader-complete', onPreloaderComplete);
    return () => window.removeEventListener('preloader-complete', onPreloaderComplete);
  }, []);

  // Pre-hide the reveal targets as soon as we mount (regardless of entranceReady) so
  // content stays hidden behind the Preloader instead of flashing fully visible before
  // the entrance timeline below snaps it back to its "from" state.
  useGSAP(() => {
    if (!mounted || !containerRef.current) return;
    gsap.set('.hero-reveal-top', { y: -30, opacity: 0 });
    gsap.set('.hero-title-inner', { yPercent: 110 });
    gsap.set('.hero-reveal-center', { x: -40, opacity: 0 });
  }, { dependencies: [mounted], scope: containerRef });

  useGSAP(() => {
    if (!entranceReady || !containerRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    const tearProgress = { tx: 1.2 };

    tl.fromTo(bladeRef.current, {
      xPercent: -100,
      opacity: 1,
    }, {
      xPercent: 100,
      duration: 0.55,
      ease: 'power2.in',
      onStart: () => soundManager?.playSwordWhoosh(),
    })
      .fromTo('.hero-reveal-top', {
        y: -30,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 1.4,
        stagger: 0.15,
        delay: 0.1,
      })
      .fromTo('.hero-title-inner', {
        yPercent: 110,
      }, {
        yPercent: 0,
        duration: 1.2,
        stagger: 0.12,
        ease: 'power4.out',
      }, '-=1.0')
      .fromTo('.hero-reveal-center', {
        x: -40,
        opacity: 0,
      }, {
        x: 0,
        opacity: 1,
        duration: 1.5,
      }, '-=0.9')
      .to(tearProgress, {
        tx: 0,
        duration: 1.8,
        ease: 'power3.out',
        onUpdate: () => {
          tearPathRef.current?.setAttribute('transform', `translate(${tearProgress.tx} 0)`);
        },
      }, '-=1.4');

    // Smooth scroll parallax for the borderless ink portrait
    gsap.to('.hero-ink-portrait', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    // Parallax fade for typography on scroll
    gsap.to('.hero-fade-out', {
      opacity: 0,
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

  }, { dependencies: [entranceReady], scope: containerRef });

  const isDark = !mounted || (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center bg-background overflow-hidden select-none py-28 lg:py-0"
    >
      {/* 1. Meditative Wind Background (WebGL Fluid) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute inset-0 opacity-35 md:opacity-50">
          {mounted && (
            <ShaderFlow
              scale={3.0}
              brightness={1.15}
              flowSpeed={[0.2, 0.0]}
              mouseStrength={1.4}
              className="absolute inset-0 h-full w-full grayscale"
            />
          )}
        </div>
      </div>

      {/* Blade-swipe: a single diagonal streak that cuts across on entrance, synced with the sword whoosh cue */}
      <div
        ref={bladeRef}
        className="absolute inset-0 -skew-x-12 pointer-events-none select-none z-30 opacity-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, transparent 44%, var(--foreground) 49%, var(--foreground) 51%, transparent 56%, transparent 100%)",
          mixBlendMode: isDark ? "screen" : "multiply",
          filter: "blur(2px)",
        }}
      />

      {/* 2. Self-contained SVG displacement filters for horizontal torn edges */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="torn-paper-filter-hero" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="line-torn-filter-hero" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Jagged "torn ink" reveal edge for the portrait — swept via the path's own transform
              (a wrapping <g transform> is silently ignored by Chromium here, so the transform
              must live directly on the <path>) */}
          <clipPath id="hero-tear-clip" clipPathUnits="objectBoundingBox">
            <path
              ref={tearPathRef}
              transform="translate(1.2 0)"
              d="M 0.02,0 L 2,0 L 2,1 L -0.01,1 L -0.05,0.923 L 0.04,0.846 L -0.05,0.769 L 0.03,0.692 L -0.02,0.615 L 0.06,0.538 L -0.04,0.462 L 0.03,0.385 L -0.05,0.308 L 0.04,0.231 L -0.02,0.154 L 0.05,0.077 L -0.03,0 Z"
            />
          </clipPath>
        </defs>
      </svg>
      <div
        className="hero-ink-portrait absolute right-0 top-0 bottom-0 w-[46%] lg:w-[38%] h-full pointer-events-none select-none z-[2]"
        style={{
          filter: isDark ? "invert(1) contrast(1.15)" : "invert(0) contrast(1.05)",
          WebkitMaskImage: "linear-gradient(to left, black 75%, transparent 100%)",
          maskImage: "linear-gradient(to left, black 75%, transparent 100%)",
          clipPath: "url(#hero-tear-clip)",
        }}
      >
        <Image
          src="/images/vagabond_background_clean.png"
          alt="Miyamoto Musashi - Peerless Spirit"
          fill
          className="object-cover grayscale"
          style={{ objectPosition: "40% center" }}
          priority
          unoptimized
        />
      </div>

      <SumiLeaves containerRef={containerRef} count={12} />

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left relative w-full hero-fade-out">
          <div
            className="absolute left-[-4%] top-[-25%] flex flex-col items-start font-serif font-black text-[12vw] sm:text-[10vw] leading-[0.8] select-none pointer-events-none text-foreground z-0"
            style={{ opacity: 0.015, filter: "url(#torn-paper-filter-hero)" }}
          >
            <span>無</span>
            <span className="mt-[-2vw]">双</span>
          </div>

          <div className="space-y-4 relative z-10 w-full">
            <div className="flex items-center gap-4 mb-4 hero-reveal-top">
              <span className="font-mono text-[9px] md:text-[10px] tracking-[0.4em] text-foreground/50 font-bold uppercase">
                NITEN ICHI-RYŪ // CHAPTER 0
              </span>
              <div className="h-[1px] w-12 bg-foreground/15" style={{ filter: "url(#line-torn-filter-hero)" }} />
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-extralight uppercase tracking-tight leading-[0.9] text-foreground">
              <span className="block w-fit overflow-hidden">
                <span className="hero-title-inner inline-block">SOFTWARE</span>
              </span>
              <span className="block w-fit overflow-hidden">
                <span className="hero-title-inner inline-block italic font-light text-foreground/80 pl-6 sm:pl-12 lg:pl-16">
                  ARCHITECT.
                </span>
              </span>
            </h1>

            <p className="font-caveat text-3xl sm:text-4xl md:text-5xl text-foreground/60 tracking-normal lowercase pt-4 leading-normal hero-reveal-center">
              &quot;from one thing, know ten thousand things.&quot;
            </p>

            <div className="pt-8 flex flex-col gap-2 hero-reveal-top">
              <span className="font-mono text-[9px] tracking-[0.35em] text-foreground/45 uppercase font-bold leading-none">
                [ SCROLL ZERO : THE PROLOGUE ]
              </span>
              <p className="font-caveat text-2xl md:text-3xl text-foreground/45 leading-none pl-1 mt-1">
                * entering the path of void and formless code...
              </p>
            </div>
          </div>
        </div>

        {/* Empty placeholder column to ensure space is maintained in the grid for the absolute image */}
        <div className="lg:col-span-5 hidden lg:block" />

      </div>
    </section>
  );
};
