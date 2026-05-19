'use client';

import { useEffect, useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { useTheme } from 'next-themes';

export const Preloader = () => {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const hasSeenPreloader = sessionStorage.getItem('preloader-seen');
      if (hasSeenPreloader === 'true') {
        setIsActive(false);
        document.body.style.overflow = '';
        document.documentElement.classList.remove('is-loading');
        window.dispatchEvent(new Event('preloader-complete'));
        return;
      }
    }

    // Lock scroll on mount
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const currentTheme = resolvedTheme || theme || "dark";

  useGSAP(() => {
    if (!mounted || !isActive || !containerRef.current || !quoteRef.current || !circleRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        // Trigger the OGL Ink Transition exactly from the center of the screen
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("trigger-ink-transition", {
              detail: { 
                cx: window.innerWidth / 2, 
                cy: window.innerHeight / 2, 
                targetTheme: currentTheme,
                preset: "mist"
              },
            })
          );
        }

        // Hide the Preloader overlay exactly when the ink is at solid full coverage (550ms)
        // This makes the unmounting completely invisible, followed by a gorgeous smoky ink dissolve!
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('preloader-seen', 'true');
            document.documentElement.classList.remove('is-loading');
          }
          document.body.style.overflow = '';
          setIsActive(false);
          // Dispatch event to kick off animations in Hero section
          window.dispatchEvent(new Event('preloader-complete'));
        }, 550);
      }
    });

    // 1. Draw the Ensō Zen Circle (SVG stroke-dashoffset)
    tl.to(circleRef.current, {
      strokeDashoffset: 0,
      duration: 1.8,
      ease: "power2.inOut"
    });

    // 2. Character-by-character rapid ink spread for the calligraphy quote
    const chars = quoteRef.current.querySelectorAll('.loader-char');
    tl.to(chars, {
      opacity: 1,
      filter: "blur(0px)",
      stagger: 0.015,
      duration: 0.7,
      ease: "power2.out"
    }, "-=1.1"); // overlap drawing of Ensō

    // 3. Short tranquil hold
    tl.to({}, { duration: 0.6 });

    // 4. Poetic fade out and dissolve of the stamp and quote into the void
    const stampWrapper = circleRef.current?.parentElement?.parentElement;
    tl.to([stampWrapper, quoteRef.current], {
      opacity: 0,
      filter: "blur(12px)",
      y: -20,
      duration: 0.9,
      ease: "power2.inOut"
    });

  }, { scope: containerRef, dependencies: [mounted, currentTheme] });

  if (!isActive) return null;

  const quoteText = "forging the blades of logic... seeking the way of the void...";

  return (
    <div
      id="preloader-overlay"
      ref={containerRef}
      suppressHydrationWarning={true}
      className="fixed inset-0 w-full h-full bg-background text-foreground z-[9999] flex flex-col items-center justify-center select-none"
    >
      {/* Texture grain overlay */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-0" />

      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Ensō Zen Circle */}
        <div className="w-32 h-32 md:w-36 md:h-36 relative flex items-center justify-center opacity-70">
          <svg className="w-full h-full text-foreground" viewBox="0 0 100 100">
            <path
              ref={circleRef}
              d="M 50,10 A 40,40 0 1,1 49.9,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset="251.2"
              className="transition-colors duration-500"
            />
          </svg>
          {/* Kanji stamp in center */}
          <div className="absolute font-serif text-[28px] font-black text-red-600/70 select-none animate-pulse">
            道
          </div>
        </div>

        {/* Calligraphic load sign-off */}
        <div ref={quoteRef} className="font-caveat text-2xl sm:text-3xl text-foreground/50 lowercase tracking-wide max-w-md text-center px-6 leading-relaxed">
          {quoteText.split("").map((char, index) => (
            <span
              key={index}
              className="loader-char inline-block opacity-0"
              style={{ filter: "blur(6px)" }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
