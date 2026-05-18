'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { useTheme } from 'next-themes';
import { ShaderFlow } from '@/components/shared/ShaderFlow';

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!mounted) return;

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.from('.hero-reveal-top', {
      y: -20,
      opacity: 0,
      duration: 1.2,
      stagger: 0.1,
      delay: 0.2,
    })
      .from('.hero-reveal-center', {
        x: 30,
        opacity: 0,
        duration: 1.4,
      }, '-=0.8');

    // 1. Smooth scroll parallax for the background image
    gsap.to('.hero-bg-img', {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    // 2. Smooth scroll fade and lift for texts
    gsap.to('.hero-fade-out', {
      opacity: 0,
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });


  }, { dependencies: [mounted], scope: containerRef });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  if (!mounted) return null;

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center bg-background overflow-hidden select-none"
    >
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden select-none">
        <div className="absolute inset-0 opacity-40 md:opacity-55">
          <ShaderFlow
            scale={3.0}
            brightness={1.15}
            flowSpeed={[0.2, 0.0]}
            className="absolute inset-0 h-full w-full grayscale"
          />
        </div>
        <div
          className="absolute right-[42%] lg:right-[40%] top-[10%] font-serif font-black text-[220px] sm:text-[380px] lg:text-[500px] select-none pointer-events-none text-foreground leading-none"
          style={{ opacity: 0.012, filter: "url(#torn-paper-filter)" }}
        >
          空
        </div>

        <div
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 hero-bg-img"
        >
          <img
            src="/images/vagabond_background_clean.png"
            alt="Miyamoto Musashi Spirit Fullscreen Background"
            className="w-full h-full object-cover object-right grayscale dark:invert transition-all duration-1000"
            style={{ filter: isDark ? "invert(1)" : "invert(0)" }}
          />
        </div>
      </div>

      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="torn-paper-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 w-full h-full px-6 md:px-12 pointer-events-none select-none z-10 hero-fade-out">

        <div className="absolute top-[135px] left-[6%] hero-reveal-top font-mono text-[9px] md:text-[10px] tracking-[0.4em] text-foreground/50 font-bold uppercase">
          NITEN ICHI-RYŪ
        </div>
        <div className="absolute top-[135px] right-[6%] hero-reveal-top font-mono text-[9px] md:text-[10px] tracking-[0.35em] text-foreground/40 text-right uppercase font-bold hidden sm:block">
          BOOK OF THE VOID
        </div>
        <div className="absolute right-[6%] top-[28%] sm:top-[30%] md:top-[32%] max-w-xl md:max-w-2xl pointer-events-auto">
          <div className="hero-reveal-center text-right space-y-5">
            <p className="font-caveat text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground/90 leading-[1.25] tracking-wide italic">
              &quot;From one thing, <br />
              know ten thousand things.&quot;
            </p>
          </div>
        </div>


      </div>
    </section>
  );
};

