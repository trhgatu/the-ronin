'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { useTheme } from "next-themes";

export const Contact = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Standard Parallax for Contact Title
    gsap.to(".contact-title-1", {
      x: -30,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
    gsap.to(".contact-title-2", {
      x: 30,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });

    // Reveal only for content below title
    gsap.from('.contact-content-reveal', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 70%',
      },
      y: 40,
      opacity: 0,
      filter: "blur(5px)",
      duration: 1.5,
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section 
      id="contact"
      ref={containerRef}
      className="py-24 md:py-40 lg:py-60 relative overflow-hidden bg-background"
    >
      {/* Torn Edge Transition Separator */}
      <div 
        className="absolute top-0 left-0 w-full h-[3px] bg-foreground/15 opacity-60" 
        style={{ filter: "url(#line-torn-filter)" }}
      />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-0" />
      
      {/* SVG filter definition for horizontal line tearing */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 w-full relative z-10">
        <div className="mb-16 md:mb-24">
           <div className="flex items-center gap-4 mb-8 w-full contact-content-reveal">
              <div className="flex items-center font-mono text-foreground/75">
                <span className="text-[10px] md:text-[12px] tracking-[0.5em] uppercase font-bold">
                  [ CHAPTER VI : THE SUMMONS ]
                </span>
              </div>
              <div className="h-[2px] flex-1 bg-foreground/15" style={{ filter: "url(#line-torn-filter)" }} />
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start lg:items-end justify-between">
          <div className="max-w-3xl text-left">
            <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light uppercase leading-[0.85] lg:leading-[0.8] tracking-tighter mb-8 md:mb-12 text-foreground whitespace-nowrap">
              <span className="inline-block contact-title-1 whitespace-nowrap">CALL THE</span> <br />
              <span className="inline-block contact-title-2 text-transparent whitespace-nowrap ml-[5%]" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}>RONIN.</span>
            </h2>
            <div className="contact-content-reveal">
              <p className="text-xl md:text-2xl lg:text-3xl font-serif font-light text-foreground/70 leading-[1.3] tracking-tight max-w-2xl relative pl-6 md:pl-10">
                <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-foreground/20" style={{ filter: "url(#line-torn-filter)" }} />
                True architecture is like swordplay—honed over a lifetime, executed in an instant. Let us craft your next legacy.
              </p>
            </div>
          </div>

          <div className="contact-content-reveal flex flex-col items-start lg:items-end gap-8 md:gap-12 w-full lg:w-auto">
            <div className="text-[9px] md:text-[10px] font-mono text-foreground/50 max-w-[250px] text-left lg:text-right leading-relaxed uppercase tracking-[0.3em] font-bold">
              Messenger Raven // <br className="hidden md:block" />
              Scroll: 07_THE_SUMMONS // <br className="hidden md:block" />
              Status: BLADE_IS_READY
            </div>
            
            <a 
              href="mailto:trhgatu.dev@gmail.com"
              className="w-full sm:w-auto group relative px-8 md:px-16 py-6 md:py-8 overflow-hidden border border-foreground/15 rounded-sm transition-all flex items-center justify-center text-center bg-background"
            >
              {/* Ink hover effect inside tag */}
              <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700 ease-out z-0" style={{ filter: "url(#line-torn-filter)" }} />
              
              <span className="relative z-10 text-[10px] md:text-xs font-serif font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] text-foreground group-hover:text-background transition-colors duration-500">
                DISPATCH SCROLL
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

